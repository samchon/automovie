import { createLongTool } from "@automovie/archetypes";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPushPull,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import { pushPull } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * How far the push carries the body forward, at least, metres: 20 cm, the
 * travel the household workflow demands of a pushed mop, which the gripped
 * hands carry with the chest.
 */
const TRAVEL: number = 0.2;

/**
 * `pushPull.plan` moves a load by its two handles: the hands close on the
 * handles and are carried with the chest while the walk goes to `to`.
 *
 * Scenario, the average man standing at the origin facing +Z with a mop
 * standing 0.41 m ahead, pushing it forward by its upper grip in the left hand
 * and its lower grip in the right, a light load, to (0, 0, 0.38):
 *
 * 1. The plan declares both hands' grips on the mop.
 * 2. The walk carries the root more than 20 cm straight forward, and with it the
 *    gripped load.
 *
 * The body is built whole (`humanFixtureBody`).
 */
export async function test_unit_motions_handling_push_pull(): Promise<void> {
  // Plans both arms, the sink and the walk on the whole body.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const mop: IAutoMovieMotionHumanProp = HumanObject.prop(
    "mop",
    createLongTool({ kind: "mop" }),
    { at: { x: 0, y: 0, z: 0.41 }, yaw: 0 },
  );
  const params: IAutoMovieMotionHumanPushPull.IParams = {
    prop: "mop",
    way: "push",
    left: "upperGrip",
    right: "lowerGrip",
    load: "light",
    to: { x: 0, y: 0, z: 0.38 },
  };
  const plan: IAutoMovieMotionHumanActionPlan = pushPull.plan(
    motionActionContext(body, params, { props: [mop] }),
  );
  const grips: string[] = plan.contacts
    .filter(
      (w: IAutoMovieMotionHumanContactWindow): boolean =>
        w.kind === "grip" &&
        w.support.kind === "prop" &&
        w.support.subject === "mop",
    )
    .map((w: IAutoMovieMotionHumanContactWindow): string => w.part);
  const root = plan.posture(plan.duration).root;
  TestValidator.equals("both hands", [...grips].sort(), [
    "leftHand",
    "rightHand",
  ]);
  TestValidator.predicate(
    "walked forward",
    root.z > TRAVEL && Math.abs(root.x) <= 1e-6,
  );
}
