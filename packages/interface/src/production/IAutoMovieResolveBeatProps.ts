import type { IAutoMovieShot } from "../cinematics/IAutoMovieShot";
import type { IAutoMovieBeatEndFootPlant } from "../harness/IAutoMovieBeatEndFootPlant";
import type { IAutoMovieMotion } from "../motion/IAutoMovieMotion";
import type { IAutoMovieScene } from "../scene/IAutoMovieScene";
import type { IAutoMovieStagedSet } from "./IAutoMovieStagedSet";

/**
 * Inputs of the beat-opening and beat-end snapshots of one compiled shot.
 *
 * `resolveBeatOpening` samples every scene actor at shot-local time zero and
 * `resolveBeatEnd` at the shot's duration; `validateFilmContinuity` takes one
 * record per beat in playback order and compares each beat's opening with the
 * previous beat's end. `compileDefinedShot` builds the record from its staged
 * scene, performed shot and motions. Duplicate motion ids, performance nodes,
 * mount riders or plant nodes make the snapshot throw.
 */
export interface IAutoMovieResolveBeatProps {
  /** Beat id the shot realizes, stamped onto both snapshots. */
  beat: string;

  /** Staged scene the shot played over; every node gets a snapshot entry. */
  scene: IAutoMovieScene;

  /** Compiled shot for the beat; its duration is the end snapshot's instant. */
  shot: IAutoMovieShot;

  /** Motion clips referenced by scene nodes and shot performances; ids unique. */
  motions: IAutoMovieMotion[];

  /**
   * Persistent mount couplings from staging (`IAutoMovieStagedSet.ISuccess`
   * `mounts`), carried to each rider's snapshot so the next beat re-couples
   * without re-declaring. Omit when nothing is mounted.
   */
  mounts?: readonly IAutoMovieStagedSet.IMount[];

  /**
   * Ground-IK stance runs per performed node, from the plant-stance-feet pass,
   * so the next beat keeps planted feet where this beat left them. One entry
   * per node; omit when no pass ran.
   */
  plants?: ReadonlyArray<{
    /** Scene node the plants belong to. */
    node: string;

    /** The pass's pinned stance runs for that node. */
    plants: readonly IAutoMovieBeatEndFootPlant[];
  }>;
}
