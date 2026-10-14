import {
  IAutoMovieAngleRange,
  IAutoMovieJointConstraint,
} from "@automovie/interface";

import { swingConeAngle } from "../rom/swingConeAngle";
import { ViolationCollector } from "./ViolationCollector";

const CONSTRAINT_AXES: readonly ["flexion", "abduction", "twist"] = ["flexion", "abduction", "twist"] as const;

/**
 * Check finite ordered degree intervals and whether the admitted flexion/abduction box reaches the declared swing cone.
 *
 * @evidence contracts/common.md#principled-implementation Admit finite ordered degree intervals, then minimize the shared swing metric over interval endpoints and the half-angle cosine's periodic extrema; independent cosine ranges make these fixed candidates sufficient under representable trigonometric arithmetic.
 * @evidence contracts/common.md#clear-and-simple-design Axis admission and cone feasibility are separate from pose sampling and per-pose ROM checking.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Periodic multi-turn intervals are not treated as monotone distance from zero; malformed axis intervals skip cone verdicts, and extremely large-angle binary64 phase reduction remains a limitation of the shared metric.
 * @evidence contracts/common.md#meaningful-documentation Null axis means immobile zero, while optional/null swing omits the coupled constraint.
 * @evidence contracts/performance.md#efficient-algorithms Three interval checks and at most four candidates per swung axis require at most sixteen metric evaluations, with bounded arrays and no angle sampling grid.
 * @evidence contracts/performance.md#reuse-equivalent-work The swing formula remains shared with ROM consumers rather than a separate anatomical table.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only collector rows remain; no joint simulation, pose history or native handle is retained.
 */
export const validateJointConstraint: (constraint: IAutoMovieJointConstraint, path: string, collector: ViolationCollector) => void = (
  constraint: IAutoMovieJointConstraint,
  path: string,
  collector: ViolationCollector,
): void => {
  for (const axis of CONSTRAINT_AXES) {
    const range: IAutoMovieAngleRange | null = constraint[axis];
    if (range !== null) validateAngleRange(range, `${path}.${axis}`, collector);
  }

  if (constraint.swingDeg !== undefined && constraint.swingDeg !== null) {
    const swingDeg: number = constraint.swingDeg;
    if (!Number.isFinite(swingDeg) || swingDeg <= 0)
      collector.push(
        "range",
        `${path}.swingDeg`,
        `swingDeg must be a finite number > 0, but was ${swingDeg}`,
        swingDeg,
      );
    else {
      const flexion: number[] | null = constraintSwingCandidates(constraint.flexion);
      const abduction: number[] | null = constraintSwingCandidates(constraint.abduction);
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
};

/**
 * A continuous half-angle cosine reaches its extrema at endpoints or angles congruent to 0/360 modulo 720 degrees; one representative of each interior extremum suffices.
 *
 * The helper owns fixed feasibility candidates while swingConeAngle remains the angular metric owner.
 *
 * Null means an immobile zero axis; invalid bounds return null without invented angles, and very large degree arithmetic retains binary64 phase limitations.
 *
 * Degree input, immobile-axis meaning, endpoint inclusion and malformed refusal are stated.
 *
 * Fixed ceil/comparison arithmetic produces at most four scalars, independent of interval width or revolution count.
 *
 * Repeated periodic extrema need one representative each; endpoint-equal extrema are not appended twice.
 *
 * Only a bounded candidate array transfers to the current validation call, with no angle history or native joint retained.
 */
const constraintSwingCandidates: (range: IAutoMovieAngleRange | null) => number[] | null = (
  range: IAutoMovieAngleRange | null,
): number[] | null => {
  if (range === null) return [0];
  if (!Number.isFinite(range.min) || !Number.isFinite(range.max) || range.min > range.max)
    return null;
  const candidates: number[] = range.min === range.max ? [range.min] : [range.min, range.max];
  const fullTurn: number = Math.ceil(range.min / 720) * 720;
  const halfTurn: number = Math.ceil((range.min - 360) / 720) * 720 + 360;
  if (fullTurn > range.min && fullTurn < range.max) candidates.push(fullTurn);
  if (halfTurn > range.min && halfTurn < range.max) candidates.push(halfTurn);
  return candidates;
};

/**
 * Append finite-bound faults and a separate inverted-order fault for an axis interval.
 *
 * Axis admission precedes cone feasibility and remains independent of angle projection.
 *
 * Nonfinite bounds do not receive an invented finite replacement.
 *
 * min/max paths and the inclusive finite ordered interval are explicit.
 *
 * Two finite tests and one ordering check take constant work.
 *
 * All three constraint axes share this exact admission rule.
 *
 * Only caller-owned fault rows remain; no angle table or pose cache is retained.
 */
const validateAngleRange: (range: IAutoMovieAngleRange, path: string, collector: ViolationCollector) => void = (
  range: IAutoMovieAngleRange,
  path: string,
  collector: ViolationCollector,
): void => {
  const fields: ReadonlyArray<readonly [string, number]> = [
    ["min", range.min],
    ["max", range.max],
  ];
  for (const [field, value] of fields)
    if (!Number.isFinite(value))
      collector.push(
        "range",
        `${path}.${field}`,
        `${field} must be finite, but was ${value}`,
        value,
      );

  if (
    Number.isFinite(range.min) &&
    Number.isFinite(range.max) &&
    range.min > range.max
  )
    collector.push(
      "range",
      path,
      `range min must be <= max, but was [${range.min}, ${range.max}]`,
      range,
    );
};
