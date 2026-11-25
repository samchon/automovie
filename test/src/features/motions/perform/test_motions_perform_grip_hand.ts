import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { prepareHumanGripHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { standingPerformanceState } from "../../internal/fixtures/standingPerformanceState";

/**
 * How far the knotted socket may stand from the displayed one, metres: the
 * course's knots hold each of its nine coordinates to the arm solver's
 * millimetre.
 */
const PLACE: number = 1e-3;

/**
 * How far the knotted frame may turn from the displayed one, radians: two axis
 * points each a millimetre off at a hand length of about 0.19 m turn the frame
 * by under 2 × √3 × 1e-3 / 0.19, below 0.02.
 */
const TURN: number = 0.02;

/**
 * `prepareHumanGripHand` tabulates a hand span's grip-socket frame once, as a
 * course a read of the held prop uses instead of the holder's live posture.
 *
 * Scenarios:
 *
 * 1. Over a span from 0.2 to 1.6 s the course stays within a millimetre and
 *    0.02 rad of the displayed socket at every tenth of a second.
 * 2. Before the span it reads the span's start, after it the span's end.
 * 3. A span running past the film ends at the film's end.
 * 4. An empty span reads its start everywhere.
 * 5. Replacing the second action preserves the earlier frame and the shared entry.
 * 6. An action boundary inside a span only a few clock values wide is still readable.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the prepared grip reader, the metre and radian bounds, its endpoint behavior and the preserved entry of a changed action.
 * @evidence contracts/development/testing.md#behavioral-verification Calls prepareHumanGripHand on a supplied placed performer, reads its frames and detects whether a later action changes already-authored frame components.
 * @evidence contracts/development/testing.md#independent-expectations The displayed hand bounds position and rotation. A later cubic root translation has the same entry value and moves the hand afterward, so earlier positions and rotations must match exactly.
 * @evidence contracts/development/testing.md#distinguishing-cases Exercises a normal span, reads outside it, film-end clipping, an empty span, an unchanged entry into a changed action and a clock-limited action boundary.
 * @evidence contracts/development/testing.md#execution-ownership The exported entry calls the grip owner using the shared stored body and two synthetic action records. It runs no scene, host process or flight.
 */
export async function test_motions_perform_grip_hand(): Promise<void> {
  const { state } = await standingPerformanceState();
  // An empty span reads the displayed socket itself at its start.
  const displayed = (seconds: number): IAutoMovieRigidTransform =>
    prepareHumanGripHand(state, {
      subject: "actor",
      side: "right",
      from: seconds,
      to: seconds,
    })(seconds);
  const course = prepareHumanGripHand(state, {
    subject: "actor",
    side: "right",
    from: 0.2,
    to: 1.6,
  });

  // 1. Within the knots' bound.
  const failures: string[] = [];
  for (let k: number = 2; k <= 16; ++k) {
    const t: number = k / 10;
    const a: IAutoMovieRigidTransform = course(t);
    const b: IAutoMovieRigidTransform = displayed(t);
    const gap: number = distance(a.position, b.position);
    const angle: number = between(a.rotation, b.rotation);
    if (!(gap <= PLACE) || !(angle <= TURN))
      failures.push(`${t} s: ${gap} m, ${angle} rad`);
  }
  TestValidator.equals("the course follows the socket", failures, []);

  // 2. Clamped.
  TestValidator.predicate(
    "clamped to the span",
    distance(course(0).position, course(0.2).position) === 0 &&
      distance(course(5).position, course(1.6).position) === 0,
  );

  // 3. Clipped to the film.
  const open = prepareHumanGripHand(state, {
    subject: "actor",
    side: "right",
    from: 0.5,
    to: Infinity,
  });
  TestValidator.predicate(
    "clipped to the film's end",
    distance(open(state.duration + 3).position, open(state.duration).position) ===
      0,
  );

  // 4. Empty.
  const empty = prepareHumanGripHand(state, {
    subject: "actor",
    side: "right",
    from: 1,
    to: 0.5,
  });
  TestValidator.predicate(
    "an empty span reads its start",
    distance(empty(3).position, displayed(1).position) === 0,
  );

  // 5. The replacement starts at the same pose and then translates its root.
  const person: IAutoMovieMotionHumanSegment.IPerson =
    state.people.get("actor")!;
  const tail: IAutoMovieMotionHumanSegment = person.segments[1]!;
  const entry: IAutoMovieMotionHumanPosture = tail.plan.posture(0);
  person.segments[1] = {
    ...tail,
    plan: {
      ...tail.plan,
      posture: (seconds: number): IAutoMovieMotionHumanPosture =>
        seconds === 0
          ? entry
          : {
              ...entry,
              root: { ...entry.root, x: entry.root.x + 0.04 * seconds ** 3 },
            },
    },
  };
  const replaced: ReturnType<typeof prepareHumanGripHand> = prepareHumanGripHand(
    state,
    {
      subject: "actor",
      side: "right",
      from: 0.2,
      to: 1.6,
    },
  );
  const join: number = tail.entryTime;
  for (const at of [join / Math.SQRT2, join - 0.001, join]) {
    const original: IAutoMovieRigidTransform = course(at);
    const branch: IAutoMovieRigidTransform = replaced(at);
    TestValidator.predicate(
      `the same frame at ${at} s`,
      Object.is(original.position.x, branch.position.x) &&
        Object.is(original.position.y, branch.position.y) &&
        Object.is(original.position.z, branch.position.z) &&
        Object.is(original.rotation.x, branch.rotation.x) &&
        Object.is(original.rotation.y, branch.rotation.y) &&
        Object.is(original.rotation.z, branch.rotation.z) &&
        Object.is(original.rotation.w, branch.rotation.w),
    );
  }
  const later: number = join + tail.plan.duration / 2;
  TestValidator.predicate(
    "the replacement can still move the held frame",
    distance(course(later).position, replaced(later).position) > PLACE,
  );

  // 6. The ordinary six-point grid cannot distinguish all its points here.
  const quantum: number = Number.EPSILON * Math.max(1, Math.abs(join));
  const narrow: ReturnType<typeof prepareHumanGripHand> = prepareHumanGripHand(
    state,
    {
      subject: "actor",
      side: "right",
      from: join - quantum,
      to: join + quantum,
    },
  );
  for (const at of [join - quantum, join, join + quantum]) {
    const actual: IAutoMovieRigidTransform = narrow(at);
    const expected: IAutoMovieRigidTransform = displayed(at);
    TestValidator.predicate(
      `the short span still follows the socket at ${at} s`,
      distance(actual.position, expected.position) <= PLACE &&
        between(actual.rotation, expected.rotation) <= TURN,
    );
  }
}

/** The distance between two points. */
function distance(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/** The angle between two turns, radians. */
function between(a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number {
  const dot: number = Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w);
  return 2 * Math.acos(Math.min(1, dot));
}
