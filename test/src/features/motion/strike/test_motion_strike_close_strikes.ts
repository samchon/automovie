import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCloseStrike,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStageFight,
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

/** A close strike row, or a stage-fight row that exposes one. */
type Row =
  | IAutoMovieMotionHumanCloseStrike.Technique
  | "stagePalmStrike"
  | "stageHeadbutt";

/** A close strike row and how its effector must arrive. */
interface IRow {
  /** The row's name in `HumanStrike`. */
  row: Row;

  /** The region of the other person it is thrown at. */
  at: AutoMovieHumanoidRegion;

  /** The partner's distance, a share of stature: inside the strike's own band. */
  distance: number;
}

/**
 * The two performers' separation for the close strikes, a share of stature:
 * about 0.6 m for the average man, where the two guards' heads stand clear of
 * each other.
 */
const DISTANCE: number = 0.34;

/**
 * The clinch range of the elbows, a share of stature: about 0.56 m for the
 * average man.
 */
const CLINCH: number = 0.32;

/**
 * The headbutt's range, a share of stature: the forehead reaches the chin by
 * the trunk's lean.
 */
const BUTT: number = 0.4;

/** The six close strikes at the head. */
const ROWS: readonly IRow[] = [
  { row: "horizontalElbow", at: "chin", distance: CLINCH },
  { row: "risingElbow", at: "chin", distance: CLINCH },
  { row: "descendingElbow", at: "shoulderLeft", distance: CLINCH },
  { row: "spinningElbow", at: "chin", distance: CLINCH },
  { row: "spinningBackfist", at: "chin", distance: DISTANCE },
  { row: "headbutt", at: "chin", distance: BUTT },
];

/**
 * A landing lies within this of its target, metres: the blade strokes spec's
 * bound.
 */
const TOUCH: number = 0.015;

/**
 * A pivoting ball and a held hand stay within this, metres: the planted support
 * checks' bound.
 */
const HOLD: number = 0.005;

/**
 * A held hand stays within this of the partner's neck, metres: the grapple
 * specs' 1 cm contact bound.
 */
const GRIP: number = 0.01;

/** One film frame at 240 Hz, seconds. */
const STEP: number = 1 / 240;

/** The punch signature spec's read-back resolution of an elbow angle, degrees. */
const TOLERANCE: number = 10;

/**
 * The close strikes land their effector on the head of a person standing close:
 * three elbows along their own paths, two spinning strikes after a whole turn
 * on the lead ball and a headbutt with both hands on the neck.
 *
 * Scenarios:
 *
 * 1. On two bodies, each strike's effector (the elbow, the back of the hand or the
 *    forehead) lies on the target region at the impact.
 * 2. The horizontal elbow arrives across the line toward the other side, the
 *    rising one upward and the descending one downward; each elbow lands folded
 *    past 120 degrees.
 * 3. A spinning strike turns the pelvis more than half a turn before the impact
 *    while the lead ball stays planted.
 * 4. The headbutt's hands hold either side of the partner's neck from the impact
 *    to the end of their declared grip.
 * 5. An elbow thrown at a person at punching range is refused with its band.
 * 6. The stage-fight palm strike and headbutt are placed as feints with no impact.
 * 7. Every take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the six strikes, their effectors and paths, the spin, the hold and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Plays each public strike row through HumanPerformance and reads the displayed elbow, hand and forehead regions, the pelvis heading, the lead ball and the partner's neck at the impact event and one 240 Hz frame before it.
 * @evidence contracts/development/testing.md#independent-expectations The 120 degree fold and the paths are the issue's; a landing is the blade strokes spec's 15 mm, a planted ball the support checks' 5 mm, a hand hold the grapple specs' 1 cm, and the elbow band is read back within the punch signature spec's 10 degrees. Punching range is the striking captures' 1.3 arms.
 * @evidence contracts/development/testing.md#distinguishing-cases Three elbow paths, two spins and a held headbutt on a small and an average body at their own band's distance, the stage-fight feints and the adjacent out-of-band target. The partner stands relaxed; first-surface stops against a guard belong to the close hand strike spec.
 * @evidence contracts/development/testing.md#execution-ownership Public in-memory performances through the strike rows, with no host or capture.
 */
export function test_motion_strike_close_strikes(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["f-small", "m-average"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const partner: IAutoMovieMotionHumanBody = body;
    for (const { row, at, distance } of ROWS) {
      const cell: string = `${name} ${row}`;
      try {
        play(
          body,
          partner,
          row,
          at,
          distance * body.measure.stature,
          cell,
          complaints,
        );
      } catch (error) {
        complaints.list.push(`${cell}: ${String(error)}`);
      }
    }

    // The stage-fight rows show the palm strike and the headbutt as feints
    // that land nothing.
    for (const row of ["stagePalmStrike", "stageHeadbutt"] as const)
      try {
        const film: HumanPerformance = perform(
          body,
          partner,
          row,
          "chin",
          (row === "stageHeadbutt" ? BUTT : DISTANCE) * body.measure.stature,
        );
        assertTakeClean(`${name} ${row}`, film);
        const placed: IAutoMovieScheduleEntry | undefined =
          film.schedule.entries.find(
            (entry: IAutoMovieScheduleEntry): boolean =>
              entry.intent.anchor === "strike",
          );
        complaints.check(
          `${name} ${row}: placed with no impact`,
          placed !== undefined && placed.contact === undefined,
        );
      } catch (error) {
        complaints.list.push(`${name} ${row}: ${String(error)}`);
      }

    // An elbow at punching range is out of its band; the refusal comes
    // when the strike's geometry is first read.
    try {
      const arm: number =
        body.measure.upperArm + body.measure.forearm + body.measure.hand;
      const film: HumanPerformance = perform(
        body,
        partner,
        "horizontalElbow",
        "jawLeft",
        1.3 * arm,
      );
      HumanSignature.bones(
        HumanSignature(film, "a", body, 0),
        film.schedule.entries.find(
          (entry: IAutoMovieScheduleEntry): boolean =>
            entry.intent.anchor === "strike",
        )?.end ?? 0,
      );
      complaints.list.push(`${name}: an elbow at punching range was admitted`);
    } catch (error) {
      complaints.check(
        `${name}: the punching-range elbow's refusal ${String(error)} names the band`,
        error instanceof HumanRefusal &&
          error.axis === "at" &&
          /feasible/.test(error.message),
      );
    }
  }
  complaints.assert("Close strikes");
}

/**
 * Play a close strike from a stand at a person standing a distance ahead, both
 * upright so their heads stand level.
 */
function perform(
  body: IAutoMovieMotionHumanBody,
  partner: IAutoMovieMotionHumanBody,
  row: Row,
  at: AutoMovieHumanoidRegion,
  distance: number,
): HumanPerformance {
  const film: HumanPerformance = new HumanPerformance({
    seed: `close-${row}`,
    laws: [
      ...Object.values(AutoMovieMotionHumanStrike.HumanStrike),
      AutoMovieMotionHumanStageFight.stageBladeFootwork,
    ],
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
        body: partner,
        at: { x: 0, y: 0, z: distance },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a")
      .stand({ hold: 0.5, sway: 0 })
      .registered(
        row,
        { at: { kind: "person", subject: "b", region: at } },
        "strike",
      )
      .stand({ hold: 1, sway: 0 })
      .with(HumanChain.subject("b").stand({ hold: 1.5, sway: 0 })).node,
  });
  if (film.schedule.entries.length === 0) throw new Error("nothing was placed");
  return film;
}

/** Play one strike and check what it shows. */
function play(
  body: IAutoMovieMotionHumanBody,
  partner: IAutoMovieMotionHumanBody,
  row: Row,
  at: AutoMovieHumanoidRegion,
  distance: number,
  cell: string,
  complaints: motionComplaints.IGatherer,
): void {
  const film: HumanPerformance = perform(body, partner, row, at, distance);
  assertTakeClean(cell, film);
  const strike: IAutoMovieScheduleEntry | undefined =
    film.schedule.entries.find(
      (entry): boolean => entry.intent.anchor === "strike",
    );
  const impact: number | undefined = strike?.contact;
  if (strike === undefined || impact === undefined) {
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
    partner,
    180,
  );
  const target: IAutoMovieVector3 = HumanSignature.region(b, at, impact);

  // The striking side is the arm whose elbow travels farther.
  const moved = (side: AutoMovieHumanSide): number =>
    Vector3.distance(
      HumanSignature.joint(a, strike.start, `${side}LowerArm`),
      HumanSignature.joint(a, impact, `${side}LowerArm`),
    );
  const side: AutoMovieHumanSide =
    moved("left") > moved("right") ? "left" : "right";
  const effector: AutoMovieHumanoidRegion =
    row === "headbutt"
      ? "forehead"
      : row === "spinningBackfist"
        ? side === "left"
          ? "handBackLeft"
          : "handBackRight"
        : side === "left"
          ? "elbowLeft"
          : "elbowRight";
  const struck = (seconds: number): IAutoMovieVector3 =>
    HumanSignature.region(a, effector, seconds);
  const gap: number = Vector3.distance(struck(impact), target);
  complaints.check(
    `${cell}: the ${effector} lands ${gap} m from the ${at}`,
    gap <= TOUCH,
  );

  if (row.endsWith("Elbow") && !row.startsWith("spinning")) {
    const travel: IAutoMovieVector3 = Vector3.subtract(
      struck(impact),
      struck(impact - STEP),
    );
    const chest: IAutoMovieVector3 = HumanSignature.joint(a, impact, "chest");
    const shoulder: IAutoMovieVector3 = HumanSignature.joint(
      a,
      impact,
      `${side}UpperArm`,
    );
    const inward: number = Vector3.dot(
      travel,
      Vector3.normalize({
        x: chest.x - shoulder.x,
        y: 0,
        z: chest.z - shoulder.z,
      }),
    );
    complaints.check(
      `${cell}: arrives ${JSON.stringify({ inward, up: travel.y })} m over the last frame`,
      row === "horizontalElbow"
        ? inward > Math.abs(travel.y)
        : row === "risingElbow"
          ? travel.y > 0
          : travel.y < 0,
    );
    const fold: number = HumanSignature.flexion(
      shoulder,
      HumanSignature.joint(a, impact, `${side}LowerArm`),
      HumanSignature.joint(a, impact, `${side}Hand`),
    );
    complaints.check(
      `${cell}: the elbow folds ${fold} deg at impact`,
      fold >= 120 - TOLERANCE,
    );
  }

  if (row.startsWith("spinning")) {
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
    const lead: AutoMovieHumanSide = side === "left" ? "right" : "left";
    const ball = (seconds: number): IAutoMovieVector3 => {
      const foot = HumanSignature.bones(a, seconds).get(`${lead}Foot`)!;
      return HumanFoot.point(body, lead, "ball", {
        ankle: foot.worldPosition,
        rotation: foot.worldRotation,
      });
    };
    const slid: number = Math.max(
      ...[0.25, 0.5, 0.75, 1].map((share: number): number =>
        Vector3.distance(
          ball(strike.start + share * (impact - strike.start)),
          ball(strike.start),
        ),
      ),
    );
    complaints.check(
      `${cell}: the pelvis turns ${turned} deg before the impact while the lead ball slides ${slid} m`,
      Math.abs(turned) > 180 && slid <= HOLD,
    );
  }

  if (row === "headbutt")
    for (const hand of ["left", "right"] as const) {
      const neck: AutoMovieHumanoidRegion =
        hand === "left" ? "neckRight" : "neckLeft";
      const held = (seconds: number): number =>
        Vector3.distance(
          HumanSignature.region(
            a,
            hand === "left" ? "palmLeft" : "palmRight",
            seconds,
          ),
          resolveAutoMovieHumanoidSurfaces.place(
            partner.surfaces.regions[neck],
            HumanSignature.bones(b, seconds).get(
              partner.surfaces.regions[neck].bone,
            )!,
          ).point,
        );
      // The declared grip's own window: held from the impact to its release.
      const segment: IAutoMovieMotionHumanSegment | undefined = film
        .segments("a")
        .find(
          (s: IAutoMovieMotionHumanSegment): boolean =>
            s.start === strike.start && s.law.name === "closeStrike",
        );
      const grip: IAutoMovieMotionHumanContactWindow | undefined =
        segment?.plan.contacts.find(
          (c: IAutoMovieMotionHumanContactWindow): boolean =>
            c.part === `${hand}Hand` && c.kind === "grip",
        );
      const released: number =
        segment === undefined || grip === undefined
          ? strike.end
          : segment.start + grip.to * segment.plan.duration - STEP;
      complaints.check(
        `${cell}: the ${hand} hand holds the neck from the impact to its release, ${held(impact)} and ${held(released)} m`,
        grip !== undefined && held(impact) <= GRIP && held(released) <= GRIP,
      );
    }
}
