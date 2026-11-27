import {
  IAutoMovieAngleRange,
  IAutoMovieFlexedAbduction,
  IAutoMovieJointConstraint,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { swingConeAngle } from "../../rom/swingConeAngle";

const CONSTRAINT_AXES: readonly ["flexion", "abduction", "twist"] = [
  "flexion",
  "abduction",
  "twist",
] as const;

/**
 * Check finite ordered degree intervals and whether the admitted
 * flexion/abduction box reaches the declared swing cone.
 */
export function validateJointConstraint(
  constraint: IAutoMovieJointConstraint,
  path: string,
  collector: IAutoMovieViolationCollector,
): void {
  for (const axis of CONSTRAINT_AXES) {
    const range: IAutoMovieAngleRange | null = constraint[axis];
    if (range !== null) validateAngleRange(range, `${path}.${axis}`, collector);
  }

  if (constraint.swingTwist !== undefined && constraint.swingTwist !== null) {
    validateAngleRange(
      constraint.swingTwist.twist,
      `${path}.swingTwist.twist`,
      collector,
    );
    // The swing is read from the flexion and abduction intervals, so a
    // swing-twist joint must have both.
    for (const axis of ["flexion", "abduction"] as const)
      if (constraint[axis] === null)
        collector.push(
          "range",
          `${path}.${axis}`,
          `a swing-twist joint reads its swing from its flexion and abduction ranges, so ${axis} must not be null`,
          null,
        );
  }

  // A flexed abduction ceiling rises from a moving abduction's own ceiling
  // at a positive flexion.
  if (
    constraint.abductionFlexed !== undefined &&
    constraint.abductionFlexed !== null
  ) {
    const flexed: IAutoMovieFlexedAbduction = constraint.abductionFlexed;
    if (
      constraint.abduction === null ||
      flexed.flexion <= 0 ||
      flexed.max < constraint.abduction.max
    )
      collector.push(
        "range",
        `${path}.abductionFlexed`,
        `a flexed abduction ceiling needs a moving abduction, a finite flexion above 0 and a ceiling at least the abduction's own max, but was flexion ${flexed.flexion}, max ${flexed.max}`,
        flexed.max,
      );
  }

  if (constraint.swingDeg !== undefined && constraint.swingDeg !== null) {
    const swingDeg: number = constraint.swingDeg;
    if (swingDeg <= 0)
      collector.push(
        "range",
        `${path}.swingDeg`,
        `swingDeg must be a finite number > 0, but was ${swingDeg}`,
        swingDeg,
      );
    else {
      const flexion: number[] | null = constraintSwingCandidates(
        constraint.flexion,
      );
      const abduction: number[] | null = constraintSwingCandidates(
        constraint.abduction,
      );
      if (flexion === null || abduction === null) return;
      let minimumSwing: number = Number.POSITIVE_INFINITY;
      for (const flex of flexion)
        for (const abduct of abduction)
          minimumSwing = Math.min(minimumSwing, swingConeAngle(flex, abduct));
      if (minimumSwing > swingDeg)
        collector.push(
          "range",
          `${path}.swingDeg`,
          `a swing-coned joint must admit at least one pose: the minimum swing within its flexion/abduction ranges is ${minimumSwing.toFixed(1)} degrees, past this ${swingDeg} degree cone, so no pose satisfies both the ranges and the cone`,
          swingDeg,
        );
    }
  }
}

/**
 * A continuous half-angle cosine reaches its extrema at endpoints or angles
 * congruent to 0/360 modulo 720 degrees; one representative of each interior
 * extremum suffices.
 *
 * The helper owns fixed feasibility candidates while swingConeAngle remains the
 * angular metric owner.
 *
 * Null means an immobile zero axis; invalid bounds return null without invented
 * angles, and very large degree arithmetic retains binary64 phase limitations.
 *
 * Degree input, immobile-axis meaning, endpoint inclusion and malformed refusal
 * are stated.
 *
 * Fixed ceil/comparison arithmetic produces at most four scalars, independent
 * of interval width or revolution count.
 *
 * Repeated periodic extrema need one representative each; endpoint-equal
 * extrema are not appended twice.
 *
 * Only a bounded candidate array transfers to the current validation call, with
 * no angle history or native joint retained.
 */
const constraintSwingCandidates: (
  range: IAutoMovieAngleRange | null,
) => number[] | null = (
  range: IAutoMovieAngleRange | null,
): number[] | null => {
  if (range === null) return [0];
  if (range.min > range.max) return null;
  const candidates: number[] =
    range.min === range.max ? [range.min] : [range.min, range.max];
  const fullTurn: number = Math.ceil(range.min / 720) * 720;
  const halfTurn: number = Math.ceil((range.min - 360) / 720) * 720 + 360;
  if (fullTurn > range.min && fullTurn < range.max) candidates.push(fullTurn);
  if (halfTurn > range.min && halfTurn < range.max) candidates.push(halfTurn);
  return candidates;
};

/**
 * Append finite-bound faults and a separate inverted-order fault for an axis
 * interval.
 *
 * Axis admission precedes cone feasibility and remains independent of angle
 * projection.
 *
 * Nonfinite bounds do not receive an invented finite replacement.
 *
 * Min/max paths and the inclusive finite ordered interval are explicit.
 *
 * Two finite tests and one ordering check take constant work.
 *
 * All three constraint axes share this exact admission rule.
 *
 * Only caller-owned fault rows remain; no angle table or pose cache is
 * retained.
 */
const validateAngleRange: (
  range: IAutoMovieAngleRange,
  path: string,
  collector: IAutoMovieViolationCollector,
) => void = (
  range: IAutoMovieAngleRange,
  path: string,
  collector: IAutoMovieViolationCollector,
): void => {
  if (range.min > range.max)
    collector.push(
      "range",
      path,
      `range min must be <= max, but was [${range.min}, ${range.max}]`,
      range,
    );
};
