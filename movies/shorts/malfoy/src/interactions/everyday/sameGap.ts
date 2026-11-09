import { AutoMovieComposition } from "@automovie/engine";

import type { Student } from "../../entities/cast/student/Student";
import type { Gait } from "../../laws/everyday/Gait";

/**
 * One person steps sideways into another's path and both stop a hand's
 * breadth apart chest to chest: the blocker's quick sidestep and the
 * mover's walk start at the same second, the walk aimed at where the
 * blocker stands when it ends and stopping 0.42 m pelvis to pelvis (about 0.1 m
 * between their fronts), so neither body enters the other. Follow it with
 * the blocker's `giveRoom(mover)`, whose palms rise only as the step back
 * begins.
 *
 * ```ts
 * sameGap(carina, harry, { start: 20.6 }); // Harry sidesteps right into Carina's path; she stops a hand's breadth from him
 * ```
 *
 * @param mover The person on the move, stopped short.
 * @param blocker The person stepping into the path.
 * @param options The shared start, the blocker's side and metres (right, 0.4 m), and the mover's pace (hurried).
 * @returns Both people's moves in parallel.
 * @evidence docs/research/everyday/walking.md#transitions A walker stopped by someone stepping into the path stops a hand's breadth short, 0.42 m between pelvis points.
 * @evidence docs/research/everyday/walking.md#gait Whole steps at the pace's length and cadence.
 * @evidence contracts/development/behaviors.md#relational-goals The walk's stop resolves against the blocker's position when it ends.
 * @evidence contracts/development/common.md#meaningful-documentation States what both do and the gap.
 */
export function sameGap(
  mover: Student,
  blocker: Student,
  options: { start: number; side?: "left" | "right"; metres?: number; pace?: Gait.Pace },
): AutoMovieComposition {
  return AutoMovieComposition.parallel(
    blocker.step(options.side ?? "right", options.metres ?? 0.4, { quick: true, start: options.start }),
    mover.walkTo(blocker, { distance: "faceToFace", pace: options.pace ?? "hurried", start: options.start }),
  );
}
