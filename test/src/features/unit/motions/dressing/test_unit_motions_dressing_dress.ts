import { createWearable } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanDress,
  IAutoMovieMotionHumanPickUp,
  IAutoMovieMotionHumanProp,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import {
  dress,
  pickUp,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `dress.plan` puts on a hat held in one hand: the hand carries it rigidly so
 * its `wear` socket comes onto the crown, and from the stroke it is worn on the
 * head, the hand's grip on it ending as it is worn.
 *
 * Scenario, the average man standing at the origin facing +Z holding a hat in
 * his right hand as a pick-up of it from a waist-high stand ahead of his right
 * shoulder left him (its grip offset read where that pick-up closes): putting
 * it on declares the hat worn on the head at the share the right hand's grip on
 * it ends.
 *
 * The body is built whole (`humanFixtureBody`).
 */
export async function test_unit_motions_dressing_dress(): Promise<void> {
  // Plans the carrying arm and the second hand on the whole body.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const shoulder: IAutoMovieVector3 = poseBones(
    body,
    resolveHumanPosture(body, stand.posture(body, { x: 0, y: 0, z: 0 }, 0)),
  ).get("rightUpperArm")!.worldPosition;
  const hat: IAutoMovieMotionHumanProp = HumanObject.prop(
    "hat",
    createWearable({ kind: "hat" }),
    {
      at: {
        x: shoulder.x,
        y: body.measure.waistHeight,
        z: 0.6 * (body.measure.upperArm + body.measure.forearm),
      },
      yaw: 0,
    },
  );
  const taken: IAutoMovieMotionHumanPickUp.IParams = {
    prop: "hat",
    handle: "hold",
    hand: "right",
    lift: 0.05,
  };
  const lifted: IAutoMovieMotionHumanActionPlan = pickUp.plan(
    motionActionContext(body, taken, { props: [hat] }),
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
      Vector3.subtract(hat.frame.position, hand.worldPosition),
    ),
    rotation: Quaternion.multiply(inverse, hat.frame.rotation),
  };
  const params: IAutoMovieMotionHumanDress.IParams = {
    item: "hat",
    prop: "hat",
    hand: "right",
  };
  const plan: IAutoMovieMotionHumanActionPlan = dress.plan(
    motionActionContext.after(body, lifted, params, {
      props: [hat],
      holds: { right: "hat" },
      carried: { right: offset },
    }),
  );
  const worn = (plan.wears ?? []).find((w) => w.prop === "hat");
  const grip = plan.contacts.find(
    (w: IAutoMovieMotionHumanContactWindow): boolean =>
      w.kind === "grip" &&
      w.part === "rightHand" &&
      w.support.kind === "prop" &&
      w.support.subject === "hat",
  );
  TestValidator.predicate(
    "worn on the head as the grip lets go",
    worn !== undefined &&
      worn.bone === "head" &&
      grip !== undefined &&
      grip.to === worn.from,
  );
}
