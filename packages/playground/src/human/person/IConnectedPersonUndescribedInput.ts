/**
 * A family of person-document inputs whose owner publishes no range descriptor the page can read: its descriptive paths, document-declared unit and editing location.
 *
 * The path string is an explanation with wildcards/alternatives, not an executable field path. Missing descriptor metadata does not establish missing numerical support or authority to invent a range.
 *
 * @evidence contracts/common.md#principled-implementation Unpublished owner ranges remain explicit metadata gaps while document units and actual editing locations identify where those inputs belong.
 * @evidence contracts/common.md#clear-and-simple-design The family description complements executable scalar descriptors without driving document mutation or numerical admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Wildcards are not executed as field paths, absent ranges are not fabricated and a metadata gap is not conflated with unsupported geometry.
 * @evidence contracts/common.md#meaningful-documentation The comment explains descriptive paths, document-unit provenance and the distinction between missing metadata and numerical support.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The type implements no wildcard traversal, range inference or editor algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Family descriptions declare no cached numerical or geometry equivalence.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Descriptive strings acquire no editing form, worker request or model resource.
 *
 * @author Samchon
 */
export interface IConnectedPersonUndescribedInput {
  /** The document paths of the family, with `{a,b}` alternatives and `*` members. */
  paths: string;

  /** The unit the document type states for these values. */
  unit: string;

  /** The section of the person screen that edits them. */
  edited: string;
}
