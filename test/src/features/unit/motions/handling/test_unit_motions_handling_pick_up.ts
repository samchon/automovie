import { createDrinkware } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPickUp,
  IAutoMovieMotionHumanProp,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import {
  pickUp,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * `pickUp.plan` reaches a hand to a prop's handle, closes on it and lifts it:
 * the plan declares the hand's grip on the prop, carrying it, from the closure
 * to the end, and the wrist arrives at the handle as the grip begins.
 *
 * Scenario, the average man standing at the origin facing +Z, a mug on a
 * waist-high stand ahead of his right shoulder at 0.6 of his arm's length,
 * picked up by its handle with the right hand and lifted 0.05 m:
 *
 * 1. The plan declares one carrying grip of the right hand on the mug, ending with
 *    the plan.
 * 2. As the grip begins the right wrist lies within a hand's length of the handle,
 *    the most a wrist lies from what its palm holds.
 * 3. The left wrist does not move: within a centimetre of where it hung.
 *
 * The body is built whole (`humanFixtureBody`): the plan solves the arm, the
 * fingers and the stance on the whole body record.
 */
export async function test_unit_motions_handling_pick_up(): Promise<void> {
  // Plans the reach on the whole body: the rig, the arm chains, the hand's colliders and the stance.
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
  const params: IAutoMovieMotionHumanPickUp.IParams = {
    prop: "mug",
    handle,
    hand: "right",
    lift: 0.05,
  };
  const plan: IAutoMovieMotionHumanActionPlan = pickUp.plan(
    motionActionContext(body, params, { props: [mug] }),
  );
  const grips: IAutoMovieMotionHumanContactWindow[] = plan.contacts.filter(
    (w: IAutoMovieMotionHumanContactWindow): boolean =>
      w.kind === "grip" &&
      w.support.kind === "prop" &&
      w.support.subject === "mug",
  );
  TestValidator.predicate(
    "one carrying grip",
    grips.length === 1 && grips[0]!.part === "rightHand" && grips[0]!.to === 1,
  );
  const local = mug.points[handle]!;
  const world: IAutoMovieVector3 = Vector3.add(
    mug.frame.position,
    Quaternion.rotateVector(mug.frame.rotation, local.point),
  );
  const read = (seconds: number) =>
    poseBones(body, resolveHumanPosture(body, plan.posture(seconds)));
  const closed = read(grips[0]!.from * plan.duration);
  const hung = read(0);
  TestValidator.predicate(
    "on the handle",
    Vector3.distance(closed.get("rightHand")!.worldPosition, world) <=
      body.measure.hand &&
      Vector3.distance(
        closed.get("leftHand")!.worldPosition,
        hung.get("leftHand")!.worldPosition,
      ) <= 0.01,
  );
}
