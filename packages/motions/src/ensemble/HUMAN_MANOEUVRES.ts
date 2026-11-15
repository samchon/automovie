import type { IHumanManoeuvre } from "./IHumanManoeuvre";

/**
 * The drills as rows over the four choices of a manoeuvre, so a new drill
 * (deploying on the head, by the rear) is a row, not code.
 *
 * - `wheel`: file order kept, every member on an arc about the pivot flank
 *   with its step growing with its radius, all together (Dundas 1792's
 *   wheeling at quickest time, through secondary sources).
 * - `deploy`: column block k takes line block k, each slanting to its place
 *   (the French deployment by oblique march, secondary), the farthest first
 *   so no two ways cross; the base block halts in place.
 * - `ploy`: the deployment reversed, the nearest first.
 * - `square`: file order kept, straight in whole steps, together; the front
 *   rank kneels, the rest stand (French regulation, through the Balagan
 *   summary of Nafziger 1996; provisional).
 * - `extend`, `close`: open or close order along the front, together.
 * - `face`: a turn in place.
 * - `free`: the least total distance (Kuhn 1955), straight, and steered
 *   where ways cross; each by its own latency.
 */
export const HUMAN_MANOEUVRES: Readonly<
  Record<IHumanManoeuvre.Row, IHumanManoeuvre.IRule>
> = {
  wheel: { assign: "order", path: "arc", order: "together" },
  deploy: { assign: "order", path: "oblique", order: "farFirst" },
  ploy: { assign: "order", path: "oblique", order: "nearFirst" },
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
