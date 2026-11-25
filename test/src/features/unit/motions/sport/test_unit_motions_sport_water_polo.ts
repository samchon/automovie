import type {
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanWaterPolo,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { scoreWaterPoloGoal } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/** The ball's radius, metres. */
const RADIUS: number = 0.11;

/** A fixed goal whose 3 by 0.9 m mouth stands at (0, 0, 10) facing +Z. */
const GOAL: IAutoMovieMotionHumanProp = {
  subject: "goal",
  frame: {
    position: { x: 0, y: 0, z: 10 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  },
  points: {},
  fixed: true,
  affordances: [
    {
      id: "mouth",
      kind: "aperture",
      frame: {
        translation: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
      extent: null,
      width: 3,
      height: 0.9,
    },
  ],
};

/**
 * A shot thrown at 1 s from 5 m before the mouth at 5 m/s, drag- and
 * gravity-free.
 */
const shot = (
  from: IAutoMovieVector3,
  end: number,
): scoreWaterPoloGoal.IFlight => ({
  launch: 1,
  end,
  projectile: {
    origin: from,
    velocity: { x: 0, y: 0, z: -5 },
    gravity: { x: 0, y: 0, z: 0 },
  },
  published: { sphere: { radius: RADIUS, centre: { x: 0, y: 0, z: 0 } } },
  source: { subject: "shooter" },
});

/** The film of one ball's flights and the fixed goal. */
const film = (
  flights: scoreWaterPoloGoal.IFlight[],
): scoreWaterPoloGoal.IFilm => ({
  duration: 10,
  prop: (): IAutoMovieRigidTransform => GOAL.frame,
  flights: (): readonly scoreWaterPoloGoal.IFlight[] => flights,
});

/**
 * `scoreWaterPoloGoal` credits a goal where the whole ball has crossed the
 * fixed mouth's plane, its centre one radius behind it, inside the mouth: its
 * centre within half the width less a radius across, a radius above the
 * waterline and a radius below the bar, before the flight ends.
 *
 * Scenarios:
 *
 * 1. A shot on the axis 0.5 m up crosses at `1 + (5 + r) / 5` s, its centre a
 *    radius behind the plane, scored to its thrower.
 * 2. A shot 2 m aside, or one whose flight ends before it crosses, scores nothing.
 * 3. A goal that is not fixed is refused.
 */
export function test_unit_motions_sport_water_polo(): void {
  const cues: readonly IAutoMovieMotionHumanWaterPolo.ICue[] =
    scoreWaterPoloGoal({
      film: film([shot({ x: 0, y: 0.5, z: 15 }, 5)]),
      ball: "ball",
      goal: GOAL,
    });
  TestValidator.predicate(
    "the whole ball through the mouth",
    cues.length === 1 &&
      nclose(cues[0]!.seconds, 1 + (5 + RADIUS) / 5, 1e-12) &&
      vclose(cues[0]!.center, { x: 0, y: 0.5, z: 10 - RADIUS }, 1e-12) &&
      cues[0]!.scorer === "shooter" &&
      cues[0]!.goal === "goal",
  );
  TestValidator.equals(
    "wide, or ended short",
    [
      scoreWaterPoloGoal({
        film: film([shot({ x: 2, y: 0.5, z: 15 }, 5)]),
        ball: "ball",
        goal: GOAL,
      }).length,
      scoreWaterPoloGoal({
        film: film([shot({ x: 0, y: 0.5, z: 15 }, 1.5)]),
        ball: "ball",
        goal: GOAL,
      }).length,
    ],
    [0, 0],
  );
  TestValidator.predicate(
    "a loose goal",
    throwsError(() =>
      scoreWaterPoloGoal({
        film: film([]),
        ball: "ball",
        goal: { ...GOAL, fixed: false },
      }),
    ),
  );
}
