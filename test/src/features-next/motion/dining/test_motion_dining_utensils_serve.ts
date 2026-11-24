import { createFoodPortion, createSpoon } from "@automovie/archetypes";
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
 * Serving seated at a table (#4005), right-handed on m-average and
 * left-handed on f-small.
 *
 * Scenarios:
 * 1. A spoon takes food from the platter.
 * 2. It leaves the food on the neighbour's plate, where it rests.
 * 3. The take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario, the bodies and the handedness.
 * @evidence contracts/development/testing.md#behavioral-verification Composes pickUp and two writes, a take and a leave, and reads the displayed food.
 * @evidence contracts/development/testing.md#independent-expectations The food's places are the archetypes' contacts; tolerances are named.
 * @evidence contracts/development/testing.md#distinguishing-cases Right- against left-handed diners, the scoop against the placing.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_dining_utensils_serve(): void {
  diningTable.run("serving", diningServe);
}

/** Serving: a spoon carries food from the platter to the neighbour's plate. */
function diningServe(
  body: IAutoMovieMotionHumanBody,
  label: string,
  side: AutoMovieHumanSide,
  checks: motionComplaints.IGatherer,
): void {
  const s: diningTable.IStage = diningTable.stage();
  // The dominant hand's side: world +X is the seated diner's left.
  const sign: number = side === "right" ? -1 : 1;
  const platter: IAutoMovieVector3 = diningTable.on(s, sign * 0.04, 0.1);
  const plate: IAutoMovieVector3 = diningTable.on(s, sign * 0.16, 0.06);
  const props: IAutoMovieMotionHumanProp[] = [
    ...s.props,
    everydayTake.prop(
      "platter",
      createFoodPortion({ id: "platter", kind: "steak" }),
      platter,
      undefined,
      true,
    ),
    everydayTake.prop(
      "plate",
      createFoodPortion({ id: "plate", kind: "steak" }),
      plate,
      undefined,
      true,
    ),
    everydayTake.prop(
      "serving",
      createFoodPortion({ id: "serving", kind: "morsel" }),
      { ...platter, y: platter.y + 0.02 },
    ),
    everydayTake.prop(
      "spoon",
      createSpoon({ id: "spoon" }),
      diningTable.on(s, sign * 0.15, 0.04),
    ),
  ];
  const chain: IAutoMovieMotionHumanChain = HumanChain.subject("actor")
    .sit({ seat: s.seat, hold: 1 })
    .pickUp({ prop: "spoon", handle: "grip", hand: side, lift: 0.05 })
    .registered("write", {
      tool: "spoon",
      tip: "face",
      on: "platter",
      surface: "top",
      stroke: [
        [0, -0.02],
        [0, 0],
      ],
      duration: 0.4,
      hand: side,
      take: { prop: "serving", point: "face" },
    })
    .registered("write", {
      tool: "spoon",
      tip: "face",
      on: "plate",
      surface: "top",
      stroke: [
        [0, 0],
        [0, 0.02],
      ],
      duration: 0.4,
      hand: side,
      leave: { prop: "serving", point: "pick" },
    });
  const take: HumanPerformance = diningTable.play(
    `${label} serve`,
    body,
    props,
    chain,
  );
  const writes: IAutoMovieMotionHumanSegment[] = diningTable.named(
    take,
    "write",
  );
  const scoop: IAutoMovieMotionHumanSegment = writes[0]!;
  const place: IAutoMovieMotionHumanSegment = writes[1]!;
  checks.check(
    `${label}: the food leaves the platter`,
    Vector3.distance(
      take.prop("serving", (scoop.end + place.start) / 2).position,
      take.prop("serving", 0).position,
    ) >= 0.05,
  );
  const rest: IAutoMovieVector3 = take.prop("serving", take.duration).position;
  checks.check(
    `${label}: the food rests on the neighbour's plate`,
    Vector3.distance({ ...rest, y: 0 }, { ...plate, y: 0 }) <= 0.06 &&
      rest.y >= plate.y,
  );
  checks.check(
    `${label}: the food stays on the plate once left`,
    Vector3.distance(take.prop("serving", place.end).position, rest) <=
      diningTable.HOLD,
  );
}
