import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";

/**
 * A copy of a person document in the standing measurement posture: body pose
 * and shoulder poses removed, expression neutral, everything else unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Person measurements are taken in one posture, so it is stated once.
 * @evidence contracts/common.md#clear-and-simple-design A copy with three fields cleared.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The caller's document is never mutated.
 * @evidence contracts/common.md#meaningful-documentation States what is cleared and what is kept.
 * @evidence contracts/anatomy.md#anatomical-source The posture is the standing posture the cited measurement protocols state.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Shape channels are kept unchanged.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The function carries no value with a unit or frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
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
