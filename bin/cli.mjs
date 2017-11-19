import Bundlifier from '../Bundlifier';
import camelCase from 'lodash/camelCase';
import forOwn from 'lodash/forOwn';
import nopt from 'nopt';

var knownOpts = {
  'input-dir': String,
  'output-dir': String,
  'scss-input': String,
  'css-output': String,
  'es-input': String,
  'js-output': String,
  'environment': String,
};
var shortHands = {
  'watch': ['--environment', 'development'],
  'w': ['--watch'],
};
var parsed = nopt(knownOpts, shortHands);
forOwn(parsed, function (value, name) {
  parsed[camelCase(name)] = value;
});

async function start (options) {
  var bundlifier = Bundlifier(options);
  await bundlifier.start();
}

start(parsed);

if (parsed['environment'] ?
    parsed['environment'] === 'development' :
    process.env.NODE_ENV === 'development') {
  // Don't exit Node if a watcher is running.
  process.stdin.resume();
}
