import type { IAutoMovieMotionHumanContactWindow } from "@automovie/interface";
import {
  humanRidePosting,
  humanRideWindows,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * The `HumanRide.ride` law's own logic: its rising trot (`humanRidePosting`),
 * the seat lifting `post · sin²(π s)` along the mount's up over each stride's
 * progress `s`, read by a stride time or on a cue track's strides; and its
 * support windows (`humanRideWindows`), the seat bearing on the support and
 * each resting foot planted by its ball on it or on its pedal or stirrup.
 *
 * Scenarios:
 *
 * 1. Posting 0.1 m at a 0.8 s stride, the seat is down at the stride's start and
 *    up the whole 0.1 m at its middle, 0.4 s; on strides at 1, 1.5 and 2.5 s of
 *    a ride starting at 1 s, 0.75 s in lies halfway through the second stride
 *    and past the last there is no stride.
 * 2. A cue track of one instant is refused.
 * 3. A seated ride on a horse plants the left foot on its stirrup point and the
 *    right on the horse, the seat bearing throughout; rising, the seat is left
 *    to the stirrups; a foot placed on its rest plants from `take`.
 */
export function test_motions_lexicon_ride(): void {
  // 1. Posting.
  const timed: humanRidePosting.IPosting = humanRidePosting(
    { kind: "period", seconds: 0.8 },
    0,
    0.1,
  );
  const cued: humanRidePosting.IPosting = humanRidePosting(
    { kind: "strides", cue: "hooves", strides: [1, 1.5, 2.5] },
    1,
    0.1,
  );
  TestValidator.predicate(
    "the rising trot",
    timed.lift(0) === 0 &&
      nclose(timed.lift(0.4), 0.1, 1e-12) &&
      nclose(cued.stride(1)!, 0.5, 1e-12) &&
      cued.stride(2) === undefined &&
      humanRidePosting(undefined, 0, 0.1).lift(0.4) === 0,
  );

  // 2. Refused.
  TestValidator.predicate(
    "one stride's instant",
    throwsError(() =>
      humanRidePosting(
        { kind: "strides", cue: "hooves", strides: [1] },
        0,
        0.1,
      ),
    ),
  );

  // 3. The windows.
  const windows = (rising: boolean): IAutoMovieMotionHumanContactWindow[] =>
    humanRideWindows({
      on: "horse",
      seconds: 4,
      kept: [],
      resting: [{ side: "left", pedal: "leftStirrup" }, { side: "right" }],
      placed: rising ? [] : ["right"],
      take: 0.6,
      rising,
    });
  const seated: IAutoMovieMotionHumanContactWindow[] = windows(false);
  const stirrup: IAutoMovieMotionHumanContactWindow["support"] =
    seated[1]!.support;
  TestValidator.predicate(
    "the seat and the feet",
    seated[0]!.part === "seat" &&
      seated[0]!.from === 0 &&
      seated[0]!.to === 1 &&
      stirrup.kind === "prop" &&
      stirrup.point === "leftStirrup" &&
      seated[1]!.socket === "ball" &&
      nclose(seated[3]!.from, 0.15, 1e-12) &&
      windows(true).every(
        (w: IAutoMovieMotionHumanContactWindow): boolean => w.part !== "seat",
      ),
  );
}
