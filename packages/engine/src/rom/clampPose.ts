import type {
  IAutoMovieClampPose,
  IAutoMoviePose,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { clampJointToSkeleton } from "./clampJointToSkeleton";

/**
 * Return a new pose/joint array by applying effective skeleton ROM to each
 * joint. Root and unconstrained joint records remain borrowed; pose/skeleton
 * identity admission and unrestricted multi-turn cone correctness are separate
 * responsibilities.
 */
export function clampPose(
  pose: IAutoMoviePose,
  skeleton: IAutoMovieSkeleton,
): IAutoMoviePose {
  return clampPose.prepare(skeleton)(pose);
}

/**
 * Full-pose projection with metadata shared only within one unchanged rig
 * operation.
 */
export namespace clampPose {
  /**
   * Prepare the metadata of repeated full-pose clamps during one operation. The
   * skeleton and its records must stay unchanged until this function is
   * released; every pose's numerical projection still runs, including when a
   * caller intentionally clamps an earlier clamp's result again.
   *
   * The shared joint owner lazily indexes B bones and prepares D requested
   * names once. Each call still costs O(J) projections and creates a fresh
   * wrapper and joint array, borrowing its root and unconstrained records. The
   * caller releases the closure on completion or failure; no pose or projected
   * result is retained between calls.
   *
   * @param skeleton The unchanged rig used by every pose of this operation.
   * @returns A full-pose clamp borrowing only operation-scoped rig metadata,
   *   carrying its one-joint clamp (`IPrepared.joints`) and that clamp's
   *   angle-taking form (`IPrepared.values`) as its own members.
   */
  export function prepare(skeleton: IAutoMovieSkeleton): IPrepared {
    const clamp: clampJointToSkeleton.IPrepared =
      clampJointToSkeleton.prepare(skeleton);
    const project: (pose: IAutoMoviePose) => IAutoMoviePose = (
      pose: IAutoMoviePose,
    ): IAutoMoviePose => ({
      skeleton: pose.skeleton,
      root: pose.root,
      joints: pose.joints.map(clamp),
    });

    // The projection carries the joint clamp it maps and that clamp's
    // angle-taking form as its own members: a borrower that holds the
    // projection reads them, nothing is looked up.
    return Object.assign(project, { joints: clamp, values: clamp.values });
  }

  /**
   * The interface contract (`IAutoMovieClampPose.IPrepared`): the pose clamp
   * with its one-joint clamp (`joints`) and that clamp's angle-taking form
   * (`values`) as its own members.
   */
  export type IPrepared = IAutoMovieClampPose.IPrepared;
}
