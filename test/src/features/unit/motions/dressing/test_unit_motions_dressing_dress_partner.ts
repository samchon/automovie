import { createWearable } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanDressPartner,
  IAutoMovieMotionHumanPickUp,
  IAutoMovieMotionHumanProp,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import {
  HumanRefusal,
  dressPartner,
  pickUp,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `dressPartner.plan` puts a held wearable on a partner's region: the dresser's
 * grip on it ends as it is worn, and naming oneself as the partner is refused.
 *
 * Scenario, the average man `a` at the origin facing +Z holding a watch in his
 * right hand, as a pick-up of it from a stand at his right left him (its grip
 * offset read where that pick-up closes), the small woman `b` standing 0.6 m
 * ahead facing him: putting the watch on her left wrist declares it worn at the
 * share his grip on it ends; naming himself is refused on `partner`.
 *
 * The bodies are built whole (`humanFixtureBody`).
 */
export async function test_unit_motions_dressing_dress_partner(): Promise<void> {
  // Plans the dressing arm on the whole body and reads the partner's surfaces.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const small: IAutoMovieMotionHumanBody = await humanFixtureBody("f-small");
  const watch: IAutoMovieMotionHumanProp = HumanObject.prop(
    "watch",
    createWearable({ kind: "watch" }),
    { position: { x: -0.25, y: 1.0, z: 0.2 }, rotation: Quaternion.identity() },
  );
  const taken: IAutoMovieMotionHumanPickUp.IParams = {
    prop: "watch",
    handle: "hold",
    hand: "right",
    lift: 0.05,
  };
  const lifted: IAutoMovieMotionHumanActionPlan = pickUp.plan(
    motionActionContext(body, taken, { props: [watch] }),
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
      Vector3.subtract(watch.frame.position, hand.worldPosition),
    ),
    rotation: Quaternion.multiply(inverse, watch.frame.rotation),
  };
  const standing: motionActionContext.IPartner = {
    subject: "b",
    body: small,
    plan: stand.plan(
      motionActionContext(
        small,
        { hold: 8, sway: 0 },
        { subject: "b", at: { x: 0, y: 0, z: 0.6 }, yaw: 180 },
      ),
    ),
  };
  const plan = (partner: string): IAutoMovieMotionHumanActionPlan => {
    const params: IAutoMovieMotionHumanDressPartner = {
      prop: "watch",
      partner,
      region: "wristLeft",
    };
    return dressPartner.plan(
      motionActionContext.after(body, lifted, params, {
        props: [watch],
        holds: { right: "watch" },
        carried: { right: offset },
        partners: [standing],
      }),
    );
  };
  const dressed: IAutoMovieMotionHumanActionPlan = plan("b");
  const worn = (dressed.wears ?? []).find((w) => w.prop === "watch");
  const grip = dressed.contacts.find(
    (w: IAutoMovieMotionHumanContactWindow): boolean =>
      w.kind === "grip" &&
      w.part === "rightHand" &&
      w.support.kind === "prop" &&
      w.support.subject === "watch",
  );
  TestValidator.predicate(
    "worn as the grip lets go",
    worn !== undefined && grip !== undefined && grip.to === worn.from,
  );
  let refused: boolean = false;
  try {
    plan("a");
  } catch (error: unknown) {
    refused = error instanceof HumanRefusal && error.axis === "partner";
  }
  TestValidator.predicate("not oneself", refused);
}
