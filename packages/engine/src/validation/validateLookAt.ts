import {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieBone,
  IAutoMovieJointConstraint,
  IAutoMovieLookAt,
  IAutoMovieSkeleton,
} from "@automovie/interface";

import { getConstraint } from "../rom/getConstraint";
import { ViolationCollector } from "./ViolationCollector";
import { finiteMinimum } from "./finiteMinimum";

type AutoMovieLookAtRange =
  | "horizontalInner"
  | "horizontalOuter"
  | "verticalDown"
  | "verticalUp";

const RANGES: readonly AutoMovieLookAtRange[] = [
  "horizontalInner",
  "horizontalOuter",
  "verticalDown",
  "verticalUp",
];

const EYES: readonly AutoMovieHumanoidBone[] = ["leftEye", "rightEye"];

/**
 * Admit a model's gaze declaration against its skeleton.
 *
 * An `"expression"` gaze needs nothing. A `"bone"` gaze needs a skeleton that
 * declares `leftEye` and `rightEye`, and each range finite and at least `0`.
 * Each range must also fit both eyes' range of motion in its direction, read
 * from the bone's constraint or the default humanoid table: down is positive
 * flexion and up negative; toward the model's left is positive twist, which is
 * outward for the left eye and inward for the right. An axis the constraint
 * declares immobile (`null`) holds only `0`, and an eye with no constraint at
 * all bounds nothing. Every other `type` is refused.
 *
 * @param lookAt The model's gaze declaration.
 * @param skeleton The model's rig, or `null` for an unrigged model.
 * @param path Diagnostic path of `lookAt`.
 * @param collector Receives the violations.
 *
 * @evidence contracts/common.md#principled-implementation Compares each declared range with the eye joint's own range of motion on the axis and sign `resolveLookAt` writes, so an admitted gaze at full weight never leaves the rig's range; a null axis is immobile, as `validateJointRom` reads it.
 * @evidence contracts/common.md#clear-and-simple-design One leaf owns gaze admission and reuses `getConstraint` and `finiteMinimum`, so validateModel only calls it in its fixed order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reports every failing range rather than clamping it, and special-cases no rig; the per-eye direction map follows from the twist sign, not from a fixture.
 * @evidence contracts/common.md#meaningful-documentation States what each variant needs, the sign of each direction per eye, the immobile and unconstrained cases, and the refusal of unknown types.
 * @evidence contracts/performance.md#efficient-algorithms Two linear bone lookups, then a constant number of comparisons.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure admission step that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing beyond the violations appended to the caller's collector.
 */
export const validateLookAt: (
  lookAt: IAutoMovieLookAt,
  skeleton: IAutoMovieSkeleton | null,
  path: string,
  collector: ViolationCollector,
) => void = (
  lookAt: IAutoMovieLookAt,
  skeleton: IAutoMovieSkeleton | null,
  path: string,
  collector: ViolationCollector,
): void => {
  if (lookAt.type === "expression") return;
  if (lookAt.type !== "bone") {
    const unknown: { type: unknown } = lookAt as { type: unknown };
    collector.push(
      "type",
      `${path}.type`,
      `lookAt type must be "bone" or "expression", but was "${String(unknown.type)}"`,
      unknown.type,
    );
    return;
  }

  for (const range of RANGES)
    finiteMinimum(lookAt[range], 0, `${path}.${range}`, `${range}`, collector);

  for (const eye of EYES) {
    const bone: IAutoMovieBone | undefined = skeleton?.bones.find(
      (entry: IAutoMovieBone): boolean => entry.bone === eye,
    );
    if (bone === undefined) {
      collector.push(
        "type",
        `${path}.type`,
        `a "bone" lookAt turns the eye bones, but the model's skeleton declares no ${eye}`,
        lookAt.type,
      );
      continue;
    }
    const constraint: IAutoMovieJointConstraint | null = getConstraint(
      eye,
      bone.constraint,
    );
    if (constraint === null) continue;
    const left: boolean = eye === "leftEye";
    const limits: Record<AutoMovieLookAtRange, number> = {
      verticalDown: positiveReach(constraint.flexion),
      verticalUp: negativeReach(constraint.flexion),
      horizontalOuter: left
        ? positiveReach(constraint.twist)
        : negativeReach(constraint.twist),
      horizontalInner: left
        ? negativeReach(constraint.twist)
        : positiveReach(constraint.twist),
    };
    for (const range of RANGES)
      if (lookAt[range] > limits[range])
        collector.push(
          "range",
          `${path}.${range}`,
          `${range} turns ${eye} ${lookAt[range]} degrees, beyond the ${limits[range]} degrees its range of motion allows in that direction`,
          lookAt[range],
        );
  }
};

/** How far an axis may turn in its positive direction; `0` when immobile. */
const positiveReach: (range: IAutoMovieAngleRange | null) => number = (
  range: IAutoMovieAngleRange | null,
): number => Math.max(0, range?.max ?? 0);

/** How far an axis may turn in its negative direction; `0` when immobile. */
const negativeReach: (range: IAutoMovieAngleRange | null) => number = (
  range: IAutoMovieAngleRange | null,
): number => Math.max(0, -(range?.min ?? 0));
