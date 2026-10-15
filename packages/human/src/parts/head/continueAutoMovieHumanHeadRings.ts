import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";

/**
 * Place the head's first loop off each junction ring as a straight continuation of the ring into the head: each off-ring neighbour of ring vertex `k` lies on the ring's own ray `k`, at the ring's own radius, moved into the head along the site axis.
 *
 * The shared ring shape is solved so that the joined limit surface along the ring has the site's girth when each part's first loop off the ring sits at the ring's radii, so the two parts' radial offsets cancel (see `IAutoMovieHumanRingShape`); a loop that flared out with the head's own skin would widen the joined girth instead. A ring vertex at a corner of the hole has two neighbours off the ring; they straddle the continued point along the ring's tangent, so their mean, which the girth reads, is that point.
 *
 * @param props.ring The head's ring shape at the site, model frame
 * @param props.vertices The cage vertex of each ring vertex, in the shape's layout order
 * @param props.faces The head cage's quads
 * @param props.depth How far into the head the loop lies along the site axis, millimetres
 * @returns The model position of every first-loop vertex, by cage vertex
 */
export function continueAutoMovieHumanHeadRings(props: {
  ring: IAutoMovieHumanRingShape;
  vertices: number[];
  faces: Array<[number, number, number, number]>;
  depth: number;
}): Map<number, IAutoMovieVector3> {
  const on: Set<number> = new Set(props.vertices);
  const neighbours: Map<number, Set<number>> = new Map();
  for (const f of props.faces)
    for (let k: number = 0; k < 4; ++k) {
      const a: number = f[k]!;
      const b: number = f[(k + 1) % 4]!;
      for (const [x, y] of [
        [a, b],
        [b, a],
      ] as const) {
        if (!on.has(x) || on.has(y)) continue;
        if (!neighbours.has(x)) neighbours.set(x, new Set());
        neighbours.get(x)!.add(y);
      }
    }
  const n: number = props.vertices.length;
  const inward: IAutoMovieVector3 = AutoMovieHumanVector.of(
    -props.ring.frame.normal.x * props.depth,
    -props.ring.frame.normal.y * props.depth,
    -props.ring.frame.normal.z * props.depth,
  );
  const out: Map<number, IAutoMovieVector3> = new Map();
  props.vertices.forEach((vertex: number, k: number): void => {
    const target: IAutoMovieVector3 = AutoMovieHumanVector.offset(props.ring.positions[k]!, [inward, 1]);
    const off: number[] = [...(neighbours.get(vertex) ?? [])];
    if (off.length === 1) {
      out.set(off[0]!, target);
      return;
    }
    // two neighbours at a hole's corner: spread them along the ring's tangent about the continued point
    const next: IAutoMovieVector3 = props.ring.positions[(k + 1) % n]!;
    const previous: IAutoMovieVector3 = props.ring.positions[(k + n - 1) % n]!;
    const tangent: IAutoMovieVector3 = AutoMovieHumanVector.offset(next, [previous, -1]);
    // the neighbour sharing a face with the next ring vertex lies toward it
    const shares = (v: number, w: number): boolean =>
      props.faces.some((f: [number, number, number, number]): boolean => f.includes(v) && f.includes(w));
    const toward: number = props.vertices[(k + 1) % n]!;
    const ordered: number[] = [...off].sort(
      (a: number, b: number): number => Number(shares(b, toward)) - Number(shares(a, toward)),
    );
    ordered.forEach((v: number, i: number): void => {
      const share: number = (0.5 - i / (ordered.length - 1)) * SPREAD;
      out.set(v, AutoMovieHumanVector.offset(target, [tangent, share]));
    });
  });
  return out;
}

/** Fraction of the span between a corner's ring neighbours over which its two off-ring neighbours spread. Conventional. */
const SPREAD: number = 0.5;
