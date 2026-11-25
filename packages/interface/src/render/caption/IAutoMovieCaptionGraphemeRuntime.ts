import type { IAutoMovieCaptionGraphemeSegmentationIdentity } from "../../production/IAutoMovieCaptionGraphemeSegmentationIdentity.js";

/**
 * Host-supplied deterministic grapheme iterator paired with the exact identity
 * of that behavior. inspectAutoMovieCaptionReadabilityWithRuntime compares
 * identity before issuing a verdict and counts yielded values without reading
 * them. The host must keep identity and segmentation behavior consistent;
 * iterator failures propagate. No SDK result object is required because yielded
 * payloads have no semantic role.
 */
export interface IAutoMovieCaptionGraphemeRuntime {
  /** Complete identity of the exact segmentation behavior below. */
  identity: IAutoMovieCaptionGraphemeSegmentationIdentity;

  /**
   * Segment one canonical caption line into grapheme clusters; only the number
   * of yielded items is read.
   */
  segment(value: string): Iterable<unknown>;
}
