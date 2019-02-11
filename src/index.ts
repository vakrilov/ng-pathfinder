import * as minimist from 'minimist';
import * as chalk from 'chalk';
import { existsSync } from 'fs';
import { ProjectSymbols, ModuleSymbol } from 'ngast';
import { pathToFileURL } from 'url';
import { join, resolve } from 'path';

import { resourceResolver } from './utils/resource';
import { ModuleTree } from './utils/module-tree';

import { Routes, Route } from '@angular/router';

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
if (!parseError) {
  // console.log("")
  // console.log(allModules.map(m => m.symbol.name).join("\n"));

  console.log("")
  console.log("----PATHS----")
  const mainModule = allModules.find(m => m.getBootstrapComponents().length > 0);
  traverseRoutes(mainModule, 0);
}


export function traverseRoutes(module: ModuleSymbol, level: number) {
  printModule(level, module);

  const routes = getRoutesForModule(module);
  routes.forEach(r => traverseRoute(r, level));
}




function getRoutesForModule(module: ModuleSymbol): Routes {
  const summary = module.getModuleSummary();
  if (!summary) return;

  const routes = summary.providers.filter(s => {
    return s.provider.token.identifier && s.provider.token.identifier.reference.name === 'ROUTES';
  });

  if (!routes) return;

  return routes[0].provider.useValue;
}

function traverseRoute(r: Route, level: number) {
  printRoute(r, level);

  //handle children
  if (r.loadChildren && typeof r.loadChildren === 'string') {
    const lazyModule: ModuleSymbol = findModule(r.loadChildren);
    traverseRoutes(lazyModule, level + 1);
  } else if (r.children) {
    r.children.forEach(cr => traverseRoute(cr, level + 1))
  }
}

function indent(level: number) {
  return " ".repeat(level * 2);
}

function printModule(level: number, module: ModuleSymbol) {
  const message = indent(level) + `Module: ${module.symbol.name}`;
  console.log(chalk.default.yellow(message));
}

function printRoute(r: Route, level: number) {
  const message =
    indent(level) +
    `path:"${r.path}" ` +
    (r.redirectTo ? `redirectTo: "${r.redirectTo}" ` : "") +
    (r.component ? `comp: ${r.component.name} ` : "") +
    (r.loadChildren ? `lazy: ${r.loadChildren} ` : "") +
    (r.children ? "children: " : "");

  const color = r.loadChildren ? chalk.default.yellow : chalk.default;
  console.log(color(message));
}

function findModule(moduleUri: string) {
  const moduleUriParts = moduleUri.split('#');

  let result = allModules.find((m) => {
    return m.symbol.name === moduleUriParts[1];
  })

  return result;
}




console.log("----END----")

