import type { IAutoMovieClip } from "../core/IAutoMovieClip";
import type { IAutoMoviePropSpec } from "../harness/IAutoMoviePropSpec";
import type { IAutoMovieScene } from "../scene/IAutoMovieScene";

/**
 * Everything `gateAuthoredObjectMotions` checks one shot's authored object
 * clips against.
 *
 * `performShot` fills it after the performance and coupling compiled, so
 * `baked` holds every clip the engine produced for the shot and `performed`
 * every node a synthesized motion drives. The gate reads every field and keeps
 * none of them after it returns.
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
   * its profile, whose declared travel the driven channels are clamped against.
   * Omit for a shot that stages no forged prop.
   */
  props?: readonly IAutoMoviePropSpec[];

  /** The object clips the source authored, the subject of the gate. */
  clips: readonly IAutoMovieClip[];

  /**
   * The object clips the engine baked for this shot: launched flights,
   * `attachTo` follows and staged mounts. Their ids and the channels they drive
   * are already taken, so an authored clip may reuse neither.
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
