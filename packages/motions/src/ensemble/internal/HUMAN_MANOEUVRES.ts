import type { IAutoMovieMotionHumanManoeuvre } from "@automovie/interface";

/*
 * The drills as rows over the four choices of a manoeuvre, so a new drill
 * (deploying on the head, by the rear) is a row, not code.
 *
 * - `wheel`: file order kept, the formation turned rigidly about the pivot flank,
 *   each member's step growing with its radius, all together (`manoeuvreWheel`,
 *   after Dundas 1792).
 * - `deploy`: column block k takes line block k, its files marching by the flank
 *   along the line's front to their own file, then fronting and marching up
 *   into place (`HumanManoeuvre`'s flank way, after Dundas 1792), the farthest
 *   first; the base block halts in place. A straight oblique from a closed
 *   column would brush the blocks ahead.
 * - `ploy`: the deployment reversed, the nearest first.
 * - `square`: file order kept, straight in whole steps, together; the front rank
 *   kneels, the rest stand (French regulation, through the Balagan summary of
 *   Nafziger 1996; provisional).
 * - `extend`, `close`: open or close order along the front, together.
 * - `face`: a turn in place.
 * - `free`: the least total distance (Kuhn 1955), straight, and steered where
 *   ways cross; each by its own latency.
 */
export const HUMAN_MANOEUVRES: Readonly<
  Record<
    IAutoMovieMotionHumanManoeuvre.Row,
    IAutoMovieMotionHumanManoeuvre.IRule
  >
> = {
  wheel: { assign: "order", path: "arc", order: "together" },
  deploy: { assign: "order", path: "flank", order: "farFirst" },
  ploy: { assign: "order", path: "flank", order: "nearFirst" },
  square: {
    assign: "order",
    path: "straight",
    order: "together",
    arrive: { front: "kneel", all: "stand" },
  },
  extend: { assign: "order", path: "straight", order: "together" },
  close: { assign: "order", path: "straight", order: "together" },
  face: { assign: "order", path: "inPlace", order: "together" },
  free: { assign: "nearest", path: "steered", order: "together" },
};
