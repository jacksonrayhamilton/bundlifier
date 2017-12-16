import util from 'util';
import path from 'path';
import rollup from 'rollup';
import RollupConfig from './RollupConfig';
import Time from './Time';
import UglifyJS from 'uglify-es';

import fs from 'fs';
var fsExistsAsync = util.promisify(fs.exists);
var fsWriteFileAsync = util.promisify(fs.writeFile);

export default function EsBundler({
  inputDir = 'client',
  outputDir = 'public',
  esInput = 'main.mjs',
  jsOutput = 'bundle.js',
  compress = false,
  environment = process.env.NODE_ENV,
} = {}) {
  esInput = path.join(inputDir, esInput);
  jsOutput = path.join(outputDir, jsOutput);

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

  async function maybeBundleEs () {
    if (await fsExistsAsync(jsOutput)) return;
    return bundleEs();
  }

  return {
    buildAndWatchEs,
    bundleEs,
    maybeBundleEs,
  };
}
