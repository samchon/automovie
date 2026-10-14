import {
  IAutoMovieAttachment,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMovieResolvedBone } from "@automovie/engine";
import { HUMANOID_JOINT_AXES } from "@automovie/engine";
import { resolveAttachment } from "@automovie/engine";
import { resolvePose } from "@automovie/engine";
import { Quaternion } from "@automovie/engine";
import { HUMANOID_REST_FRAME } from "@automovie/engine";
import { createSkeleton } from "../internal/createSkeleton";
import { joint } from "../internal/joint";
import { makePose } from "../internal/makePose";
import { namedFacts } from "../internal/namedFacts";
import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";
import { vclose } from "../internal/vclose";

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
 * 1. Rest parent and identity offset place the child on the chest within the
 *    scalar predicate tolerance. Rotation w is one and scale x is two;
 *    mutating returned scale x leaves the authored offset unchanged.
 * 2. A non-identity offset translation is placed in the bone's frame and added to
 *    the bone world position.
 * 3. Rotating the parent's root yaws the whole rig: the child inherits the bone's
 *    world rotation, and its offset translation follows the independent
 *    quarter-turn rule mapping +Z to +X while keeping height.
 * 4. Attaching to a bone absent from the skeleton throws.
 * 5. A clinical-space parent pose resolves through the supplied engine rest-frame
 *    table, so its attachment matches the numerical framed hand rather than raw
 *    rig-space FK. No displayed hand is observed by this CPU case.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls resolveAttachment on resolved bone poses, asserting contact transforms and mutating output scale to catch aliasing back into the authored attachment.
 * @evidence contracts/testing.md#independent-expectations Rest chest height is the authored sum 1+0.2+0.2 metres and Y90 maps the offset 0.1Z to 0.1X, yielding (0.1,1.45,0) without product-generated expected FK. Rotation assertions sample w rather than all quaternion components, and framed-hand replay is shared-path parity that cannot independently prove FK or clinical capacity.
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
  TestValidator.predicate(
    "the returned scale is a copy, so changing it leaves the offset intact",
    vclose(idOffset.scale, { x: 2, y: 2, z: 2 }, 0),
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
  const yaw: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    90,
  );
  const yawed: IAutoMoviePose = makePose([], {
    translation: { x: 0, y: 0, z: 0 },
    rotation: yaw,
    scale: { x: 1, y: 1, z: 1 },
  });
  const r3: IAutoMovieTransform = resolveAttachment(yawed, skeleton, att2);

  // A +Y quarter-turn maps +Z to +X and leaves Y unchanged.
  TestValidator.predicate(
    "child inherits chest world rotation (90° yaw, w≈cos45)",
    nclose(r3.rotation.w, Math.cos((45 * Math.PI) / 180)),
  );
  TestValidator.equals(
    "offset translation carried into the rotated frame",
    namedFacts([
      ["ncloseR3Translation", (): boolean => nclose(r3.translation.x, 0.1)],
      ["ncloseR3Translation2", (): boolean => nclose(r3.translation.y, 1.45)],
      ["ncloseR3Translation3", (): boolean => nclose(r3.translation.z, 0)],
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
  const raised: IAutoMoviePose = makePose([
    joint("leftUpperArm", { abduction: 180 }),
  ]);
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
    "rest-framed attachment matches the numerical framed hand",
    vclose(framed.translation, visibleHand.worldPosition, 1e-9),
  );
  TestValidator.predicate(
    "clinical attachment differs from raw rig-space FK",
    !vclose(framed.translation, raw.translation, 1e-3),
  );
}
