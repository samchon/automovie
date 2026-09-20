import { IAutoMovieChannelLimit, IAutoMovieClip, IAutoMovieDriver, IAutoMovieNode } from "@automovie/interface";
import { IAutoMovieProfileApplication } from "./IAutoMovieProfileApplication";
import { IAutoMovieResolveSprings } from "./IAutoMovieResolveSprings";

/**
 * Everything needed to resolve one instant of a scene.
 *
 * @evidence requirements/motion/validation-and-determinism.md#motion-evaluation-receipt Identifies one frame evaluation through explicit authored inputs.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-deterministic-sampling-validation Defines the complete deterministic frame-evaluation input.
 * @author Samchon
 */
export interface IAutoMovieResolveInput {
  /**
   * The scene graph: nodes with parent-local rest transforms.
   *
   * @evidence requirements/motion/validation-and-determinism.md#motion-evaluation-receipt Supplies the node graph whose transforms define this evaluation.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-deterministic-sampling-validation Carries the concrete node graph against which sampled channels resolve.
   */
  nodes: IAutoMovieNode[];

  /**
   * The clip(s) animating this frame, or `null` for the rest pose. A sequence
   * resolves duplicate channels by their track start time and producer order.
   *
   * @evidence requirements/motion/validation-and-determinism.md#motion-fixed-step-baked-state Supplies the clip state sampled for this frame.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-deterministic-sampling-validation Carries the clip set whose deterministic sample becomes resolved state.
   */
  clip: IAutoMovieClip | readonly IAutoMovieClip[] | null;

  /**
   * Channel limits to clamp sampled values against (generalized ROM).
   *
   * @evidence requirements/motion/validation-and-determinism.md#motion-numeric-stability Supplies the finite bounds used to keep sampled channel state numerically valid.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-deterministic-sampling-validation Carries the constraint set included in deterministic sample validation.
   */
  limits: IAutoMovieChannelLimit[];

  /**
   * Drivers computing channels from other channels. Channel-space drivers
   * (`copy`, `driven`) are resolved this frame; world-space ones apply in the
   * post-compose pass; only springs without a {@link springs} input are returned
   * in {@link IAutoMovieResolveOutput.deferredDrivers}. Omit for none.
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rig-control-drivers Supplies the declared driver dependency graph evaluated in this frame.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Threads the driver graph through frame resolution.
   */
  drivers?: IAutoMovieDriver[];

  /**
   * Cross-frame spring stepping (state + dt + colliders). When present every
   * spring driver advances inside this frame; when absent springs defer.
   *
   * @evidence requirements/motion/secondary-motion.md#motion-secondary-adoption-choice Selects live spring evaluation for this frame.
   * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Carries the explicit live-secondary adoption input for this frame.
   */
  springs?: IAutoMovieResolveSprings;

  /**
   * Profiles applied to this scene ({@link bindProfile} per entry). Their bound
   * limits and drivers merge **before** the directly-passed `limits`/`drivers`:
   * a profile is the rig's standard baseline, the direct inputs are the
   * caller's per-scene word, so a direct limit clamps last (its bound is the
   * final one) and direct world-space drivers apply after profile-bound ones.
   * Omit for none; absent, behavior is byte-identical to before profiles
   * existed.
   *
   * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-rig-control-drivers Supplies reusable profile applications before direct scene overrides.
   * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Carries the profile applications materialized into the frame's constraint graph.
   */
  profiles?: IAutoMovieProfileApplication[];

  /**
   * The instant to resolve, in clip-local seconds.
   *
   * @evidence requirements/motion/validation-and-determinism.md#motion-scrambled-seek Selects the arbitrary clip-local instant that must resolve independently of query order.
   * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-deterministic-sampling-validation Supplies the exact sample time for deterministic seek comparison.
   */
  seconds: number;
}
