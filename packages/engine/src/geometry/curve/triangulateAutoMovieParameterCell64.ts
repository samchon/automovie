type Point<T> = { value: T; u: number; v: number };

/**
 * Triangulate a parameter rectangle using its existing perimeter samples only.
 * The immutable perimeter starts at the bottom-left corner and traverses bottom,
 * right, top and left counterclockwise. Each side is monotone and includes its
 * corners. Equal numeric coordinates may carry distinct authoritative samples;
 * their perimeter order and object references remain intact.
 *
 * A monotone zipper joins the bottom and top chains. Additional left and right
 * samples split their owning exterior triangle edge. No analytic cell-center
 * point is introduced. Matching bottom/top u samples therefore retain vertical
 * fiber edges, including when those fibers have side subdivisions. For identical
 * translated curves this preserves extruded polygon face planes in exact arithmetic.
 * Unequal boundary sample sets and arbitrary curved fields have no normal-error
 * guarantee. The caller retains its field approximation and arithmetic diagnostics.
 * Zero-area parameter triangles remain for the caller to count and omit.
 *
 * @evidence contracts/common.md#principled-implementation Monotone polygon triangulation joins two ordered horizontal chains and subdivides only declared exterior edges; every triangle uses input sample references and stays inside the same convex parameter rectangle.
 * @evidence contracts/common.md#clear-and-simple-design One parameter-only helper serves field consumers without owning coefficients, evaluation, spatial topology, normals or output indices.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No new geometric point, coordinate weld, angle gate, source lookup or consumer-specific branch changes the surface or its boundary authority.
 * @evidence contracts/common.md#meaningful-documentation States perimeter order, repeated-coordinate identity, exact-arithmetic translation behavior, unresolved normal scope and zero-area ownership.
 * @evidence contracts/performance.md#efficient-algorithms For N perimeter samples, admission, the zipper and two exterior-edge searches take O(N) time and return N-2 triangles; no global Cartesian grid or recursive refinement is allocated.
 * @evidence contracts/performance.md#reuse-equivalent-work Coordinates are read once per sample. All chains and triangle records reference those same samples; callers retain their existing shared evaluation and vertex caches.
 * @evidence contracts/performance.md#bound-retention-and-release-resources O(N) parameter records and triangle references live for this call. Returned triangle references transfer to the caller; no input is mutated and no state or resource survives independently.
 */
export function triangulateAutoMovieParameterCell64<T>(
  boundary: readonly T[],
  coordinates: (point: T) => readonly [number, number],
): [T, T, T][] {
  const points: Point<T>[] = [];
  let u0: number = Infinity,
    u1: number = -Infinity,
    v0: number = Infinity,
    v1: number = -Infinity;
  for (const value of boundary) {
    const uv: readonly [number, number] = coordinates(value);
    if (!Number.isFinite(uv[0]) || !Number.isFinite(uv[1]))
      throw new Error("Finite parameter perimeter coordinates required");
    points.push({ value, u: uv[0], v: uv[1] });
    u0 = Math.min(u0, uv[0]);
    u1 = Math.max(u1, uv[0]);
    v0 = Math.min(v0, uv[1]);
    v1 = Math.max(v1, uv[1]);
  }
  if (
    points.length < 4 ||
    !(u0 < u1 && v0 < v1) ||
    points.some(
      (p: Point<T>): boolean =>
        p.u !== u0 && p.u !== u1 && p.v !== v0 && p.v !== v1,
    )
  )
    throw new Error("A nonempty rectangular parameter perimeter required");
  const bottom: Point<T>[] = points.filter(
    (p: Point<T>): boolean => p.v === v0,
  );
  const top: Point<T>[] = points
    .filter((p: Point<T>): boolean => p.v === v1)
    .reverse();
  const sides: Point<T>[][] = [
    points
      .filter((p: Point<T>): boolean => p.u === u0 && p.v > v0 && p.v < v1)
      .reverse(),
    points.filter((p: Point<T>): boolean => p.u === u1 && p.v > v0 && p.v < v1),
  ];
  if (
    [bottom, top].some(
      (row: Point<T>[]): boolean =>
        row.length < 2 ||
        row[0]!.u !== u0 ||
        row.at(-1)!.u !== u1 ||
        row.some(
          (p: Point<T>, i: number): boolean => i > 0 && row[i - 1]!.u > p.u,
        ),
    ) ||
    sides.some((row: Point<T>[]): boolean =>
      row.some(
        (p: Point<T>, i: number): boolean => i > 0 && row[i - 1]!.v > p.v,
      ),
    )
  )
    throw new Error("Counterclockwise monotone rectangle sides required");
  const triangles: [Point<T>, Point<T>, Point<T>][] = [];
  let i: number = 0,
    j: number = 0;
  while (i + 1 < bottom.length || j + 1 < top.length) {
    if (
      j + 1 === top.length ||
      (i + 1 < bottom.length && bottom[i + 1]!.u <= top[j + 1]!.u)
    ) {
      triangles.push([bottom[i]!, bottom[i + 1]!, top[j]!]);
      i++;
    } else {
      triangles.push([bottom[i]!, top[j + 1]!, top[j]!]);
      j++;
    }
  }
  for (let side: number = 0; side < 2; side++) {
    const inner: Point<T>[] = sides[side]!,
      u: number = side === 0 ? u0 : u1;
    if (!inner.length) continue;
    let found: boolean = false;
    for (let f: number = 0; f < triangles.length && !found; f++)
      for (let k: number = 0; k < 3 && !found; k++) {
        const triangle: [Point<T>, Point<T>, Point<T>] = triangles[f]!,
          a: Point<T> = triangle[k]!,
          b: Point<T> = triangle[(k + 1) % 3]!,
          c: Point<T> = triangle[(k + 2) % 3]!;
        // Rounded-coincident corner samples can create a degenerate triangle on
        // this side. Split the actual rectangle edge, not that zero-area record.
        if (a.u !== u || b.u !== u || a.v === b.v || c.u === u) continue;
        const chain: Point<T>[] = [
          a,
          ...(a.v < b.v ? inner : [...inner].reverse()),
          b,
        ];
        triangles[f] = [chain[0]!, chain[1]!, c];
        for (let n: number = 1; n + 1 < chain.length; n++)
          triangles.push([chain[n]!, chain[n + 1]!, c]);
        found = true;
      }
    if (!found)
      throw new Error("An exterior rectangle edge could not be resolved");
  }
  return triangles.map(
    (triangle: [Point<T>, Point<T>, Point<T>]): [T, T, T] => [
      triangle[0].value,
      triangle[1].value,
      triangle[2].value,
    ],
  );
}
