/**
 * One scaffold source before its path and text are rendered by {@link renderScaffoldEntries}.
 *
 * The source path is kept until the whole list has been rendered, so a collision error can name both sources that produce the same output path.
 *
 * @evidence contracts/common.md#principled-implementation Keeping the unrendered path is what makes a collision diagnosable, because two different sources can render to one output only after path rendering and the `.gitignore` rename.
 * @evidence contracts/common.md#clear-and-simple-design Two fields are the whole input a render needs, and reading them from disk stays with `renderScaffold`, so the renderer can take any list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The entry has no pre-rendered or override field, so every source passes through the same token and collision checks.
 * @evidence contracts/common.md#meaningful-documentation The comment states why the source path is kept, and each member states its form before rendering.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record of a path and a text chooses no algorithm; rendering cost belongs to `renderScaffoldEntries`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each entry is one source read once; the record coordinates no work.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller-owned entry retains its full source text and path while referenced; renderScaffoldEntries keeps no cross-call reference to it, and the record holds no handle or task.
 * @author Samchon
 */
export interface IAutoMovieScaffoldSourceEntry {
  /** File text before line-ending normalization and token rendering. */
  content: string;


  /**
   * Path relative to the scaffold root, with the host's separator, before the `_gitignore` rename and token rendering.
   */
  relative: string;
}
