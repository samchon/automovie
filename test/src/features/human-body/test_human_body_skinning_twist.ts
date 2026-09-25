import { Quaternion } from "@automovie/engine";
import { skinHumanBodySurface } from "@automovie/human";
import type { AutoMovieHumanoidBone } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../internal/predicates";

/**
 * A bone that spreads its twist gives its skin the swing whole and the twist
 * in proportion to where a vertex lies along the bone.
 *
 * A chain hips -> leftUpperArm (spreading) -> leftLowerArm lays the upper arm
 * along +Y from (0, 1, 0) to (0, 2, 0). The upper arm is turned 90 degrees
 * about +Y (a pure twist about its own axis) and, in the second pose, also
 * swung 90 degrees about +X after the twist; the hips stay still.
 *
 * Scenarios:
 * 1. Pure twist: a vertex bound only to the upper arm at its head keeps its
 *    place, one at its middle turns 45 degrees about the axis, one at the
 *    lower arm's head turns the full 90, and one past it is held at 90.
 * 2. Without spreading, the same vertices all turn the full 90.
 * 3. Swing and twist: the vertex at the head takes the swing alone, the one
 *    at the child's head the bone's whole rotation, rigidly about the head.
 * 4. A half-turn swing about +X has no twist component: every vertex takes
 *    the swing whole.
 * 5. A twist written as 270 degrees is the -90 degree twist on its shortest
 *    arc: the middle turns -45.
 * 6. A root that spreads its twist reads it against no parent.
 */
export const test_human_body_skinning_twist = (): void => {
  const joints = (spread: boolean) => [
    { bone: "hips" as AutoMovieHumanoidBone, parent: null },
    {
      bone: "leftUpperArm" as AutoMovieHumanoidBone,
      parent: "hips" as AutoMovieHumanoidBone,
      distributeTwist: spread,
    },
    {
      bone: "leftLowerArm" as AutoMovieHumanoidBone,
      parent: "leftUpperArm" as AutoMovieHumanoidBone,
    },
  ];
  const still = { x: 0, y: 0, z: 0, w: 1 };
  const twist = Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90);
  const swing = Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90);
  const transforms = (arm: typeof still) =>
    new Map([
      [
        "hips" as const,
        {
          rest: { position: { x: 0, y: 0, z: 0 }, rotation: still },
          posed: { position: { x: 0, y: 0, z: 0 }, rotation: still },
        },
      ],
      [
        "leftUpperArm" as const,
        {
          rest: { position: { x: 0, y: 1, z: 0 }, rotation: still },
          posed: { position: { x: 0, y: 1, z: 0 }, rotation: arm },
        },
      ],
      [
        "leftLowerArm" as const,
        {
          rest: { position: { x: 0, y: 2, z: 0 }, rotation: still },
          posed: {
            position: {
              x: Quaternion.rotateVector(arm, { x: 0, y: 1, z: 0 }).x,
              y: Quaternion.rotateVector(arm, { x: 0, y: 1, z: 0 }).y + 1,
              z: Quaternion.rotateVector(arm, { x: 0, y: 1, z: 0 }).z,
            },
            rotation: arm,
          },
        },
      ],
    ]);
  // four vertices off the axis by 0.1 along +X: at the head, the middle, the
  // child's head and past it, each bound only to the upper arm
  const rest = [0.1, 1, 0, 0.1, 1.5, 0, 0.1, 2, 0, 0.1, 2.5, 0];
  const skin = {
    joints: ["hips", "leftUpperArm", "leftLowerArm"] as AutoMovieHumanoidBone[],
    boneIndices: Array.from({ length: 16 }, (_, i) => (i % 4 === 0 ? 1 : 0)),
    weights: Array.from({ length: 16 }, (_, i) => (i % 4 === 0 ? 1 : 0)),
  };
  const v3 = (a: number[]) => ({ x: a[0], y: a[1], z: a[2] });
  const at = (list: number[], k: number) => v3(list.slice(k * 3, k * 3 + 3));
  const turned = (degrees: number, y: number) => {
    const r = (degrees * Math.PI) / 180;
    // +90 about +Y carries +X to -Z
    return v3([0.1 * Math.cos(r), y, -0.1 * Math.sin(r)]);
  };

  const spread = skinHumanBodySurface(
    rest,
    skin,
    joints(true),
    transforms(twist),
  );
  TestValidator.predicate(
    "the head keeps its place",
    vclose(at(spread, 0), v3([0.1, 1, 0])),
  );
  TestValidator.predicate(
    "the middle turns half the twist",
    vclose(at(spread, 1), turned(45, 1.5)),
  );
  TestValidator.predicate(
    "the child's head turns the whole twist",
    vclose(at(spread, 2), turned(90, 2)),
  );
  TestValidator.predicate(
    "past the child's head the twist is held whole",
    vclose(at(spread, 3), turned(90, 2.5)),
  );

  const rigid = skinHumanBodySurface(
    rest,
    skin,
    joints(false),
    transforms(twist),
  );
  TestValidator.predicate(
    "without spreading every vertex turns the whole twist",
    [0, 1, 2, 3].every((k) =>
      vclose(at(rigid, k), turned(90, [1, 1.5, 2, 2.5][k])),
    ),
  );

  const both = Quaternion.multiply(swing, twist);
  const swung = skinHumanBodySurface(
    rest,
    skin,
    joints(true),
    transforms(both),
  );
  const about = (q: typeof still, p: number[]) => {
    const v = Quaternion.rotateVector(q, { x: p[0], y: p[1] - 1, z: p[2] });
    return { x: v.x, y: v.y + 1, z: v.z };
  };
  TestValidator.predicate(
    "the head takes the swing alone",
    vclose(at(swung, 0), about(swing, [0.1, 1, 0])),
  );
  TestValidator.predicate(
    "the child's head takes the bone's whole rotation",
    vclose(at(swung, 2), about(both, [0.1, 2, 0])),
  );
  const halfTurn = Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 180);
  const flipped = skinHumanBodySurface(
    rest,
    skin,
    joints(true),
    transforms(halfTurn),
  );
  TestValidator.predicate(
    "a half-turn swing reaches every vertex whole",
    [0, 1, 2].every((k) =>
      vclose(at(flipped, k), about(halfTurn, [0.1, [1, 1.5, 2][k], 0])),
    ),
  );

  const long = Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 270);
  const shortest = skinHumanBodySurface(
    rest,
    skin,
    joints(true),
    transforms(long),
  );
  TestValidator.predicate(
    "a 270 degree twist is spread as -90",
    vclose(at(shortest, 1), turned(-45, 1.5)),
  );

  // the upper arm as the root of its own chain
  const rooted = [
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
  const rootSkin = {
    joints: ["leftUpperArm", "leftLowerArm"] as AutoMovieHumanoidBone[],
    boneIndices: Array.from({ length: 16 }, () => 0),
    weights: Array.from({ length: 16 }, (_, i) => (i % 4 === 0 ? 1 : 0)),
  };
  const fromRoot = skinHumanBodySurface(
    rest,
    rootSkin,
    rooted,
    transforms(twist),
  );
  TestValidator.predicate(
    "a spreading root reads its twist against no parent",
    vclose(at(fromRoot, 1), turned(45, 1.5)),
  );
};
