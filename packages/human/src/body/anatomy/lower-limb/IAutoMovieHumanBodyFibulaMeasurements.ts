import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Target or observed dimensions of one lateral fibula.
 *
 * Its head articulates near the knee and the lateral malleolus bounds the ankle. It is not the tibia's lateral skin contour or an offset copy of the tibial shaft; each side has its own observed bone dimensions.
 *
 * @evidence contracts/common.md#principled-implementation Nonempty maximum osseous length/bone-volume observations independently describe one side's fibula.
 * @evidence contracts/common.md#clear-and-simple-design The lateral bone retains its own measurement owner beside tibia and ankle cartilage.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A fibula is neither a lateral skin contour nor an offset copy of tibial geometry.
 * @evidence contracts/common.md#meaningful-documentation Comments define head-to-malleolus length and isolated fibular bone volume.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Fibular measurement types select no tibial-offset or bone-generation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Lateral-bone quantities retain no prior fibula reconstruction result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Fibula metadata owns no segmented lateral-leg geometry or runtime task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyFibulaMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Osseous head-to-lateral-malleolus length. */
    maximumLength?: IAutoMovieHumanBodyAnatomicalLength;

    /** Segmented fibula alone, separate from tibia and ankle cartilage. */
    boneVolume?: IAutoMovieHumanBodyAnatomicalVolume;
  }>;
