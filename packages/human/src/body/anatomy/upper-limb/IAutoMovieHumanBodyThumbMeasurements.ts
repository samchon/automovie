import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySmallBoneMeasurements } from "../measurements/IAutoMovieHumanBodySmallBoneMeasurements";

/**
 * Thumb ray with first metacarpal and only proximal/distal phalanges.
 *
 * Opposition uses a different carpometacarpal articulation from the fingers; no middle phalanx can be inserted by this closed thumb type.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty first-metacarpal/proximal/distal record preserves three independently measured thumb bones and excludes a middle phalanx structurally.
 * @evidence contracts/common.md#clear-and-simple-design The hand owns thumb side while common small-bone quantities define dimensions and segmented volumes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The thumb's distinct carpometacarpal opposition cannot be inferred from a generic three-phalange finger or inserted middle phalanx.
 * @evidence contracts/common.md#meaningful-documentation Members identify first metacarpal-to-trapezium articulation and the two thumb phalanges.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Thumb quantity typing performs no opposition solve or carpometacarpal shape generation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This thumb schema stores no evaluated opposition or phalange reconstruction result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Thumb records retain no first-ray geometry or articulation solver resource.
 * @author Samchon
 */
export type IAutoMovieHumanBodyThumbMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** First metacarpal articulating with trapezium. */
    firstMetacarpal?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Thumb proximal phalanx. */
    proximalPhalanx?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Thumb distal phalanx. */
    distalPhalanx?: IAutoMovieHumanBodySmallBoneMeasurements;
  }>;
