import {
  AutoMovieHumanoidBone,
  IAutoMovieActionTarget,
  IAutoMovieBeatEndState,
  IAutoMovieBlocking,
  IAutoMovieClip,
  IAutoMovieCompiledFormation,
  IAutoMovieFormationMotion,
  IAutoMovieJointAxes,
  IAutoMovieModel,
  IAutoMoviePerformance,
  IAutoMoviePropSpec,
  IAutoMovieScript,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieActionSynthesizer } from "../perform/IAutoMovieActionSynthesizer";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { IAutoMovieCameraClearanceRuntime } from "./IAutoMovieCameraClearanceRuntime";
import { IAutoMovieStagedSet } from "./IAutoMovieStagedSet";

/**
 * The inputs of {@link performShot}: the script, the staged world and the
 * beat's performance, the synthesizer and rig lookups that realize it, and the
 * optional context that sharpens framing, gating and coupling.
 *
 * Every optional field states what omitting it does; none changes the shot of
 * a caller that omits it beyond what that field documents.
 *
 * @evidence contracts/common.md#principled-implementation Separates what the shot is made of (script, stage, performance) from the capabilities that realize it (synthesizer, rig, axes, rest frames, live targets) and the evidence that gates it (blocking, gaits, actor context), each a plain value or lookup the caller owns.
 * @evidence contracts/common.md#clear-and-simple-design One named input record for the performance stage, kept beside the function so its contract can be read without the pipeline body.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No field exists for a test or a fixture; every optional field is a real capability or piece of evidence a production caller supplies.
 * @evidence contracts/common.md#meaningful-documentation Each field states its meaning, its units or frame where it has one, and what omitting it does.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Type-only input shape; the per-call cost of turning it into lookup tables is stated on `performShot`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A call's input; `performShot` builds its lookup tables from it once per call.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Owned by the caller; `performShot` keeps no reference past its return except through the returned shot's clips.
 */
export interface IPerformShotProps {
  /** The script whose beats the performance may realize. */
  script: IAutoMovieScript;

  /** The validated stage result, the one coordinate authority for the shot. */
  staged: IAutoMovieStagedSet.ISuccess;

  /** The beat's performance: beat id, duration, draft and revise pass. */
  performance: IAutoMoviePerformance;

  /** Turns one action and one actor into a clip, or null for nothing. */
  synthesize: IAutoMovieActionSynthesizer;

  /**
   * Rig lookup by node id; null for a node with no skeleton, whose clip skips
   * the range-of-motion gate and whose subject is measured without a rig span.
   *
   * @evidence contracts/common.md#principled-implementation A pure lookup the caller owns, so every gate, the stance pass, coupling and the framer read one rig per node; it must answer the same rig for the same id throughout the call.
   * @evidence contracts/common.md#clear-and-simple-design A lookup rather than a table, because the caller's actor registry already indexes rigs and copying it into the input would add a second authority.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The engine never substitutes a rig for a null answer; a rig-less node is handled by each stage's stated rule.
   * @evidence contracts/common.md#meaningful-documentation States the key, what null means and its two consequences.
   * @evidence contracts/performance.md#efficient-algorithms Called a bounded number of times per actor and target, so its cost is the caller's index lookup times a small multiple of the action count.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The caller's registry is the shared index; the performance stage asks it rather than caching rigs it does not own.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The engine keeps no rig past the call; the returned skeletons belong to the caller's registry.
   */
  skeleton: (node: string) => IAutoMovieSkeleton | null;

  /**
   * Compiler-owned models for the staged nodes, used to measure what a camera
   * frames. A rig's joint span is not the figure's height, so framing from the
   * rig alone crops a head; omitted, the rig span is the fallback.
   */
  models?: readonly IAutoMovieModel[];

  /**
   * Compiler-owned geometry revision and inspection clock. Required once a
   * take's camera declares a physical envelope; a camera without one is
   * unaffected when it is omitted.
   */
  cameraClearance?: IAutoMovieCameraClearanceRuntime;

  /**
   * Compiled compact formations present in this shot, so a camera can frame a
   * mass. A group naming a formation this list lacks is a violation.
   */
  formations?: readonly IAutoMovieCompiledFormation[];

  /**
   * The shot's compact formation cues, so a framed unit is measured where its
   * cue has put it; omitted, every formation is framed at rest.
   */
  formationMotions?: readonly IAutoMovieFormationMotion[];

  /**
   * Delivery raster for the horizontal half of the framing fit. Omitted, or
   * with a non-positive side, a wide subject is fitted to a square frame,
   * which stands back far enough for any raster of that height.
   */
  frameFormat?: { width: number; height: number };

  /**
   * Actor-registry membership; omitted, a bone target's actor is not checked
   * against a registry.
   *
   * @evidence contracts/common.md#principled-implementation Keeps a missing actor context distinct from a present context with no rig, so a bone target on an unregistered node is refused with the reason that actually applies.
   * @evidence contracts/common.md#clear-and-simple-design A predicate over the caller's registry, read only by the bone-target check; omitting it skips that one check rather than changing any other rule.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The engine assumes nothing about membership when it is omitted and never fabricates a context for a node.
   * @evidence contracts/common.md#meaningful-documentation States what it answers and what omitting it does.
   * @evidence contracts/performance.md#efficient-algorithms Asked once per bone target that names a staged node, a handful per beat.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A membership test the caller's registry already indexes; nothing is worth caching across a few calls.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the predicate is held only for the call.
   */
  hasActorContext?: (node: string) => boolean;

  /**
   * Per-node joint axes the renderer uses, so ground planting and attachment
   * baking read the rig through one basis. Omitted, both use their defaults.
   *
   * @evidence contracts/common.md#principled-implementation The planted feet and attached props are solved through the same joint frames the renderer animates with, so a pinned foot and a held prop land where they are drawn.
   * @evidence contracts/common.md#clear-and-simple-design Passed straight through to the stance pass and the coupling baker, the two consumers that pose a rig in world space.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No axis set is invented per actor; an omitted lookup or a node it does not answer uses the solvers' documented default.
   * @evidence contracts/common.md#meaningful-documentation States who reads it, why it must match the renderer, and what omitting it does.
   * @evidence contracts/performance.md#efficient-algorithms Asked once per planted actor and once per coupling parent.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pass-through lookup into the caller's rig data; no answer is recomputed here.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The answered records belong to the caller and are read, not stored.
   */
  jointAxes?: (
    node: string,
  ) => Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> | undefined;

  /**
   * Per-node rest frames the renderer uses, so planting and `attachTo` clips
   * read the visible pose rather than raw rig-space forward kinematics.
   *
   * @evidence contracts/common.md#principled-implementation Ground contact and bone-carried props are measured on the pose the viewer shows, which is rig forward kinematics composed with these clinical rest frames.
   * @evidence contracts/common.md#clear-and-simple-design Handed unchanged to the stance pass and the coupling baker, with no interpretation of its own in the performance stage.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An omitted lookup falls back to raw rig-space forward kinematics for every node alike, never to a guessed frame.
   * @evidence contracts/common.md#meaningful-documentation States its readers, the pose it aligns them to, and the fallback.
   * @evidence contracts/performance.md#efficient-algorithms Queried per planted actor and per coupling parent, not per frame.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The caller's rig data answers it directly, so there is nothing to memoize here.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Frames stay owned by the caller; this stage holds them only during the solve.
   */
  restFrames?: (
    node: string,
  ) => Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>> | undefined;

  /**
   * Live resolver for targets whose point changes during the shot; its `null`
   * falls back to the staged placement. Positions are world metres at
   * shot-local seconds.
   *
   * @evidence contracts/common.md#principled-implementation Lets a target that moves, such as a bone on a walking actor, be aimed and framed where it is at the instant asked, with the staged placement as the stated fallback.
   * @evidence contracts/common.md#clear-and-simple-design One resolver shared by the target gate, the launch lead and the subject framer, so a gated target, a lead and a framed subject agree.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A null answer falls back by rule, and a non-finite answer is refused by the target gate rather than accepted.
   * @evidence contracts/common.md#meaningful-documentation States what it resolves, the fallback, and the units and clock of its arguments and result.
   * @evidence contracts/performance.md#efficient-algorithms Asked once per positional target at gate time, and per sampled instant only for a bone launch lead or a followed bone subject.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each instant is a different question, so answers are not memoized here.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The resolver is held by the launch lead and the framed subject until `performShot` returns, and nothing it answers is stored beyond the shot's baked clips.
   */
  targetAt?: (
    target: IAutoMovieActionTarget,
    seconds: number,
  ) => IAutoMovieVector3 | null;

  /**
   * The gait names each actor supplies; a `locomote` naming another gait is a
   * violation. Omitted, or `undefined` for a node, skips the check.
   *
   * @evidence contracts/common.md#principled-implementation The reference synthesizer resolves a gait by name and produces no motion for an unknown one, so the actor's own vocabulary is the domain a `locomote` gait must belong to.
   * @evidence contracts/common.md#clear-and-simple-design Read only by the `locomote` check, as a lookup into the caller's actor contexts.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent vocabulary skips the check rather than assuming one, and no gait name is special-cased.
   * @evidence contracts/common.md#meaningful-documentation States what it lists, the violation it arms, and both ways to skip it.
   * @evidence contracts/performance.md#efficient-algorithms One lookup and one linear membership test per actor of each `locomote`, over a short gait list.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The caller's contexts index the lists; a beat's few locomotes need no cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned lists are the caller's and are only read.
   */
  gaits?: (node: string) => readonly string[] | undefined;

  /**
   * The beat's validated blocking. Supplying it arms the coherence gate and
   * the coverage takes.
   */
  blocking?: IAutoMovieBlocking;

  /**
   * Clips moving the staged lights over this shot's clock, carried onto
   * `shot.lightMotions` after each track is checked to address a staged
   * light. Omitted, the shot carries no such field.
   */
  lightMotions?: readonly IAutoMovieClip[];

  /**
   * Clips the source authored over non-performing scene nodes, such as a
   * door's panel or a prop's hinge, carried onto `shot.objectMotions` after the
   * baked ones once {@link gateAuthoredObjectMotions} admits them.
   */
  objectMotions?: readonly IAutoMovieClip[];

  /**
   * The shot's prop registry, whose articulation lowers the joints an authored
   * object clip may drive and bounds their travel.
   */
  props?: readonly IAutoMoviePropSpec[];

  /**
   * Registered source identity for direct code authoring; omitted, the shot id
   * is `shot:<beat>`.
   */
  shotId?: string;

  /**
   * Prior verified beat state, passed to every synthesizer call. The caller
   * restages `staged` from it beforehand, as `compileDefinedShot` does.
   */
  previous?: IAutoMovieBeatEndState | null;
}
