import {
  IAutoMovieBeatEndFootPlant,
  IAutoMovieMotion,
  IAutoMovieScene,
  IAutoMovieShot,
} from "@automovie/interface";

import { IAutoMovieStagedSet } from "./IAutoMovieStagedSet";

/** Inputs shared by the beat-end and beat-opening snapshots. */
export interface IResolveBeatProps {
  /** Beat id the shot realizes. */
  beat: string;

  /** Staged scene the shot played over. */
  scene: IAutoMovieScene;

  /** Compiled shot for the beat. */
  shot: IAutoMovieShot;

  /** Motion clips referenced by scene nodes and shot performances. */
  motions: IAutoMovieMotion[];

  /**
   * Persistent mount couplings from staging (`IAutoMovieStagedSet.mounts`),
   * carried to each rider's end state so the next beat re-couples without
   * re-declaring. Omit when nothing is mounted.
   */
  mounts?: readonly IAutoMovieStagedSet.IMount[];

  /**
   * Ground-IK plant data per performed node (the `plants` of the engine's
   * plant-stance-feet pass), carried so the next beat keeps planted feet where
   * this beat left them. Omit when no pass ran.
   */
  plants?: ReadonlyArray<{
    /** Scene node the plants belong to. */
    node: string;
    /** The pass's pinned stance runs for that node. */
    plants: readonly IAutoMovieBeatEndFootPlant[];
  }>;
}
