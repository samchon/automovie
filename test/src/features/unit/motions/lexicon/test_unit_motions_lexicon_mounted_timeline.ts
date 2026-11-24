import type {
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanMounted,
} from "@automovie/interface";
import { HumanMountedTimeline } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** A figure of a transfer and a hold, its hands on the named contacts. */
const figure = (
  transfer: number,
  hold: number,
  supports: IAutoMovieMotionHumanMounted.ISupports,
): IAutoMovieMotionHumanMounted.IFigure => ({
  seat: "basic",
  transfer,
  hold,
  supports,
});

/** A hand's grip window on a contact. */
const grip = (
  part: IAutoMovieMotionHumanContactWindow["part"],
): IAutoMovieMotionHumanContactWindow => ({
  part,
  kind: "grip",
  from: 0,
  to: 1,
});

/**
 * `HumanMountedTimeline` lays a mounted performance's clock out: each figure's
 * transfer and hold in turn, how far each hand has taken its contact, and each
 * support's contact window over the figures naming it.
 *
 * Three figures: a 1 s transfer to the left hand on the pommel held 1 s, a 2 s
 * transfer adding the right hand on the cantle, and a 1 s transfer letting both
 * go, held 1 s.
 *
 * Scenarios:
 *
 * 1. The figures start at 0, 2 and 4 s and arrive at 1, 4 and 5 s, 6 s in all;
 *    half way through a transfer its share is a half, and 1 through its hold.
 * 2. The left hand takes the pommel over the first transfer, or holds it from the
 *    entry when gripped already; it is held through the second and let go over
 *    the third; the right hand takes the cantle over the second.
 * 3. The pommel's window runs from the first arrival, or the start when the entry
 *    holds it, to the third transfer's start; the cantle's from the second
 *    arrival to the same.
 */
export function test_unit_motions_lexicon_mounted_timeline(): void {
  const figures: IAutoMovieMotionHumanMounted.IFigure[] = [
    figure(1, 1, { leftHand: "pommel" }),
    figure(2, 0, { leftHand: "pommel", rightHand: "cantle" }),
    figure(1, 1, {}),
  ];
  const clock: HumanMountedTimeline = new HumanMountedTimeline(figures);
  TestValidator.predicate(
    "the clock",
    clock.starts.join() === "0,2,4" &&
      clock.arrivals.join() === "1,4,5" &&
      clock.duration === 6 &&
      clock.at(0.5).index === 0 &&
      nclose(clock.at(0.5).share, 0.5, 1e-12) &&
      clock.at(1.5).share === 1 &&
      clock.at(3).index === 1 &&
      nclose(clock.at(3).share, 0.5, 1e-12),
  );
  const gripped: HumanMountedTimeline = new HumanMountedTimeline(
    figures,
    new Set(["left"]),
  );
  TestValidator.predicate(
    "the hands",
    nclose(clock.hand("left", 0.5), 0.5, 1e-12) &&
      gripped.hand("left", 0.5) === 1 &&
      clock.hand("left", 3) === 1 &&
      nclose(clock.hand("left", 4.5), 0.5, 1e-12) &&
      nclose(clock.hand("right", 3), 0.5, 1e-12) &&
      clock.hand("right", 1) === 0,
  );
  const members: ReadonlyMap<string, IAutoMovieMotionHumanContactWindow>[] = [
    new Map([["pommel", grip("leftHand")]]),
    new Map([
      ["pommel", grip("leftHand")],
      ["cantle", grip("rightHand")],
    ]),
    new Map(),
  ];
  const windows: IAutoMovieMotionHumanContactWindow[] = clock.windows(
    members,
    new Set(),
  );
  TestValidator.predicate(
    "the windows",
    windows.length === 2 &&
      windows[0]!.part === "leftHand" &&
      nclose(windows[0]!.from, 1 / 6, 1e-12) &&
      nclose(windows[0]!.to, 4 / 6, 1e-12) &&
      windows[1]!.part === "rightHand" &&
      nclose(windows[1]!.from, 4 / 6, 1e-12) &&
      nclose(windows[1]!.to, 4 / 6, 1e-12) &&
      clock.windows(members, new Set(["pommel"]))[0]!.from === 0,
  );
}
