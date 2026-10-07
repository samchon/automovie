import {
  type IAutoMovieJointAxes,
  Quaternion,
  decomposeJointRotation,
  jointToQuaternion,
} from "@automovie/engine";
import type { IAutoMovieJointConstraint } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, qclose } from "../internal/predicates";

/**
 * A quaternion's principal Euler chart need not belong to its joint domain.
 * Independent rotations about one declared axis fix the known clinical value;
 * the inverse must retain that orientation while respecting held axes and
 * exact interval endpoints, rather than clipping an equivalent chart.
 *
 * Scenarios:
 * 1. Distal flexion beyond 90 degrees is recovered in right- and left-handed bases.
 * 2. Proximal abduction beyond 90 degrees uses its order-specific second chart.
 * 3. A negative sign and nonzero clinical neutral retain their original conversion.
 * 4. A +180 endpoint and a positive full-turn alias remain admitted by their exact ranges.
 * 5. Omitted and null domains preserve the principal inverse; an impossible held-axis domain remains outside its range.
 */
export const test_kinematics_rotation_domain = (): void => {
  for (const handed of [1, -1]) {
    const axes: IAutoMovieJointAxes = {
      flexion: { x: 1, y: 0, z: 0 },
      abduction: { x: 0, y: 1, z: 0 },
      twist: { x: 0, y: 0, z: handed },
      twistPlacement: "distal",
    };
    const constraint: IAutoMovieJointConstraint = {
      flexion: { min: 0, max: 140 },
      abduction: null,
      twist: null,
    };
    const rotation = Quaternion.fromAxisAngle(axes.flexion, 125);
    const restored = decomposeJointRotation(rotation, axes, undefined, {
      bone: "leftLowerArm",
      constraint,
    });
    TestValidator.predicate(
      "distal hinge retains 125 degrees",
      nclose(restored.flexion, 125, 1e-10),
    );
    TestValidator.predicate(
      "held abduction remains zero",
      nclose(restored.abduction, 0, 0),
    );
    TestValidator.predicate(
      "held twist remains zero",
      nclose(restored.twist, 0, 0),
    );
    TestValidator.predicate(
      "distal orientation survives chart selection",
      qclose(jointToQuaternion(restored, axes), rotation, 1e-12),
    );

    const principal = decomposeJointRotation(rotation, axes);
    const unconstrained = decomposeJointRotation(rotation, axes, undefined, {
      bone: "leftLowerArm",
      constraint: null,
    });
    TestValidator.predicate(
      "principal distal flexion uses its 55 degree branch",
      nclose(principal.flexion, 55, 1e-10),
    );
    TestValidator.predicate(
      "null domain retains that principal branch",
      nclose(unconstrained.flexion, 55, 1e-10),
    );

    axes.twistPlacement = "proximal";
    const abducted = Quaternion.fromAxisAngle(axes.abduction, 125);
    const swing = decomposeJointRotation(abducted, axes, undefined, {
      bone: "leftUpperArm",
      constraint: {
        flexion: null,
        abduction: { min: 0, max: 140 },
        twist: null,
      },
    });
    TestValidator.predicate(
      "proximal swing retains 125 degrees",
      nclose(swing.abduction, 125, 1e-10),
    );
    TestValidator.predicate(
      "proximal held coordinates remain zero",
      nclose(swing.flexion, 0, 0) && nclose(swing.twist, 0, 0),
    );
    TestValidator.predicate(
      "proximal orientation survives chart selection",
      qclose(jointToQuaternion(swing, axes), abducted, 1e-12),
    );
  }

  const axes: IAutoMovieJointAxes = {
    flexion: { x: 1, y: 0, z: 0 },
    abduction: { x: 0, y: 1, z: 0 },
    twist: { x: 0, y: 0, z: 1 },
    twistPlacement: "distal",
  };
  const frame = { flexion: { sign: -1 as const, neutral: 20 } };
  const rotation = Quaternion.fromAxisAngle(axes.flexion, 125);
  const clinical = decomposeJointRotation(rotation, axes, frame, {
    bone: "leftLowerArm",
    constraint: {
      flexion: { min: -110, max: 20 },
      abduction: null,
      twist: null,
    },
  });
  TestValidator.predicate(
    "sign and neutral retain clinical -105 degrees",
    nclose(clinical.flexion, -105, 1e-10),
  );
  TestValidator.predicate(
    "clinical frame preserves orientation",
    qclose(jointToQuaternion(clinical, axes, frame), rotation, 1e-12),
  );

  for (const degrees of [180, -180]) {
    const endpoint = decomposeJointRotation(
      Quaternion.fromAxisAngle(axes.flexion, degrees),
      axes,
      undefined,
      {
        bone: "leftLowerArm",
        constraint: {
          flexion: { min: 180, max: 180 },
          abduction: null,
          twist: null,
        },
      },
    );
    TestValidator.predicate(
      "both quaternion endpoint signs retain legal +180",
      nclose(endpoint.flexion, 180, 0),
    );
  }
  const wrapped = decomposeJointRotation(
    Quaternion.fromAxisAngle(axes.flexion, 30),
    axes,
    undefined,
    {
      bone: "leftLowerArm",
      constraint: {
        flexion: { min: 370, max: 410 },
        abduction: null,
        twist: null,
      },
    },
  );
  TestValidator.predicate(
    "full-turn alias enters the declared interval",
    nclose(wrapped.flexion, 390, 1e-10),
  );
  const impossible = decomposeJointRotation(
    Quaternion.identity(),
    axes,
    undefined,
    {
      bone: "leftLowerArm",
      constraint: { flexion: { min: 5, max: 5 }, abduction: null, twist: null },
    },
  );
  TestValidator.predicate(
    "an unavailable chart is not clipped to five degrees",
    nclose(impossible.flexion, 0, 0),
  );
};
