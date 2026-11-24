import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPunch,
  IAutoMovieMotionHumanSignature,
  IAutoMovieResolvedBone,
  IAutoMovieScheduleEntry,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStrike,
  HumanChain,
  HumanPerformance,
  HumanSignature,
} from "@automovie/motions";
import { HumanColliders } from "@automovie/motions/internal";

import { assertTakeClean } from "../../internal/assertTakeClean";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";

/** A close hand strike's technique. */
type Technique = Extract<
  IAutoMovieMotionHumanPunch.Technique,
  "palmHeel" | "backfist" | "hammerfist"
>;

/** A close hand strike and the elbow band it lands in. */
interface IStrike {
  /** The technique, which is also its row in `HumanStrike`. */
  technique: Technique;

  /** The elbow's flexion band at contact, degrees. */
  band: readonly [number, number];
}

/** The three close hand strikes with their coached elbow bands. */
const STRIKES: readonly IStrike[] = [
  { technique: "palmHeel", band: [5, 25] },
  { technique: "backfist", band: [10, 45] },
  { technique: "hammerfist", band: [30, 90] },
];

/** The punch signature spec's read-back resolution of an elbow band, degrees. */
const TOLERANCE: number = 10;

/**
 * A struck surface lies within this of the other body's colliders at contact,
 * metres: the blade strokes spec's bound.
 */
const TOUCH: number = 0.015;

/**
 * One film frame at 240 Hz, the step the arrival direction is read over,
 * seconds.
 */
const STEP: number = 1 / 240;

/**
 * The partner's distance, a share of stature: the striking captures' punching
 * range, 1.3 arms for the average man.
 */
const DISTANCE: number = 0.45;

/**
 * The punch law's close hand strikes land their own surface of the hand on the
 * other body: the palm heel along the line, the back of the fist swung out
 * across it, the fist's little-finger edge brought down.
 *
 * Scenarios:
 *
 * 1. On two bodies, each strike is thrown from a guard at a partner in guard at
 *    punching range. At its impact the struck surface, read on the displayed
 *    hand, lies on the first surface of the other body it meets, the guard or
 *    the face.
 * 2. The surface arrives the way the technique travels: the palm heel forward, the
 *    backfist outward across the line, the hammerfist downward.
 * 3. The elbow lands within the technique's band.
 * 4. Every take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three strikes, the surfaces, the directions and the bands; the feint is pinned by the stage-fight rows in the close strike spec.
 * @evidence contracts/development/testing.md#behavioral-verification Plays each public row through HumanPerformance and reads the displayed hand, its surface and the other body's colliders at the impact and one 240 Hz frame before it.
 * @evidence contracts/development/testing.md#independent-expectations The surfaces are the body's own palm socket, back-of-hand region and little-finger knuckle; the bands are the coached ones the law states with the punch signature spec's 10 degree read-back; a touch is the blade strokes spec's 15 mm.
 * @evidence contracts/development/testing.md#distinguishing-cases Three surfaces and three arrival directions on a small and an average body against a guarded target whose guard may be met first. Spinning variants and the elbows belong to the close strike spec.
 * @evidence contracts/development/testing.md#execution-ownership Public in-memory performances through the strike rows, with no host or capture.
 */
export function test_motion_strike_close_hand_strikes(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["f-small", "m-average"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    for (const strike of STRIKES) {
      const cell: string = `${name} ${strike.technique}`;
      try {
        play(body, strike, cell, complaints);
      } catch (error) {
        complaints.list.push(`${cell}: ${String(error)}`);
      }
    }
  }
  complaints.assert("Close hand strikes");
}

/** Throw one strike from a guard at a guarded partner and check what it shows. */
function play(
  body: IAutoMovieMotionHumanBody,
  { technique, band }: IStrike,
  cell: string,
  complaints: motionComplaints.IGatherer,
): void {
  const film: HumanPerformance = new HumanPerformance({
    seed: `hand-${technique}`,
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
        at: { x: 0, y: 0, z: DISTANCE * body.measure.stature },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a")
      .guard({ duration: 1.2, style: "kickboxing" })
      .registered(
        technique,
        { at: { kind: "person", subject: "b", region: "chin" } },
        "strike",
      )
      .stand({ hold: 1, sway: 0 })
      .with(
        HumanChain.subject("b")
          .guard({ duration: 3, style: "kickboxing" })
          .stand({ hold: 0.5, sway: 0 }),
      ).node,
  });
  assertTakeClean(cell, film);
  const placed: IAutoMovieScheduleEntry | undefined =
    film.schedule.entries.find(
      (entry: IAutoMovieScheduleEntry): boolean =>
        entry.intent.anchor === "strike",
    );
  const impact: number | undefined = placed?.contact;
  if (placed === undefined || impact === undefined) {
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

  // The striking hand travels farther from the launch to the impact.
  const moved = (side: AutoMovieHumanSide): number =>
    Vector3.distance(
      HumanSignature.joint(a, placed.start, `${side}Hand`),
      HumanSignature.joint(a, impact, `${side}Hand`),
    );
  const side: AutoMovieHumanSide =
    moved("left") > moved("right") ? "left" : "right";
  const at = (seconds: number): IAutoMovieVector3 =>
    surface(
      body,
      side,
      technique,
      HumanSignature.bones(a, seconds).get(`${side}Hand`)!,
    );

  // 1. On the first surface it meets.
  const point: IAutoMovieVector3 = at(impact);
  const gap: number = HumanColliders.distance(
    body,
    HumanSignature.bones(b, impact),
    point,
  ).distance;
  complaints.check(
    `${cell}: the surface lies ${gap} m from the other body at impact`,
    gap <= TOUCH,
  );

  // 2. The arrival over the last frame.
  const travel: IAutoMovieVector3 = Vector3.subtract(point, at(impact - STEP));
  const ahead: number = travel.z;
  const up: number = travel.y;
  const shoulder: IAutoMovieVector3 = HumanSignature.joint(
    a,
    impact,
    `${side}UpperArm`,
  );
  const chest: IAutoMovieVector3 = HumanSignature.joint(a, impact, "chest");
  const out: number = Vector3.dot(
    travel,
    Vector3.normalize({
      x: shoulder.x - chest.x,
      y: 0,
      z: shoulder.z - chest.z,
    }),
  );
  complaints.check(
    `${cell}: arrives ${JSON.stringify({ ahead, out, up })} m over the last frame`,
    technique === "palmHeel"
      ? ahead > Math.abs(up)
      : technique === "backfist"
        ? out > 0
        : up < 0 && -up > Math.abs(out),
  );

  // 3. The elbow in its band.
  const elbow: number = HumanSignature.flexion(
    shoulder,
    HumanSignature.joint(a, impact, `${side}LowerArm`),
    HumanSignature.joint(a, impact, `${side}Hand`),
  );
  complaints.check(
    `${cell}: elbow flexion ${elbow} deg at impact, ${band.join(" to ")} expected within ${TOLERANCE}`,
    elbow >= band[0] - TOLERANCE && elbow <= band[1] + TOLERANCE,
  );
}

/** The technique's striking surface on the displayed hand, world metres. */
function surface(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  technique: Technique,
  hand: IAutoMovieResolvedBone,
): IAutoMovieVector3 {
  if (technique === "backfist")
    return resolveAutoMovieHumanoidSurfaces.place(
      body.surfaces.regions[side === "left" ? "handBackLeft" : "handBackRight"],
      hand,
    ).point;
  const local: IAutoMovieVector3 =
    technique === "palmHeel"
      ? body.surfaces.sockets[side === "left" ? "palmLeft" : "palmRight"].point
      : Vector3.scale(
          Vector3.subtract(
            body.rest.get(`${side}LittleProximal`)!,
            body.rest.get(`${side}Hand`)!,
          ),
          0.5,
        );
  return Vector3.add(
    hand.worldPosition,
    Quaternion.rotateVector(hand.worldRotation, local),
  );
}
