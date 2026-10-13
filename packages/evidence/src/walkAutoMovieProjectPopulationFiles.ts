import fs from "node:fs";
import path from "node:path";
import { isAutoMovieEvidencePhysicalFile } from "./isAutoMovieEvidencePhysicalFile";


const projectPopulationBoundaryDiagnostic: string =
  "project evidence populations contain only real files and directories inside the project root";


/**
 * Walk one project-local evidence population without following filesystem
 * indirection or accepting an entry the graph cannot inventory.
 *
 * @author Samchon
 *
 *
 * @evidence contracts/common.md#principled-implementation Resolved population roots must remain inside the resolved project; lstat traversal admits directories and singly linked regular files without following links, with deterministic code-unit order.
 * @evidence contracts/common.md#clear-and-simple-design One controlled walker owns physical population admission while fixed manifest admission remains a separate policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Aliases, special entries and out-of-root roots refuse; only project-root node_modules is skipped as dependency material, and no fallback repairs an unsafe path.
 * @evidence contracts/common.md#meaningful-documentation The comment states project-local admission; missing requested ancestry yields an empty population while later traversal failures propagate.
 * @evidence contracts/performance.md#efficient-algorithms For F entries with directory fanouts d, lstat traversal is O(F) plus sum O(d log d) sorting; the synchronous inventory has no declared file-count or byte cap.
 * @evidence contracts/performance.md#reuse-equivalent-work Each directory is visited once for this call, but separate graph consumers repeat walks because no physical-snapshot cache is proven equivalent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller receives path strings only; synchronous observations close internally and local traversal state is released on return or throw.
 */
export const walkAutoMovieProjectPopulationFiles: (projectRoot: string, populationRoot: string, extension: ".md" | ".ts") => string[] = (
  projectRoot: string,
  populationRoot: string,
  extension: ".md" | ".ts",
): string[] => {
  const project: string = path.resolve(projectRoot);
  const root: string = path.resolve(populationRoot);
  const relativeRoot: string = path.relative(project, root);
  if (outside(relativeRoot)) fail(project, root);

  const projectEntry: fs.Stats = fs.lstatSync(project);
  if (!projectEntry.isDirectory()) fail(project, project);

  const components: string[] = relativeRoot === "" ? [] : relativeRoot.split(path.sep);
  let ancestor: string = project;
  let rootEntry: fs.Stats = projectEntry;
  for (const [index, component] of components.entries()) {
    ancestor = path.join(ancestor, component);
    const entry: fs.Stats | undefined = fs.lstatSync(ancestor, { throwIfNoEntry: false });
    if (entry === undefined) return [];
    if (index !== components.length - 1 && !entry.isDirectory())
      fail(project, ancestor);
    rootEntry = entry;
  }

  const output: string[] = [];
  const visit: (location: string, entry: fs.Stats) => void = (location: string, entry: fs.Stats): void => {
    const regularFile: boolean = isAutoMovieEvidencePhysicalFile(entry);
    if (!entry.isDirectory() && !regularFile) fail(project, location);
    if (regularFile) {
      if (location.endsWith(extension)) output.push(location);
      return;
    }
    for (const name of fs.readdirSync(location).sort(compareCodeUnits)) {
      if (location === project && name === "node_modules") continue;
      const child: string = path.join(location, name);
      visit(child, fs.lstatSync(child));
    }
  };
  visit(root, rootEntry);
  return output;
};


const fail: (projectRoot: string, location: string) => never = (projectRoot: string, location: string): never => {
  const relative: string = path.relative(projectRoot, location);
  throw new Error(
    `${posix(relative === "" ? "." : relative)}: ${projectPopulationBoundaryDiagnostic}.`,
  );
};


const outside: (relative: string) => boolean = (relative: string): boolean =>
  relative === ".." ||
  relative.startsWith(`..${path.sep}`) ||
  path.isAbsolute(relative);


const compareCodeUnits: (left: string, right: string) => number = (left: string, right: string): number =>
  Number(left > right) - Number(left < right);


const posix: (value: string) => string = (value: string): string => value.replaceAll("\\", "/");
