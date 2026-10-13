import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySmallBoneMeasurements } from "../measurements/IAutoMovieHumanBodySmallBoneMeasurements";

/**
 * One index, middle, ring or little finger with three distinct phalanges.
 *
 * The enclosing hand names the digit and side. All four share this component schema but own independent observed lengths and volumes; a shared generator is instancing of a rule, not duplication of one person's geometry.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty metacarpal and three-phalange record preserves independent small-bone quantities for one non-thumb digit.
 * @evidence contracts/common.md#clear-and-simple-design The enclosing hand owns side/digit identity while this shared schema owns its four bony components.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sharing a digit schema does not duplicate one person's geometry or infer unmeasured joint surfaces from overall hand size.
 * @evidence contracts/common.md#meaningful-documentation Members identify metacarpal, proximal, intermediate and distal phalanges and explain the thumb's different population.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Finger quantity typing computes no joint geometry or digit-proportion generation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shared digit schema reuses definitions without sharing observed bone lengths/volumes among fingers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Digit inputs retain no phalange mesh, joint solver or instanced geometry allocation.
 * @author Samchon
 */
export type IAutoMovieHumanBodyFingerMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Metacarpal belonging to this digit. */
    metacarpal?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** First phalanx beyond metacarpophalangeal joint. */
    proximalPhalanx?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Intermediate phalanx absent in the thumb. */
    middlePhalanx?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Terminal phalanx beneath the fingertip. */
    distalPhalanx?: IAutoMovieHumanBodySmallBoneMeasurements;
  }>;
