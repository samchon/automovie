import type { IHumanViewerSubjectDocument } from "./IHumanViewerSubjectDocument.js";

/**
 * Application-supplied connected reference face on the selected published face
 * basis. The neutral reference has empty shape and expression maps and is
 * composed with standard people without giving Viewer ownership of the preset.
 *
 * @evidence contracts/common.md#meaningful-documentation Names the reference face's members.
 *
 * @evidence contracts/common.md#principled-implementation The reference document shares subject identity while declaring its actual basis and numerical shape and expression channels.
 * @evidence contracts/common.md#clear-and-simple-design Reference-only name and basis fields extend the existing subject projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The neutral reference uses empty channel maps rather than a hardcoded fitted likeness.
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
