import path from "node:path";

/**
 * Read presence without conflating an unsafe recovery marker with absent prose.
 *
 * @evidence contracts/common.md#principled-implementation Current-incarnation admission precedes native lexical descendant resolution, parent admission, one entry observation and repeated parent/incarnation checks in that order; actual project callbacks observe physical ancestry and any lstat entry.
 * @evidence contracts/common.md#clear-and-simple-design Owns presence bracketing separately from nullable regular-text reads; the project adapter supplies its existing generation and filesystem capabilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Root equality, parent escapes and cross-drive relatives refuse before observing an entry; dangling links/directories remain present through the actual lstat callback instead of becoming false absence. Sequential guards do not prove an atomic namespace snapshot.
 * @evidence contracts/common.md#meaningful-documentation Defines root/relative/capability premises, exact observation order and propagated failures; a true result is presence rather than permission to read or publish the entry.
 * @evidence contracts/performance.md#efficient-algorithms Native path resolution scales with pathname text; actual project callbacks add two incarnation checks, two parent-depth walks and one lstat, including their registry parsing/identity work without reading the target payload.
 * @evidence contracts/performance.md#reuse-equivalent-work One resolved file and parent serve the current attempt, but pre/post guards run independently; no prior presence or unchanged pathname substitutes for current observation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only path strings and one boolean are local; supplied callbacks own any native acquisition/release, and this helper retains no descriptor, entry population or task.
 */
export function readProductionEntryPresence(props: {
  /** Absolute physical root belonging to the current production incarnation. */
  root: string;

  /** Project-relative pending entry, never an external pathname. */
  relative: string;

  /** Revalidate the original production incarnation. */
  assertCurrent: () => void;

  /** Reject unsafe parent ancestry while allowing a missing tail. */
  assertParent: (parent: string) => void;

  /** Return true for any entry, including a dangling link or directory. */
  exists: (file: string) => boolean;
}): boolean {
  props.assertCurrent();
  const file: string = path.resolve(props.root, props.relative);
  const relative: string = path.relative(props.root, file);
  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  )
    throw new Error(
      "Recovery entry must be a path inside the production root.",
    );
  const parent: string = path.dirname(file);
  props.assertParent(parent);
  const exists: boolean = props.exists(file);
  props.assertParent(parent);
  props.assertCurrent();
  return exists;
}
