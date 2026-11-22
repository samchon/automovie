import type { IAutoMoviePhysicalCoupledTargetFit } from "./IAutoMoviePhysicalCoupledTargetFit";
import type { IAutoMoviePhysicalSimulationInput } from "./IAutoMoviePhysicalSimulationInput";
import type { IAutoMoviePhysicsCache } from "./IAutoMoviePhysicsCache";

/**
 * Completed fixed-step simulation and its solver-free replay data.
 *
 * AutoMoviePhysicalSimulation.compute admits an owned clone of sampled inputs,
 * applies simulation defaults, and publishes this view after completion.
 * Cancellation or native failure rejects without a partial successful result.
 * Native worlds and event queues are released before the promise settles;
 * opaque checkpoint bytes remain in the cache.
 *
 * @evidence contracts/development/design.md#principled-representation Sampled inputs establish content identity and checkpoint equivalence; cache stores the corresponding completed frames and restart snapshots.
 * @evidence contracts/development/design.md#minimal-and-owned-surface These four public constructor properties and trackingAt are the observable instance surface used by checkpoint, playback and tracking consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No native World or RigidBody handle escapes through this record; checkpoint bytes remain opaque to callers.
 * @evidence contracts/development/common.md#meaningful-documentation Defines completed publication, owned defaults, replay lifetime, work count and diagnostic sampling semantics.
 */
export interface IAutoMoviePhysicalSimulation {
  /**
   * Owned admitted input clone with defaults filled by compute. Recursively
   * frozen before execution; preserve it to establish whether a later run can
   * reuse this cache or an earlier checkpoint.
   */
  readonly input: IAutoMoviePhysicalSimulationInput.IInput;

  /**
   * Complete replay and checkpoint state for input, retained by this result.
   * Compute freezes published records after completion. Frames span film time
   * zero through input.duration; cache methods enforce their sampling domain.
   */
  readonly cache: IAutoMoviePhysicsCache;

  /**
   * Fixed output intervals recomputed by the run creating this instance,
   * excluding reused intervals. Each counts once despite native substeps.
   * Exact-identity reuse returns the previous instance and its original count.
   */
  readonly recomputedSteps: number;

  /**
   * Owned frozen pre-solve demand forecasts retained from the completed run.
   * Saturation compares requested PD torque to its configured native cap; it
   * does not measure native motor impulse. The list may be empty.
   */
  readonly tracking: IAutoMoviePhysicalSimulationInput.IDiagnostic[];

  /**
   * Successful geometric target fits owned by this completed live simulation,
   * indexed by authored output step and exact group id. The residual is for
   * the fitted motor goals. Actual displayed poses remain available in cache.
   */
  readonly coupledTargetFits?: IAutoMoviePhysicalCoupledTargetFit.ISeries;

  /**
   * Read each joint's shortest authored-relative angular error in radians at
   * finite film seconds in [0,input.duration]. Saturation entries come from
   * the latest completed output step. Returns new diagnostics and saturation
   * arrays. Invalid time or incomplete cache throws in cache.at. Recovery
   * targets may intentionally differ from the original authored goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Read each joint's shortest authored-relative angular error in radians at finite film seconds in [0,input.duration]. Saturation entries come from the latest completed output step. Returns new diagnostics and saturation arrays. Invalid time or incomplete cache throws in cache.at. Recovery targets may intentionally differ from the original authored goal.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This is a callable signature without a body; AutoMoviePhysicalSimulation.trackingAt owns the numerical method and its runtime premises.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The signature only defines the call boundary; AutoMoviePhysicalSimulation.trackingAt owns its implementation decomposition.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or compensation occurs in this declaration; review special cases in AutoMoviePhysicalSimulation.trackingAt.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature selects no algorithm or allocation strategy; AutoMoviePhysicalSimulation.trackingAt owns cost for the supported workload.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The declaration creates no cache or coordinator; AutoMoviePhysicalSimulation.trackingAt owns reuse and invalidation of any retained work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The callable type acquires no resources; AutoMoviePhysicalSimulation.trackingAt and the documented reader/caller lifetime own retained data and release.
   */
  trackingAt(seconds: number): IAutoMoviePhysicalSimulationInput.IDiagnostic[];
}
