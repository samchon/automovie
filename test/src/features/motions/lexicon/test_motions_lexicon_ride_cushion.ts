import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { carryHumanPosture } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/** Center of a rectangular seat in its carrier's own frame, metres. */
const CUSHION: IAutoMovieVector3 = { x: 0.4, y: 0.45, z: -0.1 };

/** The seat region is 0.1 m below the fixture pelvis. */
const PELVIS: number = 0.1;

/** The carrier's playing course, still before 3 s and after 7 s. */
function course(film: number): IAutoMovieRigidTransform {
  const share: number = Math.max(0, Math.min(1, (film - 3) / 4));
  return {
    position: { x: 0, y: 0, z: share },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90 * share),
  };
}

/**
 * A carried seat remains on its cushion through translation and a quarter turn.
 *
 * Scenarios:
 * 1. Read before, during and after a one-metre, 90-degree turn of the carrier.
 * 2. The pelvis stays aligned to the carrier and the seat stays in its
 *    original cushion coordinates. Repeat earlier times in a different order.
 */
export function test_motions_lexicon_ride_cushion(): void {
  const posture: IAutoMovieMotionHumanPosture = {
    root: { ...CUSHION, y: CUSHION.y + PELVIS },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const origin: IAutoMovieRigidTransform = course(0);
  const times: readonly number[] = [
    2, 3, 3.00001, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 9, 5, 2,
  ];
  for (const film of times) {
    const moved: number = film <= 3 ? 0 : film >= 7 ? 1 : (film - 3) * 0.25;
    const radians: number = (moved * Math.PI) / 2;
    const sin: number = Math.sin(radians);
    const cos: number = Math.cos(radians);
    const expected: IAutoMovieVector3 = {
      x: CUSHION.x * cos + CUSHION.z * sin,
      y: CUSHION.y,
      z: moved + CUSHION.z * cos - CUSHION.x * sin,
    };
    const actual: IAutoMovieMotionHumanPosture = carryHumanPosture(
      posture,
      origin,
      course(film),
    );
    const seat: IAutoMovieVector3 = { ...actual.root, y: actual.root.y - PELVIS };
    TestValidator.predicate(
      `the pelvis follows its cushion at ${film} s`,
      Vector3.distance(seat, expected) <= 0.01 &&
        Math.abs(actual.yaw - (radians * 180) / Math.PI) <= 1,
    );
  }
}
