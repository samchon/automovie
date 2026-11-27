import type {
  IAutoMovieProjectPhysicalSupportReach,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";

/*
 * Bounded cyclic projection of a common root translation onto support-reach
 * balls. Each limb origin translates equally; support goals remain fixed. This
 * produces a kinematic seed, never teleports a simulated body. Convex
 * projection can exhaust its finite budget or meet incompatible balls; the
 * original residual remains observable and no goal is moved to hide it.
 */
export function projectPhysicalSupportReach(
  input: IAutoMovieProjectPhysicalSupportReach.IInput,
): IAutoMovieProjectPhysicalSupportReach.IResult {
  if (
    input.maximumTranslation < 0 ||
    input.iterations < 1 ||
    input.iterations > 64 ||
    input.tolerance < 0 ||
    input.supports.some(
      (support: (typeof input.supports)[number]): boolean =>
        support.radius <= 0,
    )
  )
    throw new Error("Invalid bounded support-reach projection");
  let translation: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (let iteration: number = 0; iteration < input.iterations; iteration++) {
    for (const support of input.supports) {
      const delta: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
        support.target,
        AutoMovieEngineVector3.add(support.origin, translation),
      );
      const distance: number = AutoMovieEngineVector3.length(delta);
      if (distance > support.radius)
        translation = AutoMovieEngineVector3.add(
          translation,
          AutoMovieEngineVector3.scale(delta, (distance - support.radius) / distance),
        );
      const length: number = AutoMovieEngineVector3.length(translation);
      if (length > input.maximumTranslation)
        translation = AutoMovieEngineVector3.scale(
          translation,
          input.maximumTranslation / length,
        );
    }
    if (excess() <= input.tolerance) break;
  }
  const maximumExcess: number = excess();
  return {
    translation,
    maximumExcess,
    converged: maximumExcess <= input.tolerance,
  };

  /*
   * Re-evaluate every original ball after the entire sweep.
   */
  function excess(): number {
    return Math.max(
      0,
      ...input.supports.map(
        (support: (typeof input.supports)[number]): number =>
          AutoMovieEngineVector3.length(
            AutoMovieEngineVector3.subtract(
              support.target,
              AutoMovieEngineVector3.add(support.origin, translation),
            ),
          ) - support.radius,
      ),
    );
  }
}
