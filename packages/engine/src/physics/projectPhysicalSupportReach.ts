import type { IAutoMovieVector3 as V } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/**
 * Bounded cyclic projection of a common root translation onto support-reach
 * balls. Each limb origin translates equally; support goals remain fixed.
 * This produces a kinematic seed, never teleports a simulated body. Convex
 * projection can exhaust its finite budget or meet incompatible balls; the
 * original residual remains observable and no goal is moved to hide it.
 */
export function projectPhysicalSupportReach(input: {
  /** Current limb origins, independent goals and positive maximum reach, metres. */ supports: readonly {
    /** Current world joint. */ origin: V;
    /** Fixed world endpoint. */ target: V;
    /** Maximum straight reach, metres. */ radius: number;
  }[];
  /** Nonnegative common root travel cap, metres. */ maximumTranslation: number;
  /** Projection sweeps, integer 1..64. */ iterations: number;
  /** Nonnegative residual allowance, metres. */ tolerance: number;
}): { translation: V; maximumExcess: number; converged: boolean } {
  const finite: (value: V) => boolean = (value: V): boolean =>
    !!value && [value.x, value.y, value.z].every(Number.isFinite);
  if (
    !Array.isArray(input.supports) ||
    !Number.isFinite(input.maximumTranslation) ||
    input.maximumTranslation < 0 ||
    !Number.isSafeInteger(input.iterations) ||
    input.iterations < 1 ||
    input.iterations > 64 ||
    !Number.isFinite(input.tolerance) ||
    input.tolerance < 0 ||
    Array.from(input.supports).some(
      (support: (typeof input.supports)[number]): boolean =>
        !support ||
        !finite(support.origin) ||
        !finite(support.target) ||
        !Number.isFinite(support.radius) ||
        support.radius <= 0,
    )
  )
    throw new Error("Invalid bounded support-reach projection");
  let translation: V = { x: 0, y: 0, z: 0 };
  for (let iteration: number = 0; iteration < input.iterations; iteration++) {
    for (const support of input.supports) {
      const delta: V = Vector3.subtract(
        support.target,
        Vector3.add(support.origin, translation),
      );
      const distance: number = Vector3.length(delta);
      if (distance > support.radius)
        translation = Vector3.add(
          translation,
          Vector3.scale(delta, (distance - support.radius) / distance),
        );
      const length: number = Vector3.length(translation);
      if (length > input.maximumTranslation)
        translation = Vector3.scale(
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

  /** Re-evaluate every original ball after the entire sweep. */
  function excess(): number {
    return Math.max(
      0,
      ...input.supports.map(
        (support: (typeof input.supports)[number]): number =>
          Vector3.length(
            Vector3.subtract(
              support.target,
              Vector3.add(support.origin, translation),
            ),
          ) - support.radius,
      ),
    );
  }
}
