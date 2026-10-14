import type { IAutoMovieScript } from "@automovie/interface";

import { APPROACH_DURATION } from "./APPROACH_DURATION";

/** Authored pursuit-film script; the runtime compiles this tracked example unchanged. */
export const script: IAutoMovieScript = {
  logline: "A pursuer closes the distance; the one waiting never turns.",
  theme: "inevitability at walking pace",
  cast: [
    { node: "walker", character: "the pursuer", modelRef: "stickman" },
    { node: "waiter", character: "the one who waits", modelRef: "stickman" },
  ],
  beats: [
    {
      id: "approach",
      name: "the approach",
      summary: "the walker crosses the floor toward the waiter's back",
      durationHint: APPROACH_DURATION,
    },
    {
      id: "face-off",
      name: "the face-off",
      summary: "both hold; the camera circles the waiter",
      durationHint: 2.5,
    },
  ],
};
