#!/usr/bin/env node

'use strict';

const program = require('commander');
const exec = require('child_process').exec;
const pkg = require('./package.json');
const cmd = 'grunt';

function log(data) {
  data.stdout.on('data', function (data) {
    process.stdout.write(data);
  });

  data.stderr.on('data', function (data) {
    process.stdout.write(data);
  });
}

function argument(task, path) {
  var command;
  task === 'start' ? command = cmd : command = cmd + ' ' +  task;

  if(task === 'connect' && path != undefined) {
    let cwd = process.cwd();
    let buildPath = cwd  + '/src/build/';
    let buildInfo;

    command = 'rm src/build; ln -s ' + path + ' src/build';
    exec(command);

    buildInfo = require(path + 'package.json');
  }

  return command;
}

function run(task, path) {
  let command = argument(task, path);
  let fabric = exec(command);
  log(fabric);
}

program
  .version(pkg.version)
  .arguments('[task] [path]')
  .version(pkg.version)
  .description('CLI for Fabric')
  .action(function (task, path) {
     run(task, path);
  });

program.parse(process.argv);
if (program.args.length === 0) program.help();
