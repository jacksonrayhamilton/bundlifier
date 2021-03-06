import util from 'util';
import first from 'lodash/first';
import keys from 'lodash/keys';
import map from 'lodash/map';
import path from 'path';
import rollup from 'rollup';
import DefaultConfig from './DefaultConfig';
import RollupConfig from './RollupConfig';
import SwGenerator from './SwGenerator';
import Time from './Time';
import UglifyJS from 'uglify-es';

import fs from 'fs';
var fsWriteFileAsync = util.promisify(fs.writeFile);

export default function EsBundler({
  es = DefaultConfig.es,
  sw = false,
  minify = false,
  environment = process.env.NODE_ENV || (minify && 'production') || undefined,
} = {}) {
  var esInput = first(keys(es));
  var jsOutput = es[esInput];

  var rollupConfig = RollupConfig({esInput, jsOutput, environment});

  function start () {
    var watcher = rollup.watch(rollupConfig);
    watcher.on('event', function ({code, error}) {
      if (code === 'START') process.stdout.write('The ES watcher is (re)starting at ' + Time() + '...' + '\n');
      else if (code === 'END') process.stdout.write('Finished building ES at ' + Time() + '.' + '\n');
      else if (code === 'ERROR') process.stderr.write('Encountered an error while building ES: ' + error.stack + '\n');
      else if (code === 'FATAL') process.stderr.write('Encountered a fatal error while building ES: ' + error.stack + '\n');
    });
  }

  async function build () {
    if (sw) rollupConfig.output.footer = SwGenerator.registrationScript;
    var bundle = await rollup.rollup(rollupConfig);
    if (minify) {
      var {output} = await bundle.generate(rollupConfig.output);
      return Promise.all(map(output, function (chunkOrAsset) {
        if (chunkOrAsset.isAsset) return;
        var result = chunkOrAsset;
        result = UglifyJS.minify({[path.basename(jsOutput)]: result.code}, {
          sourceMap: {
            content: result.map,
            url: path.basename(jsOutput) + '.map',
          },
        });
        return Promise.all([
          fsWriteFileAsync(jsOutput, result.code),
          fsWriteFileAsync(jsOutput + '.map', result.map),
        ]);
      }));
    }
    return bundle.write(rollupConfig.output);
  }

  return {
    start,
    build,
  };
}
