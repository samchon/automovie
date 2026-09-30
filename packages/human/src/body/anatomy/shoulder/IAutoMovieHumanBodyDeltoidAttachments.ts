import type { AutoMovieHumanBodySide } from "../identity/AutoMovieHumanBodySide";

type DeltoidOrigin<Side extends AutoMovieHumanBodySide> =
  | { structure: `${Side}Clavicle`; site: "lateralThird" }
  | { structure: `${Side}Scapula`; site: "acromion" }
  | { structure: `${Side}Scapula`; site: "lateralScapularSpine" };

/**
 * Same-side bony origins and humeral insertion of a generated deltoid.
 *
 * Its clavicular, acromial and scapular-spine regions attach across two bones
 * rather than forming an arbitrary skin bulge around one shoulder joint.
 * Moatshe et al. 2018, doi:10.1016/j.arthro.2017.08.301, dissected and
 * measured the proximal humeral and acromial muscle attachment surfaces.
 * Anatomical site names are outputs of a resolved bone, never document XYZ.
 *
 * @evidence contracts/common.md#principled-implementation The type is a pair of closed literal unions over named structures and sites, parameterized by the side, so the opposite-side bone or a free coordinate cannot type-check.
 * @evidence contracts/common.md#clear-and-simple-design Two readonly members, origins and insertions, and nothing else.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is data only: it has no special case, foreign mutation or compensating path.
 * @evidence contracts/common.md#meaningful-documentation The comment states which structure the type names, what its quantities do not determine and which neighbouring declarations own the adjacent structures, and each member is described.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The type defines a relation between parts declared elsewhere and is neither a part nor a group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The members are absolute target or observed quantities, not offsets from a neutral that vary a form, and no product path varies a form from them.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The type states no unit or frame of its own; each value's unit is owned by the measurement type it references.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type builds no surface or volume.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type owns no part, group or joint that a viewer displays, because no product path reads it.
 * @evidenceExclude contracts/anatomy.md#permitted-range The type admits nothing itself; scalar admission is `admitHumanBodyAnatomicalMeasurements` and population ranges belong to a component resolver.
 * @evidence contracts/anatomy.md#parametric-authority Every member is a named anatomical measurement or a closed named site, and no member addresses a vertex, curve, strand or patch, so a caller cannot sculpt through it.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyDeltoidAttachments<
  Side extends AutoMovieHumanBodySide,
> {
  /** One or more origin regions on this side's clavicle and scapula. */
  readonly origins: readonly [DeltoidOrigin<Side>, ...DeltoidOrigin<Side>[]];
  /** The deltoid tuberosity on the same side's humerus. */
  readonly insertions: readonly [
    {
      structure: `${Side}Humerus`;
      site: "deltoidTuberosity";
    },
  ];
}
