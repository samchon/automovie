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
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document The reference document shares subject identity while declaring its actual basis and numerical shape and expression channels.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document The neutral reference uses empty channel maps rather than a hardcoded fitted likeness.
 *
 * @author Samchon
 */
export interface IHumanViewerReferenceFaceDocument extends IHumanViewerSubjectDocument {
  /**
   * Display name.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Preserves the application reference's display label separately from its inherited stable subject id.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Preserves the application reference's display label separately from its inherited stable subject id.
   */
  name: string;

  /**
   * The face basis id it is built on.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Names the exact selected Face basis the supplied reference document is replayed on.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Names the exact selected Face basis the supplied reference document is replayed on.
   */
  basis: string;

  /**
   * Shape channels, empty for the reference.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Retains caller-supplied numerical shape channels, empty for the neutral reference rather than a fitted specimen.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Retains caller-supplied numerical shape channels, empty for the neutral reference rather than a fitted specimen.
   */
  shape: Record<string, number>;

  /**
   * Expression channels, empty for the reference.
   *
   * @evidence requirements/actors/facial-authoring/contract.md#actor-face-document Keeps numerical expression channels separate from reference identity, empty for its neutral state.
   * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document Keeps numerical expression channels separate from reference identity, empty for its neutral state.
   */
  expression: Record<string, number>;
}
