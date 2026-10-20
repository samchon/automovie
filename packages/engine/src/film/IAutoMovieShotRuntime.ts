import {
  AutoMovieHumanoidBone,
  IAutoMovieActionTarget,
  IAutoMovieBeatEndFootPlant,
  IAutoMovieBeatEndState,
  IAutoMovieClip,
  IAutoMovieCompiledFormation,
  IAutoMovieFormationDesign,
  IAutoMovieFormationMotion,
  IAutoMovieJointAxes,
  IAutoMovieModel,
  IAutoMovieProductionDesign,
  IAutoMoviePropSpec,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
  IAutoMovieWorldDesign,
} from "@automovie/interface";

import { IAutoMovieActionSynthesizer } from "../perform/IAutoMovieActionSynthesizer";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { IAutoMovieCameraClearanceRuntime } from "./IAutoMovieCameraClearanceRuntime";
import { IAutoMovieShotPhysicsAdvice } from "./IAutoMovieShotPhysicsAdvice";

/**
 * Host-owned capabilities and compiled facts `compileDefinedShot` needs to turn
 * a shot program's thin verbs into dense, validated motion.
 *
 * The shot program states what happens; this record supplies what only the
 * host knows: the rig and model of each staged node, the action synthesizer,
 * the delivery raster, builder-owned formations and clips, the previous beat's
 * end state, and any collision advice. `compileDefinedShot` forwards the
 * capabilities to `performShot`, the measurement inputs to
 * `realizeShotContract`, `previous` to `blockBeat`, `plants` to the closing
 * continuity snapshot, and `advice` to its own validation. Every optional
 * member, when omitted, disables only the check or measurement it feeds, as
 * stated on that member.
 *
 * @evidence contracts/common.md#principled-implementation Capabilities are injected as lookups keyed by scene node id rather than imported, so the engine composes and validates motion against whatever rig, model and gait table the host actually renders with, and the same compile is deterministic for the same runtime answers.
 * @evidence contracts/common.md#clear-and-simple-design One record for everything outside the shot program, so `compileDefinedShot` keeps a three-argument signature and routes each member to the one phase that reads it; members are optional exactly where a host can lack the fact and the phase has a defined behavior without it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No member is defaulted to an invented rig, gait list or raster: an absent `skeleton` answer skips ROM for that node by contract, an absent `gaits` lookup skips only the gait check, and a clearance-declaring camera without `cameraClearance` is a violation rather than a pass.
 * @evidence contracts/common.md#meaningful-documentation States the consumer and where each member is routed, and per member its owner, what it is measured against, what omission does, and the units or keys of its answers.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A capability record with no runtime body; the work done with each member is answered on `performShot`, `realizeShotContract` and `compileDefinedShot`.
 * @evidence contracts/performance.md#reuse-equivalent-work Built once per shot by the host and shared by every compile phase of that shot, so the model, formation and clip lists are handed over once; the engine caches no lookup answer, so a host whose rig or gait lookups are costly memoizes them itself.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The host owns every member; the compiled result copies the advice with `structuredClone` and holds no reference to the lookups, so the record is released when the host drops it after compilation.
 */
export interface IAutoMovieShotRuntime {
  /**
   * Rig-specific action synthesizer; the engine composes its clips and applies
   * the ROM and artifact gates after it.
   */
  synthesize: IAutoMovieActionSynthesizer;

  /**
   * The rig of a staged node, or `null` for a node without one.
   *
   * `performShot` validates each actor's clips against it and resolves bone
   * targets through it, `realizeShotContract` measures a model-less actor's
   * span from it, and a staged mount's parent must answer a rig carrying the
   * mount bone.
   *
   * @evidence contracts/common.md#principled-implementation A pure lookup by scene node id; a `null` answer is the contract for a rig-less node, whose clip skips ROM, while a bone target or mount parent that answers `null` is reported as a violation.
   * @evidence contracts/common.md#clear-and-simple-design One lookup shared by performance, contract measurement and mount baking, so the three phases read the same rig for a node.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The engine substitutes no default skeleton for `null`; a phase that needs a rig reports its absence instead of measuring against a stand-in rig.
   * @evidence contracts/common.md#meaningful-documentation States the key, the meaning of `null`, and each phase that reads the rig and what it uses it for.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A host-supplied lookup signature; its cost is the host's, and the engine calls it per node per phase without iterating rigs.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The engine does not memoize answers, so a host with an expensive rig build memoizes it behind this lookup.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned rig stays host-owned and is read during the call; the compiled shot keeps no reference to it.
   */
  skeleton(node: string): IAutoMovieSkeleton | null;

  /**
   * Delivery raster in pixels, used to project required camera subjects at the
   * opening, review and closing times and to fit framing horizontally.
   */
  frameFormat: Pick<
    IAutoMovieProductionDesign["frameFormat"],
    "width" | "height"
  >;

  /**
   * Geometry revision and fixed inspection clock for camera-body clearance.
   * Required only when a delivered staged camera declares a clearance envelope;
   * such a camera without it is a violation.
   */
  cameraClearance?: IAutoMovieCameraClearanceRuntime;

  /**
   * World landmarks cited by contract predicates; omitted or `null`, a
   * predicate citing a landmark fails the compile with a contract-phase
   * diagnostic.
   */
  world?: IAutoMovieWorldDesign | null;

  /**
   * Formation designs by id, cited by the registered participant contract;
   * omitted means none.
   */
  formationDesigns?: ReadonlyMap<string, IAutoMovieFormationDesign>;

  /**
   * Compiler-owned compact formation runtimes present in this shot, so a camera
   * can frame a mass; a group target naming a formation absent here is a
   * violation.
   */
  formations?: readonly IAutoMovieCompiledFormation[];

  /**
   * The shot's compact formation cues.
   *
   * A camera framing a unit and the realization grading that frame both measure
   * the unit where the cue playing at that instant has put it, so the cues have
   * to reach the performance boundary rather than being attached to the source
   * artifact after it is built. Omitted, every formation is measured at rest.
   */
  formationMotions?: readonly IAutoMovieFormationMotion[];

  /**
   * The shot's own light clips, carried onto the compiled shot.
   *
   * The source states them beside its verbs and the host hands them here; the
   * performance boundary checks that each addresses a staged light, as it
   * checks every other reference the source makes.
   */
  lightMotions?: readonly IAutoMovieClip[];

  /**
   * The shot's own object clips, carried onto the compiled shot's
   * `objectMotions`.
   *
   * A building's panel and a prop's leaf are the two things a shot can move
   * that no verb reaches, and both are one node in the staged graph turned over
   * the shot's clock. The performance boundary admits the nodes this shot may
   * drive and bounds a driven joint by the travel its prop declares in
   * {@link props}.
   */
  objectMotions?: readonly IAutoMovieClip[];

  /** Forged props this shot stages, whose joints those clips may address. */
  props?: readonly IAutoMoviePropSpec[];

  /**
   * Compiler-owned models of the staged nodes, used to measure what a camera
   * frames and what the contract grades; omitted, the rig span or a stand-in
   * height is measured instead.
   */
  models?: readonly IAutoMovieModel[];

  /**
   * Ids of formation slots that collided with an authored scene node while the
   * builder materialized this shot; each one fails the contract realization.
   */
  collisions?: readonly string[];

  /**
   * Whether a staged node has an actor context in the host's registry.
   *
   * `performShot` reports a bone target on a staged node without a context as
   * missing context, which keeps it distinct from a present actor that simply
   * has no rig. Omitted, every staged node is taken to have a context.
   *
   * @evidence contracts/common.md#principled-implementation A membership lookup by scene node id, consulted only after the target node is known to be staged and before its rig is read, so the two failures are named in that order.
   * @evidence contracts/common.md#clear-and-simple-design A separate optional lookup rather than a sentinel answer from `skeleton`, because `null` there already means a rig-less actor and cannot also mean an unknown one.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The engine does not infer membership from a missing rig or model; without this lookup it skips the distinction rather than guessing.
   * @evidence contracts/common.md#meaningful-documentation States the key, the reader, the distinction it enables and the omitted behavior.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A host-supplied predicate signature; the engine calls it once per bone target.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The engine does not memoize answers; it is called once per bone target per compile.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Answers one boolean per bone target and the engine keeps neither the answer nor the predicate after compiling.
   */
  hasActorContext?(node: string): boolean;

  /**
   * Clinical joint axes of a node's rig, keyed by humanoid bone, used by ground
   * IK and attachment baking; `undefined` for a node without them.
   *
   * @evidence contracts/common.md#principled-implementation `performShot` passes the node's answer to ground planting and to `coupleObjects`, so stance solving and attachment baking read the rig in the same anatomical basis the renderer uses.
   * @evidence contracts/common.md#clear-and-simple-design A per-node lookup returning a partial table, because rigs carry axes for different bone subsets and a node may carry none.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing table or bone is passed as `undefined` to the consumers, which fall back to their documented rig-space behavior rather than to invented axes.
   * @evidence contracts/common.md#meaningful-documentation States the key, the table's keying, its two consumers, why they need it, and the meaning of `undefined`.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A host-supplied lookup signature; the engine asks it once per performed actor for ground planting and again when baking that actor's attachments or mounts.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The engine keeps no axis table between compiles, so a host whose rigs are fixed memoizes the table per rig behind this lookup.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned axis table stays host-owned; ground planting and attachment baking read it during compilation and the compiled shot keeps no reference to it.
   */
  jointAxes?(
    node: string,
  ): Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> | undefined;

  /**
   * Clinical rest frames of a node's rig, keyed by humanoid bone, used by ground
   * IK and attachment baking; `undefined` for a node without them.
   *
   * @evidence contracts/common.md#principled-implementation `performShot` passes the node's answer to ground planting and to `coupleObjects`, so planted feet and `attachTo` motions follow the visible pose rather than raw rig-space forward kinematics.
   * @evidence contracts/common.md#clear-and-simple-design A per-node lookup returning a partial table, the same shape as `jointAxes`, because the two describe one rig basis for the same consumers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing table or bone reaches the consumers as `undefined` and they use raw rig-space frames, never a guessed rest pose.
   * @evidence contracts/common.md#meaningful-documentation States the key, the table's keying, its consumers, why the visible pose matters, and the meaning of `undefined`.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A host-supplied lookup signature; the engine asks it per performed actor for ground planting and when baking attachments, alongside `jointAxes` for the same node.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The rest-frame table is fetched afresh for each compile; a host with fixed rigs memoizes it per rig, since the engine stores none.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned rest-frame table stays host-owned and is only read while stance feet and attachment motions are computed.
   */
  restFrames?(
    node: string,
  ): Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>> | undefined;

  /**
   * The world point of an action target at shot-local `seconds`, or `null` to
   * let the engine resolve it from the staged placements.
   *
   * @evidence contracts/common.md#principled-implementation `performShot` asks it first and falls back to `resolveTargetPoint` over staged node positions on `null`; an answer that is not finite is reported as an unresolved target, and a bone strike uses it as the moving intercept point.
   * @evidence contracts/common.md#clear-and-simple-design One optional resolver for targets that move during the shot, so a host with live geometry overrides the static answer without the engine modelling that geometry.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A `null` or missing resolver falls back to the staged resolution rather than a cached or extrapolated point, and a non-finite point is reported, not clamped.
   * @evidence contracts/common.md#meaningful-documentation States the time base, the space, the meaning of `null`, and the fallback.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A host-supplied resolver signature; the engine calls it per target query, including per sample of a moving strike.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The engine does not memoize answers, since a live target may move between queries.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned vector is read during the call; strike closures that capture the resolver live only for that shot's compilation.
   */
  targetAt?(
    target: IAutoMovieActionTarget,
    seconds: number,
  ): IAutoMovieVector3 | null;

  /**
   * The gait names a node's actor context supplies, or `undefined` to skip the
   * check for that node.
   *
   * @evidence contracts/common.md#principled-implementation `performShot` reports a `locomote` whose gait is not in the actor's list as a violation, because the reference synthesizer resolves gaits by name and would otherwise produce no motion for an unknown one.
   * @evidence contracts/common.md#clear-and-simple-design A per-node lookup, because gait vocabularies belong to each actor's context rather than to the shot.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An omitted lookup or an `undefined` answer skips the check rather than assuming a default gait set, and an empty list rejects every gait.
   * @evidence contracts/common.md#meaningful-documentation States the key, the check it feeds, the effect of `undefined` and of omission.
   * @evidenceExclude contracts/performance.md#efficient-algorithms A host-supplied lookup signature; the engine calls it once per actor per `locomote` action.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each gait list is requested per actor per `locomote` action and compared at once; no list survives the check inside the engine.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned list stays host-owned and is read during the check only.
   */
  gaits?(node: string): readonly string[] | undefined;

  /**
   * The previous beat's verified end state, used as this shot's opening
   * condition: actors resume its placement, facing, pose, gait phase, velocity,
   * plants and mount. Omitted for a first beat.
   */
  previous?: IAutoMovieBeatEndState;

  /**
   * Ground-IK stance runs carried into the closing continuity snapshot, one
   * entry per node; a node this shot replants replaces its entry.
   */
  plants?: ReadonlyArray<{
    /** Scene node whose feet were measured. */
    node: string;

    /** Measured stance runs for that node. */
    plants: readonly IAutoMovieBeatEndFootPlant[];
  }>;

  /**
   * Collision-response suggestions from shot code or a host analysis pass,
   * with the author's decisions; validated, then copied onto the compiled
   * result and never applied to motion.
   */
  advice?: readonly IAutoMovieShotPhysicsAdvice[];
}
