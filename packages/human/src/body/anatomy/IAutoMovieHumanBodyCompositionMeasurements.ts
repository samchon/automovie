import type { IAutoMovieHumanBodyWholeBodyVolume } from "./measurements/IAutoMovieHumanBodyWholeBodyVolume";
import type { AutoMovieHumanBodyNonemptyMeasurements } from "./measurements/AutoMovieHumanBodyNonemptyMeasurements";

/**
 * Whole-body material totals constraining, not replacing, regional anatomy.
 *
 * A complete CT/MRI segmentation can distinguish skeletal muscle, outer
 * subcutaneous adipose and bone. A single tape circumference or body mass
 * cannot split these compartments. Region-specific sums must agree with a
 * whole-body observation over the same scan coverage, and no total supplies
 * the missing 3D location of an individual muscle or fat depot. QUADRA_HC and
 * TCIA full-body segmentation data illustrate the separately labeled tissues;
 * both are acquired supine, so their totals do not validate standing skin.
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
