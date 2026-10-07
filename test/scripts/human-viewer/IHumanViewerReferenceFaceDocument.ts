import type { IHumanViewerSubjectDocument } from "./IHumanViewerSubjectDocument";

/**
 * The CC0 connected reference face the viewer authors on the published face
 * basis: no shape and no expression. The standard people wear it.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the reference face's members.
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
