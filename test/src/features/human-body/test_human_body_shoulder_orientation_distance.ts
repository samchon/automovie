import { humanBodyShoulderOrientationDistance } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/** SO(3) geodesic oracles, independent of the activation ramp. */
export const test_human_body_shoulder_orientation_distance = (): void => {
  const pose = (
    bone: "leftUpperArm" | "rightUpperArm",
    plane: number,
    elevation: number,
    axialRotation = 0,
  ) => ({ bone, plane, elevation, axialRotation });
  for (const bone of ["leftUpperArm", "rightUpperArm"] as const) {
    const forward = pose(bone, 90, 90);
    TestValidator.predicate(
      `${bone} identical orientation is zero distance`,
      nclose(humanBodyShoulderOrientationDistance(forward, forward), 0),
    );
    TestValidator.predicate(
      `${bone} pure axial thirty degrees measures thirty`,
      nclose(
        humanBodyShoulderOrientationDistance(forward, pose(bone, 90, 90, 30)),
        30,
      ),
    );
    TestValidator.predicate(
      `${bone} forward T versus frontal T is one hundred twenty degrees`,
      nclose(
        humanBodyShoulderOrientationDistance(forward, pose(bone, 0, 90)),
        120,
      ),
    );
    TestValidator.predicate(
      `${bone} zero-pole plane aliases preserve independent axial rotation`,
      nclose(
        humanBodyShoulderOrientationDistance(
          pose(bone, 0, 0, 30),
          pose(bone, 137, 0, 30),
        ),
        0,
      ) &&
        nclose(
          humanBodyShoulderOrientationDistance(
            pose(bone, 0, 0, 30),
            pose(bone, 137, 0, -30),
          ),
          60,
        ),
    );
    TestValidator.predicate(
      `${bone} 180-pole equivalent plane and axial pairs are zero distance`,
      nclose(
        humanBodyShoulderOrientationDistance(
          pose(bone, 0, 180, 30),
          pose(bone, 45, 180, -60),
        ),
        0,
      ),
    );
  }
  TestValidator.predicate(
    "one orientation distance cannot mix left and right shoulders",
    throwsError(() =>
      humanBodyShoulderOrientationDistance(
        pose("leftUpperArm", 0, 90),
        pose("rightUpperArm", 0, 90),
      ),
    ),
  );
};
