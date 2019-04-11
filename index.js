#!/usr/bin/env node

'use strict';

const inquirer = require('inquirer');
const appRoot = require('app-root-path');
const fs = require('fs');
const figlet = require('figlet');
const chalk = require('chalk');
const exec = require('child_process').exec;
const prompt = inquirer.createPromptModule();
const buildConfig = require(appRoot + '/config.json');

const base_cmd = 'Connect base';
const fabric_base_cmd = 'Connect Fabric';
const connect_cmd = 'Add build';
const start_cmd = 'Start build';


function trailingSlash(path) {
  return path.endsWith('/') ? path : path + '/';
}

function log(data) {
  data.stdout.on('data', data => process.stdout.write(data));
  data.stderr.on('data', data => process.stdout.write(data));
  data.on('close', function (code, stdout, stderr) {
    if (code) console.log('[END] code', code);
    if (stdout) console.log('[END] stdout "%s"', stdout);
    if (stderr) console.log('[END] stderr "%s"', stderr);
  });
}

function getFabric() {
  return 'cd ' + trailingSlash(buildConfig.fabricPath);
}

function defaultTask(path) {
  const fabric = getFabric();
  return fabric + '; rm src/build; ln -s ' + path + ' src/build; grunt';
}

function argument(task, name, path, fabricPath, basePath) {
  const config = readConfig();
  const fabric = getFabric();
  let project;
  let command;

  if (task === connect_cmd) {
    command = fabric + '; rm src/build; ln -s ' + config.basePath + path + ' src/build; grunt';
    buildConfig.projects.push({ name: path, path: trailingSlash(config.basePath + path) });
    fs.writeFile(appRoot + '/config.json', JSON.stringify(buildConfig, null, 2), err => {
      if (err) return console.log(err);
      console.log('Build stored!');
    });
  }

  if (task === start_cmd) {
    project = config.projects.find(obj => obj.name === name);
    command = defaultTask(project.path);

  }

  if (task === fabric_base_cmd) {
    buildConfig.fabricPath = trailingSlash(fabricPath);

    fs.writeFile(appRoot + '/config.json', JSON.stringify(buildConfig, null, 2), err => {
      if (err) return console.log(err);
      console.log('Base path stored!');
    });
  }

  if (task === base_cmd) {
    buildConfig.basePath = trailingSlash(basePath);

    fs.writeFile(appRoot + '/config.json', JSON.stringify(buildConfig, null, 2), err => {
      if (err) return console.log(err);
      console.log('Base path stored!');
    });
  }

  return command;

}

function readConfig() {
  return JSON.parse(fs.readFileSync(appRoot + '/config.json', 'utf8'));
}

function getBuilds() {
  const builds = readConfig();
  let projects = new Array();

  projects = Array.from(new Set(builds.projects.map(JSON.stringify))).map(JSON.parse);

  return projects;
}

function run(task, name, path, fabricPath, basePath) {
  const command = argument(task, name, path, fabricPath, basePath);
  const fabric = command ? exec(command) : null;
  fabric !== null ? log(fabric) : null;
}

const questions = [
  {
    type: 'list',
    name: 'command',
    message: 'What would you like to do?',
    choices: [start_cmd, connect_cmd, fabric_base_cmd, base_cmd],
  },
  {
    type: 'list',
    name: 'build',
    message: 'Which build would you like to start?',
    choices: getBuilds(),
    when: answers => answers.command === start_cmd,
  },
  {
    type: 'input',
    name: 'path',
    message: 'Enter the build path',
    when: answers => answers.command === connect_cmd,
  },
  {
    type: 'input',
    name: 'fabricPath',
    message: 'Enter your fabric path',
    when: answers => answers.command === fabric_base_cmd
  },
  {
    type: 'input',
    name: 'basePath',
    message: 'Enter your base path',
    when: answers => answers.command === base_cmd
  },
];

console.log(chalk.yellow(figlet.textSync('Fabric', { horizontalLayout: 'full' })));

prompt(questions).then(answers => {
  const { command, build, path, fabricPath, basePath } = answers;
  run(command, build, path, fabricPath, basePath);
});
