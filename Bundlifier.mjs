import util from 'util';
import debounce from 'lodash/debounce';
import chokidar from 'chokidar';
import fs from 'fs';
var fsExistsAsync = util.promisify(fs.exists);
var fsWriteFileAsync = util.promisify(fs.writeFile);
import mkdirp from 'mkdirp';
var mkdirpAsync = util.promisify(mkdirp);
import path from 'path';
import sass from 'node-sass';
var sassRenderAsync = util.promisify(sass.render);
import rollup from 'rollup';
import RollupConfig from './RollupConfig';
import Time from './Time';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import UglifyJS from 'uglify-es';

export default function Bundlifier ({
  inputDir = 'client',
  outputDir = 'public',
  scssInput = 'main.scss',
  cssOutput = 'bundle.css',
  esInput = 'main.mjs',
  jsOutput = 'bundle.js',
  compress = false,
  environment = process.env.NODE_ENV
} = {}) {
  scssInput = path.join(inputDir, scssInput);
  cssOutput = path.join(outputDir, cssOutput);
  esInput = path.join(inputDir, esInput);
  jsOutput = path.join(outputDir, jsOutput);

  var bundlifier = {};

  var rollupConfig = RollupConfig({esInput, jsOutput, environment});

  function buildAndWatchEs () {
    var watcher = rollup.watch(rollupConfig);
    watcher.on('event', function ({code, error}) {
      if (code === 'START') process.stdout.write('The ES watcher is (re)starting at ' + Time() + '...' + '\n');
      else if (code === 'END') process.stdout.write('Finished bundling ES at ' + Time() + '.' + '\n');
      else if (code === 'ERROR') process.stderr.write('Encountered an error while bundling ES: ' + error.stack + '\n');
      else if (code === 'FATAL') process.stderr.write('Encountered a fatal error while bundling ES: ' + error.stack + '\n');
    });
  }

  async function bundleScssLoudly () {
    process.stdout.write('The SCSS watcher is (re)starting at ' + Time() + '...' + '\n');
    var succeeded = await bundleScss();
    if (!succeeded) return;
    process.stdout.write('Finished bundling SCSS at ' + Time() + '.' + '\n');
  }

  var debouncedBundleScssLoudly = debounce(bundleScssLoudly, 100);

  function buildAndWatchScss () {
    var watcher = chokidar.watch(path.join(inputDir, '/**/*.{css,scss}'));
    watcher.on('ready', async function () {
      await bundleScssLoudly();
      watcher.on('add', debouncedBundleScssLoudly);
      watcher.on('change', debouncedBundleScssLoudly);
      watcher.on('unlink', debouncedBundleScssLoudly);
    });
  }

  bundlifier.start = function () {
    buildAndWatchEs();
    buildAndWatchScss();
  };

  async function bundleEs () {
    var bundle = await rollup.rollup(rollupConfig);
    if (compress) {
      var result = await bundle.generate(rollupConfig.output);
      result = UglifyJS.minify({[path.basename(jsOutput)]: result.code}, {
        sourceMap: {
          content: result.map.toString(),
          url: path.basename(jsOutput) + '.map',
        },
      });
      return Promise.all([
        fsWriteFileAsync(jsOutput, result.code),
        fsWriteFileAsync(jsOutput + '.map', result.map),
      ]);
    }
    return bundle.write(rollupConfig.output);
  }

  // Track the latest build in case a previous build was interrupted.
  var scssSession;

  async function bundleScss () {
    var thisScssSession = scssSession = {};
    try {
      var result = await sassRenderAsync({
        file: scssInput,
        outFile: cssOutput,
        sourceMap: true,
        sourceMapContents: true,
      });
    } catch (error) {
      if (scssSession !== thisScssSession) return false;
      process.stderr.write('Encountered an error while compiling SCSS: ' + error.message + '\n');
      return false;
    }
    if (scssSession !== thisScssSession) return false;
    await mkdirpAsync(outputDir);
    if (scssSession !== thisScssSession) return false;
    var plugins = [autoprefixer];
    if (compress) plugins.push(cssnano);
    try {
      result = await postcss(plugins)
        .process(result.css, {
          from: scssInput,
          to: cssOutput,
          map: {
            prev: result.map.toString(),
            sourcesContent: true,
          },
        });
    } catch (error) {
      if (scssSession !== thisScssSession) return false;
      process.stderr.write('Encountered an error while postprocessing SCSS: ' + error.message + '\n');
      return false;
    }
    if (scssSession !== thisScssSession) return false;
    return Promise.all([
      fsWriteFileAsync(cssOutput, result.css),
      fsWriteFileAsync(cssOutput + '.map', result.map),
    ]);
  }

  bundlifier.build = function () {
    return Promise.all([bundleEs(), bundleScss()]);
  };

  async function maybeBundleEs () {
    if (await fsExistsAsync(jsOutput)) return;
    return bundleEs();
  }

  async function maybeBundleScss () {
    if (await fsExistsAsync(cssOutput)) return;
    return bundleScss();
  }

  bundlifier.maybeBuild = function () {
    return Promise.all([maybeBundleEs(), maybeBundleScss()]);
  };

  return bundlifier;
}
