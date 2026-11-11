import { TestValidator } from "@nestia/e2e";
import fs from "node:fs";
import { builtinModules } from "node:module";
import path from "node:path";
import ts from "typescript-compiler";

/** Root of the `render` package's source. */
const SOURCE: string = path.resolve(__dirname, "../../../../packages/render/src");

/** Root of the `viewer` package, which `render` must never reach. */
const VIEWER: string = path.resolve(__dirname, "../../../../packages/viewer");

/** Node's built-in modules by bare name, such as `zlib`, which a file can import without the `node:` prefix. */
const BUILTINS: ReadonlySet<string> = new Set(builtinModules);

/**
 * Files under `packages/render/src` that may still import a Node built-in, each with the specifiers it may name. The CPU rasterizer's files were to be listed here until #3312 retires them, but none imports one: its only Node import, the PNG encoder's `node:zlib`, moved to `CompressionStream` with #3298. The list stays empty.
 */
const NODE_EXCEPTIONS: Readonly<Record<string, readonly string[]>> = {};

/**
 * The module specifiers a TypeScript file names that `render` forbids, each with the boundary it crosses: the `@automovie/viewer` package or a relative path into it, React (`react`, `react-dom` and their subpaths), and a Node built-in, by the `node:` prefix or a bare built-in name, unless `NODE_EXCEPTIONS` allows it for that file.
 *
 * Specifiers come from TypeScript's own pre-processor, which reports static imports, type-only imports, re-exports, dynamic `import()` and `require` calls alike, so the guard does not depend on how an import is spelled.
 */
function forbidden(file: string, source: string): string[] {
  const allowed: readonly string[] =
    NODE_EXCEPTIONS[path.relative(SOURCE, file).split(path.sep).join("/")] ?? [];
  return ts
    .preProcessFile(source, true, true)
    .importedFiles.map((entry: ts.FileReference): string => entry.fileName)
    .flatMap((specifier: string): string[] => {
      const root: string = specifier.split("/")[0]!;
      if (specifier === "@automovie/viewer" || specifier.startsWith("@automovie/viewer/"))
        return [`viewer ${specifier}`];
      if (root === "react" || root === "react-dom") return [`react ${specifier}`];
      if ((specifier.startsWith("node:") || BUILTINS.has(root)) && !allowed.includes(specifier))
        return [`node ${specifier}`];
      if (!specifier.startsWith(".")) return [];
      const target: string = path.resolve(path.dirname(file), specifier);
      return target === VIEWER || target.startsWith(VIEWER + path.sep)
        ? [`viewer ${specifier}`]
        : [];
    });
}

/**
 * No module of `render` imports the interactive `viewer` package, React or a Node built-in, so a host that draws, captures or encodes never loads the interactive display, and the same code runs in a page and in a Node host that injects files and processes.
 *
 * Scenarios:
 *
 * 1. The checker flags `@automovie/viewer` reached by a static import, a type-only import, a re-export, a dynamic `import()`, a `require` call, a subpath, and a relative path that climbs into `packages/viewer`.
 * 2. The checker flags `react`, `react-dom/client`, `node:fs/promises`, `node:zlib` and the bare built-ins `zlib` and `fs/promises`.
 * 3. The checker passes a package whose name only starts with `@automovie/viewer` or `react`, the `render` package itself, `three`, and a relative path into a `render` folder named `viewer`.
 * 4. Every `.ts` file under `packages/render/src` is read, at least one hundred of them, and none names a forbidden specifier; no file is excepted.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs TypeScript's own import pre-processor over in-memory sources and over every source file of the package, and fails listing each file and specifier that crosses a boundary. This reads source, which the checklist counts as repository arrangement; it is kept because issues #3310 and #3298 and the campaign #3292 require a unit test that fails on such an import, and the user's instruction outranks the checklist. Scenarios 1 to 3 exercise the detector itself so the scan of scenario 4 cannot pass by detecting nothing.
 * @evidence contracts/development/testing.md#independent-expectations The forbidden set is the package boundary `.agents/skills/project/SKILL.md` and the campaign's completion criteria state: `render` imports no `node:` module, no React and no `@automovie/viewer`. Built-in names come from Node's own `builtinModules`; the in-memory cases are written by hand from TypeScript's import forms; the file count floor guards against a wrong root that would scan nothing.
 * @evidence contracts/development/testing.md#distinguishing-cases Each import form against the same specifier, prefixed against bare built-ins, lookalike package and folder names that must pass, and the whole real tree. Whether the moved modules behave as before is owned by their own tests.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_render_import_boundary`; it reads source files from the checkout and starts no process, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_render_import_boundary(): void {
  // 1. Every import form that reaches the viewer is flagged.
  const inside: string = path.join(SOURCE, "scene", "sample.ts");
  for (const source of [
    `import { mountViewer } from "@automovie/viewer";`,
    `import type { IAutoMovieViewerHandle } from "@automovie/viewer";`,
    `export * from "@automovie/viewer";`,
    `const viewer = import("@automovie/viewer");`,
    `const viewer = require("@automovie/viewer");`,
    `import { x } from "@automovie/viewer/lib/index.js";`,
    `import { x } from "../../../viewer/src/mountViewer.js";`,
  ])
    TestValidator.equals(`flagged: ${source}`, forbidden(inside, source).length, 1);

  // 2. React and Node built-ins are flagged.
  for (const specifier of ["react", "react-dom/client", "node:fs/promises", "node:zlib", "zlib", "fs/promises"])
    TestValidator.equals(
      `flagged: ${specifier}`,
      forbidden(inside, `import x from "${specifier}";`).length,
      1,
    );

  // 3. Lookalikes pass.
  for (const source of [
    `import { x } from "@automovie/viewerkit";`,
    `import { x } from "reactive";`,
    `import { x } from "@automovie/render";`,
    `import * as THREE from "three";`,
    `import { x } from "./viewer/index.js";`,
  ])
    TestValidator.equals(`passed: ${source}`, forbidden(inside, source), []);

  // 4. The real tree.
  const files: string[] = (
    fs.readdirSync(SOURCE, { recursive: true, encoding: "utf8" }) as string[]
  )
    .filter((name: string): boolean => name.endsWith(".ts"))
    .map((name: string): string => path.join(SOURCE, name));
  TestValidator.predicate("the scan reads the package's source", files.length >= 100);
  const found: string[] = files.flatMap((file: string): string[] =>
    forbidden(file, fs.readFileSync(file, "utf8")).map(
      (crossing: string): string => `${path.relative(SOURCE, file)} imports ${crossing}`,
    ),
  );
  TestValidator.equals("no render module crosses a boundary", found, []);
}
