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
 */
export function requireBuiltSpace(
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): IAutoMovieBuiltSpace {
  const space: IAutoMovieBuiltSpace | undefined = environment.spaces.find(
    (candidate: IAutoMovieBuiltSpace): boolean => candidate.id === spaceId,
  );
  if (space === undefined)
    throw new Error(
      `built environment "${environment.id}" has no logical space "${spaceId}"`,
    );
  return space;
}
