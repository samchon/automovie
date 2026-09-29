import { Quaternion } from "@automovie/engine";
import { humanBodySkinDownDirection, skinHumanBodySurface } from "@automovie/human";
import type { AutoMovieHumanoidBone } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * The sag stage reads the directional derivative of the actual distributed
 * twist skin map, including its clamped endpoints.
 *
 * Scenarios:
 * 1. A 0.1 m off-axis point halfway along a 1 m upper arm with 90 degree
 *    axial twist has tangent (+pi sin(pi/4)/20, -1,
 *    +pi cos(pi/4)/20) along rest-down, from differentiating its circular
 *    path. A centimetre-sized backward secant misses this tangent.
 * 2. At the head and past the child's head, the twist fraction is clamped;
 *    the downward one-sided derivative is exactly (0, -1, 0).
 */
export const test_human_body_skin_down_direction = (): void => {
  const joints = [
    {
      bone: "leftUpperArm" as AutoMovieHumanoidBone,
      parent: null,
      distributeTwist: true,
    },
    {
      bone: "leftLowerArm" as AutoMovieHumanoidBone,
      parent: "leftUpperArm" as AutoMovieHumanoidBone,
    },
  ];
  const still = Quaternion.identity();
  const turned = Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90);
  const transforms: Parameters<typeof humanBodySkinDownDirection>[0]["transforms"] =
    new Map([
      [
        "leftUpperArm",
        {
          rest: { position: { x: 0, y: 0, z: 0 }, rotation: still },
          posed: { position: { x: 0, y: 0, z: 0 }, rotation: turned },
        },
      ],
      [
        "leftLowerArm",
        {
          rest: { position: { x: 0, y: 1, z: 0 }, rotation: still },
          posed: { position: { x: 0, y: 1, z: 0 }, rotation: turned },
        },
      ],
    ]);
  const positions = [0.1, 0.5, 0, 0.1, 0, 0, 0.1, 2, 0];
  const skin = {
    joints: ["leftUpperArm", "leftLowerArm"] as AutoMovieHumanoidBone[],
    boneIndices: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    weights: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  };
  const skinned = skinHumanBodySurface(positions, skin, joints, transforms);
  const down = humanBodySkinDownDirection({
    positions,
    skinned,
    skin,
    joints,
    transforms,
  });
  const tangent = (Math.PI * Math.SQRT1_2) / 20;
  TestValidator.predicate(
    "distributed twist follows its analytic downward tangent",
    nclose(down[0], tangent, 1e-5) &&
      nclose(down[1], -1, 1e-5) &&
      nclose(down[2], tangent, 1e-5),
  );
  TestValidator.predicate(
    "twist clamps have a one-sided downward derivative",
    [1, 2].every((vertex) =>
      nclose(down[vertex * 3], 0, 1e-5) &&
      nclose(down[vertex * 3 + 1], -1, 1e-5) &&
      nclose(down[vertex * 3 + 2], 0, 1e-5),
    ),
  );
};
