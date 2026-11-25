import type {
  IAutoMovieMotionHumanDanceBeats,
  IAutoMovieMotionHumanFoot,
  IAutoMovieQuaternion,
} from "@automovie/interface";
import {
  danceGrooveEnvelope,
  prepareDanceFootCourse,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** A floor offset: metres to the left and forward. */
interface IOffset {
  /** Metres to the left. */
  x: number;

  /** Metres forward. */
  z: number;
}

/** The identity rotation. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/** The swing's height at its middle, metres. */
const CLEARANCE: number = 0.1;

/**
 * `prepareDanceFootCourse` lays a dance foot's footfalls on its beats: the foot
 * holds its place until half a beat before the next footfall, then swings there
 * on its prepared arc, raised by the clearance at the swing's middle.
 *
 * The foot stands at the origin and falls 0.4 m forward on the beat at 1 s, a
 * beat lasting 1 s.
 *
 * Scenarios:
 *
 * 1. Before the swing the foot holds the origin, planted.
 * 2. At the swing's middle, 0.75 s, the foot is halfway, raised by the full
 *    clearance, and not planted.
 * 3. On and after the beat the foot stands on the footfall, planted.
 */
function scenario_test_unit_motions_exercise_dance_foot_course(): void {
  const origin: IOffset = { x: 0, z: 0 };
  const step: IOffset = { x: 0, z: 0.4 };
  const placements: Map<IOffset, IAutoMovieMotionHumanFoot.IPlacement> =
    new Map([
      [origin, { ankle: { x: 0, y: 0.08, z: 0 }, rotation: IDENTITY }],
      [step, { ankle: { x: 0, y: 0.08, z: 0.4 }, rotation: IDENTITY }],
    ]);
  const course: ReturnType<typeof prepareDanceFootCourse> =
    prepareDanceFootCourse(
      [{ beat: 1, at: step }],
      placements,
      origin,
      1,
      CLEARANCE,
    );

  // 1. Held.
  TestValidator.predicate(
    "the foot holds the origin before its swing",
    course.planted(0.3) &&
      course.along(0.3).z === 0 &&
      course.placed(0.3).ankle.z === 0,
  );

  // 2. Mid-swing.
  const middle: IAutoMovieMotionHumanFoot.IPlacement = course.placed(0.75);
  TestValidator.predicate(
    "the foot is halfway and raised at mid-swing",
    !course.planted(0.75) &&
      nclose(course.along(0.75).z, 0.2, 1e-12) &&
      nclose(middle.ankle.z, 0.2, 1e-12) &&
      nclose(middle.ankle.y, 0.08 + CLEARANCE, 1e-12),
  );

  // 3. Landed.
  TestValidator.predicate(
    "the foot stands on its footfall from the beat on",
    course.planted(1) &&
      nclose(course.placed(1.5).ankle.z, 0.4, 1e-12) &&
      nclose(course.placed(1.5).ankle.y, 0.08, 1e-12),
  );
}

/** Four beats half a second apart, the first at 0.5 s. */
const BEATS: Pick<IAutoMovieMotionHumanDanceBeats, "at" | "count"> = {
  count: 4,
  at: (k: number): number => 0.5 * k,
};

/**
 * `danceGrooveEnvelope` rises on a minimum-jerk share to the first beat, is
 * full to the last and falls the same way to the end.
 *
 * Scenarios, beats at 0.5 to 2 s in a dance ending at 3 s:
 *
 * 1. None before the start and at it; half at 0.25 s, the share's middle.
 * 2. Full from the first beat to the last.
 * 3. Half at 2.5 s, half way to the end, and none at the end.
 */
function scenario_test_unit_motions_exercise_dance_groove_envelope(): void {
  TestValidator.predicate(
    "the rise",
    danceGrooveEnvelope(-1, BEATS, 3) === 0 &&
      danceGrooveEnvelope(0, BEATS, 3) === 0 &&
      nclose(danceGrooveEnvelope(0.25, BEATS, 3), 0.5, 1e-12),
  );
  TestValidator.predicate(
    "full",
    danceGrooveEnvelope(0.5, BEATS, 3) === 1 &&
      danceGrooveEnvelope(1.2, BEATS, 3) === 1 &&
      danceGrooveEnvelope(2, BEATS, 3) === 1,
  );
  TestValidator.predicate(
    "the fall",
    nclose(danceGrooveEnvelope(2.5, BEATS, 3), 0.5, 1e-12) &&
      nclose(danceGrooveEnvelope(3, BEATS, 3), 0, 1e-12),
  );
}

/**
 * The dance law's own logic: the foot course and the groove envelope, each
 * scenario below.
 */
export function test_unit_motions_exercise_dance(): void {
  scenario_test_unit_motions_exercise_dance_foot_course();
  scenario_test_unit_motions_exercise_dance_groove_envelope();
}
