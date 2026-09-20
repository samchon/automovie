import { IAutoMovieDriver } from "@automovie/interface";
import { IAutoMovieResolveViolation } from "./IAutoMovieResolveViolation";

/**
 * The resolved frame: world matrices, morph weights, and any clamps fired.
 *
 * @evidence requirements/motion/validation-and-determinism.md#motion-evaluation-receipt Returns the explicit receipt for one resolved sample.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-deterministic-sampling-validation Defines the deterministic result receipt for one frame.
 * @author Samchon
 */
export interface IAutoMovieResolveOutput {
  /**
   * Node id → world matrix (`number[16]`, column-major).
   *
   * @evidence requirements/motion/validation-and-determinism.md#motion-evaluation-receipt Carries the resolved world state produced by this evaluation identity.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-deterministic-sampling-validation Emits the deterministic composed transform result for every node.
   */
  world: Map<string, number[]>;

  /**
   * Node id → morph-target weights, for nodes whose `weights` channel animated.
   *
   * @evidence requirements/motion/validation-and-determinism.md#motion-evaluation-receipt Carries resolved morph-channel state beside the world transform result.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-deterministic-sampling-validation Emits deterministic sampled weights for downstream deformation.
   */
  weights: Map<string, number[]>;

  /**
   * Every constraint breach that was clamped, in channel/component order.
   *
   * @evidence requirements/motion/validation-and-determinism.md#motion-evaluation-receipt Preserves each numeric correction applied during this frame evaluation.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-deterministic-sampling-validation Emits ordered constraint findings with the resolved state.
   */
  violations: IAutoMovieResolveViolation[];

  /**
   * Drivers this pass could not resolve: surfaced, never dropped. After S2 only
   * two things can appear here: springs when no
   * {@link IAutoMovieResolveInput.springs} input was given (stateful: nothing to
   * step them with), and malformed two-bone chains (length ≠ 3).
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rig-control-drivers Surfaces driver edges this pass could not execute instead of silently dropping them.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Preserves the unresolved remainder of the deterministic driver graph.
   */
  deferredDrivers: IAutoMovieDriver[];
}
