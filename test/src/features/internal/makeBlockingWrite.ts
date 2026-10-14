import { IAutoMovieBlocking } from "@automovie/interface";

/**
 * Create the existing two-second beat-1 blocking with knightA's t=1 strike anchor and medium static framing. The final partial spread replaces requested fields without inventing a successful performance or repairing contradictions.
 */
export function makeBlockingWrite(
  partial: Partial<IAutoMovieBlocking> = {},
): IAutoMovieBlocking {
  return {
    beat: "beat-1",
    analysis: "the charge must read as decisive, one step, one strike.",
    rationale: "medium static keeps both knights readable at striking range.",
    actors: [
      {
        node: "knightA",
        beats: "advances a step, then strikes at the top of the walk",
        anchors: [{ t: 1, cue: "the strike lands" }],
      },
      { node: "knightB", beats: "holds ground, eyes locked on the challenger" },
    ],
    camera: {
      framing: "medium",
      move: "static",
      on: { kind: "node", node: "knightA" },
    },
    duration: 2,
    ...partial,
  };
}
