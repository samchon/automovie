import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanInterruptRow,
} from "@automovie/interface";

import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";

/**
 * Seconds over which a cut into a walk inertializes the outgoing pose (a
 * deliberate change of the whole body's action,
 * `AutoMovieMotionHumanInterrupt.BLENDS.deliberate`).
 */
const BLEND: number = AutoMovieMotionHumanInterrupt.BLENDS.deliberate;

/**
 * Seconds over which a jump's cut into a walk inertializes (provisional: half
 * the walk's `BLEND`; no measured value was read).
 */
const JUMP_BLEND: number = 0.15;

/** The cut a standing action makes into a walk: only once both feet are down. */
const SETTLED: readonly IAutoMovieMotionHumanInterruptRow[] = [
  { window: ["lastFootfall", 1], kind: "inertialize", entry: 0, blend: BLEND },
];

/**
 * The walk's cancel table (`walk.interrupts`). Another walk, a run, an
 * approach, a jump or a stop may cut any step: a stance foot is always planted,
 * and each plans from the entry feet. A standing action (looking, gesturing,
 * resting, sitting) may cut only after the last footfall, once both feet are
 * down.
 */
export const walkCuts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
  stand: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: BLEND }],
  walk: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: BLEND }],
  jump: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: JUMP_BLEND }],
  run: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: BLEND }],
  approach: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: BLEND }],
  look: SETTLED,
  gesture: SETTLED,
  rest: SETTLED,
  sit: SETTLED,
};
