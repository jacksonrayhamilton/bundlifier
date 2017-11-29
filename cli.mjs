#!/usr/bin/env node

import Bundlifier from './Bundlifier';
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
  'm': ['--maybe-build'],
  'w': ['--watch'],
};
var parsed = nopt(knownOpts, shortHands);
forOwn(parsed, function (value, name) {
  parsed[camelCase(name)] = value;
});

async function start (options) {
  var bundlifier = Bundlifier(options);
  if (options.watch) {
    bundlifier.start();
  } else if (options.maybeBuild) {
    await bundlifier.maybeBuild();
  } else {
    await bundlifier.build();
  }
}

start(parsed);

if (parsed.watch) {
  // Don't exit Node if a watcher is running.
  process.stdin.resume();
}
