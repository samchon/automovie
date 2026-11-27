/** Named contracts for writing a production module page and its Vite config. */
export namespace AutoMovieCliProductionPageTypes {
  /** Inputs for writing the generated page files. */
  export interface WriteProps {
    /** The production's root folder. */
    root: string;

    /** Path of the subject module, relative to `root` or absolute. */
    module: string;

    /** Short page name used at the start of the scratch folder name. */
    kind: string;

    /** The page's title. */
    title: string;

    /** The body's markup before the script. */
    body: string;

    /** Write `main.js` from the module's import specifier. */
    script: (specifier: string) => string;
  }

  /** Production paths shared by page writing and Vite configuration. */
  export interface PageConfig {
    /** The page's folder, the root it is served from. */
    folder: string;

    /** The production's `vite.config.ts`, or `false` when it has none. */
    configFile: string | false;

    /** The production's `public` folder, or `false` when it has none. */
    publicDir: string | false;
  }

  /** A written production page and its cleanup operation. */
  export interface WrittenPage extends PageConfig {
    /** Delete the scratch folder. */
    remove: () => void;
  }

  /** The page's dependency-scanner options. */
  export interface DependencyScan {
    /** The page's own `index.html`, relative to its root. */
    entries: string[];
  }

  /** Vite configuration shared by the page's development and build hosts. */
  export interface ViteConfig {
    /** The page's folder. */
    root: string;

    /** The production's configuration file, or `false`. */
    configFile: string | false;

    /** The production's public folder, or `false`. */
    publicDir: string | false;

    /** Only warnings and errors. */
    logLevel: "warn";

    /** Keep earlier output on screen. */
    clearScreen: false;

    /** The dependency scanner's entry. */
    optimizeDeps: DependencyScan;
  }
}
