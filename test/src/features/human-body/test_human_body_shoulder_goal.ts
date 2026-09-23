import {
  type IAutoMovieHumanBodyBuild,
  createHumanBodyBasisBuilder,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyShoulderFixture } from "../internal/humanBodyShoulderFixture";
import { qclose, throwsError, vclose } from "../internal/predicates";

const arm = (built: IAutoMovieHumanBodyBuild, side: "left" | "right") => {
  const bone = built.bones.find((one) => one.bone === `${side}UpperArm`)!;
  const elbow = built.bones.find((one) => one.bone === `${side}LowerArm`)!;
  const length = Math.hypot(
    elbow.rest.position.x - bone.rest.position.x,
    elbow.rest.position.y - bone.rest.position.y,
    elbow.rest.position.z - bone.rest.position.z,
  );
  return {
    head: bone.posed.position,
    rotation: bone.posed.rotation,
    direction: {
      x: (elbow.posed.position.x - bone.posed.position.x) / length,
      y: (elbow.posed.position.y - bone.posed.position.y) / length,
      z: (elbow.posed.position.z - bone.posed.position.z) / length,
    },
  };
};

/** Measured arm direction and attachment oracles from an analytic A-pose. */
export const test_human_body_shoulder_goal = (): void => {
  const plain = humanBodyShoulderFixture();
  const build = createHumanBodyBasisBuilder(plain.basis);
  const baseline = build(plain.document);
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    const bone = `${side}UpperArm` as "leftUpperArm" | "rightUpperArm";
    const pose = (plane: number, elevation: number, axialRotation = 0) =>
      build({
        ...plain.document,
        shoulders: [{ bone, plane, elevation, axialRotation }],
      });
    TestValidator.predicate(
      `${side} omitted goal reproduces measured A-pose`,
      vclose(arm(baseline, side).direction, {
        x: sign * Math.SQRT1_2,
        y: -Math.SQRT1_2,
        z: 0,
      }),
    );
    for (const [title, plane, elevation, expected] of [
      ["hanging", 0, 0, { x: 0, y: -1, z: 0 }],
      ["frontal T", 0, 90, { x: sign, y: 0, z: 0 }],
      ["forward", 90, 90, { x: 0, y: 0, z: 1 }],
      ["mixed", 45, 90, { x: sign * Math.SQRT1_2, y: 0, z: Math.SQRT1_2 }],
      ["overhead", 0, 180, { x: 0, y: 1, z: 0 }],
    ] as const)
      TestValidator.predicate(
        `${side} ${title} direction`,
        vclose(arm(pose(plane, elevation), side).direction, expected),
      );
    TestValidator.predicate(
      `${side} axial rotation at hanging changes orientation only`,
      vclose(arm(pose(0, 0, 60), side).direction, { x: 0, y: -1, z: 0 }) &&
        !qclose(
          arm(pose(0, 0, 60), side).rotation,
          arm(pose(0, 0), side).rotation,
        ),
    );
  }
  const rhythm = humanBodyShoulderFixture(true);
  const coupled = createHumanBodyBasisBuilder(rhythm.basis);
  const overhead = coupled({
    ...rhythm.document,
    shoulders: [
      { bone: "leftUpperArm", plane: 0, elevation: 180, axialRotation: 0 },
      { bone: "rightUpperArm", plane: 90, elevation: 180, axialRotation: 0 },
    ],
  });
  for (const side of ["left", "right"] as const) {
    TestValidator.predicate(
      `${side} total overhead direction survives coupled girdle rotation`,
      vclose(arm(overhead, side).direction, { x: 0, y: 1, z: 0 }) &&
        Math.hypot(
          arm(overhead, side).head.x - arm(baseline, side).head.x,
          arm(overhead, side).head.y - arm(baseline, side).head.y,
          arm(overhead, side).head.z - arm(baseline, side).head.z,
        ) > 0.001,
    );
  }
  TestValidator.predicate(
    "authored girdle plus rhythm beyond clinical range refuses",
    throwsError(
      () =>
        coupled({
          ...rhythm.document,
          pose: [
            {
              bone: "leftShoulder",
              flexion: null,
              abduction: 30,
              twist: null,
            },
          ],
          shoulders: [
            {
              bone: "leftUpperArm",
              plane: 0,
              elevation: 180,
              axialRotation: 0,
            },
          ],
        }),
      "clinical ranges",
    ),
  );
  TestValidator.predicate(
    "authored girdle plus rhythm exactly at range is accepted",
    !throwsError(() =>
      coupled({
        ...rhythm.document,
        pose: [
          {
            bone: "leftShoulder",
            flexion: null,
            abduction: 29,
            twist: null,
          },
        ],
        shoulders: [
          {
            bone: "leftUpperArm",
            plane: 0,
            elevation: 180,
            axialRotation: 0,
          },
        ],
      }),
    ),
  );
  const shaped = humanBodyShoulderFixture();
  shaped.basis.channels.push({
    id: "armLean",
    kind: "shape",
    group: "arms",
    mirror: null,
    minimum: 0,
    maximum: 1,
    positive: "lean",
    negative: null,
  });
  shaped.basis.surfaces[0].targets.lean = [0, 0, 0, 0.001];
  shaped.basis.landmarks.targets.lean = [
    shaped.basis.landmarks.ids.indexOf("left-elbow"),
    0,
    0,
    0.1,
  ];
  const shapedBuild = createHumanBodyBasisBuilder(shaped.basis);
  const shape = { armLean: 1 };
  TestValidator.predicate(
    "omitted shoulder preserves the shaped A-pose direction",
    vclose(arm(shapedBuild({ ...shaped.document, shape }), "left").direction, {
      x: 2 / 3,
      y: -2 / 3,
      z: 1 / 3,
    }),
  );
  TestValidator.predicate(
    "authored total direction remains exact after a shape moves the elbow landmark",
    vclose(
      arm(
        shapedBuild({
          ...shaped.document,
          shape,
          shoulders: [
            {
              bone: "leftUpperArm",
              plane: 90,
              elevation: 90,
              axialRotation: 0,
            },
          ],
        }),
        "left",
      ).direction,
      { x: 0, y: 0, z: 1 },
    ),
  );
};
