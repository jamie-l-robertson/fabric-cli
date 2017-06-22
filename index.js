#!/usr/bin/env node

'use strict';

FORCE_COLOR = 1;

const program = require('commander');
const exec = require('child_process').exec;
const chalk = require('chalk');
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

function run(task) {
  let command;

  task === 'start' ? command = cmd : command = cmd + ' ' +  task;
  let fabric = exec(command + ' --colors');
  log(fabric);
}

program
  .version(pkg.version)
  .arguments('[task]')
  .version(pkg.version)
  .description('CLI for Fabric')
  .action(function (task) {
     run(task);
  });

program.parse(process.argv);

if (program.args.length === 0) program.help();
