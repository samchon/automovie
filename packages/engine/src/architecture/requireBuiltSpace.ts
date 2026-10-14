import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltSpace,
} from "@automovie/interface";

/**
 * The logical space one id names, or a thrown `Error` naming both the
 * environment and the missing id.
 *
 * Every space-addressed query refuses an undeclared id with this one message,
 * because an id that resolves to nothing is the caller's mistake and an empty
 * answer would read as a real room holding nothing. The first space declared
 * under the id is returned; duplicate ids are a contradiction
 * `validateBuiltEnvironment` refuses, not one this lookup re-decides.
 *
 * @evidence contracts/common.md#principled-implementation A first-match linear lookup over `environment.spaces`, so the answer for a validated record, where ids are unique, is the one space with that id, and an unvalidated duplicate resolves to its first declaration as `Array.prototype.find` defines.
 * @evidence contracts/common.md#clear-and-simple-design One lookup and one refusal shared by every space-addressed architecture query, so the message and the first-match rule live in one place instead of a private copy per query file.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no space, environment or caller; an undeclared id always throws rather than being answered with an empty result that a caller could not tell from a real empty room.
 * @evidence contracts/common.md#meaningful-documentation States that the result is the space record itself, the exact refusal and what its message names, and the first-match reading of a duplicate id that validation refuses.
 * @evidence contracts/performance.md#efficient-algorithms Time is linear in the declared space count and space is constant; one lookup per query call does not justify building an id index the caller would discard.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A single synchronous lookup that coordinates nothing across calls; a caller resolving many ids over one record owns any index it wants to keep.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the returned space is the caller's own record object, not a copy this function holds.
 */
export const requireBuiltSpace: (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
) => IAutoMovieBuiltSpace = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): IAutoMovieBuiltSpace => {
  const space: IAutoMovieBuiltSpace | undefined = environment.spaces.find(
    (candidate: IAutoMovieBuiltSpace): boolean => candidate.id === spaceId,
  );
  if (space === undefined)
    throw new Error(
      `built environment "${environment.id}" has no logical space "${spaceId}"`,
    );
  return space;
};
