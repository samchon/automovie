import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySternumMeasurements } from "./IAutoMovieHumanBodySternumMeasurements";
import type { IAutoMovieHumanBodyCostalCartilagesMeasurements } from "./IAutoMovieHumanBodyCostalCartilagesMeasurements";
import type { IAutoMovieHumanBodyRibsMeasurements } from "./IAutoMovieHumanBodyRibsMeasurements";

/**
 * Bony thoracic frame around the lungs, separate from breast and skin girth.
 *
 * Width and depth constrain a thoracic envelope but cannot recover each rib,
 * costal cartilage, vertebral articulation or breathing deformation. The
 * sternum has one midline owner; left and right ribs remain separate geometry
 * when a validated generator provides them.
 * @author Samchon
 */
export type IAutoMovieHumanBodyThoracicCageMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** One midline anterior bony complex. */
    sternum?: IAutoMovieHumanBodySternumMeasurements;
    /** Left anterior costal cartilage group. */
    leftCostalCartilages?: IAutoMovieHumanBodyCostalCartilagesMeasurements;
    /** Independent right anterior costal cartilage group. */
    rightCostalCartilages?: IAutoMovieHumanBodyCostalCartilagesMeasurements;
    /** Twelve separate left osseous ribs. */
    leftRibs?: IAutoMovieHumanBodyRibsMeasurements;
    /** Twelve separate right osseous ribs. */
    rightRibs?: IAutoMovieHumanBodyRibsMeasurements;
    /** Greatest left-to-right osseous rib span on an imaged resting cage. */
    maximumTransverseBreadth?: IAutoMovieHumanBodyAnatomicalLength;
    /** Sternum-to-thoracic-vertebra depth at the sternal angle. */
    sternalAngleDepth?: IAutoMovieHumanBodyAnatomicalLength;
  }>;
