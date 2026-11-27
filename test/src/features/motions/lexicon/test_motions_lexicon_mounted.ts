import type {
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanMounted,
  IAutoMovieScheduleCue,
} from "@automovie/interface";
import {
  HumanMountedStirrups
} from "../../../../../packages/motions/src/lexicon/internal/HumanMountedStirrups";
import {
  HumanMountedTimeline
} from "../../../../../packages/motions/src/lexicon/internal/HumanMountedTimeline";
import {
  HumanMountedWhip
} from "../../../../../packages/motions/src/lexicon/internal/HumanMountedWhip";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

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
  support: { kind: "ground" },
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
function scenario_test_motions_lexicon_mounted_timeline(): void {
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

/** A figureMountedWhip on a seat, its right hand on the rein, striking on a cue. */
const figureMountedWhip = (
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
 * Scenarios, one figureMountedWhip of a 1 s transfer and a 2 s hold, starting
 * at 10 s:
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
function scenario_test_motions_lexicon_mounted_whip(): void {
  const cues: (
    seconds: readonly number[],
  ) => () => readonly IAutoMovieScheduleCue[] =
    (seconds: readonly number[]): (() => readonly IAutoMovieScheduleCue[]) =>
    (): readonly IAutoMovieScheduleCue[] =>
      seconds.map(
        (s: number): IAutoMovieScheduleCue => ({ name: "crack", seconds: s }),
      );
  const figures: IAutoMovieMotionHumanMounted.IFigure[] = [
    figureMountedWhip("basic", { hand: "right", cue: "crack" }),
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
    figureMountedWhip("basic"),
    figureMountedWhip("crouch"),
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

/** The mounted laws' own logic: the timeline and the whip, each scenario below. */
export function test_motions_lexicon_mounted(): void {
  scenario_test_motions_lexicon_mounted_timeline();
  scenario_test_motions_lexicon_mounted_whip();
}
