import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCurtsy,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanFrame, HumanRefusal, curtsy } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { vclose } from "../../../internal/vclose";

/** A planted goal's rounding across the dip, metres. */
const HELD: number = 1e-9;

/**
 * The least lowering of the pelvis at the dip, metres: under half the default
 * depth (4.5 % of the hip height, some 4 cm).
 */
const DIP: number = 0.02;

/** The least lift of the crossing foot at mid-swing, metres: the toe's 15 mm. */
const LIFT: number = 0.015;

/** How near its entry footprint a returned ankle stands, metres. */
const RETURN: number = 0.01;

/**
 * `curtsy`'s plan crosses the rear foot behind the lead foot, dips on both
 * planted feet and returns to the entry stance.
 *
 * The law reads most of the body record: its rig, pose resolution, chains,
 * projection, rest joints, measure, surfaces and profile, so the test builds
 * the stored body (humanFixtureBody).
 *
 * Scenarios:
 *
 * 1. At `crossed` the rear ankle stands across the lead ankle, on the lead's side
 *    of it, and behind it.
 * 2. Both ankle goals hold from `crossed` through `uncrossOff`.
 * 3. The root lowers from `crossed` to `dip` and rises again by `uncrossOff`.
 * 4. Half way to `crossed` the rear foot is lifted off its entry height.
 * 5. At `returned` both ankles are back on their entry footprints.
 * 6. A zero depth is refused on the depth axis, and the law is cut only from
 *    `returned` on.
 */
export async function test_unit_motions_everyday_curtsy_plan(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  for (const rear of ["left", "right"] as const) {
    const lead: AutoMovieHumanSide = rear === "left" ? "right" : "left";
    const yaw: number = rear === "left" ? 0 : 35;
    const context: ReturnType<
      typeof motionActionContext<IAutoMovieMotionHumanCurtsy>
    > = motionActionContext<IAutoMovieMotionHumanCurtsy>(
      body,
      { side: rear },
      { yaw },
    );
    const plan: IAutoMovieMotionHumanActionPlan = curtsy.plan(context);
    const at: (name: string) => number = (name: string): number =>
      plan.events.find((e: IAutoMovieMotionEvent): boolean => e.name === name)!
        .share * plan.duration;
    const goal = (
      side: AutoMovieHumanSide,
      t: number,
    ): IAutoMovieHumanLimbGoal => plan.posture(t).limbs[`${side}Leg`]!;
    const local = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      HumanFrame.local({ origin: context.entry.posture.root, yaw }, point);

    // 1. Crossed behind and across.
    const crossed: number = at("crossed");
    const r: IAutoMovieVector3 = local(goal(rear, crossed).point);
    const l: IAutoMovieVector3 = local(goal(lead, crossed).point);
    TestValidator.predicate(
      `${rear}: crossed behind and across the lead ankle`,
      (r.x - l.x) * (lead === "left" ? 1 : -1) > 0 && r.z < l.z,
    );

    // 2. Both plants hold over the dip.
    for (const side of [lead, rear])
      TestValidator.predicate(
        `${rear}: the ${side} ankle holds over the dip`,
        [at("dip"), at("uncrossOff")].every((t: number): boolean =>
          vclose(goal(side, t).point, goal(side, crossed).point, HELD),
        ),
      );

    // 3. The dip.
    const root = (t: number): number => plan.posture(t).root.y;
    TestValidator.predicate(
      `${rear}: the pelvis dips and rises`,
      root(crossed) - root(at("dip")) > DIP &&
        root(at("uncrossOff")) - root(at("dip")) > DIP,
    );

    // 4. The crossing foot lifts.
    const swing: number = (at("stepOff") + crossed) / 2;
    TestValidator.predicate(
      `${rear}: the crossing foot lifts`,
      goal(rear, swing).point.y - context.entry.feet[rear].ankle.y > LIFT,
    );

    // 5. Back on the entry footprints.
    for (const side of [lead, rear])
      TestValidator.predicate(
        `${rear}: the ${side} ankle returns`,
        vclose(
          goal(side, plan.duration).point,
          context.entry.feet[side].ankle,
          RETURN,
        ),
      );
  }

  // 6. The refusals.
  const zero = (): IAutoMovieMotionHumanActionPlan =>
    curtsy.plan(motionActionContext(body, { side: "right", depth: 0 }));
  let refused: unknown;
  try {
    zero();
  } catch (error: unknown) {
    refused = error;
  }
  TestValidator.predicate(
    "zero depth is refused on the depth axis",
    refused instanceof HumanRefusal &&
      refused.kind === "parameter" &&
      refused.axis === "depth",
  );
  TestValidator.equals(
    "cut only from its return",
    curtsy.interrupts?.any?.[0]?.window,
    ["returned", 1],
  );
}
