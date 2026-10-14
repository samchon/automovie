import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySmallBoneMeasurements } from "../measurements/IAutoMovieHumanBodySmallBoneMeasurements";

/**
 * First toe ray with one metatarsal and only two phalanges.
 *
 * The hallux bears load during push-off; this type excludes a fictitious middle phalanx and does not equate metatarsal length with skin toe length.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty first-metatarsal/proximal/distal set models the supported hallux ray without a middle phalanx field.
 * @evidence contracts/common.md#clear-and-simple-design Each first-ray bone imports shared small-bone quantities while retaining independent anatomical ownership.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Metatarsal measurement never substitutes external toe length or a fictitious middle phalanx.
 * @evidence contracts/common.md#meaningful-documentation Members state the first metatarsal and two actual hallux phalanx owners.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Hallux input composition performs no toe-ray articulation or bone generation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work First-ray measurement membership stores no repeated push-off calculation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Hallux metadata owns no phalanx mesh or retained foot solver.
 * @author Samchon
 */
export type IAutoMovieHumanBodyHalluxMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** First metatarsal articulating with medial cuneiform. */
    firstMetatarsal?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Hallux proximal phalanx. */
    proximalPhalanx?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Hallux distal phalanx. */
    distalPhalanx?: IAutoMovieHumanBodySmallBoneMeasurements;
  }>;
