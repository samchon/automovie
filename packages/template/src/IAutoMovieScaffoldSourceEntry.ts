/**
 * One scaffold source before its path and text are rendered by {@link renderScaffoldEntries}.
 *
 * The source path is kept until the whole list has been rendered, so a collision error can name both sources that produce the same output path.
 *
 * @evidence contracts/development/design.md#principled-representation Keeping the unrendered path is what makes a collision diagnosable, because two different sources can render to one output only after path rendering and the `.gitignore` rename.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two fields are the whole input a render needs, and reading them from disk stays with `renderScaffold`, so the renderer can take any list.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The entry has no pre-rendered or override field, so every source passes through the same token and collision checks.
 * @evidence contracts/development/common.md#meaningful-documentation The comment states why the source path is kept, and each member states its form before rendering.
 */
export interface IAutoMovieScaffoldSourceEntry {
  /** File text before line-ending normalization and token rendering. */
  content: string;

  /**
   * Path relative to the scaffold root, with the host's separator, before the `_gitignore` rename and token rendering.
   */
  relative: string;
}
