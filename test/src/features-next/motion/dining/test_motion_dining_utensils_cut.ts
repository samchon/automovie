import {
  createFoodPortion,
  createFork,
  createTableKnife,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance, HumanRefusal } from "@automovie/motions";
import { HUMAN_LEXICON } from "@automovie/motions/internal";

import { diningTable } from "../../../features/internal/diningTable";
import { everydayTake } from "../../../features/internal/everydayTake";
import { motionComplaints } from "../../../features/internal/motionComplaints";

/**
 * Knife and fork, continental, seated at a table (#4005), right-handed on
 * m-average and left-handed on f-small.
 *
 * Scenarios:
 * 1. The fork's tines pin the steak while the knife saws across it, its
 *    working point crossing the food.
 * 2. The fork takes the cut piece, a food of its own, which rides the fork
 *    to the mouth.
 * 3. A plate beyond the seated reach is refused (once, on m-average).
 * 4. The take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario, the bodies, the handedness and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Composes pickUp, write with a steadying fork, a take and eatWith, and reads displayed utensils, food and bones.
 * @evidence contracts/development/testing.md#independent-expectations The food's places are the archetypes' contacts; tolerances are named.
 * @evidence contracts/development/testing.md#distinguishing-cases Right- against left-handed diners, the saw against the take, a plate within against beyond reach.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_dining_utensils_cut(): void {
  diningTable.run("knife and fork", diningCut);
}

/** Knife and fork: pin, saw, take the piece and bite. */
function diningCut(
  body: IAutoMovieMotionHumanBody,
  label: string,
  side: AutoMovieHumanSide,
  checks: motionComplaints.IGatherer,
): void {
  const s: diningTable.IStage = diningTable.stage();
  const other: AutoMovieHumanSide = side === "right" ? "left" : "right";
  // The dominant hand's side: world +X is the seated diner's left.
  const sign: number = side === "right" ? -1 : 1;
  const steak = createFoodPortion({ id: "steak", kind: "steak" });
  const piece = createFoodPortion({ id: "piece", kind: "piece" });
  const plate: IAutoMovieVector3 = diningTable.on(s, sign * 0.04, 0.08);
  // The piece abuts the steak's end on the knife's side.
  const props: IAutoMovieMotionHumanProp[] = [
    ...s.props,
    everydayTake.prop("steak", steak, plate, undefined, true),
    everydayTake.prop("piece", piece, {
      ...plate,
      x: plate.x + sign * (0.06 + 0.0125),
    }),
    everydayTake.prop(
      "knife",
      createTableKnife({ id: "knife" }),
      diningTable.on(s, sign * 0.18, 0.07),
    ),
    everydayTake.prop(
      "fork",
      createFork({ id: "fork" }),
      diningTable.on(s, -sign * 0.18, 0.07),
    ),
  ];
  const edge: number = sign * 0.06;
  const chain: IAutoMovieMotionHumanChain = HumanChain.subject("actor")
    .sit({ seat: s.seat, hold: 1 })
    .pickUp({ prop: "fork", handle: "grip", hand: other, lift: 0.05 })
    .pickUp({ prop: "knife", handle: "grip", hand: side, lift: 0.05 })
    .registered("write", {
      tool: "knife",
      tip: "face",
      on: "steak",
      surface: "top",
      stroke: [
        [edge, -0.03],
        [edge, 0.03],
        [edge, -0.03],
        [edge, 0.03],
      ],
      duration: 1.2,
      hand: side,
      // The fork pins a hand's breadth from the knife.
      steady: {
        tool: "fork",
        tip: "face",
        at: [edge - sign * everydayTake.BREADTH * body.measure.hand, 0],
      },
    })
    .registered("write", {
      tool: "fork",
      tip: "face",
      on: "steak",
      surface: "top",
      stroke: [
        [edge - sign * 0.004, 0],
        [edge, 0],
      ],
      duration: 0.3,
      hand: other,
      take: { prop: "piece", point: "face" },
    })
    .registered("eatWith", { held: "fork", point: "face", hand: other });
  const take: HumanPerformance = diningTable.play(
    `${label} cut`,
    body,
    props,
    chain,
  );
  const writes: IAutoMovieMotionHumanSegment[] = diningTable.named(
    take,
    "write",
  );
  const saw: IAutoMovieMotionHumanSegment = writes[0]!;
  const spear: IAutoMovieMotionHumanSegment = writes[1]!;
  const ready: number = saw.start + (saw.end - saw.start) * 0.3;
  const relax: number = saw.start + (saw.end - saw.start) * 0.7;
  const pin: IAutoMovieVector3 = everydayTake.point(
    take,
    createFork({ id: "fork" }),
    "fork",
    "face",
    ready,
  );
  let pinned: number = 0;
  let lowest: number = Infinity;
  let highest: number = -Infinity;
  for (let i: number = 0; i <= 12; ++i) {
    const t: number = ready + ((relax - ready) * i) / 12;
    pinned = Math.max(
      pinned,
      Vector3.distance(
        everydayTake.point(take, createFork({ id: "fork" }), "fork", "face", t),
        pin,
      ),
    );
    const blade: IAutoMovieVector3 = everydayTake.point(
      take,
      createTableKnife({ id: "knife" }),
      "knife",
      "face",
      t,
    );
    lowest = Math.min(lowest, blade.z - plate.z);
    highest = Math.max(highest, blade.z - plate.z);
  }
  checks.check(
    `${label}: the fork's tines stay on the food through the cut (${pinned.toFixed(3)} m)`,
    pinned <= diningTable.ON,
  );
  checks.check(
    `${label}: the knife's edge crosses the food`,
    lowest <= -0.02 && highest >= 0.02,
  );
  const bite: IAutoMovieMotionHumanSegment = diningTable.named(
    take,
    "eatWith",
  )[0]!;
  const middle: number = (bite.start + bite.end) / 2;
  checks.check(
    `${label}: the cut piece follows the fork to the mouth`,
    Vector3.distance(
      take.prop("piece", middle).position,
      diningTable.mouth(take, middle),
    ) <= 0.15,
  );
  const forkFrame: IAutoMovieRigidTransform = take.prop("fork", spear.end);
  const offset: number = Vector3.distance(
    take.prop("piece", spear.end).position,
    forkFrame.position,
  );
  checks.check(
    `${label}: the piece rides the fork from the take`,
    Math.abs(
      Vector3.distance(
        take.prop("piece", middle).position,
        take.prop("fork", middle).position,
      ) - offset,
    ) <= diningTable.HOLD,
  );
  // A refusal is checked once, on the first body.
  if (label.startsWith("m-average")) {
    const far: HumanRefusal | undefined = everydayTake.refusal(() =>
      everydayTake.perform(
        `dining-${label}-far`,
        body,
        props.map(
          (p: IAutoMovieMotionHumanProp): IAutoMovieMotionHumanProp =>
            p.subject === "steak"
              ? everydayTake.prop(
                  "steak",
                  steak,
                  diningTable.on(s, 0, 1.3),
                  undefined,
                  true,
                )
              : p,
        ),
        HumanChain.subject("actor")
          .sit({ seat: s.seat, hold: 1 })
          .pickUp({ prop: "knife", handle: "grip", hand: side, lift: 0.05 })
          .registered("write", {
            tool: "knife",
            tip: "face",
            on: "steak",
            surface: "top",
            stroke: [
              [0, -0.03],
              [0, 0.03],
            ],
            duration: 0.5,
            hand: side,
          }),
        Object.values(HUMAN_LEXICON).flat(),
      ),
    );
    checks.check(
      `${label}: a plate beyond the seated reach is refused`,
      far !== undefined && far.kind === "reach",
    );
  }
}
