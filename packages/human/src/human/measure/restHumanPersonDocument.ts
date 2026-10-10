import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";

/**
 * A copy of a person document in the standing measurement posture: body pose
 * and shoulder poses removed, expression neutral, everything else unchanged.
 */
export function restHumanPersonDocument(
  document: IAutoMovieHumanPersonDocument,
): IAutoMovieHumanPersonDocument {
  const rest = structuredClone(document);
  delete rest.body.pose;
  delete rest.body.shoulders;
  rest.face.expression = {};
  return rest;
}
