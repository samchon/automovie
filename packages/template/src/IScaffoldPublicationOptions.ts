import type { IScaffoldFileSnapshot } from "./IScaffoldFileSnapshot";

/**
 * Options for publishing a scaffold into a directory.
 *
 * @evidence contracts/common.md#principled-implementation Force is an explicit opt-in because both effects it grants, admitting a populated root and rewriting an existing file, overwrite state the user owns.
 * @evidence contracts/common.md#clear-and-simple-design Force admits replacement while optional captured generations constrain each candidate to its inspected state; sync uses both without introducing a second writer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Force grants no authority over links or multiply linked files; overwriteScaffoldFile still requires one ordinary single-link resident with its captured identity and written state.
 * @evidence contracts/common.md#meaningful-documentation The comment states both effects of `force`, the limits on replacement, and that omission means a new or empty root only.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Consumers own candidate lookup and comparison; the schema chooses no executable algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Expected snapshots are observations for one publication, never a reusable acceptance verdict.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns an optional candidate-sized snapshot map; snapshots contain scalar identities and no open resources.
 */
export interface IScaffoldPublicationOptions {
  /**
   * Admit a non-empty target directory and replace existing files in place. A file is replaced only when it is an ordinary file with exactly one link whose identity did not change between capture and write. Omitted or `false` refuses a non-empty directory before writing anything.
   */
  force?: boolean;

  /** Per-candidate relative-path generation required at write time; null requires absence. Unspecified candidates use ordinary publication admission. */
  expected?: Readonly<Record<string, IScaffoldFileSnapshot | null>>;
}
