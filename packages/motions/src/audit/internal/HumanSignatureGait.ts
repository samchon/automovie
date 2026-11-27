import type { IAutoMovieMotionHumanSignature } from "@automovie/interface";

import { AutoMovieMotionHumanSignature } from "../AutoMovieMotionHumanSignature";

/*
 * The gait over a window of steady travel
 * (`AutoMovieMotionHumanSignature.gait`): the share of the window's samples
 * each foot bears on the floor, the footfalls, a foot's contact counted once a
 * stride (`AutoMovieMotionHumanSignature.STRIDE`), and the cadence from the
 * mean interval between them.
 * Parameter reader: The performer.
 * Parameter from: The window's start, seconds.
 * Parameter to: The window's end, seconds.
 * Parameter rate: Samples per second.
 * Returns: The duty factor, the cadence in steps a minute and the strikes.
 */
export function HumanSignatureGait(
  reader: IAutoMovieMotionHumanSignature.IReader,
  from: number,
  to: number,
  rate: number,
): IAutoMovieMotionHumanSignature.IGait {
  const ts: number[] = AutoMovieMotionHumanSignature.times(from, to, rate);
  const strikes: IAutoMovieMotionHumanSignature.IGait["strikes"] = [];
  let bearing: number = 0;
  for (const side of ["left", "right"] as const) {
    let before: boolean | undefined;
    let last: number | undefined;
    for (const t of ts) {
      const now: boolean = AutoMovieMotionHumanSignature.bears(
        reader,
        t,
        side,
        0,
        from,
      );
      if (now) bearing++;

      // A foot strikes once a stride: a contact that flickers within a
      // quarter second of the same foot's last strike (a heel handing the
      // load to the ball) is the same footfall.
      if (
        before === false &&
        now &&
        (last === undefined || t - last >= AutoMovieMotionHumanSignature.STRIDE)
      ) {
        strikes.push({ seconds: t, side });
        last = t;
      }
      before = now;
    }
  }
  strikes.sort((a, b): number => a.seconds - b.seconds);
  return {
    duty: bearing / (2 * ts.length),

    // Steps a minute from the mean interval between strikes, which a
    // window a few steps long would quantise if strikes were counted.
    cadence:
      strikes.length < 2
        ? 0
        : (60 * (strikes.length - 1)) /
          (strikes[strikes.length - 1]!.seconds - strikes[0]!.seconds),
    strikes,
  };
}
