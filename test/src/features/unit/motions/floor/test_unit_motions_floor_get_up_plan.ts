import { physicalShapeBounds } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import {
  HumanColliders,
  HumanRefusal,
  crawl,
  getUp,
  lieDown,
  stand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { motionPlanReading as R } from "../../../internal/motionPlanReading";

/** How far under the floor a collider may lie, metres: 5 mm. */
const FLOOR: number = 0.005;

/** How near the quiet stance's hips the risen hips stand, metres: 20 mm. */
const HIPS: number = 0.02;

/** Samples a second over the rise. */
const RATE: number = 30;

/**
 * `getUp`'s plan rises from the floor to the quiet stance: from the back by
 * either pattern, from the front by the rotation, and from the hands and knees
 * past them; a body already standing is refused.
 *
 * The law reads most of the body record: its rig, pose resolution, chains,
 * projection, rest joints, measure, surfaces and profile, so the test builds
 * the stored body (humanFixtureBody).
 *
 * Scenarios:
 *
 * 1. From supine (symmetric and rotation), prone and the hands and knees the
 *    plan ends standing, its hips within 20 mm of the quiet stance's.
 * 2. No collider passes 5 mm under the floor at any sample of the rise.
 * 3. A standing entry is refused on its base, naming lying, kneeling and
 *    crouched as the floor bases it rises from.
 */
export async function test_unit_motions_floor_get_up_plan(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const quiet: number = R.bones(
    body,
    {
      duration: 1,
      events: [],
      contacts: [],
      posture: (): IAutoMovieMotionHumanPosture =>
        stand.posture(body, { x: 0, y: 0, z: 0 }, 0),
    },
    0,
  ).get("hips")!.worldPosition.y;
  const ended = (
    plan: IAutoMovieMotionHumanActionPlan,
  ): IAutoMovieMotionHumanPosture => plan.posture(plan.duration);
  const entries: [string, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanBase, "symmetric" | "rotation" | undefined][] = [
    [
      "supine symmetric",
      ended(lieDown.plan(motionActionContext(body, { kind: "supine", hold: 0.3 }))),
      { kind: "lying" },
      "symmetric",
    ],
    [
      "supine rotation",
      ended(lieDown.plan(motionActionContext(body, { kind: "supine", hold: 0.3 }))),
      { kind: "lying" },
      "rotation",
    ],
    [
      "prone",
      ended(lieDown.plan(motionActionContext(body, { kind: "prone", hold: 0.3 }))),
      { kind: "lying" },
      undefined,
    ],
    [
      "hands and knees",
      ended(crawl.plan(motionActionContext(body, { count: 1 }))),
      { kind: "kneeling" },
      undefined,
    ],
  ];
  for (const [label, posture, base, pattern] of entries) {
    const plan: IAutoMovieMotionHumanActionPlan = getUp.plan(
      motionActionContext(
        body,
        pattern === undefined ? {} : { pattern },
        { posture, base },
      ),
    );
    TestValidator.equals(`${label}: ends standing`, plan.base?.kind, "standing");
    const hips: number = R.bones(body, plan, plan.duration).get("hips")!
      .worldPosition.y;
    TestValidator.predicate(
      `${label}: risen hips at ${hips} m`,
      Math.abs(hips - quiet) <= HIPS,
    );
    let lowest: number = Infinity;
    for (let t: number = 0; t <= plan.duration; t += 1 / RATE)
      for (const { pose, shapes } of HumanColliders.placed(
        body,
        R.bones(body, plan, t),
      ))
        for (const shape of shapes)
          lowest = Math.min(lowest, physicalShapeBounds.lowest(pose, shape));
    TestValidator.predicate(
      `${label}: above the floor (${lowest} m)`,
      lowest >= -FLOOR,
    );
  }

  // 3. Standing.
  let refused: unknown;
  try {
    getUp.plan(motionActionContext(body, {}));
  } catch (error: unknown) {
    refused = error;
  }
  TestValidator.predicate(
    "a standing entry is refused with the floor bases",
    refused instanceof HumanRefusal &&
      refused.kind === "base" &&
      refused.value === "standing" &&
      refused.feasible?.kind === "alternatives" &&
      [...refused.feasible.values].sort().join() === "crouched,kneeling,lying",
  );
}
