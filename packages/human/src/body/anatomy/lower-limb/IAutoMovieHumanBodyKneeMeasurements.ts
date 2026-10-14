import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyPatellaMeasurements } from "./IAutoMovieHumanBodyPatellaMeasurements";

/**
 * Regional knee observations for the patella and its moving articulation.
 *
 * Femoral condyles and tibial plateau remain owned by their respective long bones; the knee relates them and does not copy those bone surfaces.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty knee-specific group owns patellar observations while femoral condyles and tibial plateau remain long-bone responsibilities.
 * @evidence contracts/common.md#clear-and-simple-design The region relates constituent anatomy without copying femur/tibia surface definitions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Regional knee membership cannot duplicate long-bone surfaces as separate owned geometry.
 * @evidence contracts/common.md#meaningful-documentation The comment defines patellar scope and independent opposing-bone ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Knee measurement grouping performs no flexion contact or patellar tracking algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Knee-specific records retain no cached femoral/tibial articulation solution.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The regional input acquires no duplicated bone surface or joint task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyKneeMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Separate sesamoid bone anterior to the distal femoral condyles. */
    patella?: IAutoMovieHumanBodyPatellaMeasurements;
  }>;
