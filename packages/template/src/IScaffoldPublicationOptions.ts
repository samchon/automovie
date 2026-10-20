/**
 * Options for publishing a scaffold into a directory.
 *
 * @evidence contracts/common.md#principled-implementation The single flag is an explicit opt-in because both effects it grants, admitting a populated root and rewriting an existing file, overwrite state the user owns.
 * @evidence contracts/common.md#clear-and-simple-design One optional boolean mirrors the CLI's one `--force` switch; there is no separate flag per effect because the CLI exposes none.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Force grants no authority over links or multiply linked files; overwriteScaffoldFile still requires one ordinary single-link resident with its captured identity and written state.
 * @evidence contracts/common.md#meaningful-documentation The comment states both effects of `force`, the limits on replacement, and that omission means a new or empty root only.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An options record with one boolean chooses no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The force switch only changes admission and coordinates no work to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This options object holds no state beyond its single boolean and owns no resource.
 */
export interface IScaffoldPublicationOptions {
  /**
   * Admit a non-empty target directory and replace existing files in place. A file is replaced only when it is an ordinary file with exactly one link whose identity did not change between capture and write. Omitted or `false` refuses a non-empty directory before writing anything.
   */
  force?: boolean;
}
