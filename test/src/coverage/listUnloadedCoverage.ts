import fs from "node:fs";
import ts from "typescript-compiler";

import type { IModuleCoverage } from "./IModuleCoverage";
import { enumerateCoverageTargets } from "./enumerateCoverageTargets";

/**
 * The coverage of a module the run never loaded: its functions and branch arms
 * read from its TypeScript source, none reached, each named with its source
 * line.
 *
 * @param file The module's absolute path.
 * @returns Its coverage, `loaded` false.
 */
export function listUnloadedCoverage(file: string): IModuleCoverage {
  const source: ts.SourceFile = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const coverage: IModuleCoverage = {
    file,
    loaded: false,
    functions: [],
    branches: [],
  };
  for (const target of enumerateCoverageTargets(source, true))
    (target.kind === "function" ? coverage.functions : coverage.branches).push({
      name: target.name,
      covered: false,
    });
  return coverage;
}
