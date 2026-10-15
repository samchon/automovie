import { validatePoseResult } from "@automovie/engine";
import {
  IAutoMovieConstraintViolation,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieValidation,
} from "@automovie/interface";
import typia, { IValidation } from "typia";

import { IAutoMovieHumanPose } from "../structures/IAutoMovieHumanPose";
import { convertAutoMovieHumanPose } from "./convertAutoMovieHumanPose";

/**
 * Admit a pose for one person: its static type and bounds, each bone at most once, and every angle within the range of motion of that person's skeleton.
 *
 * The range check is the engine's pose validation on the emitted skeleton, the same check a film runs, so a pose Human admits is one a film admits. Each bone's constraint is the one Human declared for this person, or the engine's default humanoid range where Human declared none. Findings keep the engine's `$input.joints[i]` paths, which address the same entries of the Human pose. The input is never mutated; on success the result holds a private copy.
 *
 * @param input Candidate pose, of any shape
 * @param skeleton The person's emitted skeleton
 * @returns The admitted copy, or every finding with the original input
 */
export function validateAutoMovieHumanPose(
  input: unknown,
  skeleton: IAutoMovieSkeleton,
): IValidation<IAutoMovieHumanPose> {
  const typed: IValidation<IAutoMovieHumanPose> =
    typia.validateEquals<IAutoMovieHumanPose>(input);
  if (typed.success === false) return typed;
  const pose: IAutoMovieHumanPose = structuredClone(typed.data);

  const errors: IValidation.IError[] = [];
  const seen: Set<string> = new Set();
  pose.joints.forEach((joint: IAutoMovieHumanPose.IJoint, i: number): void => {
    if (seen.has(joint.bone))
      errors.push({
        path: `$input.joints[${i}].bone`,
        value: joint.bone,
        expected: "a bone not listed before",
        description: "one joint has one rotation at an instant",
      });
    seen.add(joint.bone);
  });
  if (errors.length !== 0) return { success: false, data: input, errors };

  const engine: IAutoMoviePose = convertAutoMovieHumanPose(pose, skeleton.id);
  const result: IAutoMovieValidation = validatePoseResult(engine, skeleton);
  if (result.success === true) return { success: true, data: pose };
  return {
    success: false,
    data: input,
    errors: result.violations
      .filter(
        (violation: IAutoMovieConstraintViolation): boolean =>
          violation.severity === "error",
      )
      .map(
        (violation: IAutoMovieConstraintViolation): IValidation.IError => ({
          path: violation.path,
          value: violation.value,
          expected: violation.expected,
          description: `the engine's ${violation.kind} check on this person's skeleton`,
        }),
      ),
  };
}
