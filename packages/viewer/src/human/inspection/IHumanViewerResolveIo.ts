/**
 * The one filesystem question the resolver asks.
 *
 * @evidence contracts/common.md#principled-implementation Resolution asks whether a normalized forward-slash path names an existing regular file before selecting a source import.
 * @evidence contracts/common.md#clear-and-simple-design The resolver borrows only existence checking; path resolution and import-graph policy stay outside the IO port.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The structural existence port declares neither a subject-specific lookup nor a replacement filesystem implementation.
 * @evidence contracts/common.md#meaningful-documentation Defines the regular-file and normalized-path preconditions of the resolver's only filesystem question.
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Resolution asks whether a normalized forward-slash path names an existing regular file before selecting a source import.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The resolver borrows only existence checking; path resolution and import-graph policy stay outside the IO port.
 * @author Samchon
 */
export interface IHumanViewerResolveIo {
  /**
   * Whether a regular file exists at this normalized forward-slash path.
   *
   * @evidence contracts/common.md#principled-implementation Existence answers whether the supplied normalized path names a regular file for import resolution.
   * @evidence contracts/common.md#clear-and-simple-design The resolver supplies the path and borrows only the filesystem question.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An existence answer does not replace source text, resolution semantics or a missing module.
   * @evidence contracts/common.md#meaningful-documentation Documents the regular-file predicate and forward-slash input convention.
   * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-frame-dependency-closure Existence answers whether the supplied normalized path names a regular file for import resolution.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity The resolver supplies the path and borrows only the filesystem question.
   */
  exists(file: string): boolean;
}
