/**
 * Optional third argument of `exportHumanBody`.
 *
 * Only `true` opts in; omission, `undefined` and `false` preserve the
 * absence of the source-part namespace. An articular report always writes
 * source-part identity regardless of this option.
 *
 * @evidence contracts/common.md#principled-implementation Lets a source-conditioned exterior request source-part identity without fabricating an articular report.
 * @evidence contracts/common.md#clear-and-simple-design One optional flag replaces an anonymous options object; the exporter admits it exactly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source-part identity never certifies tissue or material names.
 * @evidence contracts/common.md#meaningful-documentation States the opt-in value, the defaults and the interaction with an articular report.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExportOptions {
  /** Write the source-part identity namespace even without an articular report. */
  sourcePartIdentity?: boolean;
}
