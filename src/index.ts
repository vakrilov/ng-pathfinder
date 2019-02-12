import * as minimist from 'minimist';
import * as chalk from 'chalk';
import { existsSync } from 'fs';
import { ProjectSymbols, ModuleSymbol } from 'ngast';
import { resolve } from 'path';
import { resourceResolver } from './resource-resolver';
import { Route } from '@angular/router';
import { StaticSymbol } from '@angular/compiler';
import { ProjectHelper } from './project-helper';

export type ExtendedRoute = Route & {
  component?: StaticSymbol
  module?: ModuleSymbol
  children?: ExtendedRoute[];
}

interface TraverseContext {
  level: number,
  currentModule: ModuleSymbol,
  currentRoute: ExtendedRoute
}

console.log("Starting ...");
const error = message => {
  console.error(chalk.default.bgRed.white(message));
};

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
const projectSymbols = new ProjectSymbols(
  projectPath,
  resourceResolver,
  e => { error(e); process.exit(1); }
);

console.log("")
console.log("----PATHS----")

const project = new ProjectHelper(projectSymbols);
const mainModule = project.getBootstrapModule();
let root: ExtendedRoute = {
  module: mainModule,
  children: project.getRoutesForModule(mainModule)
};

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

function print(route: ExtendedRoute, level: number = 0) {
  if (route.module) {
    console.log(chalk.default.yellow(`${indent(level)}${route.module.symbol.name}(${route.module.symbol.filePath})`));
  }
  chalk.default.green()
  if (typeof route.path !== undefined) {
    const message =
      indent(level) +
      `  path: "${route.path}" ` +
      chalk.default.green(route.redirectTo ? ` redirectTo: "${route.redirectTo}" ` : "") +
      chalk.default.blueBright(route.outlet ? ` outlet: ${route.outlet}` : "") +
      chalk.default.yellow(route.loadChildren ? ` lazy: ${route.loadChildren} ` : "") +
      chalk.default.magenta(route.component ? ` comp: ${route.component.name}(${route.component.filePath})` : "");
    console.log(chalk.default(message));
  }


  if (route.children) {
    route.children.forEach(childRoute => {
      print(<ExtendedRoute>childRoute, level + 1)
    });
  }
}


print(root);





//   node.children.forEach(route => {
//     if (route.loadChildren && typeof route.loadChildren === 'string') {
//       const lazyModule: ModuleSymbol = project.findModule(route.loadChildren);

//       route.module = lazyModule;
//       route.children = project.getRoutesForModule(lazyModule)
//       route.children.for

//       traverseRoutes({ currentModule: lazyModule, level: context.level + 1 });
//     } else if (route.children) {
//       route.children.forEach(childRoute => traverseRoute(<ExtendedRoute>childRoute, context))
//     }

//   }
// }

// function fillLazyModule()







// traverseRoutes({ currentModule: mainModule, level: 0, currentRoute: root });

// export function traverseRoutes(context: TraverseContext) {
//   // printModule(context);

//   const routes = project.getRoutesForModule(context.currentModule);
//   routes.forEach(r => traverseRoute(r, context));
// }

// function traverseRoute(route: ExtendedRoute, context: TraverseContext) {
//   printRoute(route, context);

//   //handle children
//   if (route.loadChildren && typeof route.loadChildren === 'string') {
//     const lazyModule: ModuleSymbol = project.findModule(route.loadChildren);

//     traverseRoutes({ currentModule: lazyModule, level: context.level + 1 });
//   } else if (route.children) {
//     route.children.forEach(childRoute => traverseRoute(<ExtendedRoute>childRoute, context))
//   }
// }

function indent(level: number) {
  return " ".repeat(level * 4);
}

// function printModule({ level, currentModule }: TraverseContext) {
//   // const message = indent(level) + `Module: ${currentModule.symbol.name}(${currentModule.symbol.filePath})`;
//   // console.log(chalk.default.yellow(message));
// }

// function printRoute(route: ExtendedRoute, context: TraverseContext) {
//   // const message =
//   //   indent(context.level) +
//   //   `path:"${route.path}" ` +
//   //   (route.redirectTo ? `redirectTo: "${route.redirectTo}" ` : "") +
//   //   (route.component ? `comp: ${route.component.name}(${route.component.filePath})` : "") +
//   //   (route.loadChildren ? `lazy: ${route.loadChildren} ` : "") +
//   //   (route.children ? "children: " : "");

//   // const color = route.loadChildren ? chalk.default.yellow : chalk.default;
//   // console.log(color(message));
// }

