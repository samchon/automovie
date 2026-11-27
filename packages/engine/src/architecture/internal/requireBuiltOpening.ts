import {
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
} from "@automovie/interface";

/*
 * The opening one id names, or a thrown `Error` naming both the environment and
 * the missing id.
 *
 * Every opening-addressed query refuses an undeclared id with this one message,
 * because an empty answer would read as a real opening with no operable panel.
 * The first opening declared under the id is returned; duplicate ids are a
 * contradiction `validateBuiltEnvironment` refuses, not one this lookup
 * re-decides.
 * Parameter environment: Building record holding the opening.
 * Parameter openingId: Id of the opening to resolve.
 * Returns: The environment's own opening record, not a copy.
 */
export function requireBuiltOpening(
  environment: IAutoMovieBuiltEnvironment,
  openingId: string,
): IAutoMovieBuiltOpening {
  const opening: IAutoMovieBuiltOpening | undefined = environment.openings.find(
    (candidate: IAutoMovieBuiltOpening): boolean => candidate.id === openingId,
  );
  if (opening === undefined)
    throw new Error(
      `built environment "${environment.id}" has no opening "${openingId}"`,
    );
  return opening;
}
