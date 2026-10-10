import type { IHumanFaceOralToothStation } from "./IHumanFaceOralToothStation";

/**
 * The frame of one dental arch: the plane its cervical rings lie about, the
 * directions along and away from it, and its crowns in arch order.
 *
 * Every lining surface of the arch (gingiva, palate or floor, vestibular
 * wall) is constructed in this frame, so a height always means "apical of the
 * local cervical ring" and never a height above the head's horizontal plane.
 * Head-frame vectors are unit length; `origin` is in head-frame metres.
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
