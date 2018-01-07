import util from 'util';
import first from 'lodash/first';
import keys from 'lodash/keys';
import path from 'path';
import rollup from 'rollup';
import RollupConfig from './RollupConfig';
import Time from './Time';
import UglifyJS from 'uglify-es';

import fs from 'fs';
var fsExistsAsync = util.promisify(fs.exists);
var fsWriteFileAsync = util.promisify(fs.writeFile);

export default function EsBundler({
  es = {'client/main.mjs': 'public/bundle.js'},
  minify = false,
  environment = process.env.NODE_ENV,
} = {}) {
  var esInput = first(keys(es));
  var jsOutput = es[esInput];

  var rollupConfig = RollupConfig({esInput, jsOutput, environment});

  function buildAndWatch () {
    var watcher = rollup.watch(rollupConfig);
    watcher.on('event', function ({code, error}) {
      if (code === 'START') process.stdout.write('The ES watcher is (re)starting at ' + Time() + '...' + '\n');
      else if (code === 'END') process.stdout.write('Finished building ES at ' + Time() + '.' + '\n');
      else if (code === 'ERROR') process.stderr.write('Encountered an error while building ES: ' + error.stack + '\n');
      else if (code === 'FATAL') process.stderr.write('Encountered a fatal error while building ES: ' + error.stack + '\n');
    });
  }

  async function build () {
    var bundle = await rollup.rollup(rollupConfig);
    if (minify) {
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

  async function maybeBuild () {
    if (await fsExistsAsync(jsOutput)) return;
    return build();
  }

  return {
    buildAndWatch,
    build,
    maybeBuild,
  };
}
