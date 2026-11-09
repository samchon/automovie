import type { IAutoMovieVector3 as V } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";

/**
 * Bounded cyclic projection of a common root translation onto support-reach
 * balls. Each limb origin translates equally; support goals remain fixed.
 * This produces a kinematic seed, never teleports a simulated body. Convex
 * projection can exhaust its finite budget or meet incompatible balls; the
 * original residual remains observable and no goal is moved to hide it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Bounded cyclic projection of a common root translation onto support-reach balls) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Bounded cyclic projection of a common root translation onto support-reach balls) directly over its typed inputs (`input`) as nested iteration of depth 2 (every over [value.x, value.y, value.z]; some over Array.from(input.supports); for loop bounded by iteration < input.iterations), delegating to `Array.isArray`, `Number.isFinite`, `Number.isSafeInteger`, `Array.from(input.supports).some`, `Array.from`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Beyond structural 0, 1 and 2 the body uses the literal 64, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 67 lines and 7 top-level statements that reuses `Array.isArray`, `Number.isFinite`, `Number.isSafeInteger`, `Array.from(input.supports).some`, `Array.from` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 64 are not independently sourced here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is nested iteration of depth 2 (every over [value.x, value.y, value.z]; some over Array.from(input.supports); for loop bounded by iteration < input.iterations), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
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
