import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * One named presacral vertebra measured independently of adjacent levels.
 *
 * Its scalar bone volume does not determine the spinal canal, facet joints,
 * disc height or the individual's kyphosis/lordosis; C1 also lacks the
 * ordinary vertebral body and is therefore not given a generic body height.
 *
 * @evidence contracts/common.md#principled-implementation The type holds one required, target-or-observed quantity of exactly this structure, so a present record always specifies something and carries its own provenance kind; it makes no claim of a surface or path.
 * @evidence contracts/common.md#clear-and-simple-design One record of named optional quantities and no behaviour.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is data only: it has no special case, foreign mutation or compensating path.
 * @evidence contracts/common.md#meaningful-documentation The comment states which structure the type names, what its quantities do not determine and which neighbouring declarations own the adjacent structures, and each member is described.
 * @evidence contracts/modeling.md#part-identity-and-grouping One declaration stands for one named bone; the adjacent structures it meets are separate declarations.
 * @evidenceExclude contracts/modeling.md#parameter-channels The members are absolute target or observed quantities, not offsets from a neutral that vary a form, and no product path varies a form from them.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The type states no unit or frame of its own; each value's unit is owned by the measurement type it references.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type builds no surface or volume.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type owns no part, group or joint that a viewer displays, because no product path reads it.
 * @evidenceExclude contracts/anatomy.md#permitted-range The type admits nothing itself; scalar admission is `admitHumanBodyAnatomicalMeasurements` and population ranges belong to a component resolver.
 * @evidence contracts/anatomy.md#parametric-authority Every member is a named anatomical measurement or a closed named site, and no member addresses a vertex, curve, strand or patch, so a caller cannot sculpt through it.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyVertebraMeasurements {
  /** This numbered vertebra's osseous volume only. */
  readonly boneVolume: IAutoMovieHumanBodyAnatomicalVolume;
}
