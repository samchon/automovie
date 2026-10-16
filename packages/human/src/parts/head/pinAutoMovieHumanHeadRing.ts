import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { AutoMovieHumanHeadDomain } from "./AutoMovieHumanHeadDomain";
import { AutoMovieHumanHeadNetwork } from "./AutoMovieHumanHeadNetwork";

/**
 * Pin a loop of points to a ring's positions: ring vertex `k` takes the loop point a fixed turn round from it, the turn and direction that bring the two loops closest, so the pairing follows the loop's order for any shape.
 *
 * @param correspondence An existing angular pairing for a parallel support row
 * @returns The pairing used by the boundary and its support row
 */
export const pinAutoMovieHumanHeadRing: (
  domain: AutoMovieHumanHeadDomain,
  network: AutoMovieHumanHeadNetwork,
  name: string,
  loop: AutoMovieHumanHeadNetwork.IPoint[],
  positions: IAutoMovieVector3[],
  correspondence?: { shift: number; sign: number },
) => { shift: number; sign: number } = (
  domain: AutoMovieHumanHeadDomain,
  network: AutoMovieHumanHeadNetwork,
  name: string,
  loop: AutoMovieHumanHeadNetwork.IPoint[],
  positions: IAutoMovieVector3[],
  correspondence?: { shift: number; sign: number },
): { shift: number; sign: number } => {
  const n: number = loop.length;
  if (positions.length !== n)
    throw new Error(
      `head ring ${name} has ${positions.length} vertices for a loop of ${n}`,
    );
  const at: IAutoMovieVector3[] = loop.map(
    (p: AutoMovieHumanHeadNetwork.IPoint): IAutoMovieVector3 => {
      const m: IAutoMovieVector3 = domain.toModel(
        domain.point(p.domain.u, p.domain.v),
      );
      return AutoMovieHumanVector.of(m.x * 1000, m.y * 1000, m.z * 1000);
    },
  );
  let best: { shift: number; sign: number; cost: number } = {
    shift: correspondence?.shift ?? 0,
    sign: correspondence?.sign ?? 1,
    cost: correspondence === undefined ? Infinity : 0,
  };
  for (const sign of correspondence === undefined ? [1, -1] : [])
    for (let shift: number = 0; shift < n; ++shift) {
      let cost: number = 0;
      for (let k: number = 0; k < n; ++k) {
        const q: IAutoMovieVector3 = at[(((shift + sign * k) % n) + n) % n]!;
        const p: IAutoMovieVector3 = positions[k]!;
        cost += (q.x - p.x) ** 2 + (q.y - p.y) ** 2 + (q.z - p.z) ** 2;
      }
      if (cost < best.cost) best = { shift, sign, cost };
    }
  network.ring(
    name,
    positions.map(
      (_: IAutoMovieVector3, k: number): AutoMovieHumanHeadNetwork.IPoint =>
        loop[(((best.shift + best.sign * k) % n) + n) % n]!,
    ),
    positions.map(
      (p: IAutoMovieVector3): { x: number; y: number; z: number } => ({
        x: p.x / 1000,
        y: p.y / 1000,
        z: p.z / 1000,
      }),
    ),
  );
  return { shift: best.shift, sign: best.sign };
};
