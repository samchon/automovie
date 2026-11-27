import type { IAutoMovieMotionHumanActionLaw } from "@automovie/interface";

import "../../compose/internal/AutoMovieMotionHumanInterrupt";
import * as WalkCutsData from "./WalkCutsData";

/*
 * The walk's cancel table (`walk.interrupts`). Another walk, a run, an
 * approach, a jump or a stop may cut any step: a stance foot is always planted,
 * and each plans from the entry feet. A standing action (looking, gesturing,
 * resting, sitting) may cut only after the last footfall, once both feet are
 * down.
 */
export const walkCuts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
  stand: [
    {
      window: { start: 0, end: 1 },
      kind: "inertialize",
      entry: 0,
      blend: WalkCutsData.BLEND,
    },
  ],
  walk: [
    {
      window: { start: 0, end: 1 },
      kind: "inertialize",
      entry: 0,
      blend: WalkCutsData.BLEND,
    },
  ],
  jump: [
    {
      window: { start: 0, end: 1 },
      kind: "inertialize",
      entry: 0,
      blend: WalkCutsData.JUMP_BLEND,
    },
  ],
  run: [
    {
      window: { start: 0, end: 1 },
      kind: "inertialize",
      entry: 0,
      blend: WalkCutsData.BLEND,
    },
  ],
  approach: [
    {
      window: { start: 0, end: 1 },
      kind: "inertialize",
      entry: 0,
      blend: WalkCutsData.BLEND,
    },
  ],
  look: WalkCutsData.SETTLED,
  gesture: WalkCutsData.SETTLED,
  rest: WalkCutsData.SETTLED,
  sit: WalkCutsData.SETTLED,
};
