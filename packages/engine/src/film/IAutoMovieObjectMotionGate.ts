import {
  IAutoMovieClip,
  IAutoMoviePropSpec,
  IAutoMovieScene,
} from "@automovie/interface";

/**
 * Everything `gateAuthoredObjectMotions` checks one shot's authored object
 * clips against.
 *
 * `performShot` fills it after the performance and coupling compiled, so
 * `baked` holds every clip the engine produced for the shot and `performed`
 * every node a synthesized motion drives. The gate reads every field and keeps
 * none of them after it returns.
 *
 * @evidence contracts/common.md#principled-implementation Names the four facts an authored clip is judged by, which nodes and joints exist, which a rig already drives, which channels and clip ids a baked clip already owns, and the shot clock, so each refusal is a membership test against data the caller already computed rather than a second derivation of it.
 * @evidence contracts/common.md#clear-and-simple-design One input record instead of seven positional parameters, because the gate is called from one place and every field is required context for the same decision; `path` keeps violation paths rooted where the author wrote the clips.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No node, prop or channel is special-cased by name: drivable nodes are the staged placements minus `performed` plus the lowered joints of forged props, and a prop spec the forge refuses contributes no joints rather than being partially trusted.
 * @evidence contracts/common.md#meaningful-documentation States the consumer and producer, when the producer fills it, for each field what it contributes to the gate, the seconds unit of `duration`, and that nothing is retained.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An input record with no runtime body; the gate's lowering, key checks and constraint sweep are answered on `gateAuthoredObjectMotions`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built once per shot by `performShot` for a single gate call; nothing shares it across shots.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources References the caller's scene, registry, clip arrays and node set without copying; the gate holds them only for the duration of its call.
 * @author Samchon
 */
export interface IAutoMovieObjectMotionGate {
  /**
   * The staged scene: its nodes, cameras and lights are the ids a clip may
   * address, and its node placements decide which forged props are lowered.
   */
  scene: IAutoMovieScene;

  /**
   * The shot's prop registry. Each spec `forgeProp` accepts lowers its
   * articulation joints to `<placement>/<joint>` ids a clip may drive and binds
   * its profile, whose declared travel the driven channels are clamped
   * against. Omit for a shot that stages no forged prop.
   */
  props?: readonly IAutoMoviePropSpec[];

  /** The object clips the source authored, the subject of the gate. */
  clips: readonly IAutoMovieClip[];

  /**
   * The object clips the engine baked for this shot: launched flights,
   * `attachTo` follows and staged mounts. Their ids and the channels they
   * drive are already taken, so an authored clip may reuse neither.
   */
  baked: readonly IAutoMovieClip[];

  /**
   * Scene node ids a compiled performance drives through the rig; an authored
   * transform clip on any of them is refused.
   */
  performed: ReadonlySet<string>;

  /** Shot length in seconds; every key time must lie in `[0, duration]`. */
  duration: number;

  /**
   * Authoring path of the clip array; violations are reported at
   * `${path}[i]...`.
   */
  path: string;
}
