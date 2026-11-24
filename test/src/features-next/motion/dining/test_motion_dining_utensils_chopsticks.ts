import {
  createBowl,
  createChopsticks,
  createFoodPortion,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";

import { diningTable } from "../../../features/internal/diningTable";
import { everydayTake } from "../../../features/internal/everydayTake";
import { motionComplaints } from "../../../features/internal/motionComplaints";

/**
 * Chopsticks seated at a table (#4005), right-handed on m-average and
 * left-handed on f-small.
 *
 * Scenarios:
 * 1. The tips close on a morsel, which stays between them to the mouth.
 * 2. The fixed stick stays still in the hand.
 * 3. The other hand lifts the rice bowl to the chin.
 * 4. The take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario, the bodies and the handedness.
 * @evidence contracts/development/testing.md#behavioral-verification Composes pickUp, write, workHeld with a take, a second pickUp and workHeld, and eatWith, and reads displayed sticks, food, bowl and bones.
 * @evidence contracts/development/testing.md#independent-expectations The food's places are the archetypes' contacts; tolerances are named.
 * @evidence contracts/development/testing.md#distinguishing-cases Right- against left-handed diners, the pinching against the holding hand.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_dining_utensils_chopsticks(): void {
  diningTable.run("chopsticks", diningChopsticks);
}

/** Chopsticks: pinch a morsel to the mouth with the bowl raised to the chin. */
function diningChopsticks(
  body: IAutoMovieMotionHumanBody,
  label: string,
  side: AutoMovieHumanSide,
  checks: motionComplaints.IGatherer,
): void {
  const s: diningTable.IStage = diningTable.stage();
  const other: AutoMovieHumanSide = side === "right" ? "left" : "right";
  // The dominant hand's side: world +X is the seated diner's left.
  const sign: number = side === "right" ? -1 : 1;
  const sticks = createChopsticks({ id: "sticks" });
  const rice: IAutoMovieVector3 = diningTable.on(s, sign * 0.15, 0.08);
  const props: IAutoMovieMotionHumanProp[] = [
    ...s.props,
    everydayTake.prop(
      "rice",
      createFoodPortion({ id: "rice", kind: "steak" }),
      rice,
      undefined,
      true,
    ),
    everydayTake.prop(
      "morsel",
      createFoodPortion({ id: "morsel", kind: "morsel" }),
      { ...rice, y: rice.y + 0.02 },
    ),
    everydayTake.prop("sticks", sticks, diningTable.on(s, sign * 0.18, 0.07)),
    everydayTake.prop(
      "bowl",
      createBowl({ id: "bowl" }),
      diningTable.on(s, -sign * 0.2, 0.12),
    ),
  ];
  // Seated, the chin stands about the standing shoulder less the thigh's drop.
  const chin: number = body.measure.shoulderHeight - 0.3;
  const chain: IAutoMovieMotionHumanChain = HumanChain.subject("actor")
    .sit({ seat: s.seat, hold: 1 })
    .pickUp({ prop: "sticks", handle: "grip", hand: side, lift: 0.05 })
    .registered("write", {
      tool: "sticks",
      tip: "tips",
      on: "rice",
      surface: "top",
      stroke: [
        [0, -0.01],
        [0, 0],
      ],
      duration: 0.3,
      hand: side,
    })
    .registered("workHeld", {
      prop: "sticks",
      hand: side,
      drive: [{ articulation: "pinch", to: 12 }],
      take: { prop: "morsel", point: "tips" },
      duration: 0.3,
    })
    .pickUp({ prop: "bowl", handle: "body", hand: other, lift: 0.05 })
    .registered("workHeld", {
      prop: "bowl",
      hand: other,
      at: { out: 0.2, up: chin - 0.15, forward: 0.3, level: true },
      duration: 0.5,
    })
    .registered("eatWith", { held: "sticks", point: "tips", hand: side });
  const take: HumanPerformance = diningTable.play(
    `${label} chopsticks`,
    body,
    props,
    chain,
  );
  const pinch: IAutoMovieMotionHumanSegment = diningTable.named(
    take,
    "workHeld",
  )[0]!;
  const bite: IAutoMovieMotionHumanSegment = diningTable.named(
    take,
    "eatWith",
  )[0]!;
  checks.check(
    `${label}: the tips close on the morsel`,
    Math.abs((take.state("sticks", pinch.end)["pinch"] ?? 0) - 12) <= 0.5,
  );
  const tips: (t: number) => IAutoMovieVector3 = (
    t: number,
  ): IAutoMovieVector3 => everydayTake.point(take, sticks, "sticks", "tips", t);
  const gap: number = Vector3.distance(
    take.prop("morsel", pinch.end).position,
    tips(pinch.end),
  );
  let held: number = 0;
  for (let i: number = 0; i <= 12; ++i) {
    const t: number = pinch.end + ((bite.end - pinch.end) * i) / 12;
    held = Math.max(
      held,
      Math.abs(
        Vector3.distance(take.prop("morsel", t).position, tips(t)) - gap,
      ),
    );
  }
  checks.check(
    `${label}: the morsel stays between the tips to the mouth`,
    held <= diningTable.HOLD && gap <= 0.03,
  );
  checks.check(
    `${label}: the fixed stick stays still in the hand`,
    everydayTake.drift(take, side, "sticks", pinch.start, bite.end) <=
      diningTable.HOLD,
  );
  const middle: number = (bite.start + bite.end) / 2;
  checks.check(
    `${label}: the morsel reaches the mouth`,
    Vector3.distance(
      take.prop("morsel", middle).position,
      diningTable.mouth(take, middle),
    ) <= 0.15,
  );
  const lifted: IAutoMovieMotionHumanSegment = diningTable.named(
    take,
    "workHeld",
  )[1]!;
  checks.check(
    `${label}: the bowl is raised to the chin`,
    Math.abs(take.prop("bowl", lifted.end).position.y - (chin - 0.15)) <=
      diningTable.MOUTH,
  );
}
