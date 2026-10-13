import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
} from "@automovie/interface";

/**
 * The opening one id names, or a thrown `Error` naming both the environment
 * and the missing id.
 *
 * Every opening-addressed query refuses an undeclared id with this one
 * message, because an empty answer would read as a real opening with no
 * operable panel. The first opening declared under the id is returned;
 * duplicate ids are a contradiction `validateBuiltEnvironment` refuses, not
 * one this lookup re-decides.
 *
 * @param environment Building record holding the opening.
 * @param openingId Id of the opening to resolve.
 * @returns The environment's own opening record, not a copy.
 *
 * @evidence contracts/common.md#principled-implementation A first-match linear lookup over `environment.openings`, so on a validated record, where ids are unique, the answer is the one opening with that id, and an unvalidated duplicate resolves to its first declaration as `Array.prototype.find` defines.
 * @evidence contracts/common.md#clear-and-simple-design One lookup and one refusal shared by the panel-placement and swept-envelope queries, which each kept a private copy of the same message.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no opening or environment; an undeclared id always throws rather than answering an empty panel list a caller could not tell from an opening without an operation.
 * @evidence contracts/common.md#meaningful-documentation States that the result is the record itself, the exact refusal and what its message names, and the first-match reading of a duplicate id that validation refuses.
 * @evidence contracts/performance.md#efficient-algorithms Time is linear in the declared opening count with constant space; one lookup per query call does not justify building an id index the caller would discard.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A single synchronous lookup that coordinates nothing across calls; a caller resolving many ids over one record owns any index it keeps.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the returned opening is the caller's own record object.
 */
export const requireBuiltOpening = (
  environment: IAutoMovieBuiltEnvironment,
  openingId: string,
): IAutoMovieBuiltOpening => {
  const opening: IAutoMovieBuiltOpening | undefined = environment.openings.find(
    (candidate: IAutoMovieBuiltOpening): boolean => candidate.id === openingId,
  );
  if (opening === undefined)
    throw new Error(
      `built environment "${environment.id}" has no opening "${openingId}"`,
    );
  return opening;
};
