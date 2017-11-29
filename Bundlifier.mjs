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

export default function Bundlifier ({
  inputDir = 'client',
  outputDir = 'public',
  scssInput = 'main.scss',
  cssOutput = 'bundle.css',
  esInput = 'main.mjs',
  jsOutput = 'bundle.js',
  environment = process.env.NODE_ENV
} = {}) {
  scssInput = path.join(inputDir, scssInput);
  cssOutput = path.join(outputDir, cssOutput);
  esInput = path.join(inputDir, esInput);
  jsOutput = path.join(outputDir, jsOutput);

  var bundlifier = {};

  var rollupConfig = RollupConfig({esInput, jsOutput, environment});

  function buildAndWatchES () {
    var watcher = rollup.watch(rollupConfig);
    watcher.on('event', function ({code, error}) {
      if (code === 'START') process.stdout.write('The ES watcher is (re)starting at ' + Time() + '...' + '\n');
      else if (code === 'END') process.stdout.write('Finished bundling ES at ' + Time() + '.' + '\n');
      else if (code === 'ERROR') process.stderr.write('Encountered an error while bundling ES: ' + error.stack + '\n');
      else if (code === 'FATAL') process.stderr.write('Encountered a fatal error while bundling ES: ' + error.stack + '\n');
    });
  }

  async function bundleSCSSLoudly () {
    process.stdout.write('The SCSS watcher is (re)starting at ' + Time() + '...' + '\n');
    var succeeded = await bundleSCSS();
    if (!succeeded) return;
    process.stdout.write('Finished bundling SCSS at ' + Time() + '.' + '\n');
  }

  var debouncedBundleSCSSLoudly = debounce(bundleSCSSLoudly, 100);

  function buildAndWatchSCSS () {
    var watcher = chokidar.watch(path.join(inputDir, '/**/*.{css,scss}'));
    watcher.on('ready', async function () {
      await bundleSCSSLoudly();
      watcher.on('add', debouncedBundleSCSSLoudly);
      watcher.on('change', debouncedBundleSCSSLoudly);
      watcher.on('unlink', debouncedBundleSCSSLoudly);
    });
  }

  bundlifier.start = function () {
    buildAndWatchES();
    buildAndWatchSCSS();
  };

  async function bundleES () {
    var bundle = await rollup.rollup(rollupConfig);
    return bundle.write(rollupConfig.output);
  }

  // Track the latest build in case a previous build was interrupted.
  var scssSession;

  async function bundleSCSS () {
    var thisSCSSSession = scssSession = {};
    try {
      var result = await sassRenderAsync({
        file: scssInput,
        outFile: cssOutput,
        sourceMap: true,
        sourceMapContents: true,
      });
    } catch (error) {
      process.stderr.write('Encountered an error while compiling SCSS: ' + error.message + '\n');
      return false;
    }
    if (scssSession !== thisSCSSSession) return false;
    await mkdirpAsync(outputDir);
    if (scssSession !== thisSCSSSession) return false;
    try {
      result = await postcss([autoprefixer])
        .process(result.css, {
          from: scssInput,
          to: cssOutput,
          map: {
            prev: result.map.toString(),
            sourcesContent: true,
          },
        });
    } catch (error) {
      process.stderr.write('Encountered an error while postprocessing SCSS: ' + error.message + '\n');
      return false;
    }
    if (scssSession !== thisSCSSSession) return false;
    return Promise.all([
      fsWriteFileAsync(cssOutput, result.css),
      fsWriteFileAsync(cssOutput + '.map', result.map),
    ]);
  }

  bundlifier.build = function () {
    return Promise.all([bundleES(), bundleSCSS()]);
  };

  async function maybeBundleES () {
    if (await fsExistsAsync(jsOutput)) return;
    return bundleES();
  }

  async function maybeBundleSCSS () {
    if (await fsExistsAsync(cssOutput)) return;
    return bundleSCSS();
  }

  bundlifier.maybeBuild = function () {
    return Promise.all([maybeBundleES(), maybeBundleSCSS()]);
  };

  return bundlifier;
}
