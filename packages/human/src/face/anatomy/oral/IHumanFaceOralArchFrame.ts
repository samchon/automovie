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
 * @evidence contracts/common.md#principled-implementation The lining attaches to the cervical rings, so the plane those rings define is the frame in which its heights have one meaning for every tooth.
 * @evidence contracts/common.md#clear-and-simple-design One frame per arch replaces the head axes each lining formula assumed.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Derived from the registered rings alone; no tooth, side or document is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States what the frame owns, its units and the meaning of each direction.
 * @evidence contracts/modeling.md#part-identity-and-grouping Groups the arch's crown stations in anatomical order without copying crown geometry.
 * @evidence contracts/modeling.md#spatial-conventions The `(lateral, anterior, apical)` arch metre frame is left-handed on the maxilla and right-handed on the mandible because apical points away from the crowns in both arches; this record owns its conversion to the Y-up head frame.
 * @evidence contracts/modeling.md#shared-boundaries Supplies the single definition the gingiva, palate or floor and vestibular wall share.
 * @evidenceExclude contracts/modeling.md#parameter-channels Carries no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation The oral assembly observes the lining built in this frame.
 * @evidence contracts/anatomy.md#anatomical-source A geometric frame of licensed source crown ports; it is no measured occlusal plane, and the source registers no tooth long axis.
 * @evidenceExclude contracts/anatomy.md#permitted-range Bounds nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no authoring input.
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
