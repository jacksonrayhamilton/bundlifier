#!/usr/bin/env node

import util from 'util';

import assign from 'lodash/assign';
import camelCase from 'lodash/camelCase';
import forOwn from 'lodash/forOwn';

import fs from 'fs';
var fsExistsAsync = util.promisify(fs.exists);
var fsReadFileAsync = util.promisify(fs.readFile);

import Bundlifier from './Bundlifier';
import nopt from 'nopt';

async function getOptions () {
  var cliOptions = getCliOptions();
  return assign({}, await getConfigOptions(cliOptions), cliOptions);
}

function getCliOptions () {
  var knownOpts = {
    'config': String,
  };
  var shortHands = {
    'n': ['--necessarily'],
    'm': ['--minify'],
    'w': ['--watch'],
  };
  var parsed = nopt(knownOpts, shortHands);
  forOwn(parsed, function (value, name) {
    parsed[camelCase(name)] = value;
  });
  return parsed;
}

var defaultConfigFile = 'bundlifier.json';

async function getConfigOptions (cliOptions) {
  var configFile = cliOptions.config || defaultConfigFile;
  if (!(await fsExistsAsync(configFile))) {
    if (cliOptions.config) {
      process.stderr.print('Config file “' + configFile + '” does not exist.\n');
      process.exit(1);
    } else {
      return {};
    }
  }
  return JSON.parse(await fsReadFileAsync(configFile));
}

async function start () {
  var options = await getOptions();

  var bundlifier = Bundlifier(options);
  if (options.watch) {
    bundlifier.start();
  } else if (options.necessarily) {
    await bundlifier.maybeBuild();
  } else {
    await bundlifier.build();
  }

  if (options.watch) {
    // Don't exit Node if a watcher is running.
    process.stdin.resume();
  }
}

start();
