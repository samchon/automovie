import {
  createBowl,
  createChopsticks,
  createFoodPortion,
  createFork,
  createSeat,
  createSpoon,
  createTable,
  createTableKnife,
} from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";

import { everydayTake } from "../internal/everydayTake";
import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/** A utensil's working point stays on the food within this, metres. */
const ON: number = 0.01;
/** A held prop drifts at most this in its hand's (or carrier's) frame, metres. */
const HOLD: number = 0.005;
/** A bite reaches the mouth within this, metres: the lips' half width. */
const MOUTH: number = 0.06;

/** The seated diner's chair. */
const CHAIR: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/**
 * Two-utensil eating and serving (#4005), seated at a table.
 *
 * Scenarios, right-handed on m-average and left-handed on f-small:
 * 1. Knife and fork, continental: the fork's tines pin the steak while the
 *    knife saws across it, its working point crossing the food; the fork
 *    takes the cut piece, a food of its own, which follows the fork to the
 *    mouth. A plate beyond the seated reach is refused.
 * 2. Chopsticks: the tips close on a morsel, which stays between them to
 *    the mouth while the fixed stick stays still in the hand; the other
 *    hand lifts the rice bowl to the chin.
 * 3. Serving: a spoon takes food from the platter and leaves it on the
 *    neighbour's plate, where it rests.
 * Every take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each scenario, the bodies, the handedness and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Composes pickUp, write with a steadying fork and a take, workHeld, eatWith and reads displayed utensils, food and bones.
 * @evidence contracts/development/testing.md#independent-expectations The food's places are the archetypes' contacts; tolerances are named.
 * @evidence contracts/development/testing.md#distinguishing-cases Right- against left-handed diners, cut against take, a plate within against beyond reach.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_human_motion_dining_utensils(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const side: AutoMovieHumanSide = name === "m-average" ? "right" : "left";
    for (const scene of SCENES)
      try {
        scene.run(body, `${name} ${scene.label}`, side, checks);
      } catch (error: unknown) {
        checks.check(
          `${name} ${scene.label} refused: ${everydayTake.describe(error)}`,
          false,
        );
      }
  }
  checks.assert("dining utensils");
}

/** The seated scene at a table. */
function stage(): IStage {
  const chair = createSeat({ id: "chair", kind: "dining" });
  const placement = { at: CHAIR, yaw: 0, fixed: true } as const;
  const table = createTable({ id: "table", kind: "dining" });
  const top: IAutoMovieAffordance = table.affordances!.find(
    (a: IAutoMovieAffordance): boolean => a.id === "top",
  )!;
  return {
    seat: HumanObject.seat(chair, placement),
    props: [
      HumanObject.prop("chair", chair, placement),
      everydayTake.prop(
        "table",
        table,
        { x: 0, y: 0, z: CHAIR.z + 0.05 + top.depth! / 2 },
        undefined,
        true,
      ),
    ],
    height: top.frame.translation.y,
    near: CHAIR.z + 0.05,
  };
}

/** A point on the table top, across and ahead of its near edge. */
function on(s: IStage, x: number, ahead: number): IAutoMovieVector3 {
  return { x, y: s.height, z: s.near + ahead };
}

/** The take with the shipped verdicts. */
function play(
  label: string,
  body: IAutoMovieMotionHumanBody,
  props: readonly IAutoMovieMotionHumanProp[],
  chain: IAutoMovieMotionHumanChain,
): HumanPerformance {
  const take: HumanPerformance = everydayTake.perform(
    `dining-${label}`,
    body,
    props,
    chain,
    Object.values(HUMAN_LEXICON).flat(),
  );
  everydayTake.clean(label, take);
  return take;
}

/** The segments of one law, in order. */
function named(
  take: HumanPerformance,
  law: string,
): IAutoMovieMotionHumanSegment[] {
  return take
    .segments("actor")
    .filter((s: IAutoMovieMotionHumanSegment): boolean => s.law.name === law);
}

/** The mouth: the head bone's point carried a head's half depth forward. */
function mouth(take: HumanPerformance, t: number): IAutoMovieVector3 {
  return take.bones("actor", t).get("head")!.worldPosition;
}

/** Knife and fork: pin, saw, take the piece and bite. */
function cut(
  body: IAutoMovieMotionHumanBody,
  label: string,
  side: AutoMovieHumanSide,
  checks: motionComplaints.IGatherer,
): void {
  const s: IStage = stage();
  const other: AutoMovieHumanSide = side === "right" ? "left" : "right";
  // The dominant hand's side: world +X is the seated diner's left.
  const sign: number = side === "right" ? -1 : 1;
  const steak = createFoodPortion({ id: "steak", kind: "steak" });
  const piece = createFoodPortion({ id: "piece", kind: "piece" });
  const plate: IAutoMovieVector3 = on(s, sign * 0.04, 0.08);
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
      on(s, sign * 0.18, 0.07),
    ),
    everydayTake.prop(
      "fork",
      createFork({ id: "fork" }),
      on(s, -sign * 0.18, 0.07),
    ),
  ];
  const edge: number = sign * 0.06;
  const chain: IAutoMovieMotionHumanChain = HumanChain.subject("actor")
    .sit({ seat: s.seat, seconds: 1 })
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
      seconds: 1.2,
      side,
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
      seconds: 0.3,
      side: other,
      take: { prop: "piece", point: "face" },
    })
    .registered("eatWith", { held: "fork", point: "face", side: other });
  const take: HumanPerformance = play(`${label} cut`, body, props, chain);
  const writes: IAutoMovieMotionHumanSegment[] = named(take, "write");
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
    pinned <= ON,
  );
  checks.check(
    `${label}: the knife's edge crosses the food`,
    lowest <= -0.02 && highest >= 0.02,
  );
  const bite: IAutoMovieMotionHumanSegment = named(take, "eatWith")[0]!;
  const middle: number = (bite.start + bite.end) / 2;
  checks.check(
    `${label}: the cut piece follows the fork to the mouth`,
    Vector3.distance(
      take.prop("piece", middle).position,
      mouth(take, middle),
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
    ) <= HOLD,
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
                  on(s, 0, 1.3),
                  undefined,
                  true,
                )
              : p,
        ),
        HumanChain.subject("actor")
          .sit({ seat: s.seat, seconds: 1 })
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
            seconds: 0.5,
            side,
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

/** Chopsticks: pinch a morsel to the mouth with the bowl raised to the chin. */
function chopsticks(
  body: IAutoMovieMotionHumanBody,
  label: string,
  side: AutoMovieHumanSide,
  checks: motionComplaints.IGatherer,
): void {
  const s: IStage = stage();
  const other: AutoMovieHumanSide = side === "right" ? "left" : "right";
  // The dominant hand's side: world +X is the seated diner's left.
  const sign: number = side === "right" ? -1 : 1;
  const sticks = createChopsticks({ id: "sticks" });
  const rice: IAutoMovieVector3 = on(s, sign * 0.15, 0.08);
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
    everydayTake.prop("sticks", sticks, on(s, sign * 0.18, 0.07)),
    everydayTake.prop(
      "bowl",
      createBowl({ id: "bowl" }),
      on(s, -sign * 0.2, 0.12),
    ),
  ];
  // Seated, the chin stands about the standing shoulder less the thigh's drop.
  const chin: number = body.measure.shoulderHeight - 0.3;
  const chain: IAutoMovieMotionHumanChain = HumanChain.subject("actor")
    .sit({ seat: s.seat, seconds: 1 })
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
      seconds: 0.3,
      side,
    })
    .registered("workHeld", {
      prop: "sticks",
      side,
      drive: [{ articulation: "pinch", to: 12 }],
      take: { prop: "morsel", point: "tips" },
      seconds: 0.3,
    })
    .pickUp({ prop: "bowl", handle: "body", hand: other, lift: 0.05 })
    .registered("workHeld", {
      prop: "bowl",
      side: other,
      at: { out: 0.2, up: chin - 0.15, forward: 0.3, level: true },
      seconds: 0.5,
    })
    .registered("eatWith", { held: "sticks", point: "tips", side });
  const take: HumanPerformance = play(
    `${label} chopsticks`,
    body,
    props,
    chain,
  );
  const pinch: IAutoMovieMotionHumanSegment = named(take, "workHeld")[0]!;
  const bite: IAutoMovieMotionHumanSegment = named(take, "eatWith")[0]!;
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
    held <= HOLD && gap <= 0.03,
  );
  checks.check(
    `${label}: the fixed stick stays still in the hand`,
    everydayTake.drift(take, side, "sticks", pinch.start, bite.end) <= HOLD,
  );
  const middle: number = (bite.start + bite.end) / 2;
  checks.check(
    `${label}: the morsel reaches the mouth`,
    Vector3.distance(
      take.prop("morsel", middle).position,
      mouth(take, middle),
    ) <= 0.15,
  );
  const lifted: IAutoMovieMotionHumanSegment = named(take, "workHeld")[1]!;
  checks.check(
    `${label}: the bowl is raised to the chin`,
    Math.abs(take.prop("bowl", lifted.end).position.y - (chin - 0.15)) <= MOUTH,
  );
}

/** Serving: a spoon carries food from the platter to the neighbour's plate. */
function serve(
  body: IAutoMovieMotionHumanBody,
  label: string,
  side: AutoMovieHumanSide,
  checks: motionComplaints.IGatherer,
): void {
  const s: IStage = stage();
  // The dominant hand's side: world +X is the seated diner's left.
  const sign: number = side === "right" ? -1 : 1;
  const platter: IAutoMovieVector3 = on(s, sign * 0.04, 0.1);
  const plate: IAutoMovieVector3 = on(s, sign * 0.16, 0.06);
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
      on(s, sign * 0.15, 0.04),
    ),
  ];
  const chain: IAutoMovieMotionHumanChain = HumanChain.subject("actor")
    .sit({ seat: s.seat, seconds: 1 })
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
      seconds: 0.4,
      side,
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
      seconds: 0.4,
      side,
      leave: { prop: "serving", point: "pick" },
    });
  const take: HumanPerformance = play(`${label} serve`, body, props, chain);
  const writes: IAutoMovieMotionHumanSegment[] = named(take, "write");
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
    Vector3.distance(take.prop("serving", place.end).position, rest) <= HOLD,
  );
}

/** One scenario of the spec. */
interface IScene {
  /** Its name. */
  label: string;

  /** Its run on one body with the dominant hand. */
  run: (
    body: IAutoMovieMotionHumanBody,
    label: string,
    side: AutoMovieHumanSide,
    checks: motionComplaints.IGatherer,
  ) => void;
}

/** The scenarios. */
const SCENES: readonly IScene[] = [
  { label: "knife and fork", run: cut },
  { label: "chopsticks", run: chopsticks },
  { label: "serving", run: serve },
];

/** The seated scene. */
interface IStage {
  /** The chair's seat. */
  seat: IAutoMovieMotionHumanSeated.ISeat;

  /** The chair and the table. */
  props: IAutoMovieMotionHumanProp[];

  /** The table top's height, metres. */
  height: number;

  /** The table's near edge, world `z`. */
  near: number;
}
