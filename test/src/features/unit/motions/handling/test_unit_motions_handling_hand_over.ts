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
  resolveHumanPosture,
  stand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `handOver.plan` plans the giver's half of a handover: the held prop is
 * carried to the meeting both partners read, held there while the receiver's
 * grip closes, and let go.
 *
 * Scenario, two average men facing 0.9 m apart; `a` holds a mug in his right
 * hand as a pick-up of it left him (its grip offset read where that pick-up
 * closes), the meeting putting the exchange midway between them at waist height
 * plus 0.2 m (its contacts local to a frame at the world origin): handing it to
 * `b` keeps `a`'s right-hand grip on the mug from the start and lets it go
 * before the plan ends.
 *
 * The bodies are built whole (`humanFixtureBody`).
 */
export async function test_unit_motions_handling_hand_over(): Promise<void> {
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
  const grip: IAutoMovieMotionHumanContactWindow | undefined =
    plan.contacts.find(
      (w: IAutoMovieMotionHumanContactWindow): boolean =>
        w.kind === "grip" &&
        w.part === "rightHand" &&
        w.support.kind === "prop" &&
        w.support.subject === "mug",
    );
  TestValidator.predicate(
    "held, then let go",
    grip !== undefined && grip.from === 0 && grip.to < 1,
  );
}
