import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyCarpusMeasurements } from "./IAutoMovieHumanBodyCarpusMeasurements";
import type { IAutoMovieHumanBodyFingerMeasurements } from "./IAutoMovieHumanBodyFingerMeasurements";
import type { IAutoMovieHumanBodyThumbMeasurements } from "./IAutoMovieHumanBodyThumbMeasurements";

/**
 * One hand's wrist and five rays, with thumb's two-phalange distinction.
 *
 * Outer hand length/breadth is kept in the connected-skin measurements; independent bone targets belong here and do not directly sculpt fingers.
 *
 * @evidence contracts/common.md#principled-implementation Nonempty carpus and five-ray fields preserve independently measured hand bones, with a distinct two-phalange thumb schema.
 * @evidence contracts/common.md#clear-and-simple-design Wrist and digit owners define their components while this same-side hand composes them independently from skin spans.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exterior hand length/breadth cannot replace per-bone targets or directly sculpt digit vertices.
 * @evidence contracts/common.md#meaningful-documentation Members number the five rays and identify eight wrist bones separately from connected-skin dimensions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Hand composition typing performs no carpal articulation or finger mesh generation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Anatomical hand grouping stores no evaluated ray/bone reconstruction for reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Hand bone inputs own no wrist/ray buffers or digit-generation task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyHandMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Eight distinct wrist bones. */
    carpus?: IAutoMovieHumanBodyCarpusMeasurements;

    /** First ray with two phalanges. */
    thumb?: IAutoMovieHumanBodyThumbMeasurements;

    /** Second ray. */
    indexFinger?: IAutoMovieHumanBodyFingerMeasurements;

    /** Third ray. */
    middleFinger?: IAutoMovieHumanBodyFingerMeasurements;

    /** Fourth ray. */
    ringFinger?: IAutoMovieHumanBodyFingerMeasurements;

    /** Fifth ray. */
    littleFinger?: IAutoMovieHumanBodyFingerMeasurements;
  }>;
