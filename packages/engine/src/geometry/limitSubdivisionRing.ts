import { ISubdivisionRing } from "./ISubdivisionRing";

/**
 * The limit position of a ring's vertex and one limit normal per sector of
 * faces between its infinitely sharp edges.
 *
 * Every edge must be smooth (0) or infinitely sharp (10); `stepSubdivisionRing`
 * spends any semi-sharp remainder first. With `n` edges, at most one sharp and
 * no boundary, the vertex is smooth (or a dart): its limit is
 * `(n^2 C + 4 sum E + sum D) / (n (n + 5))` and its tangents are the cosine and
 * sine masks with `A = 1 + cos(2 pi / n) + cos(pi / n) sqrt(2 (9 + cos(2 pi / n)))`
 * on the edges and `cos(2 pi i / n) + cos(2 pi (i + 1) / n)` on the diagonals
 * (Halstead, Kass and DeRose 1993), giving one normal. With two sharp edges the
 * vertex is on a crease, whose limit is the B-spline point `(A + 4 C + B) / 6`
 * of the crease neighbours; each sector's normal crosses the crease tangent
 * with the cross tangent of Biermann, Levin and Zorin (2000), as OpenSubdiv
 * evaluates it. With three or more the vertex is a corner and stays put; each
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
 * @evidence contracts/common.md#principled-implementation Limit and tangent masks from the eigenanalysis of the Catmull-Clark subdivision matrix (Halstead, Kass and DeRose 1993) for smooth vertices, the cubic B-spline limit of the crease curve, and Biermann, Levin and Zorin's crease cross tangent as OpenSubdiv applies it to the standard crease rules; the cross tangent reduces to the exact regular B-spline cross derivative for a sector of two quads, and for other sector sizes is the same approximation OpenSubdiv makes.
 * @evidence contracts/common.md#clear-and-simple-design One function per vertex class decision, with sectors found from the sharp edges in fan order so smooth, crease and corner vertices share one sector bookkeeping.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A vanishing or non-finite normal is refused instead of replaced; the only fallback is the stated collinear corner sector, which has no curve-determined tangent plane.
 * @evidence contracts/common.md#meaningful-documentation States the precondition, each class's limit and normal rule with sources, the corner orientation and its degenerate case, and the refusal.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the valence: one pass for the limit, one per tangent, and one per sector over its faces.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each ring is evaluated once.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns small arrays sized by the valence and retains nothing.
 */
export const limitSubdivisionRing = (
  ring: ISubdivisionRing,
  vertex: number,
): { position: number[]; normals: number[][]; sectors: number[] } => {
  const edgeCount: number = ring.sharpness.length;
  const faceCount: number = ring.diagonals.length / 3;
  const centre: number[] = ring.centre;
  const edge: (i: number) => number[] = (i: number): number[] =>
    ring.edges.slice((i % edgeCount) * 3, (i % edgeCount) * 3 + 3);
  const diagonal: (i: number) => number[] = (i: number): number[] =>
    ring.diagonals.slice((i % edgeCount) * 3, (i % edgeCount) * 3 + 3);
  const sharp: number[] = [];
  ring.sharpness.forEach((s: number, i: number): void => {
    if (s > 0) sharp.push(i);
  });

  if (sharp.length <= 1) {
    const n: number = edgeCount;
    const position: number[] = centre.map((x: number): number => n * n * x);
    const along: number[] = [0, 0, 0];
    const across: number[] = [0, 0, 0];
    const theta: number = (2 * Math.PI) / n;
    const scale: number =
      1 +
      Math.cos(theta) +
      Math.cos(theta / 2) * Math.sqrt(2 * (9 + Math.cos(theta)));
    for (let i: number = 0; i < n; ++i) {
      const e: number[] = edge(i);
      const d: number[] = diagonal(i);
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
      normals: [unit(cross(along, across), vertex)],
      sectors: new Array<number>(faceCount).fill(0),
    };
  }

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
      for (let i: number = lead; i < trail; ++i) sectors[i % edgeCount] = sector;
      const leading: number[] = edge(lead);
      const trailing: number[] = edge(trail);
      if (sharp.length === 2)
        return unit(
          cross(
            subtract(leading, trailing),
            crossTangent(centre, lead, trail, edge, diagonal),
          ),
          vertex,
        );
      const winding: number[] = [0, 0, 0];
      for (let i: number = lead; i < trail; ++i)
        add(
          winding,
          cross(subtract(edge(i), centre), subtract(edge(i + 1), centre)),
        );
      const a: number[] = subtract(leading, centre);
      const b: number[] = subtract(trailing, centre);
      const normal: number[] = cross(a, b);
      if (length(normal) <= 1e-9 * length(a) * length(b))
        return unit(winding, vertex);
      return unit(
        dot(normal, winding) < 0
          ? normal.map((x: number): number => -x)
          : normal,
        vertex,
      );
    },
  );
  return { position, normals, sectors };
};

/** The crease cross tangent over the sector from edge `lead` to edge `trail`, pointing into the sector. */
const crossTangent: (
  centre: number[],
  lead: number,
  trail: number,
  edge: (i: number) => number[],
  diagonal: (i: number) => number[],
) => number[] = (
  centre: number[],
  lead: number,
  trail: number,
  edge: (i: number) => number[],
  diagonal: (i: number) => number[],
): number[] => {
  const faces: number = trail - lead;
  if (faces === 1)
    return centre.map(
      (x: number, axis: number): number =>
        (edge(lead)[axis]! + edge(trail)[axis]!) / 2 - x,
    );
  const theta: number = Math.PI / faces;
  const r: number = (1 + Math.cos(theta)) / Math.sin(theta);
  const tangent: number[] = centre.map(
    (x: number, axis: number): number =>
      4 * r * (Math.cos(theta) - 1) * x -
      r * (1 + 2 * Math.cos(theta)) * (edge(lead)[axis]! + edge(trail)[axis]!),
  );
  for (let i: number = 0; i < faces; ++i) {
    const weight: number = Math.sin(i * theta) + Math.sin((i + 1) * theta);
    add(tangent, diagonal(lead + i).map((x: number): number => weight * x));
    if (i > 0)
      add(
        tangent,
        edge(lead + i).map((x: number): number => 4 * Math.sin(i * theta) * x),
      );
  }
  return tangent;
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
): number[] => [
  a[0]! - b[0]!,
  a[1]! - b[1]!,
  a[2]! - b[2]!,
];

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
): number =>
  a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;

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
    throw new Error(`subdivision limit normal at vertex ${vertex} is undefined`);
  return a.map((x: number): number => x / size);
};
