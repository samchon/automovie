import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMoviePhysicalBalance as Balance } from "./AutoMoviePhysicalBalance";

/**
 * Capture-point feedback toward the actual support hull under an explicit
 * root-target travel bound. This requests a bounded motor target adjustment,
 * never an extra force or a pose write. A failed step alone cannot turn off
 * remaining effort: withdrawal additionally requires the declared measured
 * COM-height recovery limit. The provider owns that limit and its meaning.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Capture-point feedback toward the actual support hull under an explicit root-target travel bound) as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Capture-point feedback toward the actual support hull under an explicit root-target travel bound) directly over its typed inputs (`input`) as 2 sequential passes (every over [ input.minimumCenterHeight, ; for loop bounded by index < input.assessment.polygon.length), delegating to `Math.max`, `Math.min`, `Math.hypot`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 63 lines and 4 top-level statements that reuses `Math.max`, `Math.min`, `Math.hypot` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body contains 0 `any`, 0 type assertion(s), 2 non-null assertion(s); these are the remaining shortcuts and are not justified here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `input`; the dominant cost is 2 sequential passes (every over [ input.minimumCenterHeight, ; for loop bounded by index < input.assessment.polygon.length), performed once per call with 4 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function physicalBalanceBracing(input: {
  /** Actual balance prediction and contact hull. */ assessment: Balance.IResult;
  /** Actual world COM, metres. */ center: IAutoMovieVector3;
  /** World floor height, metres. */ floor: number;
  /** Positive COM height below which standing recovery is withdrawn. */ minimumCenterHeight: number;
  /** Maximum horizontal root-target adjustment, metres. */ maximumRootShift: number;
  /** Sustained loss/landing failure has exhausted the recovery time budget. */ exhausted: boolean;
}): { rootStrength: number; shift: IAutoMovieVector3 } {
  if (
    !(input.minimumCenterHeight > 0) ||
    !(input.maximumRootShift > 0) ||
    ![
      input.minimumCenterHeight,
      input.maximumRootShift,
      input.center.x,
      input.center.y,
      input.center.z,
      input.floor,
    ].every(Number.isFinite)
  )
    throw new Error("Invalid physical bracing policy");
  const shift: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  if (input.assessment.outside > 0 && input.assessment.polygon.length) {
    const capture: IAutoMovieVector3 = input.assessment.capturePoint;
    let distance: number = Infinity;
    for (
      let index: number = 0;
      index < input.assessment.polygon.length;
      index++
    ) {
      const a: IAutoMovieVector3 = input.assessment.polygon[index]!;
      const b: IAutoMovieVector3 =
        input.assessment.polygon[
          (index + 1) % input.assessment.polygon.length
        ]!;
      const dx: number = b.x - a.x;
      const dz: number = b.z - a.z;
      const denominator: number = dx * dx + dz * dz;
      const fraction: number =
        denominator === 0
          ? 0
          : Math.max(
              0,
              Math.min(
                1,
                ((capture.x - a.x) * dx + (capture.z - a.z) * dz) / denominator,
              ),
            );
      const x: number = a.x + dx * fraction - capture.x;
      const z: number = a.z + dz * fraction - capture.z;
      const length: number = Math.hypot(x, z);
      if (length >= distance) continue;
      distance = length;
      const scale: number = Math.min(
        1,
        input.maximumRootShift / Math.max(length, Number.MIN_VALUE),
      );
      shift.x = x * scale;
      shift.z = z * scale;
    }
  }
  return {
    rootStrength:
      input.exhausted &&
      input.center.y - input.floor < input.minimumCenterHeight
        ? 0
        : 1,
    shift,
  };
}
