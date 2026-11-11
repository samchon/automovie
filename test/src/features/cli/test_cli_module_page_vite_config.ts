import { TestValidator } from "@nestia/e2e";
import { planAutoMovieModulePageViteConfig } from "automovie";
import * as path from "node:path";

/**
 * The Vite configuration of a written module page serves the page from its own folder with the production's configuration, and names the page as the dependency scanner's entry in a form Vite resolves without its `node_modules`-skipping glob.
 *
 * Scenarios:
 *
 * 1. A page with a configuration file and a public folder gives its folder as the root, both of them unchanged, warnings only, the screen kept, and `index.html` as the only scan entry.
 * 2. A page of a production with neither gives `false` for both, as Vite reads "no configuration file" and "no public folder".
 * 3. The entry holds none of the characters that make Vite treat it as a glob, and resolved against the root it is the page's own `index.html`, even when the folder lies under `node_modules` and holds parentheses.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the exported planner with page records and asserts every member of the returned configuration.
 * @evidence contracts/development/testing.md#independent-expectations The expected members are Vite's documented option names and values; the glob characters are those Vite's `isDynamicPattern` reacts to (`*`, `?`, `[`, `]`, `{`, `}`, `(`, `)`, `!`, `@(`, `+(`), and the resolved path comes from Node's `path.resolve`, not from the planner.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts a production with a configuration and a public folder against one with neither, and a plain folder against one under `node_modules` with parentheses in its name.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_cli_module_page_vite_config`; it starts no Vite and writes no file. Whether Vite pre-bundles from the entry belongs to a run of the command.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each naming its input and the behaviour it pins.
 */
export function test_cli_module_page_vite_config(): void {
  // 1. A production with a configuration file and a public folder.
  const folder: string = path.resolve("production", "node_modules", ".cache", "automovie", "inspect-1-2");
  TestValidator.equals(
    "the page's configuration",
    planAutoMovieModulePageViteConfig({
      folder,
      configFile: path.resolve("production", "vite.config.ts"),
      publicDir: path.resolve("production", "public"),
    }),
    {
      root: folder,
      configFile: path.resolve("production", "vite.config.ts"),
      publicDir: path.resolve("production", "public"),
      logLevel: "warn",
      clearScreen: false,
      optimizeDeps: { entries: ["index.html"] },
    },
  );

  // 2. A production with neither.
  const bare: ReturnType<typeof planAutoMovieModulePageViteConfig> = planAutoMovieModulePageViteConfig({
    folder,
    configFile: false,
    publicDir: false,
  });
  TestValidator.equals("no configuration file and no public folder", [bare.configFile, bare.publicDir], [false, false]);

  // 3. The entry is a plain name that resolves to the page.
  const awkward: string = path.resolve("Program Files (x86)", "production", "node_modules", ".cache", "automovie", "draw-1-2");
  const entries: string[] = planAutoMovieModulePageViteConfig({ folder: awkward, configFile: false, publicDir: false }).optimizeDeps.entries;
  TestValidator.predicate("no glob character", entries.every((entry: string): boolean => !/[*?[\]{}()!]/u.test(entry)));
  TestValidator.equals("the page's own index.html", entries.map((entry: string): string => path.resolve(awkward, entry)), [path.join(awkward, "index.html")]);
}
