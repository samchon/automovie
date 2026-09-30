import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Midline sternum with manubrium, body and xiphoid as one bony complex.
 *
 * Its anterior surface anchors pectoralis major and its costal articulations
 * help orient the rib cage. A measured whole-bone length or volume does not
 * yield all costal cartilage junctions or an anterior thorax skin contour.
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
export type IAutoMovieHumanBodySternumMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Superior manubrial to inferior xiphoid osseous span. */
    maximumLength?: IAutoMovieHumanBodyAnatomicalLength;
    /** Sternum alone, excluding ribs and costal cartilages. */
    boneVolume?: IAutoMovieHumanBodyAnatomicalVolume;
  }>;
