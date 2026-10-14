import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Where one vertical line of the head frame crosses one eyebrow, on the build's final surface: the lowest and highest crossing points of the brow card's triangles with the plane of constant head-frame X.
 *
 * The brow is one alpha card, so these are the card's borders, standing for the inferior and superior hair margins of the brow envelope.
 *
 * @evidence contracts/common.md#principled-implementation Lowest/highest card-triangle crossings at a fixed head X describe one observed brow section.
 * @evidence contracts/common.md#clear-and-simple-design The section reader supplies inferior/superior borders to registered brow measurements.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts These borders are source alpha-card envelopes rather than actual opaque hair margins; generated-brow replacement prevents stale card acquisition.
 * @evidence contracts/common.md#meaningful-documentation Points are head-frame metres and same-X plane intersections are not a camera/clinical measurement.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Triangle-plane traversal executes in readHumanFaceBrowAtVertical.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A returned section is reused by the measurement requesting its two borders.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The reader owns two returned vectors and this type retains no card geometry.
 *
 * @author Samchon
 */
export interface IHumanFaceBrowSection {
  /** Lowest crossing: the inferior border of the brow card on the vertical. */
  inferior: IAutoMovieVector3;

  /** Highest crossing: the superior border of the brow card on the vertical. */
  superior: IAutoMovieVector3;
}
