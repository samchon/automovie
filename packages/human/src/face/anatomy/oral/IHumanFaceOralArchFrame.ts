import type { IHumanFaceOralToothStation } from "./IHumanFaceOralToothStation";

/**
 * The frame of one dental arch: the plane its cervical rings lie about, the directions along and away from it, and its crowns in arch order.
 *
 * Every lining surface of the arch (gingiva, palate or floor, vestibular wall) is constructed in this frame, so a height always means "apical of the local cervical ring" and never a height above the head's horizontal plane. Head-frame vectors are unit length; `origin` is in head-frame metres.
 *
 * @evidence contracts/common.md#principled-implementation Cervical ring regression defines one arch's lateral/forward/apical frame and ISO-ordered stations.
 * @evidence contracts/common.md#clear-and-simple-design Lining, vault and walls use one local apical convention instead of unrelated head-Y heights.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The 65-sample vault span is a numerical proxy rather than certified continuous maximum or clinical palatal width.
 * @evidence contracts/common.md#meaningful-documentation Origin is head metres, directions unitless and maxillary/mandibular apical sign preserves the declared frame handedness.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Frame regression, station ordering and ring-distance samples execute in resolveHumanFaceOralArchFrame.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One resolved frame/station set is reused by lining field and assembly construction.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The resolver owns derived vectors/station arrays and callers retain them only through field/assembly construction.
 *
 * @author Samchon
 */
export interface IHumanFaceOralArchFrame {
  /** True for the mandibular arch, whose apical direction is inferior. */
  mandibular: boolean;

  /** Mean of the cervical ring centres, head-frame metres. */
  origin: number[];

  /** In-plane unit direction toward the anatomical left. */
  lateral: number[];

  /** In-plane unit direction toward the anterior. */
  forward: number[];

  /** Unit plane normal pointing away from the crowns: superior on the maxilla, inferior on the mandible. */
  apical: number[];

  /** Crowns from the right terminal tooth through the midline to the left terminal tooth. */
  stations: IHumanFaceOralToothStation[];

  /**
   * Maximum nearest-cervical-ring distance over 65 uniformly spaced midline
   * samples between the rearmost and foremost station centres, metres.
   * This sampled proxy sets the authored vault's transition half-span;
   * it is not a certified continuous maximum or clinical palatal width.
   */
  vaultSpanMetres: number;
}
