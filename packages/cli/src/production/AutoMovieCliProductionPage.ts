import type { AutoMovieCliProductionPageTypes } from "./AutoMovieCliProductionPageTypes";
import { planAutoMovieModulePageViteConfig } from "./internal/planAutoMovieModulePageViteConfig";
import { writeAutoMovieModulePage } from "./internal/writeAutoMovieModulePage";

/** Public operations for generated pages inside a production. */
export namespace AutoMovieCliProductionPage {
  /** Write the page files and return the production paths and cleanup method. */
  export function writeModulePage(
    props: AutoMovieCliProductionPageTypes.WriteProps,
  ): AutoMovieCliProductionPageTypes.WrittenPage {
    return writeAutoMovieModulePage(props);
  }

  /** Plan the Vite config that serves or bundles a written module page. */
  export function planViteConfig(
    page: AutoMovieCliProductionPageTypes.PageConfig,
  ): AutoMovieCliProductionPageTypes.ViteConfig {
    return planAutoMovieModulePageViteConfig(page);
  }
}
