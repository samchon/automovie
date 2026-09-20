import { AutoMovieHumanoidBone, IAutoMovieBeatEndFootPlant, IAutoMovieBeatEndState, IAutoMovieClip, IAutoMovieCompiledFormation, IAutoMovieFormationDesign, IAutoMovieFormationMotion, IAutoMovieModel, IAutoMovieProductionDesign, IAutoMoviePropSpec, IAutoMovieSkeleton, IAutoMovieVector3, IAutoMovieWorldDesign } from "@automovie/interface";
import { IAutoMovieJointAxes } from "../kinematics/IAutoMovieJointAxes";
import { IAutoMovieActionSynthesizer } from "../perform/IAutoMovieActionSynthesizer";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { IAutoMovieCameraClearanceRuntime } from "./IAutoMovieCameraClearanceRuntime";
import { IAutoMovieShotPhysicsAdvice } from "./IAutoMovieShotPhysicsAdvice";

/**
 * Host-owned capabilities needed to turn thin verbs into dense motion.
 *
 * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay IAutoMovieShotRuntime supports reproducible staging and performance: Host-owned capabilities needed to turn thin verbs into dense motion.
 * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieShotRuntime realizes deterministic staging replay and validation: Host-owned capabilities needed to turn thin verbs into dense motion.
 */
export interface IAutoMovieShotRuntime {
  /**
   * Rig-specific action synthesizer; engine composition and ROM gates follow.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay IAutoMovieShotRuntime.synthesize supports reproducible staging and performance: Rig-specific action synthesizer; engine composition and ROM gates follow.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieShotRuntime.synthesize realizes deterministic staging replay and validation: Rig-specific action synthesizer; engine composition and ROM gates follow.
   */
  synthesize: IAutoMovieActionSynthesizer;
  /**
   * Rig lookup for every staged actor.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay IAutoMovieShotRuntime.skeleton supports reproducible staging and performance: Rig lookup for every staged actor.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieShotRuntime.skeleton realizes deterministic staging replay and validation: Rig lookup for every staged actor.
   */
  skeleton(node: string): IAutoMovieSkeleton | null;
  /**
   * Raster dimensions used to project required camera subjects at opening,
   * review-frame and closing times.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay IAutoMovieShotRuntime.frameFormat supports reproducible staging and performance: Raster dimensions used to project required camera subjects at opening, review-frame and closing times.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieShotRuntime.frameFormat realizes deterministic staging replay and validation: Raster dimensions used to project required camera subjects at opening, review-frame and closing times.
   */
  frameFormat: Pick<
    IAutoMovieProductionDesign["frameFormat"],
    "width" | "height"
  >;
  /**
   * Geometry revision and fixed-clock authority for camera-body clearance.
   * Required only when a delivered staged camera declares a clearance
   * envelope.
   *
   * @evidence requirements/camera/clipping-occlusion-and-spatial-constraints.md#camera-spatial-geometry-revision Carries the measured and current revision through the public shot builder boundary.
   * @evidence specifications/camera-light-and-visibility/framing-axis-and-camera-path.md#clv-camera-path-constraints-refusal Arms the addressed swept-path refusal before a shot artifact is published.
   */
  cameraClearance?: IAutoMovieCameraClearanceRuntime;
  /**
   * Optional world landmarks cited by contract predicates.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay IAutoMovieShotRuntime.world supports reproducible staging and performance: Optional world landmarks cited by contract predicates.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieShotRuntime.world realizes deterministic staging replay and validation: Optional world landmarks cited by contract predicates.
   */
  world?: IAutoMovieWorldDesign | null;
  /**
   * Formation designs cited by the registered participant contract.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay IAutoMovieShotRuntime.formationDesigns supports reproducible staging and performance: Formation designs cited by the registered participant contract.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieShotRuntime.formationDesigns realizes deterministic staging replay and validation: Formation designs cited by the registered participant contract.
   */
  formationDesigns?: ReadonlyMap<string, IAutoMovieFormationDesign>;
  /**
   * Compiler-owned compact formation runtimes present in this shot.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay IAutoMovieShotRuntime.formations supports reproducible staging and performance: Compiler-owned compact formation runtimes present in this shot.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieShotRuntime.formations realizes deterministic staging replay and validation: Compiler-owned compact formation runtimes present in this shot.
   */
  formations?: readonly IAutoMovieCompiledFormation[];
  /**
   * The shot's compact formation cues.
   *
   * A camera framing a unit and the realization grading that frame both measure
   * the unit where the cue playing at that instant has put it, so the cues have
   * to reach the performance boundary rather than being attached to the source
   * artifact after it is built.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay IAutoMovieShotRuntime.formationMotions fixes the compact formation cues supplied to every replay of this shot.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieShotRuntime.formationMotions realizes deterministic staging replay and validation: The shot's compact formation cues. A camera framing a unit and the realization grading that frame both measure the unit where the cue playing at that instant has put it, so the cues have to reach the performance boundary rather than being attached to the source artifact after it is built.
   */
  formationMotions?: readonly IAutoMovieFormationMotion[];
  /**
   * The shot's own light clips, carried onto the compiled shot.
   *
   * The source states them beside its verbs and the host hands them here; the
   * performance boundary gates them against the staged lights, exactly as it
   * gates every other reference the source makes.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay IAutoMovieShotRuntime.lightMotions carries the authored light animation inputs into the reproducible compiled-shot result.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieShotRuntime.lightMotions realizes deterministic staging replay and validation: The shot's own light clips, carried onto the compiled shot. The source states them beside its verbs and the host hands them here; the performance boundary gates them against the staged lights, exactly as it gates every other reference the source makes.
   */
  lightMotions?: readonly IAutoMovieClip[];
  /**
   * The shot's own object clips and the prop registry they are measured
   * against, carried onto the compiled shot's `objectMotions`.
   *
   * A building's panel and a prop's leaf are the two things a shot can move
   * that no verb reaches, and both are one node in the staged graph turned over
   * the shot's clock. The performance boundary admits the nodes this shot may
   * drive and bounds a driven joint by the travel its prop declares; see
   * {@link gateAuthoredObjectMotions}.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay IAutoMovieShotRuntime.objectMotions binds authored object clips to the prop registry used to validate and reproduce them.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieShotRuntime.objectMotions realizes deterministic staging replay and validation: The shot's own object clips and the prop registry they are measured against, carried onto the compiled shot's `objectMotions`. A building's panel and a prop's leaf are the two things a shot can move that no verb reaches, and both are one node in the staged graph turned over the shot's clock. The performance boundary admits the nodes this shot may drive and bounds a driven joint by the travel its prop declares; see {@link gateAuthoredObjectMotions}.
   */
  objectMotions?: readonly IAutoMovieClip[];
  /**
   * Forged props this shot stages, whose joints those clips may address.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay IAutoMovieShotRuntime.props supports reproducible staging and performance: Forged props this shot stages, whose joints those clips may address.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieShotRuntime.props realizes deterministic staging replay and validation: Forged props this shot stages, whose joints those clips may address.
   */
  props?: readonly IAutoMoviePropSpec[];
  /**
   * Optional full models when predicates need model-owned rig evidence.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay IAutoMovieShotRuntime.models supports reproducible staging and performance: Optional full models when predicates need model-owned rig evidence.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieShotRuntime.models realizes deterministic staging replay and validation: Optional full models when predicates need model-owned rig evidence.
   */
  models?: readonly IAutoMovieModel[];
  /**
   * Formation-slot collisions found while materializing this shot.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay IAutoMovieShotRuntime.collisions supports reproducible staging and performance: Formation-slot collisions found while materializing this shot.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieShotRuntime.collisions realizes deterministic staging replay and validation: Formation-slot collisions found while materializing this shot.
   */
  collisions?: readonly string[];
  /**
   * Optional distinction between missing actor context and a rig-less actor.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay IAutoMovieShotRuntime.hasActorContext supports reproducible staging and performance: Optional distinction between missing actor context and a rig-less actor.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieShotRuntime.hasActorContext realizes deterministic staging replay and validation: Optional distinction between missing actor context and a rig-less actor.
   */
  hasActorContext?(node: string): boolean;
  /**
   * Optional clinical joint axes used by ground IK and attachment baking.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay IAutoMovieShotRuntime.jointAxes supports reproducible staging and performance: Optional clinical joint axes used by ground IK and attachment baking.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieShotRuntime.jointAxes realizes deterministic staging replay and validation: Optional clinical joint axes used by ground IK and attachment baking.
   */
  jointAxes?(
    node: string,
  ): Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> | undefined;
  /**
   * Optional clinical rest frames used by ground IK and attachment baking.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay IAutoMovieShotRuntime.restFrames supports reproducible staging and performance: Optional clinical rest frames used by ground IK and attachment baking.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieShotRuntime.restFrames realizes deterministic staging replay and validation: Optional clinical rest frames used by ground IK and attachment baking.
   */
  restFrames?(
    node: string,
  ): Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>> | undefined;
  /**
   * Optional live point resolver for moving targets.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay IAutoMovieShotRuntime.targetAt supports reproducible staging and performance: Optional live point resolver for moving targets.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieShotRuntime.targetAt realizes deterministic staging replay and validation: Optional live point resolver for moving targets.
   */
  targetAt?(
    target: import("@automovie/interface").IAutoMovieActionTarget,
    seconds: number,
  ): IAutoMovieVector3 | null;
  /**
   * Gait vocabulary available to each actor.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay IAutoMovieShotRuntime.gaits supports reproducible staging and performance: Gait vocabulary available to each actor.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieShotRuntime.gaits realizes deterministic staging replay and validation: Gait vocabulary available to each actor.
   */
  gaits?(node: string): readonly string[] | undefined;
  /**
   * Prior verified beat state used as this shot's opening condition.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay IAutoMovieShotRuntime.previous supports reproducible staging and performance: Prior verified beat state used as this shot's opening condition.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieShotRuntime.previous realizes deterministic staging replay and validation: Prior verified beat state used as this shot's opening condition.
   */
  previous?: IAutoMovieBeatEndState;
  /**
   * Ground-IK stance runs carried into the closing continuity snapshot.
   *
   * @evidence requirements/staging/budgets-safety-and-validation.md#staging-deterministic-replay IAutoMovieShotRuntime.plants supports reproducible staging and performance: Ground-IK stance runs carried into the closing continuity snapshot.
   * @evidence specifications/performance-motion-and-staging/staging-events-coverage-and-validation.md#performance-staging-deterministic-replay-failure-result IAutoMovieShotRuntime.plants realizes deterministic staging replay and validation: Ground-IK stance runs carried into the closing continuity snapshot.
   */
  plants?: ReadonlyArray<{
    /** Scene node whose feet were measured. */
    node: string;
    /** Measured stance runs for that node. */
    plants: readonly IAutoMovieBeatEndFootPlant[];
  }>;
  /**
   * Optional D010 suggestions generated by shot code or a host analysis pass.
   *
   * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-authored-simulated-trajectory Carries D010 suggestions and their author dispositions into compilation as optional source data rather than applying any proposal automatically.
   * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#rigid-trajectory-tier-contract Supplies the proposal, selected response, decision, and rationale that the builder validates at the explicit trajectory-authority boundary.
   */
  advice?: readonly IAutoMovieShotPhysicsAdvice[];
}
