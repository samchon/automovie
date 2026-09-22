import { Quaternion, resolvePose } from "@automovie/engine";
import {
  createHumanBodyBasisBuilder,
  resolveHumanBodySkeleton,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose, qunit, vclose } from "../internal/predicates";

/**
 * Joints become a rest skeleton whose frames follow the `Y x F` rule.
 *
 * Scenarios:
 * 1. With Y up and F forward the frame is X = Y x F = +X world, Y = +Y,
 *    Z = +Z: the rest rotation is the identity for this fixture, so local Y is
 *    the bone direction and local Z the flexion reference.
 * 2. The child's rest translation is the head offset in the parent's frame
 *    (one metre along the parent's local Y), and its rest rotation is the
 *    identity because both bones share one frame.
 * 3. An empty pose resolved by the engine reproduces the rest world
 *    transforms bone for bone.
 * 4. Positive flexion swings the spine toward +Z (its reference). A positive
 *    rotation about local Z would swing Y toward Z x Y = -X, so the recorded
 *    abduction sign -1 is what makes a clinical +abduction swing toward +X.
 * 5. A shaped landmark moves the joint before the skeleton is built.
 * 6. A rest angle is a clinical offset: with the spine resting at 30 degrees
 *    of flexion, a document flexion of 30 leaves it at rest and a flexion of
 *    0 swings it 30 degrees back toward -Z; the sign frames carry the offset.
 */
export const test_human_body_basis_skeleton = (): void => {
  const { basis, document } = humanBodyBasisFixture();
  const landmarks = {
    "joint-pelvis": { x: 0, y: 0, z: 0 },
    "joint-spine-4": { x: 0, y: 1, z: 0 },
    "joint-spine-2": { x: 0, y: 2, z: 0 },
  };
  const { skeleton, rest, frames } = resolveHumanBodySkeleton(basis, landmarks);
  const hips = rest.get("hips")!;
  TestValidator.predicate("rest rotation is unit", qunit(hips.rotation));
  TestValidator.predicate(
    "local Y maps to the bone direction",
    vclose(Quaternion.rotateVector(hips.rotation, { x: 0, y: 1, z: 0 }), {
      x: 0,
      y: 1,
      z: 0,
    }),
  );
  TestValidator.predicate(
    "local Z maps to the flexion reference",
    vclose(Quaternion.rotateVector(hips.rotation, { x: 0, y: 0, z: 1 }), {
      x: 0,
      y: 0,
      z: 1,
    }),
  );
  TestValidator.predicate(
    "local X is Y cross F",
    vclose(Quaternion.rotateVector(hips.rotation, { x: 1, y: 0, z: 0 }), {
      x: 1,
      y: 0,
      z: 0,
    }),
  );
  const spine = skeleton.bones[1];
  TestValidator.equals("child parent", spine.parent, "hips");
  TestValidator.predicate(
    "child rest translation in the parent frame",
    vclose(spine.rest.translation, { x: 0, y: 1, z: 0 }),
  );
  TestValidator.predicate(
    "child rest rotation is identity for a shared frame",
    nclose(spine.rest.rotation.w, 1, 1e-9),
  );
  TestValidator.equals(
    "child carries its constraint",
    spine.constraint,
    basis.joints[1].constraint,
  );
  TestValidator.equals("sign frames", frames.spine, {
    flexion: { sign: 1, neutral: 0 },
    abduction: { sign: -1, neutral: 0 },
    twist: { sign: 1, neutral: 0 },
  });
  const resolved = resolvePose(
    { skeleton: skeleton.id, root: null, joints: [] },
    skeleton,
    undefined,
    frames,
  );
  for (const bone of resolved) {
    const expected = rest.get(bone.bone)!;
    TestValidator.predicate(
      "empty pose reproduces rest " + bone.bone,
      vclose(bone.worldPosition, expected.position) &&
        Math.abs(
          Math.abs(
            bone.worldRotation.x * expected.rotation.x +
              bone.worldRotation.y * expected.rotation.y +
              bone.worldRotation.z * expected.rotation.z +
              bone.worldRotation.w * expected.rotation.w,
          ) - 1,
        ) < 1e-9,
    );
  }
  const tip = (
    joints: {
      bone: "spine";
      flexion: number | null;
      abduction: number | null;
      twist: number | null;
    }[],
  ) => {
    const posed = resolvePose(
      { skeleton: skeleton.id, root: null, joints },
      skeleton,
      undefined,
      frames,
    );
    const bone = posed.find((one) => one.bone === "spine")!;
    return Quaternion.rotateVector(bone.worldRotation, { x: 0, y: 1, z: 0 });
  };
  TestValidator.predicate(
    "positive flexion swings toward the reference",
    vclose(
      tip([{ bone: "spine", flexion: 90, abduction: null, twist: null }]),
      { x: 0, y: 0, z: 1 },
    ),
  );
  TestValidator.predicate(
    "abduction sign -1 makes clinical plus swing toward +X",
    vclose(
      tip([{ bone: "spine", flexion: null, abduction: 90, twist: null }]),
      { x: 1, y: 0, z: 0 },
      1e-6,
    ),
  );
  const resting = humanBodyBasisFixture().basis;
  resting.joints[1].neutral.flexion = 30;
  const offset = resolveHumanBodySkeleton(resting, landmarks);
  TestValidator.equals(
    "rest angle travels in the sign frame",
    offset.frames.spine!.flexion,
    { sign: 1, neutral: 30 },
  );
  const offsetTip = (flexion: number) => {
    const posed = resolvePose(
      {
        skeleton: offset.skeleton.id,
        root: null,
        joints: [{ bone: "spine", flexion, abduction: null, twist: null }],
      },
      offset.skeleton,
      undefined,
      offset.frames,
    );
    return Quaternion.rotateVector(
      posed.find((one) => one.bone === "spine")!.worldRotation,
      { x: 0, y: 1, z: 0 },
    );
  };
  TestValidator.predicate(
    "document angle equal to the rest angle leaves the bone at rest",
    vclose(offsetTip(30), { x: 0, y: 1, z: 0 }),
  );
  TestValidator.predicate(
    "clinical zero swings a bone resting at 30 back by 30",
    vclose(offsetTip(0), {
      x: 0,
      y: Math.cos(Math.PI / 6),
      z: -Math.sin(Math.PI / 6),
    }),
  );
  const raised = createHumanBodyBasisBuilder(basis)({
    ...document,
    shape: { tall: 1 },
  });
  TestValidator.predicate(
    "shaped landmark moves the joint",
    vclose(raised.bones[1].rest.position, { x: 0, y: 1, z: 0 }) &&
      nclose(raised.skeleton.bones[1].rest.translation.y, 1) &&
      nclose(raised.landmarks["joint-spine-2"].y, 2.5),
  );
};
