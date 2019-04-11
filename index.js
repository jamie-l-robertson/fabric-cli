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

function trailingSlash(path) {
  return path.endsWith('/') ? path : path + '/';
}

function log(data) {
  data.stdout.on('data', data => process.stdout.write(data));
  data.stderr.on('data', data => process.stdout.write(data));
  data.on('close', function (code) {
    if (code) console.log('[END] code', code);
    if (stdout) console.log('[END] stdout "%s"', stdout);
    if (stderr) console.log('[END] stderr "%s"', stderr);
  });
}

function defaultTask(path) {
  return 'rm src/build; ln -s ' + path + ' src/build; grunt';
}

function argument(task, name, path, basePath) {
  const config = readConfig();
  let project;
  let command;
  let buildInfo;

  if (task === 'Connect build') {

    command = 'rm src/build; ln -s ' + config.basePath + path + ' src/build; grunt';
    buildInfo = require(config.basePath + trailingSlash(path) + 'package.json');
    buildConfig.projects.push({ name: buildInfo.name, path: config.basePath + path });

    fs.writeFile(appRoot + '/config.json', JSON.stringify(buildConfig, null, 2), err => {
      if (err) return console.log(err);
      console.log('Build stored!');
    });
  }

  if (task === 'Start build') {
    project = config.projects.find(obj => obj.name === name);
    command = defaultTask(project.path);

  }

  if (task === 'Connect base') {
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

function run(task, name, path, rootPath) {
  const command = argument(task, name, path, rootPath);
  const fabric = command ? exec(command) : null;
  fabric !== null ? log(fabric) : null;
}

const questions = [
  {
    type: 'list',
    name: 'command',
    message: 'What would you like to do?',
    choices: ['Start build', 'Connect build', 'Connect base'],
  },
  {
    type: 'list',
    name: 'build',
    message: 'Which build would you like to start?',
    choices: getBuilds(),
    when: answers => answers.command === 'Start build',
  },
  {
    type: 'input',
    name: 'path',
    message: 'Enter the build path',
    when: answers => answers.command === 'Connect build',
  },
  {
    type: 'input',
    name: 'basePath',
    message: 'Enter your base path',
    when: answers => answers.command === 'Connect base'
  },
];

console.log(chalk.yellow(figlet.textSync('Fabric', { horizontalLayout: 'full' })));

prompt(questions).then(answers => {
  const { command, build, path, basePath } = answers;
  run(command, build, path, basePath);
});
