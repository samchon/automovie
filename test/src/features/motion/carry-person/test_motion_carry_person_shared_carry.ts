import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSharedCarry,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import {
  AutoMovieMotionHumanSharedCarry,
  HumanHand,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../internal/motionHumanBody";
import { nclose } from "../../internal/nclose";
import { qclose } from "../../internal/qclose";
import { vclose } from "../../internal/vclose";

/**
 * An already-held rigid prop follows one path while both hands keep their
 * original points. The contacts are fixture geometry read from two distinct
 * hand poses, and the expected path is a translation plus a yaw, evaluated
 * analytically with sine and cosine.
 *
 * Scenarios:
 *
 * 1. Two different bodies grip the same prop at different points between film
 *    seconds 2 and 3.5. The prop translates 70 mm forward and yaws 2 degrees. A
 *    registered action for each carrier displays the prepared motion in one
 *    performance. The grip centres stay within 15 mm of their own sites at both
 *    ends and at mid-carry, read out of chronological order. The shared prop
 *    frame also follows the authored path during the carry.
 * 2. The performance sees the one prop at its authored frame before the carry and
 *    at its terminal frame after the carry. Exact and adjacent reads agree with
 *    the prepared sampler. Both hands are observed at the seams.
 * 3. A duplicate grip, a minute-long planning interval and a posture read after
 *    the prepared carry are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the authored interval, the two distinct grips, the shared rigid motion and the checking bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads both carriers' displayed bones and the common prop frame from HumanPerformance, including exact and adjacent boundaries. Cross-reads the prepared motion and limbs on the same film seconds. An aliased grip must throw.
 * @evidence contracts/development/testing.md#independent-expectations The site bounds compare displayed hands with analytically transformed authored local coordinates, independent of the planner and prop reader.
 * @evidence contracts/development/testing.md#distinguishing-cases Distinct points see different motion under yaw. Samples straddle both ends, repeat an off-grid hold out of order, and refuse duplicated sites.
 * @evidence contracts/development/testing.md#execution-ownership One bounded in-memory carry under test/src/features, discovered by the motion test runner.
 */
export function test_motion_carry_person_shared_carry(): void {
  const from: number = 2;
  const to: number = 3.5;
  const first: IAutoMovieMotionHumanSharedCarry.ICarrier = carrier(
    "first",
    "left",
    -0.55,
    motionHumanBody("m-average"),
  );
  const second: IAutoMovieMotionHumanSharedCarry.ICarrier = carrier(
    "second",
    "right",
    0.55,
    motionHumanBody("m-long-armed"),
  );
  const firstSite: IAutoMovieMotionHumanHand.IFrame = grip(
    first,
    first.posture(from),
  );
  const secondSite: IAutoMovieMotionHumanHand.IFrame = grip(
    second,
    second.posture(from),
  );
  const prop: IAutoMovieMotionHumanProp = {
    subject: "panel",
    frame: { position: { x: 0, y: 0, z: 0 }, rotation: Quaternion.identity() },
    points: { first: firstSite, second: secondSite },
  };
  const input: IAutoMovieMotionHumanSharedCarry.IInput = {
    prop,
    carriers: [first, second],
    from,
    to,
    path: (seconds: number): IAutoMovieRigidTransform => ({
      position: { x: 0, y: 0, z: 0.07 * ((seconds - from) / (to - from)) },
      rotation: Quaternion.fromAxisAngle(
        { x: 0, y: 1, z: 0 },
        2 * ((seconds - from) / (to - from)),
      ),
    }),
  };
  TestValidator.error("both carriers cannot claim the same point", (): void => {
    AutoMovieMotionHumanSharedCarry({
      ...input,
      carriers: [first, { ...second, site: first.site }],
    });
  });

  TestValidator.error("a minute exceeds the draft planning span", (): void => {
    AutoMovieMotionHumanSharedCarry({ ...input, to: from + 60 });
  });

  const prepared: IAutoMovieMotionHumanSharedCarry.IPrepared =
    AutoMovieMotionHumanSharedCarry(input);
  TestValidator.error(
    "a later posture belongs to the next action",
    (): void => {
      prepared.postures[0](to + 0.1);
    },
  );
  const laws: IAutoMovieMotionHumanActionLaw[] = ([0, 1] as const).map(
    (index: 0 | 1): IAutoMovieMotionHumanActionLaw => ({
      name: `carry-${index}`,
      interrupts: {},
      plan: (): IAutoMovieMotionHumanActionPlan => ({
        duration: to,
        events: [],
        contacts: [
          {
            part: `${input.carriers[index].side}Hand`,
            kind: "grip",
            from: from / to,
            to: 1,
            support: { kind: "prop", subject: prop.subject },
          },
        ],
        posture: (seconds: number): IAutoMovieMotionHumanPosture =>
          seconds < from
            ? input.carriers[index].posture(seconds)
            : prepared.postures[index](Math.min(seconds, to)),
      }),
    }),
  );
  const performance: HumanPerformance = new HumanPerformance({
    seed: "shared-carry",
    performers: [first.performer, second.performer],
    laws,
    composition: {
      kind: "parallel",
      parts: [
        HumanChain.subject(first.performer.subject).registered(
          laws[0]!.name,
          {},
        ).node,
        HumanChain.subject(second.performer.subject).registered(
          laws[1]!.name,
          {},
        ).node,
      ],
    },
    props: [prepared.prop],
  });
  const adjacent: number = 0.0001;
  const offGrid: number = from + 0.371;
  for (const seconds of [
    to + 0.1,
    to + adjacent,
    to,
    from - 0.1,
    from - adjacent,
    from,
    offGrid,
    to - adjacent,
    (from + to) / 2,
    from + adjacent,
    offGrid,
  ]) {
    const share: number = Math.min(
      1,
      Math.max(0, (seconds - from) / (to - from)),
    );
    const angle: number = (share * Math.PI) / 90;
    const frame: IAutoMovieRigidTransform = performance.prop(
      prop.subject,
      seconds,
    );
    TestValidator.predicate(
      `the common frame follows its path at ${seconds} s`,
      vclose(frame.position, { x: 0, y: 0, z: 0.07 * share }) &&
        qclose(
          frame.rotation,
          { x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) },
          1e-12,
        ),
    );
    const direct: IAutoMovieRigidTransform = prepared.prop.motion!(seconds);
    TestValidator.predicate(
      `the prepared and placed props agree at ${seconds} s`,
      vclose(frame.position, direct.position) &&
        qclose(frame.rotation, direct.rotation, 1e-12),
    );
    if (seconds < from - adjacent || seconds > to + adjacent) continue;
    for (const index of [0, 1] as const) {
      const owner: IAutoMovieMotionHumanSharedCarry.ICarrier =
        input.carriers[index];
      const local: IAutoMovieVector3 = prop.points[owner.site]!.point;
      const expected: IAutoMovieVector3 = {
        x: local.x * Math.cos(angle) + local.z * Math.sin(angle),
        y: local.y,
        z: 0.07 * share + local.z * Math.cos(angle) - local.x * Math.sin(angle),
      };
      const actual: IAutoMovieVector3 = HumanHand.frame(
        owner.performer.body,
        performance.bones(owner.performer.subject, seconds),
        owner.side,
        "grip",
      ).point;
      TestValidator.predicate(
        `${owner.site} keeps its own point at ${seconds} s`,
        nclose(Vector3.length(Vector3.subtract(actual, expected)), 0, 0.015),
      );
      if (seconds < from || seconds > to) continue;
      const planned: IAutoMovieVector3 = grip(
        owner,
        prepared.postures[index](seconds),
      ).point;
      TestValidator.predicate(
        `${owner.site} agrees between prepared and placed reads at ${seconds} s`,
        nclose(Vector3.distance(actual, planned), 0, 0.015),
      );
    }
  }
}

/** Pose a performer with a bent elbow and a ready grip before the interval. */
function carrier(
  subject: string,
  side: AutoMovieHumanSide,
  x: number,
  body: IAutoMovieMotionHumanBody,
): IAutoMovieMotionHumanSharedCarry.ICarrier {
  const at: IAutoMovieVector3 = { x, y: 0, z: 0 };
  const standing: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, at, 0);
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    resolveHumanPosture(body, standing),
  );
  const shoulder: IAutoMovieVector3 = bones.get(
    `${side}UpperArm`,
  )!.worldPosition;
  const free: IAutoMovieMotionHumanPosture = {
    ...standing,
    joints: { ...standing.joints, ...HumanHand.shape(side, "fist") },
    limbs: {
      ...standing.limbs,
      [`${side}Arm`]: {
        point: Vector3.add(shoulder, { x: 0, y: -0.22, z: 0.32 }),
        bend: Vector3.add(shoulder, { x: 0, y: -1, z: 0 }),
      },
    },
  };
  // The ready hand holds the attitude it grips the panel with, so the
  // posture places the grip itself: a goal that leaves the hand's attitude
  // free is shown at whatever forearm turn the display continues, and the
  // grip lands elsewhere than the carry's site.
  const rotation: IAutoMovieQuaternion = poseBones(
    body,
    resolveHumanPosture(body, free),
  ).get(`${side}Hand`)!.worldRotation;
  const posture: IAutoMovieMotionHumanPosture = {
    ...free,
    limbs: {
      ...free.limbs,
      [`${side}Arm`]: { ...free.limbs[`${side}Arm`]!, rotation },
    },
  };
  return {
    performer: { subject, body, at, yaw: 0, proficiency: { level: "trained" } },
    site: subject,
    side,
    posture: (): IAutoMovieMotionHumanPosture => posture,
    rotation,
  };
}

/** Read the body's actual grip socket from its resolved hand. */
function grip(
  carrier: IAutoMovieMotionHumanSharedCarry.ICarrier,
  posture: IAutoMovieMotionHumanPosture,
): IAutoMovieMotionHumanHand.IFrame {
  const body: IAutoMovieMotionHumanBody = carrier.performer.body;
  return HumanHand.frame(
    body,
    poseBones(body, resolveHumanPosture(body, posture)),
    carrier.side,
    "grip",
  );
}
