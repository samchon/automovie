import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import {
  WalkPath,
  WalkTurn,
  walkHeading,
  walkLocomoteLowering,
  type walkStation,
  walkTempo,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

namespace part_walk_turn {
  /** Rounding of a few cubic products, degrees. */
  const ROUNDING: number = 1e-9;

  /**
   * `WalkTurn` is a walk's heading through its knots as a monotone cubic Hermite
   * curve (Fritsch and Butland 1984): the heading rests at both ends and at any
   * knot where it reverses or stops, an inner knot otherwise taking the weighted
   * harmonic mean of its two slopes, and it holds the end headings outside.
   *
   * Scenarios:
   *
   * 1. Turning 90 degrees over the first second and then holding, the knot at 1 s
   *    rests: a quarter second in reads 90 (3/16 - 2/64) = 14.0625, half way 45.
   * 2. Turning 90 degrees over 1 s and then 180 more over 2 s, both slopes 90
   *    degrees a second, the knot at 1 s takes rate 90: at 1.5 s, u = 1/4 of a 2
   *    s span ending at rest, the heading is 0.84375 * 90 + 0.140625 * 2 * 90 +
   *    0.15625 * 270 = 143.4375.
   * 3. Before the first knot and after the last the end headings hold, and two knots
   *    at one second step the heading there: the earlier at the second, the later
   *    after it.
   */
  export function verify(): void {
    const held: WalkTurn = new WalkTurn([
      { seconds: 0, yaw: 0 },
      { seconds: 1, yaw: 90 },
      { seconds: 2, yaw: 90 },
    ]);
    TestValidator.predicate(
      "a resting knot",
      nclose(held.at(0.25), 14.0625, ROUNDING) &&
        nclose(held.at(0.5), 45, ROUNDING) &&
        nclose(held.at(1.5), 90, ROUNDING),
    );
    const onward: WalkTurn = new WalkTurn([
      { seconds: 0, yaw: 0 },
      { seconds: 1, yaw: 90 },
      { seconds: 3, yaw: 270 },
    ]);
    TestValidator.predicate(
      "a passing knot",
      nclose(onward.at(1.5), 143.4375, ROUNDING),
    );
    const stepped: WalkTurn = new WalkTurn([
      { seconds: 0, yaw: 0 },
      { seconds: 1, yaw: 0 },
      { seconds: 1, yaw: 30 },
      { seconds: 2, yaw: 30 },
    ]);
    TestValidator.equals(
      "the ends",
      [onward.at(-1), onward.at(5), stepped.at(1), stepped.at(1.5)],
      [0, 270, 0, 30],
    );
  }
}

namespace part_walk_tempo {
  /** Rounding of a few sums and the inverse's 40 halvings, seconds. */
  const ROUNDING: number = 1e-9;

  /**
   * `walkTempo` takes a stepping plan's steps unevenly in time: each step between
   * two heel strikes lasts its planned time stretched by its own share, held
   * within `HOLD`, a limp cutting the spared leg's steps short and drawing the
   * other's out, the plan's clock running at `1 + k sin^2(pi u)` of the film's
   * within a step; `strikes` names a plan's heel strikes and `entrainment` sends
   * them to given seconds.
   *
   * Scenarios, a 4 s plan striking left at 1 s, right at 2 s and left at 3 s, its
   * root `x` the plan's second:
   *
   * 1. The strikes are left 1, right 2 and left 3 s.
   * 2. Stretching the first step by a tenth and shrinking the second by a tenth
   *    keeps 4 s; the second strike falls at 2.1 s and the third at 3 s; the
   *    middle of the first step, 1.55 s, reads the plan at 1.5 s, since the
   *    rate's sine integrates to a half there; before the first strike and after
   *    the last the clocks run alike.
   * 3. A half stretch is held at a fifth: the first step lasts 1.2 s.
   * 4. A 5 % limp spared on the left shortens the left-struck first step to 0.95 s
   *    and lengthens the second to 1.05 s.
   * 5. Entraining the strikes to 1, 2.2 and 3.1 s maps plan 2 s to 2.2 s and film
   *    3.1 s to plan 3 s; a step longer than twice its planned time is refused,
   *    and a plan with one strike is returned as it is.
   */
  export function verify(): void {
    const event: (name: string, share: number) => IAutoMovieMotionEvent = (
      name: string,
      share: number,
    ): IAutoMovieMotionEvent => ({ name, share });
    const plan: walkStation.IPlan = {
      duration: 4,
      events: [
        event("leftHeelStrike1", 0.25),
        event("ready", 0.3),
        event("rightHeelStrike1", 0.5),
        event("leftHeelStrike2", 0.75),
      ],
      contacts: [],
      posture: (seconds: number): IAutoMovieMotionHumanPosture => ({
        root: { x: seconds, y: 0, z: 0 },
        yaw: 0,
        pitch: 0,
        roll: 0,
        joints: {},
        limbs: {},
      }),
    };
    TestValidator.equals("the strikes", walkTempo.strikes(plan), [
      { seconds: 1, side: "left" },
      { seconds: 2, side: "right" },
      { seconds: 3, side: "left" },
    ]);
    const strike: (p: walkStation.IPlan, name: string) => number = (
      p: walkStation.IPlan,
      name: string,
    ): number =>
      p.events.find((e: IAutoMovieMotionEvent): boolean => e.name === name)!
        .share * p.duration;
    const uneven: walkStation.IPlan = walkTempo(
      plan,
      (index: number): number => (index === 0 ? 0.1 : -0.1),
    );
    TestValidator.predicate(
      "an uneven step",
      nclose(uneven.duration, 4, ROUNDING) &&
        nclose(strike(uneven, "rightHeelStrike1"), 2.1, ROUNDING) &&
        nclose(strike(uneven, "leftHeelStrike2"), 3, ROUNDING) &&
        nclose(uneven.posture(1.55).root.x, 1.5, ROUNDING) &&
        nclose(uneven.posture(0.5).root.x, 0.5, ROUNDING) &&
        nclose(uneven.posture(3.5).root.x, 3.5, ROUNDING),
    );
    TestValidator.predicate(
      "held at a fifth",
      nclose(
        strike(
          walkTempo(plan, (): number => 0.5),
          "rightHeelStrike1",
        ),
        2.2,
        ROUNDING,
      ),
    );
    TestValidator.predicate(
      "a limp",
      nclose(
        strike(
          walkTempo(plan, (): number => 0, { side: "left", share: 0.05 }),
          "rightHeelStrike1",
        ),
        1.95,
        ROUNDING,
      ),
    );
    const clock: walkTempo.IClock = walkTempo.entrainment(
      walkTempo.strikes(plan),
      [1, 2.2, 3.1],
    )!;
    TestValidator.predicate(
      "entrained",
      nclose(clock.toFilm(2), 2.2, ROUNDING) &&
        nclose(clock.toPlan(3.1), 3, ROUNDING),
    );
    TestValidator.error("a step past twice its time", (): void => {
      walkTempo.entrainment(walkTempo.strikes(plan), [1, 3.5]);
    });
    const single: walkStation.IPlan = {
      ...plan,
      events: [event("leftHeelStrike1", 0.5)],
    };
    TestValidator.predicate(
      "one strike",
      walkTempo(single, (): number => 0.1) === single &&
        walkTempo.entrainment(walkTempo.strikes(single), [2]) === undefined,
    );
  }
}

namespace part_walk_path {
  /** Rounding of a few sums, metres and degrees. */
  const ROUNDING: number = 1e-12;

  /**
   * `WalkPath` is a floor polyline by arc length: `at` the point at a length,
   * clamped to the ends; `nearest` the length of the point nearest a floor point,
   * the first on a tie; `heading` the chord's heading across a neighbourhood,
   * kept inside the path at its ends.
   *
   * Scenarios, an L from the origin 3 m along +Z and then 4 m along +X:
   *
   * 1. Its length is 7 m; 1.5 m along is (0, 0, 1.5), 5 m along (2, 0, 3), and
   *    lengths past either end clamp to them.
   * 2. The point (1, 0, 1) is nearest the first leg at 1 m; (2, 0, 5) is nearest the
   *    second leg at 5 m.
   * 3. The heading 1 m along is 0 (+Z), 6 m along is 90 (+X), and at the corner over
   *    0.5 m either side it is the 45-degree chord.
   */
  export function verify(): void {
    const path: WalkPath = new WalkPath([
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 3 },
      { x: 4, y: 0, z: 3 },
    ]);
    TestValidator.predicate(
      "by length",
      nclose(path.length, 7, ROUNDING) &&
        vclose(path.at(1.5), { x: 0, y: 0, z: 1.5 }, ROUNDING) &&
        vclose(path.at(5), { x: 2, y: 0, z: 3 }, ROUNDING) &&
        vclose(path.at(-1), { x: 0, y: 0, z: 0 }, ROUNDING) &&
        vclose(path.at(9), { x: 4, y: 0, z: 3 }, ROUNDING),
    );
    TestValidator.predicate(
      "nearest",
      nclose(path.nearest({ x: 1, y: 0, z: 1 }), 1, ROUNDING) &&
        nclose(path.nearest({ x: 2, y: 0, z: 5 }), 5, ROUNDING),
    );
    TestValidator.predicate(
      "headings",
      nclose(path.heading(1, 0.5), 0, ROUNDING) &&
        nclose(path.heading(6, 0.5), 90, ROUNDING) &&
        nclose(path.heading(3, 0.5), 45, ROUNDING) &&
        nclose(path.heading(0, 0.5), 0, ROUNDING),
    );
  }
}

namespace part_walk_heading_footfalls {
  /** Rounding of a few trigonometric products, degrees and metres. */
  const ROUNDING: number = 1e-9;

  /** A 90-degree turn's step turn, degrees (`walkHeading.step`). */
  const STEP: number = 73.54;

  /**
   * `walkHeading`'s footfall rules: `opening` counts the in-place turns before a
   * walk sets off, each foot turning at most `step` of the turn until both face
   * within the twist of the way; `about` turns each footfall at most that far
   * from its foot's last; `uncrossed` picks the leading foot so its first
   * footprint never lands across the standing foot; `separated` keeps a footprint
   * its offset to its side of the other foot's; `around` steps the turning foot
   * round the standing foot's footprint; `leaned` keeps a heading within the
   * ankle's sideways lean of the line to the hip.
   *
   * Scenarios, the feet facing 0 from a heading of 0 and a 10-degree twist:
   *
   * 1. Setting off at 90 degrees takes four in-place turns, 73.54 and then 16.46
   *    each foot; at 30 none, and two when the walk opens with a step turn.
   * 2. Footfalls asked at 30, 60, 90, 90 with the last two kept stay as asked; two
   *    at 90 from rest turn 73.54 each.
   * 3. With the left foot behind, a walk ahead keeps it leading; one turning hard
   *    right toward the standing right foot would land the left across it, so the
   *    right leads.
   * 4. A left footprint 5 cm left of the right one's, both 10 cm off the way, is
   *    moved out to 20 cm; one already 30 cm out is kept; with no other footprint
   *    it is kept.
   * 5. Facing +X, the right foot steps round to 20 cm behind its standing partner's
   *    footprint.
   * 6. A hip 0.5 m to the side with 0.1 m of leeway turns a heading of 0 to 90 -
   *    asin(0.2); a hip within the leeway leaves it.
   */
  export function verify(): void {
    const still: Record<"left" | "right", number> = { left: 0, right: 0 };
    TestValidator.equals(
      "the opening",
      [
        walkHeading.opening(90, "right", still, 0, 10),
        walkHeading.opening(30, "right", still, 0, 10),
        walkHeading.opening(30, "right", still, 0, 10, true),
      ],
      [4, 0, 2],
    );
    TestValidator.predicate(
      "the footfalls",
      walkHeading
        .about([30, 60, 90, 90], "left", still, 0, 2)
        .every((y: number, i: number): boolean =>
          nclose(y, [30, 60, 90, 90][i]!, ROUNDING),
        ) &&
        walkHeading
          .about([90, 90], "left", still, 0, 0)
          .every((y: number): boolean => nclose(y, STEP, ROUNDING)),
    );
    const ankles: Record<
      "left" | "right",
      { x: number; y: number; z: number }
    > = { left: { x: 0.1, y: 0, z: 0 }, right: { x: -0.1, y: 0, z: 0 } };
    TestValidator.equals(
      "the lead",
      [
        walkHeading.uncrossed(
          "left",
          ankles,
          still,
          { x: 0, y: 0, z: 0.3 },
          0,
          0.1,
        ),
        walkHeading.uncrossed(
          "left",
          ankles,
          still,
          { x: -0.3, y: 0, z: 0 },
          -90,
          0.1,
        ),
      ],
      ["left", "right"],
    );
    const other: walkHeading.ISeparated = {
      point: { x: 0, y: 0, z: 1 },
      lateral: 0.1,
    };
    TestValidator.predicate(
      "separated",
      vclose(
        walkHeading.separated({ x: 0.05, y: 0, z: 1 }, other, 0, "left", 0.1),
        { x: 0.2, y: 0, z: 1 },
        ROUNDING,
      ) &&
        vclose(
          walkHeading.separated({ x: 0.3, y: 0, z: 1 }, other, 0, "left", 0.1),
          { x: 0.3, y: 0, z: 1 },
          ROUNDING,
        ) &&
        vclose(
          walkHeading.separated(
            { x: 0.05, y: 0, z: 1 },
            undefined,
            0,
            "left",
            0.1,
          ),
          { x: 0.05, y: 0, z: 1 },
          ROUNDING,
        ),
    );
    TestValidator.predicate(
      "around",
      vclose(
        walkHeading.around(other, 90, "right", 0.1, 0.08),
        { x: 0, y: 0.08, z: 1.2 },
        ROUNDING,
      ),
    );
    TestValidator.predicate(
      "leaned",
      nclose(
        walkHeading.leaned(
          0,
          { x: 0, y: 0, z: 0 },
          { x: 0.5, y: 0.9, z: 0 },
          0.1,
          false,
        ),
        90 - (Math.asin(0.2) * 180) / Math.PI,
        ROUNDING,
      ) &&
        walkHeading.leaned(
          0,
          { x: 0, y: 0, z: 0 },
          { x: 0.05, y: 0.9, z: 0 },
          0.1,
          false,
        ) === 0,
    );
  }
}

namespace part_walk_locomote_lowering_prepare {
  /** Rounding of one quintic's evaluation, metres and degrees. */
  const ROUNDING: number = 1e-12;

  /**
   * `walkLocomoteLowering.prepare` solves the exact lowering at knots AutoKnots
   * places between the walk's contact events, every toe-off and heel strike
   * (`walkLocomoteLowering.marks`), and joins them by a knot course, so the
   * course passes every exact value it read and holds the end values outside the
   * take; `prepareStances` courses each foot's pitch the same way, split at that
   * foot's own events only.
   *
   * The exact lowering here is `0.01 t` metres at `t` seconds over a one-second
   * take with a left swing from 0.2 to 0.6 s; the pitches are `10 t` degrees for
   * the left foot and `-5 t` for the right.
   *
   * Scenarios:
   *
   * 1. The marks are the swing's toe-off and heel strike.
   * 2. The lowering is read at the take's ends and at both contact events, and the
   *    course passes the exact lowering at every second it read.
   * 3. Before the take and after it the course holds its end values.
   * 4. Each pitch course passes its exact pitch at both ends of the take and at the
   *    left foot's events, and on a 0.26 m foot the pitch tolerance is the turn
   *    that moves its far end a millimetre, 0.001 / 0.26 radians.
   */
  export function verify(): void {
    const swings: { side: "left"; off: number; on: number }[] = [
      { side: "left", off: 0.2, on: 0.6 },
    ];
    TestValidator.equals(
      "the marks",
      walkLocomoteLowering.marks(swings),
      [0.2, 0.6],
    );
    const read: number[] = [];
    const course: ReturnType<typeof walkLocomoteLowering.prepare> =
      walkLocomoteLowering.prepare(1, swings, (t: number): number => {
        read.push(t);
        return 0.01 * t;
      });
    TestValidator.predicate(
      "through every read",
      [0, 0.2, 0.6, 1].every((t: number): boolean =>
        read.some((r: number): boolean => nclose(r, t, ROUNDING)),
      ) &&
        read.every((t: number): boolean =>
          nclose(course(t)[0]!, 0.01 * t, ROUNDING),
        ),
    );
    TestValidator.predicate(
      "held outside",
      nclose(course(-1)[0]!, 0, ROUNDING) &&
        nclose(course(2)[0]!, 0.01, ROUNDING),
    );
    const pitches: ReturnType<typeof walkLocomoteLowering.prepareStances> =
      walkLocomoteLowering.prepareStances(
        1,
        swings,
        0.26,
        (t: number): Record<"left" | "right", number> => ({
          left: 10 * t,
          right: -5 * t,
        }),
      );
    TestValidator.predicate(
      "the pitches",
      [0, 0.2, 0.6, 1].every((t: number): boolean =>
        nclose(pitches(t).left, 10 * t, ROUNDING),
      ) &&
        nclose(pitches(0).right, 0, ROUNDING) &&
        nclose(pitches(1).right, -5, ROUNDING) &&
        nclose(
          walkLocomoteLowering.pitchTolerance(0.26),
          ((0.001 / 0.26) * 180) / Math.PI,
          ROUNDING,
        ),
    );
  }
}

/**
 * `walk`'s unit contract: its turns, tempo, path, footfalls and lowered stance
 * course.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `walk_turn`: `WalkTurn` is a walk's heading through its knots as a monotone
 *   cubic Hermite curve (Fritsch and Butland 1984):
 * - `walk_tempo`: `walkTempo` takes a stepping plan's steps unevenly in time:
 * - `walk_path`: `WalkPath` is a floor polyline by arc length:
 * - `walk_heading_footfalls`: `walkHeading`'s footfall rules:
 * - `walk_locomote_lowering_prepare`: `walkLocomoteLowering.prepare` solves the
 *   exact lowering at knots AutoKnots places between the walk's contact events,
 *   every toe-off and heel strike (`walkLocomoteLowering.marks`), and joins
 *   them by a knot course, so the course passes every exact value it read and
 *   holds the end values outside the take;
 */
export async function test_unit_motions_actions_walk(): Promise<void> {
  part_walk_turn.verify();
  part_walk_tempo.verify();
  part_walk_path.verify();
  part_walk_heading_footfalls.verify();
  part_walk_locomote_lowering_prepare.verify();
}
