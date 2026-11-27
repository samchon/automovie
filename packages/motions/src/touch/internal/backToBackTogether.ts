import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * Admit two backs leaning on each other together: each window is when that back
 * bears, from its lean being ready to its relaxing, in shot seconds.
 *
 * Refuses on `with` when the partner's back sits up before this lean ends or
 * bears only after it is ready, by more than one 24 Hz frame, so this back
 * would lean on nothing; refuses on `hold` when this back is withdrawn more
 * than a frame before the partner's, which would leave the partner leaning on
 * nothing.
 */
export function backToBackTogether(
  mine: backToBackTogether.IWindow,
  partner: backToBackTogether.IWindow,
  action: string,
  hold: number,
): void {
  if (
    partner.relax < mine.relax - backToBackTogether.FRAME ||
    partner.ready > mine.ready + backToBackTogether.FRAME
  )
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "with",
      value: action,
      reason: `the partner's back bears from ${partner.ready.toFixed(2)} s to ${partner.relax.toFixed(2)} s, but this lean bears on it from ${mine.ready.toFixed(2)} s to ${mine.relax.toFixed(2)} s, so it would lean on nothing`,
      fix: "lean and sit up together with the partner",
    });
  if (mine.relax < partner.relax - backToBackTogether.FRAME)
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "hold",
      value: hold,
      reason: `this back is withdrawn at ${mine.relax.toFixed(2)} s while the partner still leans on it until ${partner.relax.toFixed(2)} s`,
      fix: "hold the lean as long as the partner's",
    });
}

/*
 * The contact windows and frame alignment bound of a shared back support.
 */
export namespace backToBackTogether {
  /*
   * When one back bears on the other, shot seconds.
   */
  export interface IWindow {
    /*
     * When its lean is ready.
     */
    ready: number;

    /*
     * When it starts to sit up.
     */
    relax: number;
  }

  /*
   * How far apart the two leans may begin or end, seconds: one 24 Hz frame.
   */
  export const FRAME: number = 1 / 24;
}
