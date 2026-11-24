import {
  createBag,
  createFingerRing,
  createNecklace,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanProp,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import { HumanHand, pickUp } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { caneSweepScene } from "../../../internal/caneSweepScene";
import { everydayTake } from "../../../internal/everydayTake";
import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { humanFixture } from "../../../internal/fixtures/humanFixture";
import { motionActionContext } from "../../../internal/motionActionContext";
import { motionGraspUnit } from "../../../internal/motionGraspUnit";
import { motionPlanReading as R } from "../../../internal/motionPlanReading";
import { placeOverHeadScene } from "../../../internal/placeOverHeadScene";
import { slipRingScene } from "../../../internal/slipRingScene";

/** The touch contract's placement bound, metres: 10 mm. */
const GRIP: number = 0.01;

/** The wrist's rise after the grasp when no lift is asked, metres. */
const LIFT: number = 0.1;

/** The lift the loop and ring cases ask, metres. */
const ASKED: number = 0.05;

/** The closed hand's contact surfaces. */
const CONTACTS: readonly IAutoMovieMotionHumanHand.Surface[] = [
  "palm",
  "thumbTip",
  "thumbPad",
  "indexTip",
  "indexPad",
  "middleTip",
  "middlePad",
  "ringTip",
  "ringPad",
  "littleTip",
  "littlePad",
];

/**
 * `pickUp`'s plan closes a hand on a prop's handle and lifts it: at
 * `gripClosed` a contact surface of the closed hand lies within half the
 * handle's grasped width (`motionGraspUnit.width`) and 10 mm of the handle's
 * point, and by `lifted` the wrist has risen the asked lift within 10 mm.
 *
 * Scenarios, on both stored bodies:
 *
 * 1. A long cane fitted to the body, standing beside the right foot, by its grip
 *    and the default lift.
 * 2. A ribbon laid for the front and a chain laid for behind, by their holds.
 * 3. A finger ring by its hold from its stand, either hand.
 * 4. A tote by its strap held before the body, with no lift.
 */
export async function test_unit_motions_handling_pick_up_plan(): Promise<void> {
  for (const name of humanFixture.NAMES) {
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody(name);
    const cases: {
      label: string;
      prop: IAutoMovieMotionHumanProp;
      model: everydayTake.IPosable;
      handle: string;
      side: AutoMovieHumanSide;
      lift: number;
      asked?: number;
    }[] = [];
    const cane: caneSweepScene.Cane = caneSweepScene.fitted(body);
    cases.push({
      label: "the cane",
      prop: HumanObject.prop("cane", cane, {
        position: caneSweepScene.STAND,
        rotation: Quaternion.identity(),
      }),
      model: cane,
      handle: "grip",
      side: "right",
      lift: LIFT,
    });
    for (const pose of ["front", "behind"] as const) {
      const loop: placeOverHeadScene.Loop = createNecklace({
        id: "loop",
        kind: pose === "front" ? "ribbon" : "chain",
      });
      cases.push({
        label: `a loop for ${pose}`,
        prop: HumanObject.prop("loop", loop, placeOverHeadScene.stand(pose)),
        model: loop,
        handle: placeOverHeadScene.handle(pose),
        side: "right",
        lift: ASKED,
        asked: ASKED,
      });
    }
    for (const side of ["left", "right"] as const) {
      const ring: slipRingScene.Ring = createFingerRing({ id: "ring" });
      cases.push({
        label: `a ring in the ${side} hand`,
        prop: HumanObject.prop("ring", ring, slipRingScene.stand(side)),
        model: ring,
        handle: "hold",
        side,
        lift: ASKED,
        asked: ASKED,
      });
    }
    const tote: everydayTake.IPosable = createBag({ id: "tote", kind: "tote" });
    cases.push({
      label: "a tote by its strap",
      prop: everydayTake.prop("tote", tote, { x: 0, y: 0.7, z: 0.35 }),
      model: tote,
      handle: "strap",
      side: "right",
      lift: 0,
      asked: 0,
    });
    for (const c of cases) {
      const plan: IAutoMovieMotionHumanActionPlan = pickUp.plan(
        motionActionContext(
          body,
          {
            prop: c.prop.subject,
            handle: c.handle,
            hand: c.side,
            ...(c.asked === undefined ? {} : { lift: c.asked }),
          },
          { props: [c.prop] },
        ),
      );
      const closed: number = R.event(plan, "gripClosed")!;
      const lifted: number = R.event(plan, "lifted")!;
      const site: IAutoMovieAffordance = (c.model.affordances ?? []).find(
        (a: IAutoMovieAffordance): boolean => a.id === c.handle,
      )!;
      const frame: IAutoMovieRigidTransform = c.prop.frame;
      const at: IAutoMovieVector3 = Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, site.frame.translation),
      );
      const bones: ReturnType<typeof R.bones> = R.bones(body, plan, closed);
      const off: number = Math.min(
        ...CONTACTS.map((surface: IAutoMovieMotionHumanHand.Surface): number =>
          Vector3.distance(HumanHand.frame(body, bones, c.side, surface).point, at),
        ),
      );
      const half: number = motionGraspUnit.width(c.model, c.handle) / 2;
      TestValidator.predicate(
        `${name} ${c.label}: closes on the handle (${off} m, half width ${half} m)`,
        off <= half + GRIP,
      );
      const wrist = (t: number): number =>
        R.bones(body, plan, t).get(`${c.side}Hand`)!.worldPosition.y;
      const rise: number = wrist(lifted) - wrist(closed);
      TestValidator.predicate(
        `${name} ${c.label}: rises ${rise} m of ${c.lift} m`,
        Math.abs(rise - c.lift) <= GRIP,
      );
    }
  }
}
