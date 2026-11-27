import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBicycleEffort,
} from "@automovie/interface";

import { HumanBound } from "../../law/internal/HumanBound";
import { HumanRide } from "./HumanRide";

/**
 * A bicycle effort's timeline: the rider rises off the seat no sooner than the
 * ride's take (`HumanRide.TAKE`), stands up after it, lowers no sooner than
 * standing, and sits again between lowering and the end; the rise lifts the
 * body some height. Cues: `seatOff`, `standing`, `lower` and `seatOn`.
 *
 * @param params The effort's seconds, instants and lift.
 * @returns The effort's cues.
 * @throws {HumanRefusal} When the instants are out of order or out of the
 *   effort, or the lift has no height.
 */
export function humanBicycleEffortTimeline(
  params: Pick<
    IAutoMovieMotionHumanBicycleEffort,
    "duration" | "seatOff" | "up" | "lower" | "seatOn" | "lift"
  >,
): IAutoMovieMotionEvent[] {
  const { duration: seconds, seatOff, up, lower, seatOn, lift } = params;
  HumanBound.above("duration", seconds, HumanRide.TAKE, "s");
  HumanBound.least("seatOff", seatOff, HumanRide.TAKE, "s");
  HumanBound.above("up", up, seatOff, "s");
  HumanBound.least("lower", lower, up, "s");
  HumanBound.within("seatOn", seatOn, lower, seconds, "s", "minimum");
  HumanBound.above("lift", lift, 0, "m");
  return [
    { name: "seatOff", share: seatOff / seconds },
    { name: "standing", share: up / seconds },
    { name: "lower", share: lower / seconds },
    { name: "seatOn", share: seatOn / seconds },
  ];
}
