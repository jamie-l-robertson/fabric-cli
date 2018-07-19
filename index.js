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

function log(data) {
  data.stdout.on('data', data => process.stdout.write(data));
  data.stderr.on('data', data => process.stdout.write(data));
  data.on('close', function(code) {
    console.log('[END] code', code);
    console.log('[END] stdout "%s"', stdout);
    console.log('[END] stderr "%s"', stderr);
  });
}

function defaultTask(path) {
  return 'rm src/build; ln -s ' + path + ' src/build; grunt';
}

function argument(task, name, path) {
  const config = readConfig();
  let project;
  let command;
  let buildInfo;

  if (task === 'connect') {
    command = 'rm src/build; ln -s ' + path + ' src/build; grunt';
    buildInfo = require(path + 'package.json');
    buildConfig.projects.push({ name: buildInfo.name, path: path });

    fs.writeFile(appRoot + '/config.json', JSON.stringify(buildConfig, null, 2), err => {
      if (err) return console.log(err);
      console.log('Build stored!');
    });
  }

  if (task === 'start') {
    project = config.projects.find(obj => obj.name === name);
    command = defaultTask(project.path);
  }

  return command;
}

function readConfig() {
  return JSON.parse(fs.readFileSync(appRoot + '/config.json', 'utf8'));
}

function getBuilds() {
  const builds = readConfig();
  const options = builds.projects.map(proj => proj.name);
  return options;
}

function run(task, name, path) {
  const command = argument(task, name, path);
  const fabric = exec(command);
  log(fabric);
}

const questions = [
  {
    type: 'list',
    name: 'command',
    message: 'What would you like to do?',
    choices: ['start', 'connect'],
  },
  {
    type: 'list',
    name: 'build',
    message: 'Which build would you like to start?',
    choices: getBuilds(),
    when: answers => answers.command === 'start',
  },
  {
    type: 'input',
    name: 'path',
    message: 'Enter the build path',
    when: answers => answers.command === 'connect',
  },
];

console.log(chalk.yellow(figlet.textSync('Fabric', { horizontalLayout: 'full' })));

prompt(questions).then(answers => {
  const { command, build, path } = answers;
  run(command, build, path);
});
