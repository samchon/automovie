import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Target or observed dimensions of one clavicle between sternum and scapula.
 *
 * Its sternoclavicular and acromioclavicular ends are distinct articular attachments. A rig shoulder slot or one clavicle length cannot reconstruct those ends, its S-shaped shaft or its independent elevation and rotation. This input holds named dimensions only, not a user-authored bone path.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty choice of osseous length and segmented volume preserves independently supplied clavicular quantities.
 * @evidence contracts/common.md#clear-and-simple-design Shared length/volume contracts own acquisition details while this record owns one clavicle's dimensions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Maximum length cannot stand in for the S-shaped shaft, articular ends or clavicular motion.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes bony measurements from skin distances and excludes authored bone paths.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Clavicle dimension typing selects no shaft fitting or articular reconstruction algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The clavicular input records no completed sternoclavicular or acromioclavicular reconstruction to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Named clavicle quantities retain no bone-path buffer or joint-generation task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyClavicleMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Greatest osseous length of this clavicle, not a skin distance. */
    maximumLength?: IAutoMovieHumanBodyAnatomicalLength;

    /** Segmented clavicle alone, excluding adjacent muscle and cartilage. */
    boneVolume?: IAutoMovieHumanBodyAnatomicalVolume;
  }>;
