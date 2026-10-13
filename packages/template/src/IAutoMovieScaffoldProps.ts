/**
 * Project-owned values for {@link renderScaffold}.
 *
 * @evidence contracts/common.md#principled-implementation The record carries only what differs per project; versions come from the generated table at build time, so a caller cannot pin the scaffold to dependency ranges the package was not built with.
 * @evidence contracts/common.md#clear-and-simple-design One field serves the one per-project token the scaffold has, `{{name}}`, and the name rule lives in `renderScaffold`, which applies it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record has no override or escape field that would let a caller supply raw token values past the name rule.
 * @evidence contracts/common.md#meaningful-documentation The member comment states where the name lands, that it is trimmed, and which names are refused.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A one-field input record chooses no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A props record is read once by one render and coordinates no work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The record holds one string and no handle.
 * @author Samchon
 */
export interface IAutoMovieScaffoldProps {
  /**
   * The new project's name, written into `package.json` `name` and the
   * README heading through `{{name}}`. Surrounding whitespace is trimmed; an
   * empty result, `.`, `..`, a trailing `.`, a character from `<>:"/\|?*`, a
   * control character, or a reserved Windows device name is refused.
   */
  name: string;
}
