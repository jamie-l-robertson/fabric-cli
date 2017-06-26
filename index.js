#!/usr/bin/env node

'use strict';

const program = require('commander');
const exec = require('child_process').exec;
const appRoot = require('app-root-path');
const pkg = require('./package.json');
const buildConfig = require(appRoot + '/config.json');
const cmd = 'grunt';
const fs = require('fs');

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

    buildInfo = require(path + 'src/build/package.json');
    buildConfig.projects.push({'name': buildInfo.name, 'path': path});

    fs.writeFile(appRoot + '/config.json', JSON.stringify(buildConfig, null, 2), function (err) {
      if (err) return console.log(err);
      console.log('build added');
    });

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
