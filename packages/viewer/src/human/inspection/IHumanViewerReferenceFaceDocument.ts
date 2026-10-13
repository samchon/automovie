import type { IHumanViewerSubjectDocument } from "./IHumanViewerSubjectDocument.js";

/**
 * Application-supplied connected reference face on the selected published face
 * basis. The neutral reference has empty shape and expression maps and is
 * composed with standard people without giving Viewer ownership of the preset.
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
