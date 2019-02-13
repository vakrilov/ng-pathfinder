#!/usr/bin/env node

import * as minimist from 'minimist';
import chalk from 'chalk';
import { existsSync } from 'fs';
import { ProjectSymbols, ModuleSymbol } from 'ngast';
import { resolve } from 'path';
import { resourceResolver } from './resource-resolver';
import { StaticSymbol } from '@angular/compiler';
import { ProjectHelper } from './project-helper';

export interface ExtendedRoute {
    path?: string;
    pathMatch?: string;
    //matcher?: UrlMatcher;
    component?: StaticSymbol; //Type<any>;
    redirectTo?: string;
    outlet?: string;
    canActivate?: any[];
    canActivateChild?: any[];
    canDeactivate?: any[];
    canLoad?: any[];
    data?: any; //Data;
    //resolve?: ResolveData;
    children?: ExtendedRoute[]; //Routes;
    loadChildren?: string; //LoadChildren;
    // runGuardsAndResolvers?: RunGuardsAndResolvers;

    module?: ModuleSymbol
}

const error = message => {
    console.error(chalk.bgRed.white(message));
};

let projectPath = (minimist(process.argv.slice(2)) as any).p;
if (!projectPath) {
    projectPath = './tsconfig.json';
}
projectPath = projectPath.trim();

if (!existsSync(projectPath)) {
    error('Cannot find tsconfig at \'' + projectPath + '\'.');
    process.exit(1);
}

console.log('Loading project: ' + projectPath);
const projectSymbols = new ProjectSymbols(
    projectPath,
    resourceResolver,
    e => { error(e); process.exit(1); }
);

const project = new ProjectHelper(projectSymbols);
const mainModule = project.getBootstrapModule();
if (!mainModule) {
    error('Could not figure out bootstrap module');
    process.exit(1);
}

let root: ExtendedRoute = {
    module: mainModule,
    children: project.getRoutesForModule(mainModule)
};

console.log('Reading lazy modules...');
function fillLazyChildren(route: ExtendedRoute) {
    if (route.children) {
        route.children.forEach((childRoute: ExtendedRoute) => {
            if (childRoute.loadChildren && typeof childRoute.loadChildren === 'string') {
                const lazyModule: ModuleSymbol = project.findModule(childRoute.loadChildren);
                childRoute.module = lazyModule;
                childRoute.children = project.getRoutesForModule(lazyModule);
            }
            fillLazyChildren(childRoute);
        })
    }
}
fillLazyChildren(root);

function indent(level: number) {
    return ' '.repeat(level * 2);
}

function printComponent(comp: StaticSymbol) {
    if (!comp) {
        return '';
    }

    if (comp.filePath.indexOf('node_modules') === -1) {
        return chalk.magenta(comp ? ` comp: ${comp.name}(${comp.filePath})` : '')
    } else {
        return chalk.magenta(comp ? ` comp: ${comp.name}` : '')
    }
}

function print(route: ExtendedRoute, level: number) {
    if (typeof route.path !== 'undefined') {
        const message =
            indent(level) +
            `path: '${route.path}'` +
            chalk.green(route.redirectTo ? ` redirectTo: '${route.redirectTo}'` : '') +
            chalk.blueBright(route.outlet ? ` outlet: ${route.outlet}` : '') +
            chalk.yellow(route.loadChildren ? ` lazy: ${route.loadChildren} ` : '') +
            printComponent(route.component);
        console.log(message);
    }

    if (route.module) {
        console.log(chalk.yellow(`${indent(level + 1)}${route.module.symbol.name}(${route.module.symbol.filePath})`));
    }

    if (route.children) {
        route.children.forEach(childRoute => { print(childRoute, level + 1) });
    }
}

function printRoot(root: ExtendedRoute) {
    console.log('')
    console.log('----PATHS----')
    console.log(chalk.yellow(`${root.module.symbol.name}(${root.module.symbol.filePath})`));
    if (root.children) {
        root.children.forEach(child => { print(child, 0) });
    }
}

printRoot(root);
