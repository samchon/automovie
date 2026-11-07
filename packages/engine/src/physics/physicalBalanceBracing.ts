import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMoviePhysicalBalance as Balance } from "./AutoMoviePhysicalBalance";

/**
 * Capture-point feedback toward the actual support hull under an explicit
 * root-target travel bound. This requests a bounded motor target adjustment,
 * never an extra force or a pose write. A failed step alone cannot turn off
 * remaining effort: withdrawal additionally requires the declared measured
 * COM-height recovery limit. The provider owns that limit and its meaning.
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
