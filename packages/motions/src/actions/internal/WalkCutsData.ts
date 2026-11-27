import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import type { IAutoMovieMotionHumanInterruptRow } from "@automovie/interface";

/*
 * Seconds over which a cut into a walk inertializes the outgoing pose (a
 * deliberate change of the whole body's action,
 * `AutoMovieMotionHumanInterrupt.BLENDS.deliberate`).
 */
export const BLEND: number = AutoMovieMotionHumanInterrupt.BLENDS.deliberate;

/*
 * Seconds over which a jump's cut into a walk inertializes (provisional: half
 * the walk's `BLEND`; no measured value was read).
 */
export const JUMP_BLEND: number = 0.15;

/*
 * The cut a standing action makes into a walk: only once both feet are down.
 */
export const SETTLED: readonly IAutoMovieMotionHumanInterruptRow[] = [
  {
    window: { start: "lastFootfall", end: 1 },
    kind: "inertialize",
    entry: 0,
    blend: BLEND,
  },
];
