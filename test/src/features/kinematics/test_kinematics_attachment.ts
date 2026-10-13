import { IAutoMovieSkeleton, IAutoMoviePose, IAutoMovieQuaternion, IAutoMovieVector3, IAutoMovieAttachment, IAutoMovieTransform } from "@automovie/interface";
import { IAutoMovieResolvedBone } from "../../../../packages/engine/src/kinematics/IAutoMovieResolvedBone";
import { HUMANOID_JOINT_AXES } from "../../../../packages/engine/src/kinematics/constants/HUMANOID_JOINT_AXES";
import { HUMANOID_REST_FRAME } from "../../../../packages/engine/src/rom/constants/HUMANOID_REST_FRAME";
import { Quaternion } from "../../../../packages/engine/src/math/Quaternion";
import { resolveAttachment } from "../../../../packages/engine/src/kinematics/resolveAttachment";
import { resolvePose } from "../../../../packages/engine/src/kinematics/resolvePose";
import { TestValidator } from "@nestia/e2e";
import { createSkeleton, joint, makePose } from "../internal/fixtures";
import { namedFacts, nclose, throwsError, vclose } from "../internal/predicates";
/**
 * `resolveAttachment`: the cross-skeleton joint that fixes a child model's root
 * into a bone of a posed parent (a rider in a horse's saddle). It runs FK on
 * the parent, reads the attachment bone's world position + orientation, and
 * composes the offset into that frame.
 *
 * The fixture skeleton stacks hips(0,1,0) → spine(0,0.2,0) → chest(0,0.2,0), so
 * at rest `chest` sits at world (0,1.4,0) with identity orientation.
 *
 * Scenarios:
 *
 * 1. Rest parent, identity offset → child root lands exactly on the chest's world
 *    position, identity rotation, offset scale passed through as a copy that
 *    the caller can change without changing the attachment.
 * 2. A non-identity offset translation is placed in the bone's frame and added to
 *    the bone world position.
 * 3. Rotating the parent's root yaws the whole rig: the child inherits the bone's
 *    world rotation, and its offset translation is carried (rotated) into that
 *    frame: exactly matching a hand-composed FK result.
 * 4. Attaching to a bone absent from the skeleton throws.
 * 5. A clinical-space parent pose resolves through the same rest-frame table as
 *    the renderer, so an attachment rides the visible hand rather than raw
 *    rig-space FK.
  *
 * @evidence contracts/testing.md#behavioral-verification Calls resolveAttachment on resolved bone poses, asserting contact transforms and mutating output scale to catch aliasing back into the authored attachment.
 * @evidence contracts/testing.md#independent-expectations Rest chest height is the sum 1+0.2+0.2 metres, with hand-composed offset rotations; clinical replay uses the declared shared rest-frame convention.
 * @evidence contracts/testing.md#distinguishing-cases Covers rest/nonidentity offsets, root rotation, absent bone, clinical-space posing and returned scale ownership; skeleton topology tests own unreachable hierarchies.
 * @evidence contracts/testing.md#execution-ownership This discoverable CPU kinematics entry directly imports numerical product source and code fixtures, with no real process, browser, GPU or native build.
 */
export function test_kinematics_attachment(): void {
  const skeleton: IAutoMovieSkeleton = createSkeleton();
  const restPose: IAutoMoviePose = makePose([]);

  // 1. rest + identity offset → sits on the chest, scale carried
  const idOffset: IAutoMovieTransform = {
    translation: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 2, y: 2, z: 2 },
  };
  const att1: IAutoMovieAttachment = { parentBone: "chest", offset: idOffset };
  const r1: IAutoMovieTransform = resolveAttachment(restPose, skeleton, att1);
  TestValidator.equals(
    "child sits on chest world pos (0,1.4,0)",
    namedFacts([
      ["ncloseR1Translation", (): boolean => nclose(r1.translation.x, 0)],
      ["ncloseR1Translation2", (): boolean => nclose(r1.translation.y, 1.4)],
      ["ncloseR1Translation3", (): boolean => nclose(r1.translation.z, 0)],
    ]),
    {
      ncloseR1Translation: true,
      ncloseR1Translation2: true,
      ncloseR1Translation3: true,
    },
  );
  TestValidator.predicate(
    "identity rotation at rest",
    nclose(r1.rotation.w, 1),
  );
  TestValidator.predicate("offset scale passed through", nclose(r1.scale.x, 2));
  r1.scale.x = 7;
  TestValidator.equals(
    "the returned scale is a copy, so changing it leaves the offset intact",
    idOffset.scale,
    { x: 2, y: 2, z: 2 },
  );

  // 2. offset translation added in the (rest = world) frame
  const att2: IAutoMovieAttachment = {
    parentBone: "chest",
    offset: {
      translation: { x: 0, y: 0.05, z: 0.1 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
  };
  const r2: IAutoMovieTransform = resolveAttachment(restPose, skeleton, att2);
  TestValidator.equals(
    "seat offset added to chest pos",
    namedFacts([
      ["ncloseR2Translation", (): boolean => nclose(r2.translation.y, 1.45)],
      ["ncloseR2Translation2", (): boolean => nclose(r2.translation.z, 0.1)],
    ]),
    { ncloseR2Translation: true, ncloseR2Translation2: true },
  );

  // 3. yaw the whole rig via the pose root: child inherits the bone's world
  //    rotation and the offset is carried into that frame
  const yaw: IAutoMovieQuaternion = Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90);
  const yawed: IAutoMoviePose = makePose([], {
    translation: { x: 0, y: 0, z: 0 },
    rotation: yaw,
    scale: { x: 1, y: 1, z: 1 },
  });
  const r3: IAutoMovieTransform = resolveAttachment(yawed, skeleton, att2);

  // hand-compose against resolvePose to confirm the composition is exact
  const chest: IAutoMovieResolvedBone = resolvePose(yawed, skeleton).find((r: IAutoMovieResolvedBone): boolean => r.bone === "chest")!;
  const expectedT: IAutoMovieVector3 = Quaternion.rotateVector(chest.worldRotation, {
    x: 0,
    y: 0.05,
    z: 0.1,
  });
  TestValidator.predicate(
    "child inherits chest world rotation (90° yaw, w≈cos45)",
    nclose(r3.rotation.w, Math.cos((45 * Math.PI) / 180)),
  );
  TestValidator.equals(
    "offset translation carried into the rotated frame",
    namedFacts([
      [
        "ncloseR3Translation",
        (): boolean => nclose(r3.translation.x, chest.worldPosition.x + expectedT.x),
      ],
      [
        "ncloseR3Translation2",
        (): boolean => nclose(r3.translation.y, chest.worldPosition.y + expectedT.y),
      ],
      [
        "ncloseR3Translation3",
        (): boolean => nclose(r3.translation.z, chest.worldPosition.z + expectedT.z),
      ],
    ]),
    {
      ncloseR3Translation: true,
      ncloseR3Translation2: true,
      ncloseR3Translation3: true,
    },
  );

  // 4. unknown bone → throws (the fixture skeleton has no rightFoot)
  TestValidator.predicate(
    "attaching to a missing bone throws",
    throwsError(
      (): IAutoMovieTransform =>
        resolveAttachment(
          restPose,
          skeleton,
          { parentBone: "rightFoot", offset: idOffset },
          undefined,
        ),
      'parent bone "rightFoot" is not in the skeleton',
    ),
  );

  // a referenced bone the fixture DOES have, with a non-rest articulation, also
  // resolves (exercises the jointAxes-less articulation path through FK)
  const posed: IAutoMoviePose = makePose([joint("spine", { flexion: 20 })]);
  const r5: IAutoMovieTransform = resolveAttachment(posed, skeleton, att1);
  TestValidator.predicate(
    "posed parent still resolves",
    Number.isFinite(r5.translation.y),
  );

  // 5. clinical parent pose → same FK path as the renderer/player
  const raised: IAutoMoviePose = makePose([joint("leftUpperArm", { abduction: 180 })]);
  const framed: IAutoMovieTransform = resolveAttachment(
    raised,
    skeleton,
    { parentBone: "leftHand", offset: idOffset },
    HUMANOID_JOINT_AXES,
    HUMANOID_REST_FRAME,
  );
  const raw: IAutoMovieTransform = resolveAttachment(
    raised,
    skeleton,
    { parentBone: "leftHand", offset: idOffset },
    HUMANOID_JOINT_AXES,
  );
  const visibleHand: IAutoMovieResolvedBone = resolvePose(
    raised,
    skeleton,
    HUMANOID_JOINT_AXES,
    HUMANOID_REST_FRAME,
  ).find((r: IAutoMovieResolvedBone): boolean => r.bone === "leftHand")!;
  TestValidator.predicate(
    "rest-framed attachment rides the visible clinical hand",
    vclose(framed.translation, visibleHand.worldPosition, 1e-9),
  );
  TestValidator.predicate(
    "clinical attachment differs from raw rig-space FK",
    !vclose(framed.translation, raw.translation, 1e-3),
  );
}
