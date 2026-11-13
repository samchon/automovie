import {
  type OnResolveArgs,
  type OnResolveResult,
  type Plugin,
  type ResolveResult,
  build,
} from "esbuild";
import fs from "node:fs";
import path from "node:path";

/**
 * Builds the test program for a fast run: `src/index.ts` and every test file
 * as entry points of one esbuild bundle in `bin/`, so `node bin/index.mjs`
 * runs the same program with the same arguments as `ttsx src/index.ts`.
 *
 * The build type-checks and lints nothing; the type-check watch and CI's
 * `pnpm test` own that. `bin/` is git-ignored and outside `src`, because a
 * compiled file beside a source is what Node would load instead of it.
 */
const root: string = import.meta.dirname;
const output: string = path.join(root, "bin");

/**
 * Leaves installed packages to Node and bundles the workspace's own sources.
 *
 * A workspace package resolves through its symlink to TypeScript under
 * `packages/`, which only a bundler can load; an installed package resolves
 * inside a `node_modules` directory and stays an import, so native addons
 * and packages with their own assets load as they do under `ttsx`.
 */
const installed: Plugin = {
  name: "installed-packages",
  setup(setup): void {
    const resolving: unique symbol = Symbol("resolving");
    setup.onResolve(
      { filter: /^[^./]/ },
      async (args: OnResolveArgs): Promise<OnResolveResult | undefined> => {
        // The nested resolve below reaches this hook again; let it through.
        if ((args.pluginData as symbol | undefined) === resolving)
          return undefined;
        const resolved: ResolveResult = await setup.resolve(args.path, {
          kind: args.kind,
          importer: args.importer,
          resolveDir: args.resolveDir,
          pluginData: resolving,
        });
        if (resolved.errors.length !== 0) return { errors: resolved.errors };
        return resolved.external ||
          resolved.path.split(/[\\/]/).includes("node_modules")
          ? { path: args.path, external: true }
          : { path: resolved.path };
      },
    );
  },
};

// A test removed from the sources must not stay runnable from an old build.
fs.rmSync(output, { recursive: true, force: true });
await build({
  absWorkingDir: root,
  entryPoints: ["src/index.ts", "src/features/**/test_*.ts"],
  outdir: output,
  outbase: "src",
  outExtension: { ".js": ".mjs" },
  bundle: true,

  // Shared code is emitted once as chunks, not once per test file.
  splitting: true,
  format: "esm",
  platform: "node",
  plugins: [installed],

  // The sources are CommonJS and read these two names; an ES module has
  // neither, so each output file defines them from its own location.
  banner: {
    js: [
      `import { fileURLToPath as __toPath } from "node:url";`,
      `import { dirname as __toDirectory } from "node:path";`,
      `const __filename = __toPath(import.meta.url);`,
      `const __dirname = __toDirectory(__filename);`,
    ].join("\n"),
  },
  logLevel: "warning",
});
