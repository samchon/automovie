import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanTrunk, affectHeldHands } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of a rigid carry through the rig's FK, metres. */
const CARRY: number = 1e-9;

/**
 * `affectHeldHands` keeps the hands an action holds by contact on their
 * contacts while a trunk layer moves the body under them.
 *
 * - A hand on something outside the body, posed by joint angles, gets the
 *   action's own angle back on every joint the layer turned between the root
 *   and the hand, in full inside its window and by the minimum-jerk ease over
 *   the 0.1 s before it opens; the layer's other joints stay layered.
 * - A hand held by a limb goal on something outside the body keeps its goal, so
 *   the layer stands.
 * - A hand held by a limb goal on its own bone has its goal carried rigidly with
 *   that bone: the goal's place in the bone's frame is the same before and
 *   after the layer.
 * - With no action, or no open contact, the layer stands.
 *
 * The body is built whole (`humanFixtureBody`): the carry resolves the rig.
 *
 * Scenarios, an action over 0 to 10 s and a layer that flexes the spine 4, the
 * chest 10 and the head 8 degrees and lifts the right shoulder 6:
 *
 * 1. A left palm on the ground over shares 0.5 to 1 at 7 s: the spine and chest
 *    return to rest and the head and right shoulder keep the layer.
 * 2. At 4.95 s, half the ease before the window, the chest is 10 - 10 x 0.5 = 5,
 *    the minimum-jerk share of a half being a half.
 * 3. The same palm with a limb goal, or no action, or at 2 s, returns the layered
 *    posture itself.
 * 4. A left palm goaled on the performer's own head keeps its goal's head-local
 *    place and turn across the layer.
 */
export async function test_unit_motions_everyday_affect_held_hands(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const before: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const after: IAutoMovieMotionHumanPosture = {
    ...before,
    joints: {
      spine: [4, 0, 0],
      chest: [10, 0, 0],
      head: [8, 0, 0],
      rightShoulder: [0, 6, 0],
    },
  };
  const ground: IAutoMovieMotionHumanContactWindow = {
    part: "leftHand",
    kind: "plant",
    from: 0.5,
    to: 1,
    support: { kind: "ground" },
  };
  const context = (
    contacts: readonly IAutoMovieMotionHumanContactWindow[] | undefined,
  ): affectHeldHands.IContext => ({
    subject: "a",
    body,
    action: (): IAutoMovieMotionHumanLayer.IAction | undefined =>
      contacts === undefined
        ? undefined
        : {
            name: "stand",
            family: "stand",
            from: 0,
            to: 10,
            events: [],
            contacts,
          },
  });
  const held: IAutoMovieMotionHumanPosture = affectHeldHands(
    before,
    after,
    7,
    context([ground]),
  );
  TestValidator.equals(
    "a joint-posed hand on the ground",
    [held.joints.spine, held.joints.chest, held.joints.head],
    [
      [0, 0, 0],
      [0, 0, 0],
      [8, 0, 0],
    ],
  );
  TestValidator.equals("the free side", held.joints.rightShoulder, [0, 6, 0]);
  TestValidator.predicate(
    "easing in",
    nclose(
      affectHeldHands(before, after, 4.95, context([ground])).joints.chest![0],
      5,
      CARRY,
    ),
  );
  const goaled: IAutoMovieMotionHumanPosture = {
    ...before,
    limbs: {
      leftArm: {
        point: { x: 0.1, y: 1.6, z: 0.15 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        bend: { x: 0.3, y: 1.2, z: 0 },
      },
    },
  };
  TestValidator.predicate(
    "the layer stands",
    affectHeldHands(goaled, after, 7, context([ground])) === after &&
      affectHeldHands(before, after, 7, context(undefined)) === after &&
      affectHeldHands(before, after, 2, context([ground])) === after,
  );
  const face: IAutoMovieMotionHumanPosture = affectHeldHands(
    goaled,
    after,
    7,
    context([
      {
        ...ground,
        support: { kind: "person", subject: "a", bone: "head" },
      },
    ]),
  );
  const read: (
    posture: IAutoMovieMotionHumanPosture,
  ) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    HumanTrunk.prepareResolve(body, new Set<AutoMovieHumanoidBone>(["head"]));
  const local = (
    posture: IAutoMovieMotionHumanPosture,
    goal: IAutoMovieMotionHumanPosture["limbs"]["leftArm"],
  ): IAutoMovieVector3 => {
    const head: IAutoMovieResolvedBone = read(posture).get("head")!;
    return Quaternion.rotateVector(
      Quaternion.inverse(head.worldRotation),
      Vector3.subtract(goal!.point, head.worldPosition),
    );
  };
  const turn = (
    posture: IAutoMovieMotionHumanPosture,
    goal: IAutoMovieMotionHumanPosture["limbs"]["leftArm"],
  ): IAutoMovieVector3 =>
    Quaternion.rotateVector(
      Quaternion.multiply(
        Quaternion.inverse(read(posture).get("head")!.worldRotation),
        goal!.rotation!,
      ),
      { x: 0, y: 0, z: 1 },
    );
  TestValidator.predicate(
    "a goal carried with its own bone",
    vclose(
      local(face, face.limbs.leftArm),
      local(goaled, goaled.limbs.leftArm),
      CARRY,
    ) &&
      vclose(
        turn(face, face.limbs.leftArm),
        turn(goaled, goaled.limbs.leftArm),
        CARRY,
      ) &&
      !vclose(face.limbs.leftArm!.point, goaled.limbs.leftArm!.point, CARRY),
  );
}
