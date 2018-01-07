import util from 'util';
import chokidar from 'chokidar';
import debounce from 'lodash/debounce';
import first from 'lodash/first';
import keys from 'lodash/keys';
import path from 'path';
import Time from './Time';

import fs from 'fs';
var fsExistsAsync = util.promisify(fs.exists);
var fsWriteFileAsync = util.promisify(fs.writeFile);

import mkdirp from 'mkdirp';
var mkdirpAsync = util.promisify(mkdirp);

import nodeSass from 'node-sass';
var sassRenderAsync = util.promisify(nodeSass.render);
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

export default function SassBundler({
  sass = {'client/main.scss': 'public/bundle.css'},
  compress = false,
} = {}) {
  var sassInput = first(keys(sass));
  var inputDir = path.dirname(sassInput);
  var cssOutput = sass[sassInput];
  var outputDir = path.dirname(cssOutput);

  async function buildLoudly () {
    process.stdout.write('The Sass watcher is (re)starting at ' + Time() + '...' + '\n');
    var succeeded = await build();
    if (!succeeded) return;
    process.stdout.write('Finished bundling Sass at ' + Time() + '.' + '\n');
  }

  var debouncedBuildLoudly = debounce(buildLoudly, 100);

  function buildAndWatch () {
    var watcher = chokidar.watch(path.join(inputDir, '/**/*.{css,scss}'));
    watcher.on('ready', async function () {
      await buildLoudly();
      watcher.on('add', debouncedBuildLoudly);
      watcher.on('change', debouncedBuildLoudly);
      watcher.on('unlink', debouncedBuildLoudly);
    });
  }

  // Track the latest build in case a previous build was interrupted.
  var session;

  async function build () {
    var thisSession = session = {};
    try {
      var result = await sassRenderAsync({
        file: sassInput,
        outFile: cssOutput,
        sourceMap: true,
        sourceMapContents: true,
      });
    } catch (error) {
      if (session !== thisSession) return false;
      process.stderr.write('Encountered an error while compiling Sass: ' + error.message + '\n');
      return false;
    }
    if (session !== thisSession) return false;
    await mkdirpAsync(outputDir);
    if (session !== thisSession) return false;
    var plugins = [autoprefixer];
    if (compress) plugins.push(cssnano);
    try {
      result = await postcss(plugins)
        .process(result.css, {
          from: sassInput,
          to: cssOutput,
          map: {
            prev: result.map.toString(),
            sourcesContent: true,
          },
        });
    } catch (error) {
      if (session !== thisSession) return false;
      process.stderr.write('Encountered an error while postprocessing Sass: ' + error.message + '\n');
      return false;
    }
    if (session !== thisSession) return false;
    return Promise.all([
      fsWriteFileAsync(cssOutput, result.css),
      fsWriteFileAsync(cssOutput + '.map', result.map),
    ]);
  }

  async function maybeBuild () {
    if (await fsExistsAsync(cssOutput)) return;
    return build();
  }

  return {
    buildAndWatch,
    build,
    maybeBuild,
  };
}