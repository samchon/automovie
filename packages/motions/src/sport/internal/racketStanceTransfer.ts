import { AutoMovieEngineMotionSampling } from "@automovie/engine";

/*
 * Prepare a racket stance's weight transfer between two feet over a window: the
 * first foot swings over 17% to 43% of it and the second over 57% to 83%, so
 * both feet stand between the swings, and the pelvis shifts `SUPPORT_SHARE` of
 * the way toward the first foot's offset before its swing, on toward the
 * second's between the swings, and settles after the second, each shift on a
 * minimum-jerk share (provisional shares).
 * Parameter from: The window's start, seconds.
 * Parameter to: The window's end, seconds.
 * Parameter first: The first bearing foot's lateral offset from the pelvis, metres.
 * Parameter second: The second's, metres.
 * Returns: The two swing windows and the pelvis's lateral offset at a second.
 */
export function racketStanceTransfer(
  from: number,
  to: number,
  first: number,
  second: number,
): racketStanceTransfer.ITransfer {
  const span: number = to - from;
  const shares: readonly [
    racketStanceTransfer.Window,
    racketStanceTransfer.Window,
  ] = racketStanceTransfer.SWING_SHARES;
  const swings: readonly [
    racketStanceTransfer.Window,
    racketStanceTransfer.Window,
  ] = [
    [from + shares[0][0] * span, from + shares[0][1] * span],
    [from + shares[1][0] * span, from + shares[1][1] * span],
  ];
  const firstShift: racketStanceTransfer.Window = [from, swings[0][0]];
  const secondShift: racketStanceTransfer.Window = [swings[0][1], swings[1][0]];
  const recenter: racketStanceTransfer.Window = [swings[1][1], to];
  return {
    swings,
    offset: (seconds: number): number => {
      const towardFirst: number = racketStanceTransfer.ease(
        firstShift,
        seconds,
      );
      const towardSecond: number = racketStanceTransfer.ease(
        secondShift,
        seconds,
      );
      const settle: number = racketStanceTransfer.ease(recenter, seconds);
      return (
        racketStanceTransfer.SUPPORT_SHARE *
        (first * (towardFirst - towardSecond) +
          second * (towardSecond - settle))
      );
    },
  };
}

/*
 * The transfer's windows, shares and easing.
 */
export namespace racketStanceTransfer {
  /*
   * Absolute action-local endpoints of a phase, seconds.
   */
  export type Window = readonly [from: number, to: number];

  /*
   * A prepared pair of foot swings and the lateral pelvis movement with them.
   */
  export interface ITransfer {
    /*
     * The first and second foot's separate swing windows.
     */
    swings: readonly [Window, Window];

    /*
     * World metres along the local left axis from the entry pelvis.
     */
    offset(seconds: number): number;
  }

  /*
   * Fractions of a stance entry or recovery at which each foot leaves and
   * lands.
   */
  export const SWING_SHARES: readonly [Window, Window] = [
    [0.17, 0.43],
    [0.57, 0.83],
  ];

  /*
   * The portion of the horizontal distance to the bearing ankle the authored
   * pelvis shift covers.
   */
  export const SUPPORT_SHARE: number = 0.65;

  /*
   * Whether a second lies strictly inside a window: its endpoints belong to the
   * adjacent bearing phases.
   * Parameter window: The window.
   * Parameter seconds: The second.
   * Returns: True inside.
   */
  export function inside([from, to]: Window, seconds: number): boolean {
    return seconds > from && seconds < to;
  }

  /*
   * The clamped linear fraction of a positive-length window.
   * Parameter window: The window.
   * Parameter seconds: The second.
   * Returns: The fraction, in [0, 1].
   */
  export function share([from, to]: Window, seconds: number): number {
    return Math.min(1, Math.max(0, (seconds - from) / (to - from)));
  }

  /*
   * A zero-velocity turnaround at both ends of a window: the minimum-jerk share
   * of its clamped fraction.
   * Parameter window: The window.
   * Parameter seconds: The second.
   * Returns: The share, in [0, 1].
   */
  export function ease(window: Window, seconds: number): number {
    return AutoMovieEngineMotionSampling.minimumJerkShare(share(window, seconds));
  }
}
