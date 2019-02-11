import * as minimist from 'minimist';
import * as chalk from 'chalk';
import { existsSync } from 'fs';
import { ProjectSymbols } from 'ngast';

import { resourceResolver } from './utils/resource';
import { pathToFileURL } from 'url';
import { join, resolve } from 'path';
// import { ModuleTree } from './utils/module-tree';

console.log("Starting ...");
const error = message => {
  console.error(chalk.default.bgRed.white(message));
  };
const info = (message, count1?, count2?) => {
  console.log(chalk.default.green(message)
    + ` ${count1 ? chalk.default.blue(count1) : ''}`
    + ` ${count2 ? '/ ' + chalk.default.yellowBright(count2) : ''}`
  );
}

let projectPath = (minimist(process.argv.slice(2)) as any).p;
if (!projectPath) {
  projectPath = './tsconfig.json';
}

projectPath = resolve(__dirname, projectPath.trim());
if (!existsSync(projectPath)) {
  error('Cannot find tsconfig at "' + projectPath + '".');
  process.exit(1);
}

console.log('Parsing...');
let parseError: any = null;
const projectSymbols = new ProjectSymbols(
  projectPath,
  resourceResolver,
  e => (parseError = e)
);
const allModules = projectSymbols.getModules();
const allPipes = projectSymbols.getPipes();
const allProviders = projectSymbols.getProviders();
const allDirectives = projectSymbols.getDirectives();
console.log("Finished!")

