import {
  HUMAN_BODY_SKIN_RELIEF_POSE,
  type IAutoMovieHumanBodyBasis,
  humanBodyReliefWeights,
} from "@automovie/human";
import type { IAutoMovieJointPose } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

const flexed = (flexion: number): IAutoMovieJointPose[] => [
  { bone: "leftLowerArm", flexion, abduction: null, twist: null },
];

/**
 * The skin's relief follows the pose: a bent joint deepens the creases on
 * the side it folds toward and flattens the wrinkles on the side it
 * stretches.
 *
 * An elbow runs from the origin down to (0, −1, 0) with the reference +Z,
 * so its flexion side is +Z. Four vertices: at the joint on the flexion
 * side, at the joint on the extension side, half a metre down the bone,
 * and beyond the joint's reach of the axis.
 *
 * Scenarios:
 * 1. At rest, or with the joint unposed, the relief stays as drawn (null).
 * 2. Halfway to full flexion the flexion side deepens by half the table's
 *    deepening and the extension side loses half the flattening; the far
 *    and out-of-reach vertices keep one.
 * 3. Past rest toward extension the sides swap; a range that ends at rest
 *    on that side leaves the joint as drawn.
 * 4. Full flexion flattens the extension side to zero, never below.
 */
export const test_human_body_relief_pose = (): void => {
  const joint = (min: number) =>
    ({
      bone: "leftLowerArm",
      head: "elbow",
      tail: "wrist",
      reference: [0, 0, 1],
      neutral: { flexion: 0, abduction: 0, twist: 0 },
      constraint: {
        flexion: { min, max: 100 },
        abduction: null,
        twist: null,
      },
    }) as unknown as IAutoMovieHumanBodyBasis["joints"][number];
  const table = {
    ...HUMAN_BODY_SKIN_RELIEF_POSE,
    joints: [{ bone: "LowerArm", sigmaMetres: 0.05, reachMetres: 0.1 }],
  };
  const weights = (min: number, pose: IAutoMovieJointPose[]) =>
    humanBodyReliefWeights({
      basis: { joints: [joint(min)] } as unknown as IAutoMovieHumanBodyBasis,
      table,
      positions: [0, 0, 0.03, 0, 0, -0.03, 0, -0.5, 0.03, 0, 0, 0.5],
      normals: [0, 0, 1, 0, 0, -1, 0, 0, 1, 0, 0, 1],
      landmarks: { elbow: { x: 0, y: 0, z: 0 }, wrist: { x: 0, y: -1, z: 0 } },
      pose,
    });
  TestValidator.equals(
    "at rest the relief stays as drawn",
    [weights(-20, flexed(0)), weights(-20, [])],
    [null, null],
  );
  const half = weights(-20, flexed(50))!;
  TestValidator.predicate(
    "half flexion deepens the fold and flattens the stretch",
    nclose(half[0]!, 1 + 0.5 * table.deepen, 1e-12) &&
      nclose(half[1]!, 1 - 0.5 * table.flatten, 1e-12) &&
      half[2] === 1 &&
      half[3] === 1,
  );
  const extended = weights(-20, flexed(-10))!;
  TestValidator.predicate(
    "extension swaps the sides",
    nclose(extended[0]!, 1 - 0.5 * table.flatten, 1e-12) &&
      nclose(extended[1]!, 1 + 0.5 * table.deepen, 1e-12),
  );
  TestValidator.equals(
    "a range ending at rest leaves the joint as drawn",
    weights(0, flexed(-10)),
    null,
  );
  TestValidator.predicate(
    "full flexion smooths the stretched side",
    weights(-20, flexed(140))![1] === 0,
  );
};
