import { ISubdivisionRing } from "./ISubdivisionRing";
import { subdivisionRingEigenbasis } from "./subdivisionRingEigenbasis";

/**
 * The limit position of a ring's vertex and one limit normal per sector of
 * faces between its infinitely sharp edges.
 *
 * Every edge must be smooth (0) or infinitely sharp (10); `stepSubdivisionRing`
 * spends any semi-sharp remainder first. A vertex with no sharp edge is smooth:
 * its limit is `(n^2 C + 4 sum E + sum D) / (n (n + 5))` and its tangents are
 * the cosine and sine masks with
 * `A = 1 + cos(2 pi / n) + cos(pi / n) sqrt(2 (9 + cos(2 pi / n)))` on the edges
 * and `cos(2 pi i / n) + cos(2 pi (i + 1) / n)` on the diagonals (Halstead,
 * Kass and DeRose 1993), giving one normal. A dart, with one sharp edge, has
 * another subdivision matrix, so its limit and tangents come from that
 * matrix's eigenvectors through `subdivisionRingEigenbasis`. An interior vertex
 * of valence two has no tangent plane and is refused, as is any vanishing or
 * non-finite normal.
 *
 * With two sharp edges the vertex is on a crease, whose limit is the B-spline
 * point `(A + 4 C + B) / 6` of the crease neighbours. Each side's normal
 * crosses the crease tangent with a cross tangent into that side. For a side of
 * two faces this is the regular B-spline cross derivative, exact. A side of
 * three faces refines on its own as a boundary ring whose dominant tangent
 * eigenvalues, about 0.580 across and 0.5 along the crease, stand clear of the
 * next, 0.410, so its exact tangents come from `subdivisionRingEigenbasis`.
 * Other sides take OpenSubdiv's masks, Biermann, Levin and Zorin's (2000) for
 * four or more faces and the vertex-to-mean-of-crease-neighbours mask for one
 * face. Those are approximations with no exact replacement: under the standard
 * crease rules a side of four faces has a tie for its second tangent
 * eigenvalue and a wider side has two dominant eigenvalues above the crease's
 * 0.5, while a side of one face has a degenerate parametrisation, so the limit
 * surface has no tangent plane containing the crease there.
 *
 * With three or more sharp edges the vertex is a corner and stays put; each
 * sector's normal crosses the tangents of its two bounding crease curves,
 * which leave the corner along their edges, oriented by the sector's own
 * winding. A corner sector whose two crease curves leave in one line has no
 * tangent plane the curves determine, and takes the winding-weighted normal of
 * its ring quads instead.
 *
 * @param ring A one-ring whose sharpness is only 0 or 10.
 * @param vertex Vertex index, for the diagnostic.
 * @returns The limit position, the unit normal of each sector, and each ring face's sector.
 *
 * @evidence contracts/common.md#principled-implementation Smooth limit and tangent masks are left eigenvectors of the Catmull-Clark subdivision matrix (Halstead, Kass and DeRose 1993), and darts and three-face crease sides use the eigenvectors of their own matrices; the crease limit is the cubic B-spline curve point; a two-face crease side is a regular B-spline boundary; corner tangents are the end tangents of the crease curves. Crease sides of one or four or more faces use OpenSubdiv's masks, stated as approximations together with the eigenstructure reason no exact normal exists there.
 * @evidence contracts/common.md#clear-and-simple-design One function per vertex class decision, with sectors found from the sharp edges in fan order so crease and corner vertices share one sector bookkeeping; the dart eigenvectors are computed in their own function.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A valence-two interior vertex and a vanishing or non-finite normal are refused instead of replaced; the only fallback is the stated collinear corner sector, which has no curve-determined tangent plane.
 * @evidence contracts/common.md#meaningful-documentation States the precondition, each class's limit and normal rule with sources, which results are exact and which approximate and why, the corner orientation and its degenerate case, and the refusals.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the valence for every class except darts and three-face crease sides, whose eigenvector search is quadratic in the ring size per iteration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each ring is evaluated once.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns small arrays sized by the valence and retains nothing.
 */
export const limitSubdivisionRing = (
  ring: ISubdivisionRing,
  vertex: number,
): { position: number[]; normals: number[][]; sectors: number[] } => {
  const edgeCount: number = ring.sharpness.length;
  const faceCount: number = ring.diagonals.length / 3;
  const sharp: number[] = [];
  ring.sharpness.forEach((s: number, i: number): void => {
    if (s > 0) sharp.push(i);
  });
  if (sharp.length <= 1 && edgeCount < 3)
    throw new Error(
      `subdivision limit normal at vertex ${vertex} is undefined`,
    );
  if (sharp.length === 0) {
    const smooth: { position: number[]; normal: number[] } = smoothLimit(ring);
    return {
      position: smooth.position,
      normals: [unit(smooth.normal, vertex)],
      sectors: new Array<number>(faceCount).fill(0),
    };
  }
  if (sharp.length === 1) {
    const basis: { limit: number[]; tangents: number[][] } =
      subdivisionRingEigenbasis(ring);
    return {
      position: basis.limit,
      normals: [
        oriented(
          cross(basis.tangents[0]!, basis.tangents[1]!),
          winding(ring, 0, edgeCount),
          vertex,
        ),
      ],
      sectors: new Array<number>(faceCount).fill(0),
    };
  }

  const centre: number[] = ring.centre;
  const edge: (i: number) => number[] = (i: number): number[] =>
    ring.edges.slice((i % edgeCount) * 3, (i % edgeCount) * 3 + 3);
  const position: number[] =
    sharp.length === 2
      ? centre.map(
          (x: number, axis: number): number =>
            (edge(sharp[0]!)[axis]! + 4 * x + edge(sharp[1]!)[axis]!) / 6,
        )
      : centre.slice();
  const bounds: Array<[number, number]> = [];
  for (let t: number = 0; t + 1 < sharp.length; ++t)
    bounds.push([sharp[t]!, sharp[t + 1]!]);
  if (edgeCount === faceCount)
    bounds.push([sharp[sharp.length - 1]!, sharp[0]! + edgeCount]);
  const sectors: number[] = new Array<number>(faceCount).fill(0);
  const normals: number[][] = bounds.map(
    ([lead, trail]: [number, number], sector: number): number[] => {
      for (let i: number = lead; i < trail; ++i)
        sectors[i % edgeCount] = sector;
      const turn: number[] = winding(ring, lead, trail);
      if (sharp.length === 2 && trail - lead === 3) {
        const basis: { limit: number[]; tangents: number[][] } =
          subdivisionRingEigenbasis(side(ring, lead, trail));
        return oriented(
          cross(basis.tangents[0]!, basis.tangents[1]!),
          turn,
          vertex,
        );
      }
      if (sharp.length === 2)
        return unit(
          cross(
            subtract(edge(lead), edge(trail)),
            crossTangent(ring, lead, trail),
          ),
          vertex,
        );
      const a: number[] = subtract(edge(lead), centre);
      const b: number[] = subtract(edge(trail), centre);
      const normal: number[] = cross(a, b);
      if (length(normal) <= 1e-9 * length(a) * length(b))
        return unit(turn, vertex);
      return oriented(normal, turn, vertex);
    },
  );
  return { position, normals, sectors };
};

/**
 * The smooth limit position and an unnormalized normal of a ring, by the masks
 * of Halstead, Kass and DeRose (1993).
 */
const smoothLimit: (ring: ISubdivisionRing) => {
  position: number[];
  normal: number[];
} = (ring: ISubdivisionRing): { position: number[]; normal: number[] } => {
  const n: number = ring.sharpness.length;
  const position: number[] = ring.centre.map((x: number): number => n * n * x);
  const along: number[] = [0, 0, 0];
  const across: number[] = [0, 0, 0];
  const theta: number = (2 * Math.PI) / n;
  const scale: number =
    1 +
    Math.cos(theta) +
    Math.cos(theta / 2) * Math.sqrt(2 * (9 + Math.cos(theta)));
  for (let i: number = 0; i < n; ++i) {
    const e: number[] = point(ring.edges, i);
    const d: number[] = point(ring.diagonals, i);
    for (let axis: number = 0; axis < 3; ++axis) {
      position[axis]! += 4 * e[axis]! + d[axis]!;
      along[axis]! +=
        scale * Math.cos(theta * i) * e[axis]! +
        (Math.cos(theta * i) + Math.cos(theta * (i + 1))) * d[axis]!;
      across[axis]! +=
        scale * Math.sin(theta * i) * e[axis]! +
        (Math.sin(theta * i) + Math.sin(theta * (i + 1))) * d[axis]!;
    }
  }
  return {
    position: position.map((x: number): number => x / (n * (n + 5))),
    normal: cross(along, across),
  };
};

/** Point `i` of a packed ring array, wrapping around the ring's edge count. */
const point: (packed: readonly number[], i: number) => number[] = (
  packed: readonly number[],
  i: number,
): number[] => {
  const count: number = packed.length / 3;
  const at: number = i % count;
  return packed.slice(at * 3, at * 3 + 3);
};

/**
 * The crease cross tangent over the sector from edge `lead` to edge `trail`,
 * pointing into the sector: OpenSubdiv's average of the two crease edges for
 * one face, and Biermann, Levin and Zorin's mask for more.
 */
const crossTangent: (
  ring: ISubdivisionRing,
  lead: number,
  trail: number,
) => number[] = (
  ring: ISubdivisionRing,
  lead: number,
  trail: number,
): number[] => {
  const faces: number = trail - lead;
  const centre: number[] = ring.centre;
  const first: number[] = point(ring.edges, lead);
  const last: number[] = point(ring.edges, trail);
  if (faces === 1)
    return centre.map(
      (x: number, axis: number): number => (first[axis]! + last[axis]!) / 2 - x,
    );
  const theta: number = Math.PI / faces;
  const r: number = (1 + Math.cos(theta)) / Math.sin(theta);
  const tangent: number[] = centre.map(
    (x: number, axis: number): number =>
      4 * r * (Math.cos(theta) - 1) * x -
      r * (1 + 2 * Math.cos(theta)) * (first[axis]! + last[axis]!),
  );
  for (let i: number = 0; i < faces; ++i) {
    const weight: number = Math.sin(i * theta) + Math.sin((i + 1) * theta);
    add(
      tangent,
      point(ring.diagonals, lead + i).map((x: number): number => weight * x),
    );
    if (i > 0)
      add(
        tangent,
        point(ring.edges, lead + i).map(
          (x: number): number => 4 * Math.sin(i * theta) * x,
        ),
      );
  }
  return tangent;
};

/**
 * The sum of `(E_i - C) x (E_{i+1} - C)` over the ring quads from edge `lead`
 * to edge `trail`, a vector on the outward side of that sector.
 */
const winding: (
  ring: ISubdivisionRing,
  lead: number,
  trail: number,
) => number[] = (
  ring: ISubdivisionRing,
  lead: number,
  trail: number,
): number[] => {
  const turn: number[] = [0, 0, 0];
  for (let i: number = lead; i < trail; ++i)
    add(
      turn,
      cross(
        subtract(point(ring.edges, i), ring.centre),
        subtract(point(ring.edges, i + 1), ring.centre),
      ),
    );
  return turn;
};

/** The unit vector along `normal`, flipped to the side of `turn`. */
const oriented: (
  normal: number[],
  turn: readonly number[],
  vertex: number,
) => number[] = (
  normal: number[],
  turn: readonly number[],
  vertex: number,
): number[] =>
  unit(
    dot(normal, turn) < 0 ? normal.map((x: number): number => -x) : normal,
    vertex,
  );

/**
 * The faces from edge `lead` to edge `trail` of a crease ring as a boundary
 * ring of their own, which refines independently of the other side because
 * the crease rules read only the crease.
 */
const side: (
  ring: ISubdivisionRing,
  lead: number,
  trail: number,
) => ISubdivisionRing = (
  ring: ISubdivisionRing,
  lead: number,
  trail: number,
): ISubdivisionRing => {
  const edges: number[] = [];
  const diagonals: number[] = [];
  const sharpness: number[] = [];
  for (let i: number = lead; i <= trail; ++i) {
    edges.push(...point(ring.edges, i));
    sharpness.push(i === lead || i === trail ? 10 : 0);
    if (i < trail) diagonals.push(...point(ring.diagonals, i));
  }
  return { centre: ring.centre.slice(), edges, diagonals, sharpness };
};

/** Add `b` into `a` in place. */
const add: (a: number[], b: readonly number[]) => void = (
  a: number[],
  b: readonly number[],
): void => {
  for (let axis: number = 0; axis < 3; ++axis) a[axis]! += b[axis]!;
};

/** The difference `a - b`. */
const subtract: (a: readonly number[], b: readonly number[]) => number[] = (
  a: readonly number[],
  b: readonly number[],
): number[] => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];

/** The cross product `a x b`. */
const cross: (a: readonly number[], b: readonly number[]) => number[] = (
  a: readonly number[],
  b: readonly number[],
): number[] => [
  a[1]! * b[2]! - a[2]! * b[1]!,
  a[2]! * b[0]! - a[0]! * b[2]!,
  a[0]! * b[1]! - a[1]! * b[0]!,
];

/** The dot product. */
const dot: (a: readonly number[], b: readonly number[]) => number = (
  a: readonly number[],
  b: readonly number[],
): number => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;

/** The Euclidean length. */
const length: (a: readonly number[]) => number = (
  a: readonly number[],
): number => Math.hypot(a[0]!, a[1]!, a[2]!);

/** The unit vector along `a`, refusing a vanishing or non-finite one. */
const unit: (a: readonly number[], vertex: number) => number[] = (
  a: readonly number[],
  vertex: number,
): number[] => {
  const size: number = length(a);
  if (!(size > 0) || !Number.isFinite(size))
    throw new Error(
      `subdivision limit normal at vertex ${vertex} is undefined`,
    );
  return a.map((x: number): number => x / size);
};
