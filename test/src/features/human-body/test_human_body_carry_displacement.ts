import { skinHumanBodySurface } from "@automovie/human";
import type { AutoMovieHumanoidBone } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  type BodyBoneFrames,
  blendBodyVertices,
  carryToPosed,
  carryToRest,
  rotationMatrixOf,
} from "../../../scripts/body-basis/carryBodyDisplacement";
import { nclose, throwsError } from "../internal/predicates";

const turn = (degrees: number) => ({
  x: Math.sin((degrees * Math.PI) / 360),
  y: 0,
  z: 0,
  w: Math.cos((degrees * Math.PI) / 360),
});
const identity = { x: 0, y: 0, z: 0, w: 1 };

/**
 * The per-vertex rigid transform of dual quaternion skinning, mirrored so a
 * posed displacement can be carried to the rest frame that a corrective row
 * lives in.
 *
 * The oracle is the package's own skinning: three bones (a hips root, a
 * spine that turns 90 degrees about X about a pivot 0.2 above the root, and a
 * leg that turns 40 degrees the other way) skin five vertices weighted
 * across two and three bones, and the mirror's `R p + t` must equal the
 * package's skinned position to a nanometre.
 *
 * Scenarios:
 * 1. The rotation matrix of a quarter turn about X sends the Y axis to Z.
 * 2. For every vertex the mirror's `R p + t` equals `skinHumanBodySurface`,
 *    across a vertex weighted on one bone, two bones and three bones.
 * 3. A rest displacement carried to the posed frame and back is unchanged,
 *    and a posed displacement carried to rest and back is unchanged.
 * 4. A rest displacement moves a posed vertex by exactly `R d`: the skinned
 *    position of the displaced rest vertex minus the skinned position of the
 *    rest vertex, for the vertex weighted on one bone.
 * 5. A skin that names a bone with no frame is refused.
 */
export const test_human_body_carry_displacement = (): void => {
  const joints: {
    bone: AutoMovieHumanoidBone;
    parent: AutoMovieHumanoidBone | null;
  }[] = [
    { bone: "hips", parent: null },
    { bone: "spine", parent: "hips" },
    { bone: "leftUpperLeg", parent: "hips" },
  ];
  const frames: BodyBoneFrames = new Map([
    [
      "hips",
      {
        rest: { position: { x: 0, y: 0, z: 0 }, rotation: identity },
        posed: { position: { x: 0, y: 0, z: 0 }, rotation: identity },
      },
    ],
    [
      "spine",
      {
        rest: { position: { x: 0, y: 0.2, z: 0 }, rotation: identity },
        posed: { position: { x: 0, y: 0.2, z: 0 }, rotation: turn(90) },
      },
    ],
    [
      "leftUpperLeg",
      {
        rest: { position: { x: 0.1, y: 0, z: 0 }, rotation: identity },
        posed: { position: { x: 0.1, y: 0, z: 0 }, rotation: turn(-40) },
      },
    ],
  ]);
  const positions = [
    0, 0.1, 0.05, //  hips only
    0, 0.3, 0.05, //  spine only
    0.1, -0.2, 0.02, //  leg only
    0.02, 0.2, 0.06, //  hips and spine
    0.05, 0.05, 0.03, //  hips, spine and leg
  ];
  const skin = {
    joints: ["hips", "spine", "leftUpperLeg"] as AutoMovieHumanoidBone[],
    boneIndices: [0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 1, 2, 0],
    weights: [
      1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0.6, 0.4, 0, 0, 0.3, 0.4, 0.3, 0,
    ],
  };
  const vertices = 5;

  // 1. matrix
  const quarter = rotationMatrixOf(turn(90));
  TestValidator.predicate(
    "Y goes to Z",
    nclose(quarter[2][1], 1, 1e-12) && nclose(quarter[1][1], 0, 1e-12),
  );

  // 2. mirror against the package
  const blends = blendBodyVertices(skin, frames, vertices, joints);
  const skinned = skinHumanBodySurface(positions, skin, joints, frames);
  for (let v = 0; v < vertices; ++v) {
    const p = positions.slice(v * 3, v * 3 + 3);
    const posed = carryToPosed(blends[v].rotation, p).map(
      (value, k) => value + blends[v].translation[k],
    );
    TestValidator.predicate(
      "vertex " + v + " matches the package's skinning",
      posed.every((value, k) => nclose(value, skinned[v * 3 + k], 1e-9)),
    );
  }

  // 3. round trips
  const d = [0.004, -0.002, 0.007];
  const there = carryToRest(
    blends[4].rotation,
    carryToPosed(blends[4].rotation, d),
  );
  TestValidator.predicate(
    "rest to posed to rest",
    there.every((value, k) => nclose(value, d[k], 1e-12)),
  );
  const back = carryToPosed(
    blends[4].rotation,
    carryToRest(blends[4].rotation, d),
  );
  TestValidator.predicate(
    "posed to rest to posed",
    back.every((value, k) => nclose(value, d[k], 1e-12)),
  );

  // 4. a rest row moves the posed vertex by R d
  const moved = positions.slice();
  for (let k = 0; k < 3; ++k) moved[3 + k] += d[k];
  const skinnedMoved = skinHumanBodySurface(moved, skin, joints, frames);
  const expected = carryToPosed(blends[1].rotation, d);
  TestValidator.predicate(
    "a single-bone vertex moves by exactly R d",
    expected.every((value, k) =>
      nclose(skinnedMoved[3 + k] - skinned[3 + k], value, 1e-9),
    ),
  );

  // 5. a bone without a frame
  TestValidator.predicate(
    "a missing frame is refused",
    throwsError(
      () =>
        blendBodyVertices(
          skin,
          new Map([...frames].filter(([bone]) => bone !== "spine")),
          vertices,
          joints,
        ),
      "no frame for spine",
    ),
  );
};
