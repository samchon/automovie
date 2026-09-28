import { Quaternion } from "@automovie/engine";
import { skinHumanBodySurface } from "@automovie/human";
import type { AutoMovieHumanoidBone } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError, vclose } from "../internal/predicates";

/**
 * Near a half turn the blend is decided by the skeleton, not by which
 * influence a vertex happens to list first.
 *
 * A chain hips (still) -> spine (turned 10 degrees about +X) -> chest
 * (turned 182 degrees about +X, the same rotation as -178) puts the chest's
 * real part in the spine's hemisphere and outside the hips': chosen per
 * vertex against the first influence, a vertex listing the chest first would
 * flip the hips against the spine, and the two nearly equal rotations would
 * cancel. With signs aligned parent to child once for the skin, a blend
 * depends only on its weights.
 *
 * Scenarios:
 * 1. Two vertices at the same rest point with the same three weights in
 *    opposite orders land on the same posed point.
 * 2. A vertex bound only to the chest moves rigidly: the rest point rotated
 *    by 182 degrees about +X through the chest's joint (0, 2, 0).
 * 3. A skin naming a bone the joint list lacks is refused by name.
 */
export const test_human_body_skinning_hemisphere = (): void => {
  const joints: {
    bone: AutoMovieHumanoidBone;
    parent: AutoMovieHumanoidBone | null;
  }[] = [
    { bone: "hips", parent: null },
    { bone: "spine", parent: "hips" },
    { bone: "chest", parent: "spine" },
  ];
  const still = { x: 0, y: 0, z: 0, w: 1 };
  const about = (degrees: number) =>
    Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, degrees);
  const frame = (
    y: number,
    rotation: { x: number; y: number; z: number; w: number },
  ) => ({
    rest: { position: { x: 0, y, z: 0 }, rotation: still },
    posed: { position: { x: 0, y, z: 0 }, rotation },
  });
  const transforms = new Map([
    ["hips" as const, frame(0, still)],
    ["spine" as const, frame(1, about(10))],
    ["chest" as const, frame(2, about(182))],
  ]);
  const point = [0, 2.5, 0.1];
  const skin = {
    joints: ["hips", "spine", "chest"] as AutoMovieHumanoidBone[],
    boneIndices: [2, 1, 0, 0, 0, 1, 2, 0, 2, 0, 0, 0],
    weights: [0.4, 0.3, 0.3, 0, 0.3, 0.3, 0.4, 0, 1, 0, 0, 0],
  };
  const p = skinHumanBodySurface(
    [...point, ...point, ...point],
    skin,
    joints,
    transforms,
  );
  const at = (v: number) => ({ x: p[v * 3], y: p[v * 3 + 1], z: p[v * 3 + 2] });
  TestValidator.predicate(
    "influence order does not change the blend",
    vclose(at(0), at(1), 1e-12),
  );
  const r = (182 * Math.PI) / 180;
  // (0, 0.5, 0.1) from the chest joint, turned about +X
  TestValidator.predicate(
    "a chest-only vertex turns rigidly about its joint",
    vclose(
      at(2),
      {
        x: 0,
        y: 2 + 0.5 * Math.cos(r) - 0.1 * Math.sin(r),
        z: 0.5 * Math.sin(r) + 0.1 * Math.cos(r),
      },
      1e-12,
    ),
  );
  TestValidator.predicate(
    "a skin bone outside the joint list is refused",
    throwsError(
      () => skinHumanBodySurface(point, skin, joints.slice(0, 2), transforms),
      "chest",
    ),
  );
};
