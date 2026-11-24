import type { IAutoMovieCameraClearanceRuntime } from "../cinematics/IAutoMovieCameraClearanceRuntime";
import type { IAutoMovieClip } from "../core/IAutoMovieClip";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieActionTarget } from "../harness/IAutoMovieActionTarget";
import type { IAutoMovieBeatEndFootPlant } from "../harness/IAutoMovieBeatEndFootPlant";
import type { IAutoMovieBeatEndState } from "../harness/IAutoMovieBeatEndState";
import type { IAutoMoviePropSpec } from "../harness/IAutoMoviePropSpec";
import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieActionSynthesizer } from "../motion/perform/IAutoMovieActionSynthesizer";
import type { IAutoMovieRestFrame } from "../pose/IAutoMovieRestFrame";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieFontSource } from "../typography/IAutoMovieFontSource";
import type { IAutoMovieCompiledFormation } from "./IAutoMovieCompiledFormation";
import type { IAutoMovieFormationDesign } from "./IAutoMovieFormationDesign";
import type { IAutoMovieFormationMotion } from "./IAutoMovieFormationMotion";
import type { IAutoMoviePracticalLightBinding } from "./IAutoMoviePracticalLightBinding";
import type { IAutoMovieProductionDesign } from "./IAutoMovieProductionDesign";
import type { IAutoMovieShotPhysicsAdvice } from "./IAutoMovieShotPhysicsAdvice";
import type { IAutoMovieWorldDesign } from "./IAutoMovieWorldDesign";

/**
 * Host-owned capabilities and compiled facts `compileDefinedShot` needs to turn
 * a shot program's thin verbs into dense, validated motion.
 *
 * The shot program states what happens; this record supplies what only the host
 * knows: the rig and model of each staged node, the action synthesizer, the
 * delivery raster, builder-owned formations and clips, the previous beat's end
 * state, and any collision advice. `compileDefinedShot` forwards the
 * capabilities to `performShot`, the measurement inputs to
 * `realizeShotContract`, `previous` to `blockBeat`, `plants` to the closing
 * continuity snapshot, and `advice` to its own validation. Every optional
 * member, when omitted, disables only the check or measurement it feeds, as
 * stated on that member.
 */
export interface IAutoMovieEngineShotRuntime {
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
   */
  skeleton(node: string): IAutoMovieSkeleton | null;

  /**
   * Delivery raster in pixels, used to project required camera subjects at the
   * opening, review and closing times and to fit framing horizontally, and the
   * delivery clock moving camera paths are keyed at. Without `fps`, a shot
   * whose camera moves is refused; one whose cameras hold or whip compiles.
   */
  frameFormat: Pick<
    IAutoMovieProductionDesign["frameFormat"],
    "width" | "height"
  > &
    Partial<
      Pick<IAutoMovieProductionDesign["frameFormat"], "fps" | "frameRate">
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
   * Practical lights bound to staged prop emitters. Compiled from the final
   * object clips, using the corresponding prop model in models, and appended to
   * lightMotions. Omit when no practical source follows a prop.
   */
  practicalLights?: readonly IAutoMoviePracticalLightBinding[];

  /**
   * Font sources the shot's text layers may name, carried onto `shot.fonts`.
   * Omit when no surface graphic letters text.
   */
  fonts?: readonly IAutoMovieFontSource[];

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
   */
  hasActorContext?(node: string): boolean;

  /**
   * Clinical joint axes of a node's rig, keyed by humanoid bone, used by ground
   * IK and attachment baking; `undefined` for a node without them.
   */
  jointAxes?(
    node: string,
  ): Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> | undefined;

  /**
   * Clinical rest frames of a node's rig, keyed by humanoid bone, used by
   * ground IK and attachment baking; `undefined` for a node without them.
   */
  restFrames?(
    node: string,
  ): Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>> | undefined;

  /**
   * The world point of an action target at shot-local `seconds`, or `null` to
   * let the engine resolve it from the staged placements.
   */
  targetAt?(
    target: IAutoMovieActionTarget,
    seconds: number,
  ): IAutoMovieVector3 | null;

  /**
   * The gait names a node's actor context supplies, or `undefined` to skip the
   * check for that node.
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
   * Collision-response suggestions from shot code or a host analysis pass, with
   * the author's decisions; validated, then copied onto the compiled result and
   * never applied to motion.
   */
  advice?: readonly IAutoMovieShotPhysicsAdvice[];
}
