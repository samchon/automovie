import { createDrinkware } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPickUp,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPutDown,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import {
  pickUp,
  poseBones,
  putDown,
  resolveHumanPosture,
  stand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `putDown.plan` carries a held prop to a place and lets it go: the hand's grip
 * on the prop is declared from the start until the release, and the wrist
 * travels the carried prop toward the place.
 *
 * Scenario, the average man standing at the origin facing +Z holding a mug in
 * the right hand as a pick-up of it left him, setting it down 0.2 m to his left
 * of where it was taken, at the same height:
 *
 * 1. The plan declares the right hand's grip on the mug from its start, ending
 *    before the plan does: the hand lets go.
 * 2. As the grip ends the right wrist has moved toward the place: nearer to it
 *    than where the pick-up left the wrist, by more than half the 0.2 m.
 *
 * The body is built whole (`humanFixtureBody`).
 */
export async function test_unit_motions_handling_put_down(): Promise<void> {
  // Plans the carry on the whole body: the rig, the arm chains, the hand's colliders and the stance.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const shoulder: IAutoMovieVector3 = poseBones(
    body,
    resolveHumanPosture(body, stand.posture(body, { x: 0, y: 0, z: 0 }, 0)),
  ).get("rightUpperArm")!.worldPosition;
  const at: IAutoMovieVector3 = {
    x: shoulder.x,
    y: body.measure.waistHeight,
    z: 0.6 * (body.measure.upperArm + body.measure.forearm),
  };
  const mug: IAutoMovieMotionHumanProp = HumanObject.prop(
    "mug",
    createDrinkware({ kind: "mug" }),
    { at, yaw: 0 },
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
  const place: IAutoMovieVector3 = { ...at, x: at.x + 0.2 };
  const params: IAutoMovieMotionHumanPutDown.IParams = {
    prop: "mug",
    to: place,
  };
  const plan: IAutoMovieMotionHumanActionPlan = putDown.plan(
    motionActionContext.after(body, lifted, params, {
      props: [mug],
      holds: { right: "mug" },
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
    "the release",
    grip !== undefined && grip.from === 0 && grip.to < 1,
  );
  const wrist = (seconds: number): IAutoMovieVector3 =>
    poseBones(body, resolveHumanPosture(body, plan.posture(seconds))).get(
      "rightHand",
    )!.worldPosition;
  TestValidator.predicate(
    "toward the place",
    Vector3.distance(wrist(0), place) -
      Vector3.distance(wrist(grip!.to * plan.duration), place) >
      0.1,
  );
}
