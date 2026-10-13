import type { IHumanPreviewArtifact } from "./IHumanPreviewArtifact.js";

/**
 * Successful disposable-worker artifact ready for decoding, before publication.
 *
 * @author Samchon
 */
export interface IHumanPreviewSuccess extends IHumanPreviewArtifact {
  /** Artifact reply discriminator. */
  success: true;
}
