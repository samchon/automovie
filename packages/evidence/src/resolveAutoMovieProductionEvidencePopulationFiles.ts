import fs from "node:fs";
import path from "node:path";
import { walkAutoMovieProjectPopulationFiles } from "./walkAutoMovieProjectPopulationFiles";
import { posix } from "./readAutoMovieProductionEvidenceInternal/posix";
import { compareCodeUnits } from "./readAutoMovieProductionEvidenceInternal/compareCodeUnits";

/**
 * Resolve manifest globs within the production's controlled source or document tree.
 *
 * A manifest's reference root is an addressing base, not its physical host population. A source claim rooted at the project still owns only `src`; vendored package links and tool-created artifacts do not become evidence.
 *
 *
 * @evidence contracts/common.md#principled-implementation Controlled src or docs enumeration is intersected with exact manifest glob matches resolved against the declaration's addressing root.
 * @evidence contracts/common.md#clear-and-simple-design Addressing base and physically admitted host population are separate responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Vendored package links and tool-created files outside the controlled tree cannot become graph-owned hosts merely because a broad glob selects them.
 * @evidence contracts/common.md#meaningful-documentation The comment states root and population distinctions; injected walk/glob capabilities perform the same intersection.
 * @evidence contracts/performance.md#efficient-algorithms For F controlled candidates and G glob results, the set intersection is expected O(F+G), plus traversal, glob cost and O(S log S) sorting of selected paths.
 * @evidence contracts/performance.md#reuse-equivalent-work One selected absolute-path set serves the whole candidate filter; repeated graph calls currently repeat walks and glob evaluation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only sorted project-relative path strings escape; inventories and selection sets are call-local, without retained descriptors or a population size cap.
 */
export const resolveAutoMovieProductionEvidencePopulationFiles: (projectRoot: string, populationRoot: string, patterns: readonly string[], extension?: ".md" | ".ts", io?: {
    walk: typeof walkAutoMovieProjectPopulationFiles;
    glob: (patterns: readonly string[], root: string) => string[];
}) => string[] = (
  projectRoot: string,
  populationRoot: string,
  patterns: readonly string[],
  extension: ".md" | ".ts" = ".ts",
  io: {
    walk: typeof walkAutoMovieProjectPopulationFiles;
    glob: (patterns: readonly string[], root: string) => string[];
  } = populationIO,
): string[] => {
  const root: string = path.resolve(projectRoot, populationRoot);
  const candidates: string[] = io.walk(
    projectRoot,
    path.resolve(projectRoot, extension === ".ts" ? "src" : "docs"),
    extension,
  );
  const selected: Set<string> = new Set(
    io.glob(patterns, root).map((file: string) : string => path.resolve(root, file)),
  );
  return candidates
    .filter((file: string) : boolean => selected.has(file))
    .map((file: string) : string => posix(path.relative(projectRoot, file)))
    .sort(compareCodeUnits);
};


const populationIO: { walk: (projectRoot: string, populationRoot: string, extension: ".md" | ".ts") => string[]; glob: (patterns: readonly string[], root: string) => string[]; } = {
  walk: walkAutoMovieProjectPopulationFiles,
  glob: (patterns: readonly string[], root: string): string[] =>
    fs.globSync(patterns, { cwd: root }),
};
