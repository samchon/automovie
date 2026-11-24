import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanRefusal, crabWalk } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../../internal/fixtures/humanFixture";
import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { motionPlanReading as R } from "../../../internal/motionPlanReading";

/** The crawl's travel, metres in the performer's frame. */
const TO: IAutoMovieVector3 = { x: 0, y: 0, z: 1.2 };

/** The authored pelvis height, statures. */
const HEIGHT: number = 0.22;

/** The pelvis holds its height within this while travelling, metres. */
const LEVEL: number = 0.05;

/** The pelvis arrives within this of the travel, metres. */
const ARRIVE: number = 0.03;

/** A part other than the hands and feet stays this far above the floor, metres. */
const CLEAR: number = 0.05;

/** The bones that stay off the floor. */
const OFF: readonly AutoMovieHumanoidBone[] = ["hips", "spine", "chest", "head"];

/** Samples of the travel. */
const SAMPLES: number = 16;

/** Rounding of a contact window's share edge. */
const SHARE: number = 1e-9;

/**
 * `crabWalk`'s plan settles supine onto the hands and feet and travels the
 * authored displacement on them, the pelvis at the authored height and the
 * supports in diagonal pairs.
 *
 * The law reads most of the body record: its rig, pose resolution, chains,
 * projection, rest joints, measure, surfaces and profile, so the test builds
 * the stored body (`humanFixtureBody`).
 *
 * Scenarios, on both stored bodies, feet first and head first, sampled from
 * `settled` to the end:
 *
 * 1. The pelvis holds 0.22 statures within 5 cm, and the hips, spine, chest and
 *    head stay 5 cm off the floor.
 * 2. At every sample a diagonal pair (a hand and the opposite foot) bears.
 * 3. The pelvis travels the authored 1.2 m within 3 cm; feet first and head
 *    first end facing opposite ways, within a degree.
 * 4. A backbend beyond the spine's extension is refused on `backbend`, and a
 *    pelvis height of 0.6 statures on `height`.
 */
export async function test_unit_motions_floor_crab_walk_plan(): Promise<void> {
  for (const name of humanFixture.NAMES) {
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody(name);
    const yaws: number[] = [];
    for (const lead of ["feet", "head"] as const) {
      const plan: IAutoMovieMotionHumanActionPlan = crabWalk.plan(
        motionActionContext(body, { to: TO, lead, height: HEIGHT }),
      );
      const settled: number = R.event(plan, "settled")!;
      const label: string = `${name} ${lead} first`;
      const bearing = (part: IAutoMovieMotionHumanContactWindow["part"], share: number): boolean =>
        plan.contacts.some(
          (c: IAutoMovieMotionHumanContactWindow): boolean =>
            c.part === part &&
            c.kind === "plant" &&
            c.from <= share + SHARE &&
            c.to >= share - SHARE,
        );
      let level: number = 0;
      let lowest: number = Infinity;
      let diagonal: boolean = true;
      for (let i: number = 0; i <= SAMPLES; ++i) {
        const t: number = settled + ((plan.duration - settled) * i) / SAMPLES;
        const bones: ReturnType<typeof R.bones> = R.bones(body, plan, t);
        level = Math.max(
          level,
          Math.abs(bones.get("hips")!.worldPosition.y - HEIGHT * body.measure.stature),
        );
        for (const bone of OFF) lowest = Math.min(lowest, bones.get(bone)!.worldPosition.y);
        const share: number = t / plan.duration;
        diagonal &&=
          (bearing("rightHand", share) && bearing("leftFoot", share)) ||
          (bearing("leftHand", share) && bearing("rightFoot", share));
      }
      TestValidator.predicate(`${label}: the pelvis holds (${level} m)`, level <= LEVEL);
      TestValidator.predicate(`${label}: the trunk stays off (${lowest} m)`, lowest >= CLEAR);
      TestValidator.predicate(`${label}: a diagonal pair bears`, diagonal);
      const moved: IAutoMovieVector3 = Vector3.subtract(
        R.bones(body, plan, plan.duration).get("hips")!.worldPosition,
        R.bones(body, plan, settled).get("hips")!.worldPosition,
      );
      TestValidator.predicate(
        `${label}: travels`,
        Math.abs(moved.z - TO.z) <= ARRIVE && Math.abs(moved.x - TO.x) <= ARRIVE,
      );
      yaws.push(plan.posture(plan.duration).yaw);
    }
    const apart: number = Math.abs((((yaws[0]! - yaws[1]!) % 360) + 360) % 360);
    TestValidator.predicate(
      `${name}: opposite ways (${apart} degrees)`,
      Math.abs(apart - 180) <= 1,
    );
    for (const [axis, params] of [
      ["backbend", { to: TO, backbend: true }],
      ["height", { to: TO, height: 0.6 }],
    ] as const) {
      const refusal: unknown = (() => {
        try {
          crabWalk.plan(motionActionContext(body, params));
        } catch (error: unknown) {
          return error;
        }
        return undefined;
      })();
      TestValidator.predicate(
        `${name}: refused on ${axis}`,
        refusal instanceof HumanRefusal && refusal.axis === axis,
      );
    }
  }
}
