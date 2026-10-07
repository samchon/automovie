import type { IHumanPreviewArtifact } from "./IHumanPreviewArtifact";

/**
 * Successful disposable-worker artifact ready for decoding, before publication.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Keeps decoded candidate preparation separate from numerical refusal.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor Adds the success discriminator to the existing artifact fields.
 * @author Samchon
 */
export interface IHumanPreviewSuccess extends IHumanPreviewArtifact {
  /** Artifact reply discriminator. */
  success: true;
}
