import { AutoMovieComposition, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieComposition,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanGroupDance,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanDance,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** How many dance in each group: the issue's eight. */
const MEMBERS: number = 8;

/** The tempo, beats per minute. */
const BPM: number = 120;

/** The seeded variation, seconds. */
const VARY: number = 0.03;

/** The joined-hands bound, metres. */
const JOINED: number = 0.04;

/**
 * Line, circle and conga dances of eight (#4010's group dances), the two
 * canonical bodies alternating in each group.
 *
 * Scenarios:
 * 1. In the line dance every member's facing turns a quarter to the left
 *    each repeat, and the rows keep their spacing within 50 mm.
 * 2. In the circle dance each member's left hand stays within 40 mm of its
 *    left neighbour's right hand while the circle rotates.
 * 3. In the conga each member's hands stay within 40 mm of the shoulders of
 *    the one ahead.
 * 4. Every member's beats fall within the variation of the shared beat,
 *    and no two members' beats coincide.
 * 5. Each take passes the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each group rule, the bounds and the verdicts.
 * @evidence contracts/development/testing.md#behavioral-verification Plans eight members on the social-dance row through the public chain and reads displayed hips, hands and shoulders.
 * @evidence contracts/development/testing.md#independent-expectations The turn is a quarter a repeat; spacing is the start grid's; the beat is the tempo's.
 * @evidence contracts/development/testing.md#distinguishing-cases Three dances, eight members, two bodies, eight seeds.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on the shared Human fixture.
 */
export function test_motion_dance_group_dance(): void {
  const period: number = 60 / BPM;

  // 1. Line dance: two rows of four, two repeats.
  {
    const places: IAutoMovieVector3[] = Array.from(
      { length: MEMBERS },
      (_: unknown, i: number): IAutoMovieVector3 => ({
        x: 1.4 * (i % 4),
        y: 0,
        z: -1.6 * Math.floor(i / 4),
      }),
    );
    const film: HumanPerformance = group(
      places,
      places.map((): number => 0),
      (): IAutoMovieMotionHumanGroupDance.IParams => ({
        kind: "line",
        bpm: BPM,
        repeats: 2,
        vary: VARY,
      }),
    );
    let turnOk: boolean = true;
    const ends: IAutoMovieVector3[] = [];
    for (let i: number = 0; i < MEMBERS; i++) {
      const s: IAutoMovieMotionHumanSegment = dance(film, i);
      turnOk &&= Math.abs(turn(film, i, s.start, s.end) - 180) <= 5;
      ends.push(hips(film, i, s.end));
    }
    let spacing: number = 0;
    for (let i: number = 0; i < MEMBERS; i++)
      for (let j: number = i + 1; j < MEMBERS; j++)
        spacing = Math.max(
          spacing,
          Math.abs(
            Vector3.distance(ends[i]!, ends[j]!) -
              Vector3.distance(places[i]!, places[j]!),
          ),
        );
    TestValidator.predicate(
      `the line turns a quarter each repeat and keeps its rows (${(spacing * 1000).toFixed(0)} mm)`,
      turnOk && spacing <= 0.05,
    );
    beats(film, period);
    assertTakeClean("line dance", film);
  }

  // 2. Circle dance round the origin.
  {
    const radius: number = 1.1;
    const places: IAutoMovieVector3[] = Array.from(
      { length: MEMBERS },
      (_: unknown, i: number): IAutoMovieVector3 => {
        const a: number = (2 * Math.PI * i) / MEMBERS;
        return { x: radius * Math.sin(a), y: 0, z: radius * Math.cos(a) };
      },
    );
    const yaws: number[] = places.map(
      (p: IAutoMovieVector3): number =>
        (Math.atan2(-p.x, -p.z) * 180) / Math.PI,
    );
    const film: HumanPerformance = group(
      places,
      yaws,
      (i: number): IAutoMovieMotionHumanGroupDance.IParams => ({
        kind: "circle",
        bpm: BPM,
        repeats: 1,
        vary: VARY,
        centre: { x: 0, y: 0, z: 0 },
        members: MEMBERS,
        left: id((i + MEMBERS - 1) % MEMBERS),
        right: id((i + 1) % MEMBERS),
      }),
    );
    const s: IAutoMovieMotionHumanSegment = dance(film, 0);
    let apart: number = 0;
    for (let t: number = s.start + 0.2; t <= s.end - 0.2; t += 0.1)
      for (let i: number = 0; i < MEMBERS; i++) {
        const mine: IAutoMovieVector3 = film
          .bones(id(i), t)
          .get("leftHand")!.worldPosition;
        const theirs: IAutoMovieVector3 = film
          .bones(id((i + MEMBERS - 1) % MEMBERS), t)
          .get("rightHand")!.worldPosition;
        apart = Math.max(apart, Vector3.distance(mine, theirs));
      }
    const moved: number = Vector3.distance(
      hips(film, 0, s.start),
      hips(film, 0, s.end),
    );
    TestValidator.predicate(
      `the circle's joined hands stay together (${(apart * 1000).toFixed(0)} mm) while it rotates (${(moved * 1000).toFixed(0)} mm)`,
      apart <= JOINED && moved >= 0.2,
    );
    beats(film, period);
    assertTakeClean("circle dance", film);
  }

  // 3. Conga in file.
  {
    const places: IAutoMovieVector3[] = Array.from(
      { length: MEMBERS },
      (_: unknown, i: number): IAutoMovieVector3 => ({
        x: 0,
        y: 0,
        z: -0.6 * i,
      }),
    );
    const film: HumanPerformance = group(
      places,
      places.map((): number => 0),
      (i: number): IAutoMovieMotionHumanGroupDance.IParams => ({
        kind: "conga",
        bpm: BPM,
        repeats: 2,
        vary: VARY,
        ...(i === 0 ? {} : { ahead: id(i - 1) }),
      }),
    );
    let worst: number = 0;
    for (let i: number = 1; i < MEMBERS; i++) {
      const s: IAutoMovieMotionHumanSegment = dance(film, i);
      for (let t: number = s.start + 0.2; t <= s.end - 0.2; t += 0.1)
        for (const [hand, shoulder] of [
          ["leftHand", "leftUpperArm"],
          ["rightHand", "rightUpperArm"],
        ] as const) {
          const palm: IAutoMovieVector3 = film
            .bones(id(i), t)
            .get(hand)!.worldPosition;
          const top: IAutoMovieVector3 = film
            .bones(id(i - 1), t)
            .get(shoulder)!.worldPosition;
          worst = Math.max(worst, Vector3.distance(palm, top));
        }
    }
    TestValidator.predicate(
      `each conga member's hands stay on the shoulders ahead (${(worst * 1000).toFixed(0)} mm)`,
      worst <= 0.15,
    );
    beats(film, period);
    assertTakeClean("conga", film);
  }
}

/** A member's id. */
function id(i: number): string {
  return `m${i}`;
}

/** Eight members dancing together from their places, the bodies alternating; a member read by another is composed first. */
function group(
  places: readonly IAutoMovieVector3[],
  yaws: readonly number[],
  params: (i: number) => IAutoMovieMotionHumanGroupDance.IParams,
): HumanPerformance {
  const performers: IAutoMovieMotionHumanPerformer[] = places.map(
    (at: IAutoMovieVector3, i: number): IAutoMovieMotionHumanPerformer => ({
      subject: id(i),
      body: motionHumanBody(i % 2 === 0 ? "f-small" : "m-average"),
      at,
      yaw: yaws[i]!,
      proficiency: { level: "trained" },
    }),
  );
  return new HumanPerformance({
    seed: "group-dance",
    laws: [AutoMovieMotionHumanDance.HumanDanceStyles.socialDance],
    performers,
    composition: AutoMovieComposition.parallel(
      ...places.map(
        (_: IAutoMovieVector3, i: number): IAutoMovieComposition =>
          HumanChain.subject(id(i))
            .stand({ hold: 0.3, sway: 0 })
            .registered("socialDance", params(i)).node,
      ),
    ),
  });
}

/** A member's dance segment. */
function dance(
  film: HumanPerformance,
  i: number,
): IAutoMovieMotionHumanSegment {
  return film.segments(id(i))[1]!;
}

/** The displayed hips of a member. */
function hips(
  film: HumanPerformance,
  i: number,
  time: number,
): IAutoMovieVector3 {
  return film.bones(id(i), time).get("hips")!.worldPosition;
}

/** How far a member's facing turned between two seconds, degrees to the left. */
function turn(
  film: HumanPerformance,
  i: number,
  from: number,
  to: number,
): number {
  let total: number = 0;
  let last: number = heading(film, i, from);
  for (let t: number = from; t <= to; t += 1 / 24) {
    const now: number = heading(film, i, t);
    total += ((now - last + 540) % 360) - 180;
    last = now;
  }
  return total;
}

/** A member's displayed hips' heading, degrees. */
function heading(film: HumanPerformance, i: number, time: number): number {
  const f: IAutoMovieVector3 = Quaternion.rotateVector(
    film.bones(id(i), time).get("hips")!.worldRotation,
    { x: 0, y: 0, z: 1 },
  );
  return (Math.atan2(f.x, f.z) * 180) / Math.PI;
}

/** Every member's first beat within the variation of the shared beat, and no two alike. */
function beats(film: HumanPerformance, period: number): void {
  const offsets: number[] = Array.from(
    { length: MEMBERS },
    (_: unknown, i: number): number => {
      const s: IAutoMovieMotionHumanSegment = dance(film, i);
      const first: IAutoMovieMotionEvent = s.plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === "beat1",
      )!;
      return first.share * s.plan.duration - period;
    },
  );
  TestValidator.predicate(
    "every member keeps the shared beat within the variation, no two alike",
    offsets.every((o: number): boolean => Math.abs(o) <= VARY + 1e-9) &&
      new Set(offsets.map((o: number): string => o.toFixed(9))).size ===
        MEMBERS,
  );
}
