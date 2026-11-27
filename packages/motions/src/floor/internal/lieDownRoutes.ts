import type { IAutoMovieMotionHumanLieDown } from "@automovie/interface";

/*
 * The route of postures to each position, after standing, with each arrival's
 * event.
 */
export const lieDownRoutes: Readonly<
  Record<IAutoMovieMotionHumanLieDown.Position, readonly [string, string][]>
> = {
  supine: [
    ["sit", "seatContact"],
    ["supine", "supine"],
  ],
  prone: [
    ["kneel", "kneeContact"],
    ["quadruped", "handsDown"],
    ["prone", "prone"],
  ],
  lateralLeft: [
    ["sit", "seatContact"],
    ["supine", "supine"],
    ["lateralLeft", "lateral"],
  ],
  lateralRight: [
    ["sit", "seatContact"],
    ["supine", "supine"],
    ["lateralRight", "lateral"],
  ],
  sitLong: [
    ["sit", "seatContact"],
    ["sitLong", "seated"],
  ],
  sitCrossed: [
    ["sit", "seatContact"],
    ["sitCrossed", "seated"],
  ],
  sitSide: [
    ["sit", "seatContact"],
    ["sitSide", "seated"],
  ],
};
