import { IAutoMovieHumanIdentity } from "../structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanMeasurements } from "./IAutoMovieHumanMeasurements";

/**
 * Resolve an identity into the measurements modeling reads.
 *
 * Every derived quantity is a definition, not a regression: head breadth from head length and cephalic index, trochanterion height from the three stacked leg lengths. The identity is copied, so later changes to the caller's object never reach a built person. The function does not admit the identity; callers resolve only what `validateAutoMovieHumanIdentity` has admitted, or what it is about to check.
 *
 * @param identity Identity whose static bounds hold
 * @returns Measurements holding a private copy of the identity
 */
export function resolveAutoMovieHumanMeasurements(
  identity: IAutoMovieHumanIdentity,
): IAutoMovieHumanMeasurements {
  const copy: IAutoMovieHumanIdentity = structuredClone(identity);
  const sum: (leg: IAutoMovieHumanIdentity.ILeg) => number = (
    leg: IAutoMovieHumanIdentity.ILeg,
  ): number => leg.thighLength + leg.shankLength + leg.ankleHeight;
  return {
    identity: copy,
    headBreadth: (copy.head.headLength * copy.head.cephalicIndex) / 100,
    leftTrochanterionHeight: sum(copy.body.leftLeg),
    rightTrochanterionHeight: sum(copy.body.rightLeg),
  };
}
