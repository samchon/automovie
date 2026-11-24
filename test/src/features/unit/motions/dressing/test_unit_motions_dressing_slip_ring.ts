import { createFingerRing } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPickUp,
  IAutoMovieMotionHumanPresentHand,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSlipRing,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import {
  HumanRefusal,
  pickUp,
  poseBones,
  presentHand,
  resolveHumanPosture,
  slipRing,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `slipRing.plan` slides a held ring onto a partner's presented ring finger:
 * the ring hand's grip on the ring ends as the ring is worn on the finger's
 * proximal phalanx, the other hand holding the partner's palm; naming oneself
 * as the partner is refused.
 *
 * Scenario, the average man `a` at the origin facing +Z holding a ring in his
 * right hand as a pick-up of it from a stand ahead of his right side left him
 * (its grip offset read where that pick-up closes), the small woman `b` 0.75 m
 * ahead facing him presenting her left hand:
 *
 * 1. The ring is worn on her `leftRingProximal` at the share his right hand's grip
 *    on it ends.
 * 2. His left hand grips on her.
 * 3. Naming himself as the partner is refused on `partner`.
 *
 * The bodies are built whole (`humanFixtureBody`).
 */
export async function test_unit_motions_dressing_slip_ring(): Promise<void> {
  // Plans both arms and the ring's slide on the whole bodies.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const small: IAutoMovieMotionHumanBody = await humanFixtureBody("f-small");
  const ring: IAutoMovieMotionHumanProp = HumanObject.prop(
    "ring",
    createFingerRing({ id: "ring" }),
    { position: { x: -0.25, y: 1.1, z: 0.3 }, rotation: Quaternion.identity() },
  );
  const taken: IAutoMovieMotionHumanPickUp.IParams = {
    prop: "ring",
    handle: "hold",
    hand: "right",
    lift: 0.05,
  };
  const lifted: IAutoMovieMotionHumanActionPlan = pickUp.plan(
    motionActionContext(body, taken, { props: [ring] }),
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
      Vector3.subtract(ring.frame.position, hand.worldPosition),
    ),
    rotation: Quaternion.multiply(inverse, ring.frame.rotation),
  };
  const presenting: IAutoMovieMotionHumanPresentHand = {
    side: "left",
    hold: 8,
  };
  const presenter: motionActionContext.IPartner = {
    subject: "b",
    body: small,
    plan: presentHand.plan(
      motionActionContext(small, presenting, {
        subject: "b",
        at: { x: 0, y: 0, z: 0.75 },
        yaw: 180,
      }),
    ),
  };
  const plan = (partner: string): IAutoMovieMotionHumanActionPlan => {
    const params: IAutoMovieMotionHumanSlipRing = {
      prop: "ring",
      partner,
      hand: "left",
      side: "right",
    };
    return slipRing.plan(
      motionActionContext.after(body, lifted, params, {
        props: [ring],
        holds: { right: "ring" },
        carried: { right: offset },
        partners: [presenter],
      }),
    );
  };
  const slipped: IAutoMovieMotionHumanActionPlan = plan("b");
  const worn = (slipped.wears ?? []).find((w) => w.prop === "ring");
  const grip = slipped.contacts.find(
    (w: IAutoMovieMotionHumanContactWindow): boolean =>
      w.kind === "grip" &&
      w.part === "rightHand" &&
      w.support.kind === "prop" &&
      w.support.subject === "ring",
  );
  TestValidator.predicate(
    "worn as the grip lets go",
    worn !== undefined &&
      worn.bone === "leftRingProximal" &&
      grip !== undefined &&
      grip.to === worn.from &&
      slipped.contacts.some(
        (w: IAutoMovieMotionHumanContactWindow): boolean =>
          w.kind === "grip" &&
          w.part === "leftHand" &&
          w.support.kind === "person" &&
          w.support.subject === "b",
      ),
  );
  let refused: boolean = false;
  try {
    plan("a");
  } catch (error: unknown) {
    refused = error instanceof HumanRefusal && error.axis === "partner";
  }
  TestValidator.predicate("not oneself", refused);
}
