import type { IAutoMovieHumanBodyAnatomicalAngle } from "../measurements/IAutoMovieHumanBodyAnatomicalAngle";
import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";

/**
 * Sagittal spinal alignment measured between named vertebral endplates.
 *
 * A global trunk bend in an editor pose is a different quantity. Observed
 * supine and standing curvatures are not interchangeable because loading and
 * posture alter spinal alignment; neither scalar creates individual vertebrae.
 * @author Samchon
 */
export type IAutoMovieHumanBodySpineMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Lumbar lordosis angle between superior L1 and superior S1 endplates. */
    lumbarLordosis?: IAutoMovieHumanBodyAnatomicalAngle;
    /** Thoracic kyphosis angle between superior T4 and inferior T12 endplates. */
    thoracicKyphosis?: IAutoMovieHumanBodyAnatomicalAngle;
  }>;
