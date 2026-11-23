import type { IAutoMovieProjectSoftCordSelfContact } from "@automovie/interface";

/**
 * Project detected nonadjacent cord-segment penetrations along the line between
 * their closest points, with Coulomb friction, in place on predicted positions.
 * One ordered pass does not certify separation of every pair.
 *
 * A cord is a one-wide lattice, its particles in index order along it and
 * segment s joining particles s and s + 1. Each segment is a capsule of the
 * domain's `thickness` (its radius). For two segments, the closest points p =
 * a0 + s (a1 - a0) and q = b0 + t (b1 - b0) come from the clamped
 * segment-segment solution of Ericson ("Real-Time Collision Detection", 2005,
 * section 5.1.9). The non-penetration constraint C = |p - q| - 2r (r the
 * radius) has gradients (1 - s) n and s n on a0 and a1 and -(1 - t) n and -t n
 * on b0 and b1, n the unit direction from q to p; an active one (C < 0) is
 * projected as a position-based constraint with those gradients and the
 * particles' inverse masses (Müller, Heidelberger, Hennix and Ratcliff 2007,
 * "Position based dynamics", section 3.3).
 *
 * Friction is the position-based Coulomb model of Macklin, Müller, Chentanez
 * and Kim 2014 ("Unified particle physics for real-time applications", ACM TOG
 * 33(4):153, section 6.1), with one coefficient for sticking and sliding: the
 * relative tangential displacement of the two closest points over the step is
 * removed entirely while it is under mu times the penetration depth, and
 * shortened by mu times the depth above it, distributed over the four particles
 * as the normal correction is.
 *
 * Candidate pairs come from a uniform grid whose cell is the longest segment
 * plus two radii, so two segments within two radii of each other have midpoints
 * in neighbouring cells; segments are visited in index order and each one's
 * candidates in ascending order, so the result is deterministic. The grid
 * describes positions at the start of this call and is not rebuilt after each
 * projection. Closest-point coincidence has no separating direction and is
 * skipped. The declared `dt * referenceSpeed <= thickness` admission bound does
 * not clamp actual particle speed; this discrete projection is not continuous
 * collision detection and cannot rule out tunnelling.
 *
 * @param props The cord's particles, its previous and predicted positions,
 *   inverse masses and contact.
 * @returns How many pairs were in contact.
 */
export const projectSoftCordSelfContact: (
  props: IAutoMovieProjectSoftCordSelfContact.IProps,
) => number = (props: IAutoMovieProjectSoftCordSelfContact.IProps): number => {
  // The pair projection reads the positions and the inverse masses from
  // `props`; the grid needs only the predicted positions.
  const { count, predicted }: typeof props = props;
  const segments: number = count - 1;
  if (segments < 3) return 0;
  const reach: number = 2 * props.radius;

  // The grid: a cell the longest segment plus two radii wide.
  let longest: number = 0;
  for (let s: number = 0; s < segments; ++s)
    longest = Math.max(longest, distance(predicted, s, s + 1));
  const cell: number = longest + reach;
  const key = (x: number, y: number, z: number): string => `${x},${y},${z}`;
  const index = (s: number, axis: number): number =>
    Math.floor(
      (predicted[s * 3 + axis] + predicted[(s + 1) * 3 + axis]) / 2 / cell,
    );
  const grid: Map<string, number[]> = new Map();
  for (let s: number = 0; s < segments; ++s) {
    const k: string = key(index(s, 0), index(s, 1), index(s, 2));
    const list: number[] | undefined = grid.get(k);
    if (list === undefined) grid.set(k, [s]);
    else list.push(s);
  }

  let contacts: number = 0;
  for (let a: number = 0; a < segments; ++a) {
    const candidates: number[] = [];
    const cx: number = index(a, 0);
    const cy: number = index(a, 1);
    const cz: number = index(a, 2);
    for (let x: number = -1; x <= 1; ++x)
      for (let y: number = -1; y <= 1; ++y)
        for (let z: number = -1; z <= 1; ++z)
          for (const b of grid.get(key(cx + x, cy + y, cz + z)) ?? [])
            if (b >= a + 2) candidates.push(b);
    candidates.sort((l: number, r: number): number => l - r);
    for (const b of candidates) if (separate(props, a, b, reach)) ++contacts;
  }
  return contacts;
};

/** The buffers and coefficient one pair's projection reads. */
interface IPair {
  position: Float64Array<ArrayBufferLike>;
  predicted: Float64Array<ArrayBufferLike>;
  inverseMass: Float64Array<ArrayBufferLike>;
  friction: number;
}

/**
 * Project one pair of segments apart and apply friction between them, returning
 * whether they were in contact.
 */
const separate: (
  props: IPair,
  a: number,
  b: number,
  reach: number,
) => boolean = (props: IPair, a: number, b: number, reach: number): boolean => {
  const { predicted, position, inverseMass }: typeof props = props;
  const [s, t]: [number, number] = closest(predicted, a, b);
  const point = (
    buffer: Float64Array<ArrayBufferLike>,
    first: number,
    share: number,
    axis: number,
  ): number =>
    buffer[first * 3 + axis] * (1 - share) +
    buffer[(first + 1) * 3 + axis] * share;
  const d: number[] = [0, 1, 2].map(
    (axis: number): number =>
      point(predicted, a, s, axis) - point(predicted, b, t, axis),
  );
  const length: number = Math.hypot(d[0]!, d[1]!, d[2]!);
  if (length >= reach || length === 0) return false;
  const n: number[] = d.map((v: number): number => v / length);

  // The four particles with their gradient weights along n.
  const ids: readonly number[] = [a, a + 1, b, b + 1];
  const weights: readonly number[] = [1 - s, s, -(1 - t), -t];
  const denominator: number = ids.reduce(
    (sum: number, id: number, i: number): number =>
      sum + inverseMass[id] * weights[i]! * weights[i]!,
    0,
  );
  if (denominator === 0) return true;
  const depth: number = reach - length;
  const normal: number = depth / denominator;
  ids.forEach((id: number, i: number): void => {
    for (let axis: number = 0; axis < 3; ++axis)
      predicted[id * 3 + axis] +=
        inverseMass[id] * weights[i]! * normal * n[axis]!;
  });

  // Coulomb friction on the closest points' relative tangential travel.
  const travel: number[] = [0, 1, 2].map(
    (axis: number): number =>
      point(predicted, a, s, axis) -
      point(position, a, s, axis) -
      (point(predicted, b, t, axis) - point(position, b, t, axis)),
  );
  const along: number =
    travel[0]! * n[0]! + travel[1]! * n[1]! + travel[2]! * n[2]!;
  const tangent: number[] = travel.map(
    (v: number, axis: number): number => v - along * n[axis]!,
  );
  const slide: number = Math.hypot(tangent[0]!, tangent[1]!, tangent[2]!);
  if (slide === 0) return true;
  const keep: number =
    slide < props.friction * depth
      ? 1
      : Math.min((props.friction * depth) / slide, 1);
  ids.forEach((id: number, i: number): void => {
    for (let axis: number = 0; axis < 3; ++axis)
      predicted[id * 3 + axis] -=
        (inverseMass[id] * weights[i]! * keep * tangent[axis]!) / denominator;
  });
  return true;
};

/**
 * The shares along two segments of their closest points, each in [0, 1]
 * (Ericson 2005, section 5.1.9, `ClosestPtSegmentSegment`).
 */
const closest: (
  x: Float64Array<ArrayBufferLike>,
  a: number,
  b: number,
) => [number, number] = (
  x: Float64Array<ArrayBufferLike>,
  a: number,
  b: number,
): [number, number] => {
  const d1: number[] = [0, 1, 2].map(
    (k: number): number => x[(a + 1) * 3 + k] - x[a * 3 + k],
  );
  const d2: number[] = [0, 1, 2].map(
    (k: number): number => x[(b + 1) * 3 + k] - x[b * 3 + k],
  );
  const r: number[] = [0, 1, 2].map(
    (k: number): number => x[a * 3 + k] - x[b * 3 + k],
  );
  const dot = (u: number[], v: number[]): number =>
    u[0]! * v[0]! + u[1]! * v[1]! + u[2]! * v[2]!;
  const aa: number = dot(d1, d1);
  const ee: number = dot(d2, d2);
  const f: number = dot(d2, r);
  const clamp = (v: number): number => Math.max(0, Math.min(1, v));
  if (aa === 0 && ee === 0) return [0, 0];
  if (aa === 0) return [0, clamp(f / ee)];
  const c: number = dot(d1, r);
  if (ee === 0) return [clamp(-c / aa), 0];
  const bb: number = dot(d1, d2);
  const denom: number = aa * ee - bb * bb;
  let s: number = denom !== 0 ? clamp((bb * f - c * ee) / denom) : 0;
  let t: number = (bb * s + f) / ee;
  if (t < 0) {
    t = 0;
    s = clamp(-c / aa);
  } else if (t > 1) {
    t = 1;
    s = clamp((bb - c) / aa);
  }
  return [s, t];
};

/** The distance between two particles of a buffer. */
const distance: (
  x: Float64Array<ArrayBufferLike>,
  i: number,
  k: number,
) => number = (
  x: Float64Array<ArrayBufferLike>,
  i: number,
  k: number,
): number =>
  Math.hypot(
    x[i * 3] - x[k * 3],
    x[i * 3 + 1] - x[k * 3 + 1],
    x[i * 3 + 2] - x[k * 3 + 2],
  );
