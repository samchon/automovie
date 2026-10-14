import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Target or observed dimensions of one weight-bearing tibia.
 *
 * The proximal tibial plateau belongs to the knee and the distal plafond to the ankle. Neither articular shape follows from leg length or calf girth; the fibula remains a different bone sharing those joints.
 *
 * @evidence contracts/common.md#principled-implementation Tibial length and segmented volume preserve distinct dimensional and acquisition contracts within a nonempty record.
 * @evidence contracts/common.md#clear-and-simple-design One tibia owns optional maximum length and bone volume separately from fibula.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Skin knee-to-ankle distance cannot silently stand in for maximum bony tibial length.
 * @evidence contracts/common.md#meaningful-documentation Comments separate plateau/plafond surfaces from exterior length and name excluded adjacent bones.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Tibial measurement typing carries no plateau fitting or segmented-volume computation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This tibia schema shares no computed leg-length or ankle-surface result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The tibial declaration retains no tomography images or generated leg resources.
 * @author Samchon
 */
export type IAutoMovieHumanBodyTibiaMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Maximum bony tibial length rather than knee-to-ankle skin distance. */
    maximumLength?: IAutoMovieHumanBodyAnatomicalLength;

    /** Segmented tibia alone, excluding fibula and patella. */
    boneVolume?: IAutoMovieHumanBodyAnatomicalVolume;
  }>;
