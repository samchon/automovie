import {
  type IAutoMovieHumanBodyShoulderPose,
  evaluateHumanBodyLandmarks,
  resolveHumanBodyShapedShoulderRest,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyShoulderFixture } from "../internal/humanBodyShoulderFixture";
import { nclose, throwsError } from "../internal/predicates";

const degrees = (radians: number): number => (radians * 180) / Math.PI;

/**
 * The shaped rest of each upper arm is the tilt of the arm the shaped
 * landmarks give, read from the direction of its head-to-tail line.
 *
 * Every expectation is the closed-form angle of a hand-typed landmark offset:
 * the tilt from hanging is acos of the downward component of the unit
 * direction, the plane is the angle from lateral toward the front.
 *
 * Scenarios:
 * 1. The declared A-pose landmarks (0.2 out, 0.2 down) read 45 degrees in
 *    plane 0 on both sides, with zero axial rotation, and only the two upper
 *    arms have an entry.
 * 2. Lifting the left elbow by 0.1 m reads atan(2) on the left alone, so the
 *    one-sided shape leaves the right arm at the A-pose.
 * 3. Moving the left elbow 0.2 m forward reads plane 45 and acos(1/sqrt 3).
 * 4. A basis whose shoulder contract sits on another bone is refused instead
 *    of being read as an arm.
 */
export const test_human_body_shaped_shoulder_rest = (): void => {
  const { basis } = humanBodyShoulderFixture();
  const landmarks = evaluateHumanBodyLandmarks(basis, {
    weights: new Map(),
    activations: [],
  });
  const read = (
    edit: (marks: typeof landmarks) => void,
  ): ReadonlyMap<
    IAutoMovieHumanBodyShoulderPose["bone"],
    IAutoMovieHumanBodyShoulderPose
  > => {
    const marks = structuredClone(landmarks);
    edit(marks);
    return resolveHumanBodyShapedShoulderRest(basis, marks);
  };
  const near = (
    pose: IAutoMovieHumanBodyShoulderPose | undefined,
    plane: number,
    elevation: number,
  ): boolean =>
    pose !== undefined &&
    nclose(pose.plane, plane, 1e-9) &&
    nclose(pose.elevation, elevation, 1e-9) &&
    pose.axialRotation === 0;

  const declared = read(() => {});
  TestValidator.equals("only the upper arms have a rest", [...declared.keys()], [
    "leftUpperArm",
    "rightUpperArm",
  ]);
  TestValidator.predicate(
    "the declared A-pose reads 45 degrees on both sides",
    near(declared.get("leftUpperArm"), 0, 45) &&
      near(declared.get("rightUpperArm"), 0, 45),
  );
  const lifted = read((marks) => {
    marks["left-elbow"].y += 0.1;
  });
  TestValidator.predicate(
    "a lifted left elbow tilts the left arm alone",
    near(lifted.get("leftUpperArm"), 0, degrees(Math.atan(2))) &&
      near(lifted.get("rightUpperArm"), 0, 45),
  );
  const forward = read((marks) => {
    marks["left-elbow"].z += 0.2;
  });
  TestValidator.predicate(
    "a forward elbow reads its plane and tilt",
    near(forward.get("leftUpperArm"), 45, degrees(Math.acos(1 / Math.sqrt(3)))),
  );
  const unnamed = structuredClone(basis);
  unnamed.joints.find((joint) => joint.bone === "leftLowerArm")!.shoulder =
    unnamed.joints.find((joint) => joint.bone === "leftUpperArm")!.shoulder;
  TestValidator.predicate(
    "a shoulder contract on another bone is refused",
    throwsError(
      () => resolveHumanBodyShapedShoulderRest(unnamed, landmarks),
      "named upper arm",
    ),
  );
};
