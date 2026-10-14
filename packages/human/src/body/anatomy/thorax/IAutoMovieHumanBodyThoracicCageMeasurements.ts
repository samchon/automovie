import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyCostalCartilagesMeasurements } from "./IAutoMovieHumanBodyCostalCartilagesMeasurements";
import type { IAutoMovieHumanBodyRibsMeasurements } from "./IAutoMovieHumanBodyRibsMeasurements";
import type { IAutoMovieHumanBodySternumMeasurements } from "./IAutoMovieHumanBodySternumMeasurements";

/**
 * Bony thoracic frame around the lungs, separate from breast and skin girth.
 *
 * Width and depth constrain a thoracic envelope but cannot recover each rib, costal cartilage, vertebral articulation or breathing deformation. The sternum has one midline owner; left and right ribs remain separate geometry when a validated generator provides them.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty cage tree separately owns midline sternum, bilateral cartilage/rib groups and bony breadth/depth measurements.
 * @evidence contracts/common.md#clear-and-simple-design Component schemas retain individual quantities while this thoracic frame defines their composition and envelope constraints.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Chest girth or cage breadth/depth cannot determine every rib, vertebral articulation or breathing deformation.
 * @evidence contracts/common.md#meaningful-documentation Members give independent sides, imaged resting osseous breadth and sternal-angle depth; prose distinguishes the frame from soft tissue.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Cage input typing performs no respiratory deformation or articulation reconstruction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Thoracic grouping contains no evaluated left/right rib correspondence or cage fit cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Cage measurement records own no rib meshes, respiratory workspace or scanning handle.
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
