import type { IHumanViewerSubjectDocument } from "./IHumanViewerSubjectDocument.js";

/**
 * Application-supplied connected reference face on the selected published face basis. The neutral reference has empty shape and expression maps and is composed with standard people without giving Viewer ownership of the preset.
 *
 * @evidence contracts/common.md#principled-implementation The reference extends the ordinary subject document and names the selected face basis; neutral empty channel maps remain an application convention, not type-level validation.
 * @evidence contracts/common.md#clear-and-simple-design Only name, basis and numerical channel maps refine the shared subject identity; the application supplies the actual reference example.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No preset geometry or subject name is embedded in this contract; reference admission follows the same face owner as other documents.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies application ownership, published basis selection and the neutral reference's empty shape and expression maps.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This subject shape declares no numerical construction algorithm; the face viewport builds the supplied document.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The reference document has no memo table; readHumanViewerFaceDocuments hashes it with basis and source digests externally.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Strings and channel maps contain no disposal handles; catalogue ownership determines when the reference document is dropped.
 *
 * @author Samchon
 */
export interface IHumanViewerReferenceFaceDocument extends IHumanViewerSubjectDocument {
  /** Display name. */
  name: string;

  /** The face basis id it is built on. */
  basis: string;

  /** Shape channels, empty for the reference. */
  shape: Record<string, number>;

  /** Expression channels, empty for the reference. */
  expression: Record<string, number>;
}
