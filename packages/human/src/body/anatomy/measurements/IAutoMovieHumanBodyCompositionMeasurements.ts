import type { AutoMovieHumanBodyNonemptyMeasurements } from "./AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyWholeBodyVolume } from "./IAutoMovieHumanBodyWholeBodyVolume";

/**
 * Whole-body material totals constraining, not replacing, regional anatomy.
 *
 * A complete CT/MRI segmentation can distinguish skeletal muscle, outer
 * subcutaneous adipose and bone. A single tape circumference or body mass
 * cannot split these compartments. Region-specific sums must agree with a
 * whole-body observation over the same scan coverage, and no total supplies
 * the missing 3D location of an individual muscle or fat depot. QUADRA_HC's
 * body-composition masks cover only the L3 level and cannot populate these
 * whole-body fields. Even a CT/MRI collection labeled “total body” must have
 * actual head-to-foot coverage verified before its volume is used here;
 * supine tissue totals do not validate standing skin.
 * @author Samchon
 */
export type IAutoMovieHumanBodyCompositionMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Complete-body skeletal muscle, excluding organs and adipose. */
    skeletalMuscleVolume?: IAutoMovieHumanBodyWholeBodyVolume;
    /** Entire outer subcutaneous adipose depot, excluding visceral fat. */
    subcutaneousAdiposeVolume?: IAutoMovieHumanBodyWholeBodyVolume;
    /** Entire osseous skeleton, excluding articular cartilage. */
    boneVolume?: IAutoMovieHumanBodyWholeBodyVolume;
  }>;
