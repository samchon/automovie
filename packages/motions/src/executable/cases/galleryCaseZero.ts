import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
  IAutoMovieSkeleton,
} from "@automovie/interface";

/**
 * Every rig bone at clinical zero, with some bones' angles set: a pose of the
 * body's skeleton with no root, each bone's flexion, abduction and twist taken
 * from `set` or zero.
 *
 * @param body The body: its skeleton's id and bones.
 * @param set Flexion, abduction and twist of the bones to turn, degrees.
 * @returns The pose.
 */
export function galleryCaseZero(
  body: galleryCaseZero.IBody,
  set: Partial<Record<AutoMovieHumanoidBone, [number, number, number]>>,
): IAutoMoviePose {
  return {
    skeleton: body.skeleton.id,
    root: null,
    joints: body.skeleton.bones.map(
      (b: Pick<IAutoMovieBone, "bone">): IAutoMovieJointPose => {
        const a: [number, number, number] = set[b.bone] ?? [0, 0, 0];
        return { bone: b.bone, flexion: a[0], abduction: a[1], twist: a[2] };
      },
    ),
  };
}

/** What a zero pose reads of the body. */
export namespace galleryCaseZero {
  /** The body's skeleton: its id and its bones' names. */
  export interface IBody {
    /** The skeleton. */
    skeleton: Pick<IAutoMovieSkeleton, "id"> & {
      /** Its bones, each by name. */
      bones: readonly Pick<IAutoMovieBone, "bone">[];
    };
  }
}
