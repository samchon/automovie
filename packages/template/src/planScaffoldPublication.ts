import { type IScaffoldPublicationEntry } from "./IScaffoldPublicationEntry";
import * as path from "node:path";


/**
 * Validate a rendered file map and freeze it as a publication candidate, before any directory or file is touched.
 *
 * Throws when a value is not a string, a key contains NUL, a target resolves to the root or outside it, or two targets collide. Targets are compared after lower-casing, so `A.txt` and `a.txt` collide on every platform, and a file also collides with any file below it, such as `a` and `a/b`. Lower-casing approximates the case folding of Windows and macOS file systems and does not apply Unicode normalization.
 *
 * @param props.files UTF-8 text keyed by paths resolved against `root`; absolute keys are admitted when their targets remain below it.
 * @param props.root Directory the candidate is published under.
 * @returns Frozen entries in the map's insertion order.
 *
 * @evidence contracts/common.md#principled-implementation Containment and the ancestor walk's root boundary both use `path.relative`, preserving Windows case-equivalent root spellings instead of looping at the drive root; empty, parent and absolute remainders refuse. Lower-cased target keys detect exact and file-ancestor collisions, approximating case-insensitive file systems without Unicode normalization.
 * @evidence contracts/common.md#clear-and-simple-design This owner validates and encodes with one private collision walk; publishFiles coordinates mutation, ensureScaffoldFileDirectory captures descendant directories, and writeScaffoldFile owns target admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No path or file name is special-cased; case-only collisions are refused consistently on every platform without claiming complete filesystem-name validation. The runtime string check rejects non-text input from untyped callers rather than selecting a fixture.
 * @evidence contracts/common.md#meaningful-documentation The comment lists every refusal, the case-folding rule and its limits, the parameters' meaning, and that entries keep insertion order.
 * @evidence contracts/performance.md#efficient-algorithms Encoding visits total content bytes; collision checks use one map lookup per file and per ancestor below the root, with path-relative, dirname, lower-casing and string-key costs driven by the visited path lengths. The local map holds one entry per file, and there is no pairwise file scan.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The planner runs once per call over its own input and has no completed or in-flight work from another caller that could stand in for it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned candidate retains each file's bytes as a frozen array owned by the caller; the collision map is local and released on return, and no handle is opened.
 * @author Samchon
 */
export const planScaffoldPublication: (props: { files: Readonly<Record<string, string>>; root: string; }) => readonly IScaffoldPublicationEntry[] = (props: {
  files: Readonly<Record<string, string>>;
  root: string;
}): readonly IScaffoldPublicationEntry[] => {
  const root: string = path.resolve(props.root);
  const entries: IScaffoldPublicationEntry[] = Object.entries(props.files).map(
    ([relative, content]: [string, string]): IScaffoldPublicationEntry => {
      if (typeof content !== "string")
        throw new Error(`scaffold content is not text: ${relative}`);
      if (relative.includes("\0"))
        throw new Error(`refusing invalid scaffold path: ${relative}`);
      const target: string = path.resolve(root, relative);
      const inside: string = path.relative(root, target);
      if (
        inside.length === 0 ||
        inside === ".." ||
        inside.startsWith(`..${path.sep}`) ||
        path.isAbsolute(inside)
      )
        throw new Error(`refusing to write outside "${root}": ${relative}`);
      return Object.freeze({
        bytes: Object.freeze(Array.from(Buffer.from(content, "utf8"))),
        relative,
        target,
      });
    },
  );
  assertDistinctScaffoldTargets(root, entries);
  return Object.freeze(entries);
};


/**
 * Throw when two entries name the same target, ignoring case, or when one entry's target is an ancestor directory of another's.
 */
const assertDistinctScaffoldTargets: (root: string, entries: readonly IScaffoldPublicationEntry[]) => void = (
  root: string,
  entries: readonly IScaffoldPublicationEntry[],
): void => {
  const owners: Map<string, IScaffoldPublicationEntry> = new Map<
    string,
    IScaffoldPublicationEntry
  >();
  for (const entry of entries) {
    const key: string = canonicalScaffoldPath(entry.target);
    const previous: IScaffoldPublicationEntry | undefined = owners.get(key);
    if (previous !== undefined) throw scaffoldPathCollision(previous, entry);
    owners.set(key, entry);
  }
  for (const entry of entries)
    for (
      let directory: string = path.dirname(entry.target);
      path.relative(root, directory).length !== 0;
      directory = path.dirname(directory)
    ) {
      const ancestor: IScaffoldPublicationEntry | undefined = owners.get(
        canonicalScaffoldPath(directory),
      );
      if (ancestor !== undefined) throw scaffoldPathCollision(ancestor, entry);
    }
};

const scaffoldPathCollision: (first: IScaffoldPublicationEntry, second: IScaffoldPublicationEntry) => Error = (
  first: IScaffoldPublicationEntry,
  second: IScaffoldPublicationEntry,
): Error =>
  new Error(`scaffold paths collide: ${first.relative}, ${second.relative}`);

const canonicalScaffoldPath: (value: string) => string = (value: string): string => value.toLowerCase();
