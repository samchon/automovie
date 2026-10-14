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
   * The new project's name, substituted into package.json and the README heading after trimming. renderScaffold documents the refused separators, ASCII controls and device-name patterns; its checks do not validate npm naming or every filesystem limit.
   */
  name: string;
}
