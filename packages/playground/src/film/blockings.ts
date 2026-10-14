import type { IAutoMovieBlocking } from "@automovie/interface";

import { APPROACH_DURATION } from "./APPROACH_DURATION";

/** Authored pursuit-film blockings; the runtime compiles this tracked example unchanged. */
export const blockings: IAutoMovieBlocking[] = [
  {
    beat: "approach",
    analysis: "the distance itself is the drama: the walk must read whole.",
    rationale:
      "a full follow keeps the walker's stride and the shrinking gap in one frame.",
    actors: [
      {
        node: "walker",
        beats: "walks the 2.25 m to just behind the waiter, eyes on him",
        anchors: [{ t: APPROACH_DURATION - 0.2, cue: "the last step lands" }],
      },
      { node: "waiter", beats: "stands dead still, facing away" },
    ],
    camera: {
      framing: "full",
      move: "follow",
      on: { kind: "node", node: "walker" },
    },
    duration: APPROACH_DURATION,
  },
  {
    beat: "face-off",
    analysis: "stillness after motion: the circle asks who moves first.",
    rationale:
      "an orbiting full shot of the waiter turns his stillness into tension.",
    actors: [
      { node: "walker", beats: "holds one pace behind, watching" },
      { node: "waiter", beats: "holds, jaw set" },
    ],
    camera: {
      framing: "full",
      move: "orbit",
      on: { kind: "node", node: "waiter" },
    },
    duration: 2.5,
  },
];
