import { TestValidator } from "@nestia/e2e";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript-compiler";

/** Root of the `render` package's source. */
const SOURCE: string = path.resolve(__dirname, "../../../../packages/render/src");

/** Root of the `viewer` package, which `render` must never reach. */
const VIEWER: string = path.resolve(__dirname, "../../../../packages/viewer");

/**
 * The module specifiers a TypeScript file names that `render` forbids: the `@automovie/viewer` package and any relative path that resolves into the viewer package.
 *
 * Specifiers come from TypeScript's own pre-processor, which reports static imports, type-only imports, re-exports, dynamic `import()` and `require` calls alike, so the guard does not depend on how an import is spelled.
 */
function forbidden(file: string, source: string): string[] {
  return ts
    .preProcessFile(source, true, true)
    .importedFiles.map((entry: ts.FileReference): string => entry.fileName)
    .filter((specifier: string): boolean => {
      if (
        specifier === "@automovie/viewer" ||
        specifier.startsWith("@automovie/viewer/")
      )
        return true;
      if (!specifier.startsWith(".")) return false;
      const target: string = path.resolve(path.dirname(file), specifier);
      return target === VIEWER || target.startsWith(VIEWER + path.sep);
    });
}

/**
 * No module of `render` imports the interactive `viewer` package, so a non-interactive host that draws, captures or encodes never loads the interactive display.
 *
 * Scenarios:
 *
 * 1. The checker flags `@automovie/viewer` reached by a static import, a type-only import, a re-export, a dynamic `import()`, a `require` call, a subpath, and a relative path that climbs into `packages/viewer`.
 * 2. The checker passes a package whose name only starts with `@automovie/viewer`, the `render` package itself, and a relative path into a `render` folder named `viewer`.
 * 3. Every `.ts` file under `packages/render/src` is read, at least one hundred of them, and none names a forbidden specifier.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs TypeScript's own import pre-processor over in-memory sources and over every source file of the package, and fails listing each file and specifier that reaches the viewer. This reads source, which the checklist counts as repository arrangement; it is kept because issue #3310 and the campaign #3292 require a unit test that fails on such an import, and the user's instruction outranks the checklist. Scenarios 1 and 2 exercise the detector itself so the scan of scenario 3 cannot pass by detecting nothing.
 * @evidence contracts/development/testing.md#independent-expectations The forbidden set is the package boundary that `.agents/skills/project/SKILL.md` and issue #3310 state: `render` holds the non-interactive three.js core and never imports `viewer`. The in-memory cases are written by hand from TypeScript's import forms; the file count floor guards against a wrong root that would scan nothing.
 * @evidence contracts/development/testing.md#distinguishing-cases Each import form against the same specifier, a lookalike package name and a lookalike folder name that must pass, and the whole real tree. Whether the moved modules behave as before is owned by the moved modules' own tests.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_render_import_boundary`; it reads source files from the checkout and starts no process, browser or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each naming the input and the behavior it pins.
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
    TestValidator.equals(
      `flagged: ${source}`,
      forbidden(inside, source).length,
      1,
    );

  // 2. Lookalikes pass.
  for (const source of [
    `import { x } from "@automovie/viewerkit";`,
    `import { x } from "@automovie/render";`,
    `import { x } from "./viewer/index.js";`,
  ])
    TestValidator.equals(`passed: ${source}`, forbidden(inside, source), []);

  // 3. The real tree.
  const files: string[] = (
    fs.readdirSync(SOURCE, { recursive: true, encoding: "utf8" }) as string[]
  )
    .filter((name: string): boolean => name.endsWith(".ts"))
    .map((name: string): string => path.join(SOURCE, name));
  TestValidator.predicate(
    "the scan reads the package's source",
    files.length >= 100,
  );
  const found: string[] = files.flatMap((file: string): string[] =>
    forbidden(file, fs.readFileSync(file, "utf8")).map(
      (specifier: string): string =>
        `${path.relative(SOURCE, file)} imports ${specifier}`,
    ),
  );
  TestValidator.equals("no render module imports the viewer", found, []);
}
