import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanInterruptRow,
} from "@automovie/interface";

/** The cut a standing action makes into a walk: only once both feet are down. */
const SETTLED: readonly IAutoMovieMotionHumanInterruptRow[] = [
  { window: ["lastFootfall", 1], kind: "inertialize", entry: 0, blend: 0.3 },
];

/**
 * The walk's cancel table (`walk.interrupts`). Another walk, an approach, a
 * jump or a stop may cut any step: a stance foot is always planted, and each
 * plans from the entry feet. A standing action (looking, gesturing, resting,
 * sitting) may cut only after the last footfall, once both feet are down.
 */
export const walkCuts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
  stand: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
  walk: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
  jump: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.15 }],
  run: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
  approach: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
  look: SETTLED,
  gesture: SETTLED,
  rest: SETTLED,
  sit: SETTLED,
};
