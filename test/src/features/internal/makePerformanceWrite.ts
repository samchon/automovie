import { IAutoMoviePerformance } from "@automovie/interface";

/**
 * Create the existing beat-1 draft: two actors walk, knightA gestures at knightB and the main camera frames knightA over two seconds. The final shallow partial spread is unchanged and can author explicit contradictions for the engine's gate.
 */
export function makePerformanceWrite(
  partial: Partial<IAutoMoviePerformance> = {},
): IAutoMoviePerformance {
  return {
    beat: "beat-1",
    plan: "both advance a step; A strikes at the top of the walk; camera holds.",
    draft: [
      {
        verb: "locomote",
        actor: ["knightA", "knightB"],
        start: 0,
        duration: 1,
        gait: "walk",
        to: { kind: "point", point: { x: 0, y: 0, z: 0.35 } },
      },
      {
        verb: "gesture",
        actor: "knightA",
        start: 1,
        duration: 1,
        kind: "strike",
        at: { kind: "node", node: "knightB" },
      },
      {
        verb: "frame",
        actor: "cam-main",
        start: 0,
        duration: "auto",
        framing: "medium",
        move: "static",
        on: { kind: "node", node: "knightA" },
      },
    ],
    revise: {
      review: "range ok; strike lands after the step; camera holds.",
      final: null,
    },
    duration: 2,
    ...partial,
  };
}
