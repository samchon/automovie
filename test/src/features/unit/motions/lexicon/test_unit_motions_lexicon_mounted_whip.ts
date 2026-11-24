import type {
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanMounted,
  IAutoMovieScheduleCue,
} from "@automovie/interface";
import {
  HumanMountedStirrups,
  HumanMountedTimeline,
  HumanMountedWhip,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** A figure on a seat, its right hand on the rein, striking on a cue. */
const figure = (
  seat: IAutoMovieMotionHumanMounted.Seat,
  whip?: IAutoMovieMotionHumanMounted.IWhip,
): IAutoMovieMotionHumanMounted.IFigure => ({
  seat,
  transfer: 1,
  hold: 2,
  supports: { rightHand: "rein" },
  ...(whip === undefined ? {} : { whip }),
});

/** The seats out of the saddle. */
const SEATS: readonly IAutoMovieMotionHumanMounted.Seat[] = [
  "twoPoint",
  "crouch",
  "standing",
  "ascent",
];

/** The right hand's grip on the rein over the whole performance. */
const REIN: IAutoMovieMotionHumanContactWindow = {
  part: "rightHand",
  kind: "grip",
  from: 0,
  to: 1,
  support: { kind: "ground" },
};

/**
 * A mounted rider's whip and stirrups: a stroke at each cue inside a hold whose
 * hand holds a rein, a stroke's reach (`REACH`, 0.25 s) clear of the hold's
 * ends and of the stroke before; the hand's weight toward the strike on a
 * minimum-jerk share over that reach, and its rein grip let go for it; the
 * seats that stand out of the saddle and their profiles, blended across a
 * transfer.
 *
 * Scenarios, one figure of a 1 s transfer and a 2 s hold, starting at 10 s:
 *
 * 1. Cues at 11.5 and 12.25 s become strokes at 1.5 and 2.25 s; a cue outside the
 *    hold is left out; a cue 0.1 s after the hold opens, too near its start,
 *    and two cues 0.3 s apart are refused.
 * 2. The right hand is fully toward the strike at a stroke, half way 0.125 s off,
 *    and not at all a reach away; the left never.
 * 3. The rein's grip is split around the stroke at 1.5 s, left at `1.25 / 3` and
 *    taken back at `1.75 / 3`.
 * 4. Two-point, crouch, standing and ascent stand out of the saddle and basic does
 *    not; from basic into a crouch the pitch blends from none to 55 degrees,
 *    half way at a half.
 */
export function test_unit_motions_lexicon_mounted_whip(): void {
  const cues: (
    seconds: readonly number[],
  ) => () => readonly IAutoMovieScheduleCue[] =
    (seconds: readonly number[]): (() => readonly IAutoMovieScheduleCue[]) =>
    (): readonly IAutoMovieScheduleCue[] =>
      seconds.map(
        (s: number): IAutoMovieScheduleCue => ({ name: "crack", seconds: s }),
      );
  const figures: IAutoMovieMotionHumanMounted.IFigure[] = [
    figure("basic", { hand: "right", cue: "crack" }),
  ];
  const clock: HumanMountedTimeline = new HumanMountedTimeline(figures);
  const strokes: HumanMountedWhip.IStroke[] = HumanMountedWhip.strokes(
    cues([11.5, 12.25, 14]),
    10,
    figures,
    clock,
  );
  TestValidator.equals("the strokes", strokes, [
    { side: "right", at: 1.5 },
    { side: "right", at: 2.25 },
  ]);
  TestValidator.error("too near the hold's start", () =>
    HumanMountedWhip.strokes(cues([11.1]), 10, figures, clock),
  );
  TestValidator.error("overlapping strokes", () =>
    HumanMountedWhip.strokes(cues([11.5, 11.8]), 10, figures, clock),
  );

  TestValidator.predicate(
    "the hand's weight",
    HumanMountedWhip.weight(strokes, "right", 1.5) === 1 &&
      nclose(HumanMountedWhip.weight(strokes, "right", 1.625), 0.5, 1e-12) &&
      HumanMountedWhip.weight(strokes, "right", 1.25) === 0 &&
      HumanMountedWhip.weight(strokes, "left", 1.5) === 0,
  );

  const split: IAutoMovieMotionHumanContactWindow[] = HumanMountedWhip.split(
    [REIN],
    [{ side: "right", at: 1.5 }],
    3,
  );
  TestValidator.predicate(
    "the rein let go",
    split.length === 2 &&
      split[0]!.from === 0 &&
      nclose(split[0]!.to, 1.25 / 3, 1e-12) &&
      nclose(split[1]!.from, 1.75 / 3, 1e-12) &&
      split[1]!.to === 1,
  );

  TestValidator.predicate(
    "the seats out of the saddle",
    SEATS.every((seat: IAutoMovieMotionHumanMounted.Seat): boolean =>
      HumanMountedStirrups.free(seat),
    ) && !HumanMountedStirrups.free("basic"),
  );
  const crouching: IAutoMovieMotionHumanMounted.IFigure[] = [
    figure("basic"),
    figure("crouch"),
  ];
  const pitch: (p: HumanMountedStirrups.IProfile) => number = (
    p: HumanMountedStirrups.IProfile,
  ): number => p.pitch;
  TestValidator.predicate(
    "the pitch blended",
    HumanMountedStirrups.blend(crouching, 1, 0, pitch) === 0 &&
      nclose(
        HumanMountedStirrups.blend(crouching, 1, 0.5, pitch),
        27.5,
        1e-12,
      ) &&
      HumanMountedStirrups.blend(crouching, 1, 1, pitch) === 55,
  );
}
