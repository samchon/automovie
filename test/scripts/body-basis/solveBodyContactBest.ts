import type { IBodyContactPlane } from "./IBodyContactPlane";
import { crossedCorners } from "./bodyContactGeometry";
import { type IBodyStanding, solveBodyContact } from "./solveBodyContact";

/**
 * Several contact attempts from the same start, keeping the best.
 *
 * The attempts run in order and the first that parts the pair wins; when none
 * does, the one with the fewest crossing corners left wins, ties to the
 * smaller largest displacement. The modes are the surface rule with the
 * repeated push (parts the elbow, the knee and the hip), the surface rule with
 * a single hold (parts the shoulder's fold, where the repeated push pinches
 * new pairs), the separating plane the caller found when there is one, and the
 * plane estimated from the contact itself, tried once with a single hold and
 * once with the repeated push.
 *
 * The contact's own plane passes through the midpoint of the two crossing
 * corner sets and is normal to the difference of their centroids: the two sets
 * of an interpenetrating pair are displaced along the contact normal, so the
 * difference estimates it. A joint's fold plane is the crease only when the
 * crease passes through the joint; at the groin the hip centre sits inside
 * the pelvis, centimetres behind the fold, and its plane leaves the contact
 * standing.
 *
 * `positions`, `displacement` and `standing` receive the winning attempt.
 */
export function solveBodyContactBest(
  positions: number[],
  base: number[],
  displacement: Map<number, number[]>,
  near: number[][],
  a: number[],
  b: number[],
  budget: number,
  plane: IBodyContactPlane | null,
  owner: Map<number, 1 | -1>,
  standing: Map<number, IBodyStanding[]> = new Map(),
): {
  solved: boolean;
  rounds: number;
  rule: string;
  chosen: IBodyContactPlane | null;
} {
  const start = positions.slice();
  const worn = new Map([...displacement].map(([v, d]) => [v, [...d]]));
  const centroid = (vertices: Set<number>): number[] | null => {
    if (vertices.size === 0) return null;
    const sum = [0, 0, 0];
    for (const v of vertices)
      for (let k = 0; k < 3; k++) sum[k] += start[v * 3 + k];
    return sum.map((one) => one / vertices.size);
  };
  const centreA = centroid(crossedCorners(start, a, b));
  const centreB = centroid(crossedCorners(start, b, a));
  const between =
    centreA === null || centreB === null
      ? null
      : [0, 1, 2].map((k) => centreA[k] - centreB[k]);
  const span =
    between === null ? 0 : Math.hypot(between[0], between[1], between[2]);
  const contact: IBodyContactPlane | null =
    between === null || span < 1e-6
      ? null
      : {
          point: [0, 1, 2].map((k) => (centreA![k] + centreB![k]) / 2),
          normal: between.map((one) => one / span),
        };
  const modes: {
    rule: string;
    plane: IBodyContactPlane | null;
    repeated: boolean;
  }[] = [
    { rule: "surface", plane: null, repeated: true },
    { rule: "surface-hold", plane: null, repeated: false },
    ...(plane === null ? [] : [{ rule: "plane", plane, repeated: false }]),
    ...(contact === null
      ? []
      : [
          { rule: "contact", plane: contact, repeated: false },
          { rule: "contact-repeated", plane: contact, repeated: true },
        ]),
  ];
  const attempts: {
    rule: string;
    chosen: IBodyContactPlane | null;
    solved: boolean;
    rounds: number;
    left: number;
    most: number;
    positions: number[];
    displacement: Map<number, number[]>;
    standing: Map<number, IBodyStanding[]>;
  }[] = [];
  for (const mode of modes) {
    const trial = start.slice();
    const moved = new Map([...worn].map(([v, d]) => [v, [...d]]));
    const held = new Map(
      [...standing].map(([v, list]) => [
        v,
        list.map((one) => ({
          direction: [...one.direction],
          distance: one.distance,
        })),
      ]),
    );
    const result = solveBodyContact(
      trial,
      base,
      moved,
      near,
      a,
      b,
      budget,
      mode.plane,
      owner,
      null,
      mode.repeated,
      held,
    );
    const left = result.solved
      ? 0
      : crossedCorners(trial, a, b).size + crossedCorners(trial, b, a).size;
    let most = 0;
    for (const d of moved.values())
      most = Math.max(most, Math.hypot(d[0], d[1], d[2]));
    attempts.push({
      rule: mode.rule,
      chosen: mode.plane,
      solved: result.solved,
      rounds: result.rounds,
      left,
      most,
      positions: trial,
      displacement: moved,
      standing: held,
    });
    if (result.solved) break;
  }
  const best = attempts.reduce((x, y) =>
    y.solved !== x.solved
      ? y.solved
        ? y
        : x
      : y.left !== x.left
        ? y.left < x.left
          ? y
          : x
        : y.most < x.most
          ? y
          : x,
  );
  for (let i = 0; i < positions.length; i++) positions[i] = best.positions[i];
  displacement.clear();
  for (const [v, d] of best.displacement) displacement.set(v, d);
  standing.clear();
  for (const [v, list] of best.standing) standing.set(v, list);
  return {
    solved: best.solved,
    rounds: best.rounds,
    rule:
      best.rule +
      "@" +
      best.rounds +
      (best.solved ? "" : ":" + best.left + "left"),
    chosen: best.chosen,
  };
}
