import {
  IAutoMovieClip,
  IAutoMoviePropSpec,
  IAutoMovieScene,
} from "@automovie/interface";

/** What one shot's authored object clips are checked against. */
export interface IAutoMovieObjectMotionGate {
  /** The staged scene, for the placements a clip may address. */
  scene: IAutoMovieScene;

  /** The shot's prop registry, whose articulation lowers the joint ids. */
  props?: readonly IAutoMoviePropSpec[];

  /** The clips the source authored. */
  clips: readonly IAutoMovieClip[];

  /**
   * The object clips the engine baked for this shot (launched flights,
   * `attachTo` follows, staged mounts). Their ids and the channels they drive
   * are already spoken for.
   */
  baked: readonly IAutoMovieClip[];

  /** Scene nodes a compiled performance drives through the rig. */
  performed: ReadonlySet<string>;

  /** Shot length in seconds; a key outside it is never played. */
  duration: number;

  /** Authoring path the violations are reported against. */
  path: string;
}
