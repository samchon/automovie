import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";

/**
 * A bone's record in a body's rig, by name: the first record of that name,
 * the one a scan of `body.skeleton.bones` finds.
 *
 * A body's rig is a value read when the body is made, so the body indexes
 * its bones by name once (`IAutoMovieMotionHumanBody.bones`), in place of a
 * scan of the bone list at every lookup. The record returned is the rig's
 * own object, so a caller reads its current constraint, axes and rest.
 *
 * @param body The body.
 * @param bone The bone's name.
 * @returns The record, or undefined when the rig has no bone of that name.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is returned, which record a repeated name gives, who owns the index and the absent case.
 * @evidence contracts/development/implementation.md#principled-implementation The body's name-to-record map, filled in list order keeping the first record of a name, gives what `Array.prototype.find` gives for that name on the same list.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The record is the rig's own, never a copy or a default; an absent name is undefined, as a scan reports it.
 * @evidence contracts/development/implementation.md#efficient-algorithms One map read a lookup, in place of a scan of up to B records.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The index is the body's, built once with it and shared by every lookup.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the body owns its index.
 */
export function readHumanBone(
  body: IAutoMovieMotionHumanBody,
  bone: AutoMovieHumanoidBone,
): IAutoMovieBone | undefined {
  return body.bones.get(bone);
}
