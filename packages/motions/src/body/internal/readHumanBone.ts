import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";

/*
 * A bone's record in a body's rig, by name: the first record of that name, the
 * one a scan of `body.skeleton.bones` finds.
 *
 * A body's rig is a value read when the body is made, so the body indexes its
 * bones by name once (`IAutoMovieMotionHumanBody.bones`), in place of a scan of
 * the bone list at every lookup. The record returned is the rig's own object,
 * so a caller reads its current constraint, axes and rest.
 * Parameter body: The body's index of its bones.
 * Parameter bone: The bone's name.
 * Returns: The record, or undefined when the rig has no bone of that name.
 */
export function readHumanBone(
  body: Pick<IAutoMovieMotionHumanBody, "bones">,
  bone: AutoMovieHumanoidBone,
): IAutoMovieBone | undefined {
  return body.bones.get(bone);
}
