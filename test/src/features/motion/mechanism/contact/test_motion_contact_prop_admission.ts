import { Quaternion, Transform, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { poseBones, resolveHumanPosture } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../internal/motionHumanBody";
import { vclose } from "../../../internal/vclose";

/**
 * Mounted props follow their receiving sockets, including when an action reads
 * them on the performer's supplied body instead of the display pose.
 *
 * Scenarios, on the average man, with a translating and rotating fixture and
 * with a carrier worn on the hips:
 *
 * 1. A mounted part and a part mounted on it follow the composed socket frames at
 *    three film seconds, within 1 micrometre of rigid composition.
 * 2. Aiming at either part gives that same physical point. Moving only the
 *    supplied body translates the worn hierarchy by that displacement and
 *    leaves the fixture's hierarchy unchanged.
 *
 * Scenarios:
 *
 * 1. Move a mounted prop with its socket, then resolve a nested attachment and
 *    inspect its owner.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the hierarchy, both parent modes, the supplied-body difference and the numerical bound.
 * @evidence contracts/development/testing.md#behavioral-verification Builds mounted spans through a registered law and reads the public prop and aiming seams; a socket mistaken for the mounting performer's hand, or a lost supplied-body frame, fails.
 * @evidence contracts/development/testing.md#independent-expectations Expected points are rigid compositions of the fixture's analytic motion or the hips' frame, followed by the authored socket and part offsets; 1 micrometre is a rounding bound far inside the campaign's 1 mm rigid-grip requirement.
 * @evidence contracts/development/testing.md#distinguishing-cases A moving fixture and worn carrier, one and two mount edges, three instants and a supplied body displaced independently of the display.
 * @evidence contracts/development/testing.md#execution-ownership One polygon body and two in-memory performances; no viewer or external host.
 */
export function test_motion_contact_prop_admission(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const standing: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const initial: IAutoMovieResolvedBone = poseBones(
    body,
    resolveHumanPosture(body, standing),
  ).get("hips")!;
  const offset: IAutoMovieVector3 = { x: 0.07, y: 0.12, z: -0.03 };
  const tip: IAutoMovieVector3 = { x: 0.02, y: 0.04, z: 0.08 };
  const displacement: IAutoMovieVector3 = { x: 0.3, y: -0.1, z: 0.2 };
  const socket: IAutoMovieAffordance = {
    id: "socket",
    kind: "socket",
    frame: Transform.of(offset, Quaternion.identity()),
    extent: null,
  };
  const placed = (
    parent: IAutoMovieRigidTransform,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    Vector3.add(
      parent.position,
      Quaternion.rotateVector(parent.rotation, point),
    );
  const law: IAutoMovieMotionHumanActionLaw = {
    name: "mountParts",
    interrupts: {},
    plan: (
      context: IAutoMovieMotionHumanActionContext,
    ): IAutoMovieMotionHumanActionPlan => ({
      ...AutoMovieMotionHumanStance.stand.plan({
        ...context,
        params: { hold: 1 },
      }),
      mounts: [
        { prop: "part", onto: "carrier", point: "socket", from: 0 },
        { prop: "nested", onto: "part", point: "socket", from: 0 },
      ],
    }),
  };
  for (const worn of [false, true]) {
    const moving = (seconds: number): IAutoMovieRigidTransform => ({
      position: { x: seconds, y: 1, z: -seconds / 2 },
      rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 30 * seconds),
    });
    const before: IAutoMovieRigidTransform = worn
      ? { position: initial.worldPosition, rotation: initial.worldRotation }
      : moving(0);
    const part = (
      subject: string,
      depth: number,
    ): IAutoMovieMotionHumanProp => ({
      subject,
      frame: {
        position: placed(before, Vector3.scale(offset, depth)),
        rotation: before.rotation,
      },
      points: { tip: { point: tip, normal: { x: 0, y: 1, z: 0 } } },
      affordances: [socket],
    });
    const film: IAutoMovieMotionHumanPerformance = new HumanPerformance({
      seed: "mounted-parts",
      laws: [law],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        {
          subject: "carrier",
          frame: before,
          points: {},
          affordances: [socket],
          ...(worn
            ? {
                worn: {
                  subject: "a",
                  bone: "hips" as const,
                  offset: {
                    position: { x: 0, y: 0, z: 0 },
                    rotation: Quaternion.identity(),
                  },
                },
              }
            : { motion: moving }),
        },
        part("part", 1),
        part("nested", 2),
      ],
      composition: HumanChain.subject("a").registered("mountParts").node,
    });
    for (const seconds of [0, 0.5, 1]) {
      const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        film.bones("a", seconds);
      const hips: IAutoMovieResolvedBone = bones.get("hips")!;
      const parent: IAutoMovieRigidTransform = worn
        ? { position: hips.worldPosition, rotation: hips.worldRotation }
        : moving(seconds);
      const supplied: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        new Map(
          [...bones].map(
            ([id, bone]: [AutoMovieHumanoidBone, IAutoMovieResolvedBone]): [
              AutoMovieHumanoidBone,
              IAutoMovieResolvedBone,
            ] => [
              id,
              {
                ...bone,
                worldPosition: Vector3.add(bone.worldPosition, displacement),
              },
            ],
          ),
        );
      for (const [subject, depth] of [
        ["part", 1],
        ["nested", 2],
      ] as const) {
        const expected: IAutoMovieVector3 = placed(
          parent,
          Vector3.add(Vector3.scale(offset, depth), tip),
        );
        const aimed: IAutoMovieVector3 = film.aim(
          { kind: "prop", subject, point: "tip" },
          seconds,
          {
            subject: "a",
            body,
            root: standing.root,
            yaw: 0,
            heights: { low: 0.5, middle: 1, high: 1.5 },
            range: 1,
            bones: (): ReadonlyMap<
              AutoMovieHumanoidBone,
              IAutoMovieResolvedBone
            > => supplied,
          },
        ).point;
        TestValidator.predicate(
          `${worn ? "worn" : "fixture"} ${subject} is aimed on the supplied body at ${seconds}`,
          vclose(aimed, worn ? Vector3.add(expected, displacement) : expected),
        );
        const frame: IAutoMovieRigidTransform = film.prop(subject, seconds);
        TestValidator.predicate(
          `${worn ? "worn" : "fixture"} ${subject} follows its socket at ${seconds}`,
          vclose(placed(frame, tip), expected),
        );
      }
    }
  }
}
