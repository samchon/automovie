/**
 * Project-owned values for {@link renderScaffold}, {@link renderWorkspaceScaffold} and {@link renderWorkspaceProductionScaffold}.
 *
 * @evidence contracts/development/design.md#principled-representation The record carries only what differs per project; versions come from the generated table at build time, so a caller cannot pin the scaffold to dependency ranges the package was not built with.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One field serves the one per-project token the scaffold has, `{{name}}`, and the name rule lives in `assertScaffoldProjectName`, which every renderer applies.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The record has no override or escape field that would let a caller supply raw token values past the name rule.
 * @evidence contracts/development/common.md#meaningful-documentation The member comment states where the name lands, that it is trimmed, and which names are refused.
 */
export interface IAutoMovieScaffoldProps {
  /**
   * The new project's or workspace's name, substituted into its package.json and README heading after trimming. assertScaffoldProjectName documents the refused separators, ASCII controls and device-name patterns; its checks do not validate npm naming or every filesystem limit.
   */
  name: string;
}
