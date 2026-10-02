import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Target or observed dimensions of the lateral forearm bone, the radius.
 *
 * Its proximal head turns at the humerus and its distal surface carries the
 * wrist; this bone is independent of the ulna even when an exterior forearm
 * girth is the only user input. Its volume does not specify either joint face.
 *
 * @evidence contracts/common.md#principled-implementation The type holds only the named quantities of one bone (each an optional target-or-observed record from the measurement vocabulary), so any subset of them is representable and a quantity carries its own provenance kind; it makes no claim of a bone surface.
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
export type IAutoMovieHumanBodyRadiusMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Whole osseous radius from head to styloid, not skin forearm length. */
    maximumLength?: IAutoMovieHumanBodyAnatomicalLength;
    /** Segmented radius alone, excluding ulna and carpal bones. */
    boneVolume?: IAutoMovieHumanBodyAnatomicalVolume;
  }>;
