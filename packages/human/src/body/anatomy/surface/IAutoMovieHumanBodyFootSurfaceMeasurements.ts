import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySurfaceDistance } from "../measurements/IAutoMovieHumanBodySurfaceDistance";

/**
 * One foot's overall skin dimensions from heel to longest toe and across.
 *
 * Foot length and breadth constrain the exterior but cannot locate the calcaneus, metatarsals, arch or toe joints by themselves. Those structures need independent generated geometry and evaluated population inference.
 *
 * @evidence contracts/common.md#principled-implementation Nonempty foot length/breadth quantities preserve surface-distance provenance at distinct skin-defined spans.
 * @evidence contracts/common.md#clear-and-simple-design One foot owns overall dimensions while the shared distance schema owns target and observed units/protocol.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts External foot dimensions cannot locate calcaneus, metatarsals, arch or toe joints without an independently qualified generator.
 * @evidence contracts/common.md#meaningful-documentation Members identify heel-to-longest-toe length and mediolateral forefoot breadth under weight-bearing conditions.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Foot surface typing performs no arch reconstruction or toe-joint inference.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Overall foot quantities hold no evaluated skin-distance or bony-foot model to reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources These foot measurements own no weight-bearing mesh, pressure samples or generation task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyFootSurfaceMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Posterior heel to the most distal toe in a weight-bearing stance. */
    length?: IAutoMovieHumanBodySurfaceDistance;

    /** Greatest mediolateral forefoot span in a weight-bearing stance. */
    breadth?: IAutoMovieHumanBodySurfaceDistance;
  }>;
