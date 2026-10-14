import {
  type IAutoMovieResolvedBone,
  skinAutoMovieMesh,
} from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshSkin,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkinnedTubeMesh } from "../internal/createSkinnedTubeMesh";
import { throwsError, vclose } from "../internal/predicates";

/**
 * The engine's skinning reference blends joints linearly or by dual quaternions as the skin declares, so a measurement reads the shape the viewer draws.
 *
 * Scenarios:
 * 1. Rest bones equal to posed bones leave every vertex in place under both methods.
 * 2. A vertex bound wholly to the child bone moves rigidly with it under both methods, for a twist and for a bend about the joint.
 * 3. A half-weighted vertex at the joint under a 90 degree twist lands at the chord midpoint with linear blending and on the circle at 45 degrees with dual quaternions; an omitted method blends linearly.
 * 4. The same under a 90 degree bend: linear blending pulls the vertex toward the joint axis, dual quaternions keep its radius.
 * 5. A posed rotation given as its negated quaternion skins identically, because each influence is aligned to the pivot's hemisphere.
 * 6. A translated pose moves every vertex by the translation under both methods.
 * 7. A mesh without a skin and a skin joint missing from the posed bones throw.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls skinAutoMovieMesh on a synthetic tube with hand-built rest and posed bones and reads the returned positions; catches a wrong joint transform (P R^-1), a missing translation term in the dual part, a missing hemisphere alignment, a linear blend on a dual-quaternion skin and the reverse.
 * @evidence contracts/testing.md#independent-expectations Expected points come from closed-form rotations about the joint: a rigid point rotates by the full angle, the dual quaternion blend of identity and a rotation by theta is the rotation by theta/2, and the linear blend is the midpoint of the rest and fully rotated points; none is read from the implementation.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts rest and posed, rigid and blended vertices, twist and bend, both methods and the omitted method, a negated quaternion and a pure translation, and the two refusal paths; mesh admission of the method and the viewer's shader belong to their own tests.
 * @evidence contracts/testing.md#execution-ownership A portable unit over engine arithmetic and an internal synthetic fixture; it starts no browser, GPU or process.
 */
export function test_kinematics_skin_methods(): void {
  const rest: IAutoMovieResolvedBone[] = [
    bone("hips", ZERO, IDENTITY),
    bone("spine", { x: 0, y: 1, z: 0 }, IDENTITY),
  ];
  const posed: (
    rotation: IAutoMovieQuaternion,
    shift?: IAutoMovieVector3,
  ) => IAutoMovieResolvedBone[] = (
    rotation: IAutoMovieQuaternion,
    shift: IAutoMovieVector3 = ZERO,
  ): IAutoMovieResolvedBone[] => [
    bone("hips", shift, IDENTITY),
    bone("spine", { x: shift.x, y: shift.y + 1, z: shift.z }, rotation),
  ];
  const skinned: (
    method: IAutoMovieMeshSkin["method"],
    bones: IAutoMovieResolvedBone[],
  ) => number[] = (
    method: IAutoMovieMeshSkin["method"],
    bones: IAutoMovieResolvedBone[],
  ): number[] => {
    const mesh: IAutoMovieMesh = createSkinnedTubeMesh();
    if (method !== undefined) mesh.skin!.method = method;
    return skinAutoMovieMesh(mesh, rest, bones);
  };
  const at: (positions: number[], vertex: number) => IAutoMovieVector3 = (
    positions: number[],
    vertex: number,
  ): IAutoMovieVector3 => ({
    x: positions[vertex * 3]!,
    y: positions[vertex * 3 + 1]!,
    z: positions[vertex * 3 + 2]!,
  });
  const half: number = Math.SQRT1_2;
  const twist: IAutoMovieQuaternion = { x: 0, y: half, z: 0, w: half };
  const bend: IAutoMovieQuaternion = { x: half, y: 0, z: 0, w: half };
  // vertex = ring * 16 + side; ring 8 is y = 1 (half weight), ring 16 is y = 2
  const JOINT_X: number = 8 * 16;
  const JOINT_Z: number = 8 * 16 + 4;
  const TOP_X: number = 16 * 16;
  const TOP_Z: number = 16 * 16 + 4;

  // 1. rest pose is the identity under both methods
  for (const method of ["linear", "dual-quaternion"] as const)
    TestValidator.predicate(
      `${method} leaves the rest pose in place`,
      skinned(method, rest).every((value: number, i: number): boolean =>
        Math.abs(value - createSkinnedTubeMesh().positions[i]!) <= 1e-12,
      ),
    );

  // 2. a rigidly bound vertex follows its bone under both methods
  for (const method of ["linear", "dual-quaternion"] as const) {
    TestValidator.predicate(
      `${method} twists a rigid vertex with its bone`,
      vclose(at(skinned(method, posed(twist)), TOP_X), { x: 0, y: 2, z: -0.2 }),
    );
    TestValidator.predicate(
      `${method} bends a rigid vertex about the joint`,
      vclose(at(skinned(method, posed(bend)), TOP_Z), { x: 0, y: 0.8, z: 1 }),
    );
  }

  // 3. twist: chord midpoint versus the half-angle rotation
  const r: number = 0.2;
  TestValidator.predicate(
    "linear twist blends to the chord midpoint",
    vclose(at(skinned("linear", posed(twist)), JOINT_X), {
      x: r / 2,
      y: 1,
      z: -r / 2,
    }),
  );
  TestValidator.predicate(
    "an omitted method blends linearly",
    vclose(at(skinned(undefined, posed(twist)), JOINT_X), {
      x: r / 2,
      y: 1,
      z: -r / 2,
    }),
  );
  TestValidator.predicate(
    "dual quaternion twist rotates by half the angle",
    vclose(at(skinned("dual-quaternion", posed(twist)), JOINT_X), {
      x: r * half,
      y: 1,
      z: -r * half,
    }),
  );

  // 4. bend: linear collapses toward the joint axis, dual quaternion keeps the radius
  TestValidator.predicate(
    "linear bend blends to the chord midpoint",
    vclose(at(skinned("linear", posed(bend)), JOINT_Z), {
      x: 0,
      y: 1 - r / 2,
      z: r / 2,
    }),
  );
  TestValidator.predicate(
    "dual quaternion bend keeps the radius at half the angle",
    vclose(at(skinned("dual-quaternion", posed(bend)), JOINT_Z), {
      x: 0,
      y: 1 - r * half,
      z: r * half,
    }),
  );

  // 5. a negated quaternion is the same rotation
  const negated: IAutoMovieQuaternion = { x: -half, y: 0, z: 0, w: -half };
  TestValidator.predicate(
    "dual quaternion skinning aligns a negated rotation to the pivot",
    vclose(at(skinned("dual-quaternion", posed(negated)), JOINT_Z), {
      x: 0,
      y: 1 - r * half,
      z: r * half,
    }),
  );

  // 6. pure translation
  const shift: IAutoMovieVector3 = { x: 0.5, y: -1, z: 5 };
  for (const method of ["linear", "dual-quaternion"] as const)
    TestValidator.predicate(
      `${method} carries a translated pose`,
      vclose(at(skinned(method, posed(IDENTITY, shift)), JOINT_Z), {
        x: 0.5,
        y: 0,
        z: 5.2,
      }),
    );

  // 7. refusals
  TestValidator.predicate(
    "a mesh without a skin throws",
    throwsError(
      (): number[] =>
        skinAutoMovieMesh(
          { ...createSkinnedTubeMesh(), skin: null },
          rest,
          posed(twist),
        ),
      "needs a mesh with a skin",
    ),
  );
  TestValidator.predicate(
    "a skin joint missing from the posed bones throws",
    throwsError(
      (): number[] =>
        skinAutoMovieMesh(createSkinnedTubeMesh(), rest, [rest[0]!]),
      'skin joint "spine" is missing from the posed bones',
    ),
  );
}

const ZERO: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

function bone(
  name: IAutoMovieResolvedBone["bone"],
  worldPosition: IAutoMovieVector3,
  worldRotation: IAutoMovieQuaternion,
): IAutoMovieResolvedBone {
  return {
    bone: name,
    localRotation: worldRotation,
    worldPosition,
    worldRotation,
  };
}
