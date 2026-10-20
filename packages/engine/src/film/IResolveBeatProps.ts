import {
  IAutoMovieBeatEndFootPlant,
  IAutoMovieMotion,
  IAutoMovieScene,
  IAutoMovieShot,
} from "@automovie/interface";

import { IAutoMovieStagedSet } from "./IAutoMovieStagedSet";

/**
 * Inputs of the beat-opening and beat-end snapshots of one compiled shot.
 *
 * `resolveBeatOpening` samples every scene actor at shot-local time zero and
 * `resolveBeatEnd` at the shot's duration; `validateFilmContinuity` takes one
 * record per beat in playback order and compares each beat's opening with the
 * previous beat's end. `compileDefinedShot` builds the record from its staged
 * scene, performed shot and motions. Duplicate motion ids, performance nodes,
 * mount riders or plant nodes make the snapshot throw.
 *
 * @evidence contracts/common.md#principled-implementation The shared `resolveBeatSnapshot` indexes motions by id and performances, mounts and plants by node in maps, refusing a duplicate key with a thrown error that names its position, so every actor resolves against exactly one source instead of the first or last match.
 * @evidence contracts/common.md#clear-and-simple-design One record shared by both snapshots and the film linter, because all three read the same compiled facts and differ only in the instant they sample; the optional members carry the forward state that a later beat resumes from.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing mounts or plants mean none rather than a guessed coupling or stance, and nothing in the record is recomputed or repaired by the snapshot functions.
 * @evidence contracts/common.md#meaningful-documentation States the two snapshot readers and their instants, the linter's use and order, the builder, the duplicate-key failure, and for each member its source and what omitting it means.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An input record with no runtime body; the snapshot cost is answered on `resolveBeatSnapshot`, which both entry points call.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Built once per compiled shot and handed to both snapshots, which each index it independently through `resolveBeatSnapshot`; nothing caches a snapshot.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources References scene, shot, motions, mounts and plants without copying. Snapshot indexes and sampled-channel maps live for one call; returned states shallow-copy non-null poses with root cleared, borrow joints, selected plants and mounts, and own or borrow transforms according to the sampled branch.
 */
export interface IResolveBeatProps {
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
