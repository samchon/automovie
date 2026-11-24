import { createDrinkware } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanHandoverAction,
  IAutoMovieMotionHumanPickUp,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanReceive,
  IAutoMovieMotionMeeting,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import {
  handOver,
  pickUp,
  poseBones,
  receive,
  resolveHumanPosture,
  stand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `receive.plan` plans the receiver's half of a handover: the hand reaches the
 * prop the giver offers at the meeting both read, closes on it after the start
 * and keeps it to the end.
 *
 * Scenario, two average men facing 0.9 m apart; `a` hands a mug held in his
 * right hand over by `handOver` (planned first, its grip offset read where his
 * pick-up of it closes), the meeting putting the exchange midway between them
 * at waist height plus 0.2 m, its contacts local to a frame at the world
 * origin; `b` receives it in his right hand, the mug offered at the meeting:
 * `b`'s right-hand grip on the mug begins after the start and lasts to the
 * end.
 *
 * The bodies are built whole (`humanFixtureBody`).
 */
export async function test_unit_motions_handling_receive(): Promise<void> {
  // Plans the giving arm and reads the receiver's displayed body.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const shoulder: IAutoMovieVector3 = poseBones(
    body,
    resolveHumanPosture(body, stand.posture(body, { x: 0, y: 0, z: 0 }, 0)),
  ).get("rightUpperArm")!.worldPosition;
  const mug: IAutoMovieMotionHumanProp = HumanObject.prop(
    "mug",
    createDrinkware({ kind: "mug" }),
    {
      at: {
        x: shoulder.x,
        y: body.measure.waistHeight,
        z: 0.6 * (body.measure.upperArm + body.measure.forearm),
      },
      yaw: 0,
    },
  );
  const handle: string = mug.affordances!.find(
    (a: IAutoMovieAffordance): boolean => a.kind === "handle",
  )!.id;
  const taken: IAutoMovieMotionHumanPickUp.IParams = {
    prop: "mug",
    handle,
    hand: "right",
    lift: 0.05,
  };
  const lifted: IAutoMovieMotionHumanActionPlan = pickUp.plan(
    motionActionContext(body, taken, { props: [mug] }),
  );
  const closes: number =
    lifted.contacts.find(
      (w: IAutoMovieMotionHumanContactWindow): boolean =>
        w.kind === "grip" && w.part === "rightHand",
    )!.from * lifted.duration;
  const hand: IAutoMovieResolvedBone = poseBones(
    body,
    resolveHumanPosture(body, lifted.posture(closes)),
  ).get("rightHand")!;
  const inverse = Quaternion.inverse(hand.worldRotation);
  const offset: IAutoMovieRigidTransform = {
    position: Quaternion.rotateVector(
      inverse,
      Vector3.subtract(mug.frame.position, hand.worldPosition),
    ),
    rotation: Quaternion.multiply(inverse, mug.frame.rotation),
  };
  const receiver = stand.plan(
    motionActionContext(
      body,
      { hold: 4, sway: 0 },
      { subject: "b", at: { x: 0, y: 0, z: 0.9 }, yaw: 180 },
    ),
  );
  const met: IAutoMovieMotionMeeting = {
    kind: "handover",
    frame: { origin: { x: 0, y: 0, z: 0 }, yaw: 0 },
    contacts: { meet: { x: 0, y: body.measure.waistHeight + 0.2, z: 0.45 } },
    instants: { ready: 0.8, stroke: 0.9, relax: 1.2 },
    roles: [
      { name: "giver", subject: "a" },
      { name: "receiver", subject: "b" },
    ],
    solid: true,
  };
  const params: IAutoMovieMotionHumanHandoverAction.IParams = {
    prop: "mug",
    to: "b",
    handle,
  };
  const plan: IAutoMovieMotionHumanActionPlan = handOver.plan(
    motionActionContext.after(body, lifted, params, {
      props: [mug],
      holds: { right: "mug" },
      carried: { right: offset },
      meeting: () => met,
      partners: [
        { subject: "a", body, plan: lifted },
        { subject: "b", body, plan: receiver },
      ],
    }),
  );
  // The receiver's half, on the giver's planned handover: `b` takes the mug,
  // offered at the meeting, in his right hand.
  const offered: IAutoMovieMotionHumanProp = {
    ...mug,
    frame: {
      position: met.contacts.meet!,
      rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180),
    },
  };
  const taking: IAutoMovieMotionHumanReceive.IParams = {
    prop: "mug",
    partner: "a",
    handle,
  };
  const received: IAutoMovieMotionHumanActionPlan = receive.plan(
    motionActionContext(body, taking, {
      subject: "b",
      at: { x: 0, y: 0, z: 0.9 },
      yaw: 180,
      props: [offered],
      meeting: () => met,
      partners: [
        { subject: "a", body, plan },
        { subject: "b", body, plan: receiver },
      ],
    }),
  );
  const kept: IAutoMovieMotionHumanContactWindow | undefined =
    received.contacts.find(
      (w: IAutoMovieMotionHumanContactWindow): boolean =>
        w.kind === "grip" &&
        w.part === "rightHand" &&
        w.support.kind === "prop" &&
        w.support.subject === "mug",
    );
  TestValidator.predicate(
    "taken and kept",
    kept !== undefined && kept.from > 0 && kept.to === 1,
  );
}
