import { resolveAutoMovieProductionEvidencePopulationFiles } from "@automovie/evidence";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

/**
 * A citation base cannot enroll unrelated files into a physical evidence walk.
 *
 * Scenarios:
 *
 * 1. Project-rooted source selectors walk src, not vendored or tool files.
 * 2. Document selectors keep final screenplays inside the docs population.
 * 3. Non-selected and empty candidates disappear; output ordering stays stable.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls resolveAutoMovieProductionEvidencePopulationFiles through its walk and glob seams and checks observed roots, extensions and selectors plus sorted project-relative output, catching enrollment of a selected vendor path or an unselected controlled candidate.
 * @evidence contracts/testing.md#independent-expectations Literal candidate and selected inventories define an intersection: only a.ts and z.ts belong to both source sets, and the final screenplay belongs below docs. Code-unit ordering gives a before z; these observations do not claim execution of the real walker or glob implementation.
 * @evidence contracts/testing.md#distinguishing-cases Covers a project-rooted TypeScript claim, a docs-rooted Markdown claim, selected vendor residue, an unselected controlled model, deliberately reversed candidates and the empty intersection; physical file/link admission belongs to the population walker tests.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_evidence_population_inventory entry owns both injected inventories and the empty case through the declared I/O parameter, without replacing fs methods or creating files, consumers, native artifacts or running hosts.
 */
export function test_evidence_population_inventory(): void {
  const project: string = path.resolve("production");
  const walks: string[] = [];
  const source: string[] = resolveAutoMovieProductionEvidencePopulationFiles(
    project,
    ".",
    ["src/spaces/*.ts"],
    undefined,
    {
      walk: (root: string, directory: string, extension: ".md" | ".ts"): string[] => {
        TestValidator.equals("same project boundary", root, project);
        TestValidator.equals("source extension", extension, ".ts");
        walks.push(directory);
        return [
          "src/spaces/z.ts",
          "src/models/other.ts",
          "src/spaces/a.ts",
        ].map((file: string): string => path.resolve(root, file));
      },
      glob: (patterns: readonly string[], root: string): string[] => {
        TestValidator.equals("unchanged selectors", patterns, [
          "src/spaces/*.ts",
        ]);
        TestValidator.equals("citation root", root, project);
        return ["src/spaces/a.ts", "src/spaces/z.ts", "vendor/irrelevant.ts"];
      },
    },
  );
  TestValidator.equals("source inventory", source, [
    "src/spaces/a.ts",
    "src/spaces/z.ts",
  ]);
  const final: string = "final/screenplays/001-film/001-opening.md";
  const documents: string[] = resolveAutoMovieProductionEvidencePopulationFiles(
    project,
    "docs",
    ["final/screenplays/**/*.md"],
    ".md",
    {
      walk: (root: string, directory: string, extension: ".md" | ".ts"): string[] => {
        TestValidator.equals("document extension", extension, ".md");
        walks.push(directory);
        return [path.resolve(root, "docs", final)];
      },
      glob: (_patterns: readonly string[], root: string): string[] => {
        TestValidator.equals(
          "document citation root",
          root,
          path.resolve(project, "docs"),
        );
        return [final];
      },
    },
  );
  TestValidator.equals("final source owner target", documents, [
    "docs/" + final,
  ]);
  TestValidator.equals("only controlled trees are walked", walks, [
    path.resolve(project, "src"),
    path.resolve(project, "docs"),
  ]);
  TestValidator.equals(
    "empty inventory",
    resolveAutoMovieProductionEvidencePopulationFiles(
      project,
      ".",
      ["src/*.ts"],
      ".ts",
      { walk: (): string[] => [], glob: (): string[] => [] },
    ),
    [],
  );
}
