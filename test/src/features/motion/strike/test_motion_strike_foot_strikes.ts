import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanSignature,
  IAutoMovieMotionTarget,
  IAutoMovieResolvedBone,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStrike,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

/** The foot strike rows. */
type Row =
  | "sideKick"
  | "backKick"
  | "hookKick"
  | "crescentKick"
  | "axeKick"
  | "stomp"
  | "legSweep"
  | "spinningHookKick"
  | "jumpingSideKick";

/** How a foot strike's contact point must arrive. */
type Arrival = "line" | "ownSide" | "otherSide" | "down";

/** One row, its target and its arrival. */
interface IRow {
  /** The row in `HumanStrike`. */
  row: Row;

  /** The partner's region, or `floor` for a point on the floor ahead. */
  at: AutoMovieHumanoidRegion | "floor";

  /** The foot's point that lands. */
  contact: "heel" | "sole";

  /** The direction it travels over the last frame. */
  arrival: Arrival;
}

/** Every foot strike row with its target, contact point and arrival. */
const ROWS: readonly IRow[] = [
  { row: "sideKick", at: "abdomen", contact: "heel", arrival: "line" },
  { row: "backKick", at: "abdomen", contact: "heel", arrival: "line" },
  { row: "hookKick", at: "chestRight", contact: "heel", arrival: "ownSide" },
  {
    row: "crescentKick",
    at: "chestLeft",
    contact: "sole",
    arrival: "otherSide",
  },
  { row: "axeKick", at: "chestLeft", contact: "heel", arrival: "down" },
  { row: "stomp", at: "floor", contact: "sole", arrival: "down" },
  { row: "legSweep", at: "heelLeft", contact: "sole", arrival: "otherSide" },
  {
    row: "spinningHookKick",
    at: "chestLeft",
    contact: "heel",
    arrival: "ownSide",
  },
  { row: "jumpingSideKick", at: "abdomen", contact: "heel", arrival: "line" },
];

/**
 * The partner's distance, a share of stature: a kicking range where the leg
 * reaches the chest. The head lies past the leg here even with the body tilted
 * away and the support on its ball (the jaw stands about 0.94 m from the
 * average body's kicking hip so raised, against a leg of about 0.85 m), where a
 * strike lands short at the leg's full reach (scenario 7), so the rows that
 * land on the partner aim at the chest.
 */
const DISTANCE: number = 0.5;

/**
 * The sweep's distance, a share of stature: close enough for the lead leg to
 * reach the partner's lead heel.
 */
const SWEEP: number = 0.3;

/**
 * A landing lies within this of its target, metres: the blade strokes spec's
 * bound.
 */
const TOUCH: number = 0.015;

/** A planted ball stays within this, metres: the support checks' bound. */
const HOLD: number = 0.005;

/**
 * A foot clears the floor by at least this, metres: one millimetre above
 * contact.
 */
const CLEAR: number = 0.001;

/** One film frame at 240 Hz, seconds. */
const STEP: number = 1 / 240;

/**
 * The side kick's launch to contact band, seconds (Pieter and Pieter 1995, as
 * #3970 cites).
 */
const SIDE: readonly [number, number] = [0.7, 0.84];

/**
 * The foot strike rows land the heel or the sole on their targets along their
 * own paths, with the support planted.
 *
 * Scenarios:
 *
 * 1. On two bodies, each row's contact point (heel or sole) lies on its target at
 *    the impact: the partner's region, or the floor for the stomp.
 * 2. It arrives along its path over the last frame: the side, back and jumping
 *    side kicks along the line, the hook and spinning hook toward the kicker's
 *    own side, the crescent and the sweep away from it, the axe and the stomp
 *    from above.
 * 3. The side kick lands 0.70 to 0.84 s after its launch, its foot fastest after
 *    the chamber and before the contact.
 * 4. Every planted support ball stays fixed through chamber and recoil; the
 *    spinning hook kick turns the pelvis past a half turn before the contact on
 *    that ball.
 * 5. The jumping side kick has both feet off the floor at the contact.
 * 6. The sweep's partner falls on its contact: the knockdown synced to it takes
 *    the partner's struck heel off the floor, and a partner out of reach is
 *    refused with the distance.
 * 7. A side kick at a point beyond the leg is missed at the leg's full reach.
 * 8. Every take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each row's target, contact, path and the timing, support, spin, jump, sweep and reach cases.
 * @evidence contracts/development/testing.md#behavioral-verification Plays each public row through HumanPerformance and reads the displayed foot, pelvis and partner at the impact and one 240 Hz frame before it.
 * @evidence contracts/development/testing.md#independent-expectations The timing band is Pieter and Pieter's as #3970 cites; a landing is the blade strokes spec's 15 mm and a planted ball the support checks' 5 mm; the paths are the issue's.
 * @evidence contracts/development/testing.md#distinguishing-cases Nine rows on a small and an average body, the sweep's reachable and unreachable partner and an unreachable kick target. The round and push kicks stay pinned by the striking baselines.
 * @evidence contracts/development/testing.md#execution-ownership Public in-memory performances through the strike rows, with no host or capture.
 */
export function test_motion_strike_foot_strikes(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["f-small", "m-average"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const distance: number = DISTANCE * body.measure.stature;
    for (const row of ROWS) {
      const cell: string = `${name} ${row.row}`;
      try {
        play(body, row, distance, cell, complaints);
      } catch (error) {
        complaints.list.push(`${cell}: ${String(error)}`);
      }
    }

    // A side kick at a point beyond the leg lands short at full reach.
    try {
      const far: number = 2 * (body.measure.thigh + body.measure.shank);
      const film: HumanPerformance = perform(
        body,
        "sideKick",
        {
          kind: "point",
          at: { x: 0, y: body.measure.hipHeight, z: far },
          frame: "performer",
        },
        distance + far,
        false,
      );
      const strike: IAutoMovieScheduleEntry = struck(film);
      const a: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
        film,
        "a",
        body,
        0,
      );
      const side: AutoMovieHumanSide = kicking(a, strike);
      const hip: IAutoMovieVector3 = HumanSignature.joint(
        a,
        strike.contact!,
        `${side}UpperLeg`,
      );
      const ankle: IAutoMovieVector3 = HumanSignature.joint(
        a,
        strike.contact!,
        `${side}Foot`,
      );
      const reach: number = body.measure.thigh + body.measure.shank;
      complaints.check(
        `${name}: a kick beyond reach has the ankle ${Vector3.distance(hip, ankle)} m from the hip, the leg ${reach} m`,
        Math.abs(Vector3.distance(hip, ankle) - reach) <= 0.02,
      );
    } catch (error) {
      complaints.list.push(`${name} beyond reach: ${String(error)}`);
    }

    // A sweep at a partner out of reach is refused with the distance.
    try {
      const film: HumanPerformance = perform(
        body,
        "legSweep",
        { kind: "person", subject: "b", region: "heelLeft" },
        2 * distance + body.measure.thigh + body.measure.shank,
        false,
      );
      HumanSignature.bones(
        HumanSignature(film, "a", body, 0),
        struck(film).contact ?? struck(film).end,
      );
      complaints.list.push(`${name}: a sweep out of reach was admitted`);
    } catch (error) {
      complaints.check(
        `${name}: the unreachable sweep's refusal ${String(error)} names the distance`,
        error instanceof HumanRefusal &&
          error.axis === "at" &&
          / m /.test(error.message),
      );
    }
  }
  complaints.assert("Foot strikes");
}

/**
 * Play a row from a stand at a partner standing a distance ahead; the sweep's
 * partner falls on its contact.
 */
function perform(
  body: IAutoMovieMotionHumanBody,
  row: Row,
  at: IAutoMovieMotionTarget,
  distance: number,
  falls: boolean,
): HumanPerformance {
  const strike: IAutoMovieMotionHumanChainCore = HumanChain.subject("a")
    .stand({ hold: 0.5, sway: 0 })
    .registered(row, { at }, "strike")
    .stand({ hold: 2, sway: 0 });
  const partner: ReturnType<typeof HumanChain.subject> =
    HumanChain.subject("b");
  return new HumanPerformance({
    seed: `foot-${row}`,
    laws: Object.values(AutoMovieMotionHumanStrike.HumanStrike),
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body,
        at: { x: 0, y: 0, z: distance },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    composition: falls
      ? strike.with(
          partner
            .registered(
              "knockdown",
              { target: { kind: "person", subject: "a", region: "soleLeft" } },
              "fall",
            )
            .sync({ of: "strike", align: "stroke" }),
        ).node
      : strike.with(partner.stand({ hold: 3, sway: 0 })).node,
  });
}

/** The placed strike. */
function struck(film: HumanPerformance): IAutoMovieScheduleEntry {
  const strike: IAutoMovieScheduleEntry | undefined =
    film.schedule.entries.find(
      (entry: IAutoMovieScheduleEntry): boolean =>
        entry.intent.anchor === "strike",
    );
  if (strike === undefined) throw new Error("the strike was not placed");
  return strike;
}

/**
 * The kicking side: the foot that travels farther from the launch to the
 * impact.
 */
function kicking(
  a: IAutoMovieMotionHumanSignature.IReader,
  strike: IAutoMovieScheduleEntry,
): AutoMovieHumanSide {
  const at: number = strike.contact ?? strike.end;
  const moved = (side: AutoMovieHumanSide): number =>
    Vector3.distance(
      HumanSignature.joint(a, strike.start, `${side}Foot`),
      HumanSignature.joint(a, at, `${side}Foot`),
    );
  return moved("left") > moved("right") ? "left" : "right";
}

/** A foot's named point on the displayed foot. */
function point(
  body: IAutoMovieMotionHumanBody,
  a: IAutoMovieMotionHumanSignature.IReader,
  side: AutoMovieHumanSide,
  name: "heel" | "sole" | "ball",
  seconds: number,
): IAutoMovieVector3 {
  const foot: IAutoMovieResolvedBone = HumanSignature.bones(a, seconds).get(
    `${side}Foot`,
  )!;
  return HumanFoot.point(body, side, name, {
    ankle: foot.worldPosition,
    rotation: foot.worldRotation,
  });
}

/** Play one row and check what it shows. */
function play(
  body: IAutoMovieMotionHumanBody,
  row: IRow,
  distance: number,
  cell: string,
  complaints: motionComplaints.IGatherer,
): void {
  const stature: number = body.measure.stature;
  const target: IAutoMovieMotionTarget =
    row.at === "floor"
      ? {
          kind: "point",
          at: { x: 0, y: 0, z: 0.25 * stature },
          frame: "performer",
        }
      : { kind: "person", subject: "b", region: row.at };
  const film: HumanPerformance = perform(
    body,
    row.row,
    target,
    row.row === "legSweep" ? SWEEP * stature : distance,
    row.row === "legSweep",
  );
  assertTakeClean(cell, film);
  const strike: IAutoMovieScheduleEntry = struck(film);
  const impact: number | undefined = strike.contact;
  if (impact === undefined) {
    complaints.list.push(`${cell}: no impact`);
    return;
  }
  const a: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
    film,
    "a",
    body,
    0,
  );
  const b: IAutoMovieMotionHumanSignature.IReader = HumanSignature(
    film,
    "b",
    body,
    180,
  );
  const side: AutoMovieHumanSide = kicking(a, strike);
  const support: AutoMovieHumanSide = side === "left" ? "right" : "left";
  const landed = (seconds: number): IAutoMovieVector3 =>
    point(body, a, side, row.contact, seconds);

  // 1. The contact point on its target.
  const aimed: IAutoMovieVector3 =
    row.at === "floor"
      ? { ...landed(impact), y: 0 }
      : HumanSignature.region(b, row.at, impact);
  const gap: number = Vector3.distance(landed(impact), aimed);
  complaints.check(
    `${cell}: the ${row.contact} lands ${gap} m from the ${row.at}`,
    gap <= TOUCH,
  );

  // 2. The arrival over the last frame.
  const travel: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(landed(impact), landed(impact - STEP)),
  );
  const forward: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const own: IAutoMovieVector3 = { x: side === "left" ? 1 : -1, y: 0, z: 0 };
  const along: number = Vector3.dot(travel, forward);
  const across: number = Vector3.dot(travel, own);
  complaints.check(
    `${cell}: arrives ${JSON.stringify(travel)} for ${row.arrival}`,
    row.arrival === "line"
      ? along > Math.abs(across) && along > Math.abs(travel.y)
      : row.arrival === "ownSide"
        ? across > Math.abs(along)
        : row.arrival === "otherSide"
          ? -across > Math.abs(along)
          : -travel.y > Math.hypot(along, across),
  );

  // 3. The side kick's timing and its peak foot speed.
  if (row.row === "sideKick") {
    const span: number = impact - strike.start;
    complaints.check(
      `${cell}: lands ${span} s after its launch`,
      span >= SIDE[0] && span <= SIDE[1],
    );
    let peak: number = strike.start;
    let fastest: number = 0;
    for (let s: number = strike.start + STEP; s <= impact; s += STEP) {
      const speed: number =
        Vector3.distance(landed(s), landed(s - STEP)) / STEP;
      if (speed > fastest) {
        fastest = speed;
        peak = s;
      }
    }
    complaints.check(
      `${cell}: the foot is fastest at ${peak} s, the impact at ${impact} s`,
      peak > strike.start + 0.5 * span && peak < impact,
    );
  }

  // 4. The support ball stays planted; the spin passes a half turn.
  if (row.row !== "jumpingSideKick") {
    const ball = (seconds: number): IAutoMovieVector3 =>
      point(body, a, support, "ball", seconds);
    let slid: number = 0;
    for (let s: number = strike.start; s <= strike.end; s += 1 / 24)
      slid = Math.max(slid, Vector3.distance(ball(s), ball(strike.start)));
    complaints.check(
      `${cell}: the support ball slides ${slid} m`,
      slid <= HOLD,
    );
  }
  if (row.row === "spinningHookKick") {
    const heading = (seconds: number): number =>
      HumanFoot.heading(
        HumanSignature.bones(a, seconds).get("hips")!.worldRotation,
      );
    let turned: number = 0;
    let previous: number = heading(strike.start);
    for (let s: number = strike.start; s <= impact; s += 1 / 48) {
      const now: number = heading(s);
      turned += ((now - previous + 540) % 360) - 180;
      previous = now;
    }
    complaints.check(
      `${cell}: the pelvis turns ${turned} deg before the contact`,
      Math.abs(turned) > 180,
    );
  }

  // 5. The jump is off the floor at the contact.
  if (row.row === "jumpingSideKick") {
    const low: number = Math.min(
      ...(["left", "right"] as const).flatMap(
        (foot: AutoMovieHumanSide): number[] =>
          (["heel", "ball"] as const).map(
            (name: "heel" | "ball"): number =>
              point(body, a, foot, name, impact).y,
          ),
      ),
    );
    complaints.check(
      `${cell}: the lowest foot point is ${low} m above the floor at contact`,
      low >= CLEAR,
    );
  }

  // 6. The swept partner falls on the contact, the struck heel lifted.
  if (row.row === "legSweep") {
    const fall: IAutoMovieScheduleEntry | undefined =
      film.schedule.entries.find(
        (entry: IAutoMovieScheduleEntry): boolean =>
          entry.intent.anchor === "fall",
      );
    complaints.check(
      `${cell}: the knockdown's decisive instant ${fall?.contact} meets the sweep's ${impact}`,
      fall?.contact !== undefined && Math.abs(fall.contact - impact) <= STEP,
    );
    const heel = (seconds: number): number =>
      HumanSignature.region(b, "heelLeft", seconds).y;
    complaints.check(
      `${cell}: the swept heel rises from ${heel(impact)} to ${heel(impact + 0.25)} m`,
      heel(impact + 0.25) > heel(impact) + 0.02,
    );
  }
}
