import path from "node:path";

import { HumanReferenceIsolation } from "../../../internal/reference/isolation/HumanReferenceIsolation";

/** One made source file and whether the boundary must list it. */
interface IMade {
  /** What the case shows. */
  label: string;

  /** Repository-relative path of the made file. */
  location: string;

  /** Its source text. */
  text: string;

  /** Number of crossing edges the boundary must list for it. */
  expected: number;
}

/**
 * The reference comparison layer is reached only from inside its own two
 * folders, so it can be deleted as a whole without breaking any logic test or
 * package.
 *
 * Scenarios:
 * 1. Made files outside the layer that reach it by a static import, a type-only import, a re-export, a dynamic `import()` and a `require()` are each listed once.
 * 2. Made files that only name the layer in a comment or a string, import a shared helper, import from a sibling folder whose name merely begins with `reference`, or sit inside the layer and import within it are not listed.
 * 3. The real test program and every package have no crossing edge.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs `HumanReferenceIsolation.breaches` over the module graph TypeScript's pre-processor reads from every source file of `test/src` and `packages`, and fails with every importer, specifier and target that enters `test/src/features/human/reference` or `test/src/features/internal/reference` from outside them. It catches a logic test, helper or production file that starts to depend on the reference layer, which would make deleting the layer break it. The owner of the test program ordered this boundary as a check; it reads source arrangement, which the testing contract does not count as behaviour, and it stands only as long as the layer does.
 * @evidence contracts/testing.md#independent-expectations The expectation is the layer's definition: two named folders, entered by no edge from outside. Imports are found by `ts.preProcessFile`, the compiler's own dependency scanner, not by a pattern over text, so the made cases pin what the scanner must and must not report. Oracle limits: a specifier is resolved by path only, without the compiler's module resolution, which is exact for relative specifiers and is why bare package specifiers are skipped (no package holds the layer); a file outside `test/src` and `packages` is not read.
 * @evidence contracts/testing.md#distinguishing-cases The made cases cover each import form that can reach the layer, each near miss that must not (a comment, a string, a shared helper, a `reference-notes` sibling folder, an edge inside the layer), and the real tree. This test owns only the layer's boundary; the comparisons themselves belong to the tests beside it under `human/reference`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_reference_isolation`, reading source files from disk with no generation, renderer, browser or GPU.
 */
export function test_human_reference_isolation(): void {
  const failures: string[] = [];

  // Every made case must list exactly its own crossing edges.
  for (const made of MADE) {
    const found: HumanReferenceIsolation.IBreach[] = HumanReferenceIsolation.breaches([
      { location: path.join(HumanReferenceIsolation.ROOT, made.location), text: made.text },
    ]);

    if (found.length !== made.expected)
      failures.push(`made case "${made.label}": ${found.length} crossing edge(s) listed, expected ${made.expected}`);
  }

  // The real tree must have none, and must be read at all.
  const files: HumanReferenceIsolation.IFile[] = HumanReferenceIsolation.read(HumanReferenceIsolation.SOURCES);
  const layer: number = files.filter((file: HumanReferenceIsolation.IFile): boolean => HumanReferenceIsolation.inside(file.location)).length;

  if (layer === 0) failures.push("no file of the reference layer was read: the folders moved or the walk is broken");

  for (const breach of HumanReferenceIsolation.breaches(files))
    failures.push(`${breach.importer} imports "${breach.specifier}" (${breach.target}) from the reference layer`);

  if (failures.length !== 0)
    throw new Error(`${failures.length} reference-layer boundary finding(s):\n${failures.join("\n")}`);
}

/** A logic test's folder, outside the layer. */
const LOGIC: string = "test/src/features/human/logic/test_made.ts";

/** A file inside the layer. */
const LAYER: string = "test/src/features/internal/reference/surface/Made.ts";

/** The made cases: four import forms and a re-export that cross, five near misses that do not. */
const MADE: readonly IMade[] = [
  {
    label: "static import",
    location: LOGIC,
    text: 'import { HumanReference } from "../../internal/reference/bodies/HumanReference";\nexport const a: unknown = HumanReference;\n',
    expected: 1,
  },
  {
    label: "type-only import",
    location: LOGIC,
    text: 'import type { HumanReferenceSurface } from "../../internal/reference/surface/HumanReferenceSurface";\nexport type A = HumanReferenceSurface.IPatch;\n',
    expected: 1,
  },
  {
    label: "re-export",
    location: "test/src/features/internal/HumanMade.ts",
    text: 'export { HumanLayerBasis } from "./reference/layers/HumanLayerBasis";\n',
    expected: 1,
  },
  {
    label: "dynamic import",
    location: LOGIC,
    text: 'export async function f(): Promise<unknown> {\n  return import("../reference/surface/test_human_reference_surface");\n}\n',
    expected: 1,
  },
  {
    label: "require",
    location: "packages/human/src/Made.ts",
    text: 'const m: unknown = require("../../../test/src/features/internal/reference/curves/HumanReferenceCurves");\nexport default m;\n',
    expected: 1,
  },
  {
    label: "comment and string naming the layer",
    location: LOGIC,
    text: '// import { HumanReference } from "../../internal/reference/bodies/HumanReference";\nexport const s: string = "../../internal/reference/bodies/HumanReference";\n',
    expected: 0,
  },
  {
    label: "shared helper",
    location: LOGIC,
    text: 'import { HumanAnatomy } from "../../internal/HumanAnatomy";\nexport const a: unknown = HumanAnatomy;\n',
    expected: 0,
  },
  {
    label: "sibling folder whose name begins with reference",
    location: LOGIC,
    text: 'import { X } from "../../internal/reference-notes/X";\nexport const a: unknown = X;\n',
    expected: 0,
  },
  {
    label: "edge inside the layer",
    location: LAYER,
    text: 'import { HumanReference } from "../bodies/HumanReference";\nexport const a: unknown = HumanReference;\n',
    expected: 0,
  },
  {
    label: "package specifier",
    location: LOGIC,
    text: 'import { Singleton } from "tstl";\nexport const a: unknown = Singleton;\n',
    expected: 0,
  },
];
