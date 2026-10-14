import type { IAutoMovieSequence } from "@automovie/interface";

/** Original one-second duel trim and two-second aftermath trim with a half-second dissolve, shared unchanged by the caption planner and slicer cases. */
export const CAPTION_SEQUENCE: IAutoMovieSequence = {
  id: "seq:duel",
  name: "duel",
  fps: 24,
  shots: [
    { shot: "shot:duel", trim: { start: 0.5, duration: 1 }, transition: null },
    {
      shot: "shot:aftermath",
      trim: { start: 1, duration: 2 },
      transition: { kind: "crossDissolve", duration: 0.5 },
    },
  ],
};
