import type {
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { prepareHumanGripHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { standingPerformanceState } from "../../../internal/fixtures/standingPerformanceState";

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
 * Scenarios, for the standing man's right hand:
 *
 * 1. Over a span from 0.2 to 1.6 s the course stays within a millimetre and
 *    0.02 rad of the displayed socket at every tenth of a second.
 * 2. Before the span it reads the span's start, after it the span's end.
 * 3. A span running past the film ends at the film's end.
 * 4. An empty span reads its start everywhere.
 */
export async function test_unit_motions_perform_grip_hand(): Promise<void> {
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
