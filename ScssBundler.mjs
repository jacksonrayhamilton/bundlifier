import util from 'util';
import chokidar from 'chokidar';
import debounce from 'lodash/debounce';
import path from 'path';
import Time from './Time';

import fs from 'fs';
var fsExistsAsync = util.promisify(fs.exists);
var fsWriteFileAsync = util.promisify(fs.writeFile);

import mkdirp from 'mkdirp';
var mkdirpAsync = util.promisify(mkdirp);

import sass from 'node-sass';
var sassRenderAsync = util.promisify(sass.render);
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

export default function ScssBundler({
  inputDir = 'client',
  outputDir = 'public',
  scssInput = 'main.scss',
  cssOutput = 'bundle.css',
  compress = false,
} = {}) {
  scssInput = path.join(inputDir, scssInput);
  cssOutput = path.join(outputDir, cssOutput);

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

  async function maybeBundleScss () {
    if (await fsExistsAsync(cssOutput)) return;
    return bundleScss();
  }

  return {
    buildAndWatchScss,
    bundleScss,
    maybeBundleScss,
  };
}
