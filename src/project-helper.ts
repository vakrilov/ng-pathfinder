import { ModuleSymbol, ProjectSymbols } from 'ngast';
import { ExtendedRoute } from './index';


export class ProjectHelper {
  private allModules: ModuleSymbol[];
  constructor(private proj: ProjectSymbols) {
    this.allModules = proj.getModules();
  }

  getRoutesForModule(module: ModuleSymbol): ExtendedRoute[] {
    const summary = module.getModuleSummary();
    if (!summary) return;

    const routes = summary.providers.filter(s => {
      return s.provider.token.identifier && s.provider.token.identifier.reference.name === 'ROUTES';
    });

    if (!routes) return [];

    return routes[0].provider.useValue;
  }

  findModule(moduleUri: string) {
    const moduleUriParts = moduleUri.split('#');

    // TODO: Find module by name only might not be good enough
    let result = this.allModules.find((m) => m.symbol.name === moduleUriParts[1]);

    return result;
  }

  getBootstrapModule(): ModuleSymbol {
    return this.allModules.find(m => m.getBootstrapComponents().length > 0);
  }
}