import type {
  AutoMovieVector3Tuple,
  IAutoMovieMeshPlaneContour,
  IAutoMovieMeshPlaneCut,
  IAutoMovieMeshPlaneIntersection,
  IAutoMoviePlaneFrame,
} from "@automovie/interface";

/*
 * Admit immutable source positions, incidence and scalar heights once. The
 * caller keeps every supplied array unchanged until all queries finish. Each
 * query accepts original face IDs in strictly increasing order; candidates
 * must include every face whose scalar interval contains level, including
 * ties. Omitting candidates scans every face. The optional filter sees
 * original IDs. The supplied plane retains the physical chart, while heights
 * minus level own predicates. retainSourceFaces copies actual emitting faces,
 * excluding endpoint-star neighbors. retainOrderedSource additionally
 * preserves directed segments and original edge alias witnesses. Both default
 * false; omitted mode retains original properties and numeric paths. Binary64
 * predicates are not certified exact arithmetic.
 */
export function prepareCutExact(
  skin: Parameters<IAutoMovieMeshPlaneCut.Prepare>[0],
  heights: Parameters<IAutoMovieMeshPlaneCut.Prepare>[1],
  retainSourceFaces: Parameters<IAutoMovieMeshPlaneCut.Prepare>[2] = false,
  retainOrderedSource: Parameters<IAutoMovieMeshPlaneCut.Prepare>[3] = false,
): ReturnType<IAutoMovieMeshPlaneCut.Prepare> {
  if (
    skin.canon.length !== skin.vertices.length ||
    heights.length !== skin.vertices.length
  )
    throw new Error(
      "Section scalar chart does not align with finite source positions",
    );
  for (let i: number = 0; i < skin.vertices.length; i++)
    if (
      skin.vertices[i]!.length !== 3 ||
      skin.canon[i]! < 0 ||
      skin.canon[i]! >= skin.vertices.length
    )
      throw new Error(
        "Finite positions and valid canonical source addresses are required",
      );
  for (const triangle of skin.triangles)
    if (
      triangle.length !== 3 ||
      triangle.some(
        (i: number): boolean => i < 0 || i >= skin.vertices.length,
      )
    )
      throw new Error(
        "Section face addresses do not align with source positions",
      );
  return (
    _plane: IAutoMoviePlaneFrame,
    level: number,
    candidates?: readonly number[],
    select?: (triangle: number) => boolean,
  ): IAutoMovieMeshPlaneContour[] => {
    const distances: Map<number, number> = new Map();
    const distance: (i: number) => number = (i: number): number => {
      const known: number | undefined = distances.get(i);
      if (known !== undefined) return known;
      const value: number = heights[i]! - level;
      if (value === Infinity || value === -Infinity)
        throw new Error("Exact section signed distances are unresolved");
      distances.set(i, value);
      return value;
    };
    const points: Map<string, IAutoMovieMeshPlaneIntersection> = new Map();
    const segments: Map<string, [string, string]> = new Map();
    const sourceFaces: Map<string, Set<number>> | undefined =
      retainSourceFaces || retainOrderedSource ? new Map() : undefined;
    const contactFaces: Map<string, Set<number>> | undefined =
      retainSourceFaces || retainOrderedSource ? new Map() : undefined;
    const record: (
      id: string,
      faces: readonly number[],
      contact?: boolean,
    ) => void = (
      id: string,
      faces: readonly number[],
      contact: boolean = false,
    ): void => {
      const registry: Map<string, Set<number>> | undefined = contact
        ? contactFaces
        : sourceFaces;
      if (!registry) return;
      if (!registry.has(id)) registry.set(id, new Set());
      for (const face of faces) registry.get(id)!.add(face);
    };
    const provenance: (
      edges?: readonly string[],
      contact?: string,
    ) => Pick<IAutoMovieMeshPlaneContour, "exactSourceTriangleIds"> = (
      edges?: readonly string[],
      contact?: string,
    ): Pick<IAutoMovieMeshPlaneContour, "exactSourceTriangleIds"> => {
      if (!sourceFaces) return {};
      const faces: Set<number> = new Set(
        contact === undefined ? [] : contactFaces!.get(contact),
      );
      for (const edge of edges ?? [])
        for (const face of sourceFaces.get(edge) ?? []) faces.add(face);
      return {
        exactSourceTriangleIds: [...faces].sort(
          (a: number, b: number): number => a - b,
        ),
      };
    };
    const contacts: Set<string> = new Set();
    const coplanarVertices: Set<string> = new Set();
    const coplanar: Map<
      string,
      {
        ends: [string, string];
        triangle: number;
        opposite: AutoMovieVector3Tuple;
      }[]
    > = new Map();
    const key: (a: string, b: string) => string = (
      a: string,
      b: string,
    ): string => JSON.stringify(a < b ? [a, b] : [b, a]);
    const ordered: (
      edges: readonly string[] | undefined,
    ) => Pick<IAutoMovieMeshPlaneContour, "orderedSegments"> = (
      edges: readonly string[] | undefined,
    ): Pick<IAutoMovieMeshPlaneContour, "orderedSegments"> =>
      retainOrderedSource
        ? {
            orderedSegments: (edges ?? []).map(
              (
                id: string,
              ): NonNullable<
                IAutoMovieMeshPlaneContour["orderedSegments"]
              >[number] => ({
                id,
                sourceTriangleIds: [...(sourceFaces?.get(id) ?? [])].sort(
                  (a: number, b: number): number => a - b,
                ),
              }),
            ),
          }
        : {};
    const remember: (
      id: string,
      a: number,
      b: number,
      t: number,
      pointMm: AutoMovieVector3Tuple,
    ) => void = (
      id: string,
      a: number,
      b: number,
      t: number,
      pointMm: AutoMovieVector3Tuple,
    ): void => {
      if (!retainOrderedSource) return;
      const point: IAutoMovieMeshPlaneIntersection = points.get(id)!;
      point.sourceEdges ??= [];
      if (
        !point.sourceEdges.some(
          (
            e: NonNullable<
              IAutoMovieMeshPlaneIntersection["sourceEdges"]
            >[number],
          ): boolean => e.a === a && e.b === b && e.t === t,
        )
      )
        point.sourceEdges.push({ a, b, t, pointMm: [...pointMm] });
    };
    const vertex: (i: number) => string = (i: number): string => {
      const id: string = `v:${skin.canon[i]}`;
      if (!points.has(id))
        points.set(id, {
          p: [...skin.vertices[i]!],
          a: skin.canon[i]!,
          b: skin.canon[i]!,
          t: 0,
        });
      remember(id, i, i, 0, skin.vertices[i]!);
      return id;
    };
    const crossing: (i: number, j: number) => string = (
      i: number,
      j: number,
    ): string => {
      if (skin.canon[i]! > skin.canon[j]!) [i, j] = [j, i];
      const id: string = `e:${skin.canon[i]},${skin.canon[j]}`;
      if (!points.has(id)) {
        const a: AutoMovieVector3Tuple = skin.vertices[i]!,
          b: AutoMovieVector3Tuple = skin.vertices[j]!;
        // Opposite finite signs permit a ratio without overflowing their difference.
        const da: number = Math.abs(distance(i)),
          db: number = Math.abs(distance(j));
        const ratio: number = Math.min(da, db) / Math.max(da, db);
        const t: number = da <= db ? ratio / (1 + ratio) : 1 / (1 + ratio);
        if (!(t > 0 && t < 1))
          throw new Error("Exact section edge fraction is unresolved");
        const p: AutoMovieVector3Tuple = [
          a[0] * (1 - t) + b[0] * t,
          a[1] * (1 - t) + b[1] * t,
          a[2] * (1 - t) + b[2] * t,
        ];
        points.set(id, { p, a: skin.canon[i]!, b: skin.canon[j]!, t });
      }
      if (retainOrderedSource) {
        const da: number = Math.abs(distance(i)),
          db: number = Math.abs(distance(j));
        const ratio: number = Math.min(da, db) / Math.max(da, db);
        const t: number = da <= db ? ratio / (1 + ratio) : 1 / (1 + ratio);
        const a: AutoMovieVector3Tuple = skin.vertices[i]!,
          b: AutoMovieVector3Tuple = skin.vertices[j]!;
        const p: AutoMovieVector3Tuple = [
          a[0] * (1 - t) + b[0] * t,
          a[1] * (1 - t) + b[1] * t,
          a[2] * (1 - t) + b[2] * t,
        ];
        if (!(t > 0 && t < 1))
          throw new Error("Ordered original-edge witness is unresolved");
        remember(id, i, j, t, p);
      }
      return id;
    };
    let previous: number = -1;
    for (
      let fi: number = 0;
      fi < (candidates?.length ?? skin.triangles.length);
      fi++
    ) {
      const ti: number = candidates === undefined ? fi : candidates[fi]!;
      if (ti <= previous || ti >= skin.triangles.length)
        throw new Error(
          "Section candidates must be increasing original face addresses",
        );
      previous = ti;
      if (select && !select(ti)) continue;
      const t: [number, number, number] = skin.triangles[ti]!;
      if (t.every((i: number): boolean => distance(i) === 0)) {
        for (let k: number = 0; k < 3; k++) {
          const a: string = vertex(t[k]!),
            b: string = vertex(t[(k + 1) % 3]!);
          coplanarVertices.add(a);
          coplanarVertices.add(b);
          if (a === b) continue;
          const id: string = key(a, b);
          if (!coplanar.has(id)) coplanar.set(id, []);
          coplanar.get(id)!.push({
            ends: [a, b],
            triangle: ti,
            opposite: skin.vertices[t[(k + 2) % 3]!]!,
          });
        }
        continue;
      }
      const hits: Set<string> = new Set();
      for (let k: number = 0; k < 3; k++) {
        const i: number = t[k]!,
          j: number = t[(k + 1) % 3]!;
        if (distance(i) === 0) hits.add(vertex(i));
        if (
          (distance(i) < 0 && distance(j) > 0) ||
          (distance(i) > 0 && distance(j) < 0)
        )
          hits.add(crossing(i, j));
      }
      if (hits.size === 1) {
        const point: string = [...hits][0]!;
        contacts.add(point);
        record(point, [ti], true);
      }
      if (hits.size === 2) {
        const [first, second]: string[] = [...hits];
        const ends: [string, string] = [first!, second!];
        // Only a plane-coincident physical source edge is shared across faces.
        const onEdge: boolean =
          t.filter((i: number): boolean => distance(i) === 0).length === 2;
        if (ends[0] !== ends[1]) {
          const segment: string = onEdge ? key(...ends) : `face:${ti}`;
          segments.set(segment, ends);
          record(segment, [ti]);
        }
      }
    }
    for (const [id, patch] of coplanar) {
      let interior: boolean = false;
      if (
        patch.length === 2 &&
        patch[0]!.ends[0] === patch[1]!.ends[1] &&
        patch[0]!.ends[1] === patch[1]!.ends[0]
      ) {
        const a: AutoMovieVector3Tuple = points.get(patch[0]!.ends[0])!.p,
          b: AutoMovieVector3Tuple = points.get(patch[0]!.ends[1])!.p;
        const e: number[] = b.map(
          (x: number, i: number): number => x - a[i]!,
        );
        const u: number[] = patch[0]!.opposite.map(
          (x: number, i: number): number => x - a[i]!,
        );
        const v: number[] = patch[1]!.opposite.map(
          (x: number, i: number): number => x - a[i]!,
        );
        const cross: (p: number[], q: number[]) => number[] = (
          p: number[],
          q: number[],
        ): number[] => [
          p[1]! * q[2]! - p[2]! * q[1]!,
          p[2]! * q[0]! - p[0]! * q[2]!,
          p[0]! * q[1]! - p[1]! * q[0]!,
        ];
        const c: number[] = cross(e, u),
          d: number[] = cross(e, v);
        const sense: number = c.reduce(
          (sum: number, x: number, i: number): number => sum + x * d[i]!,
          0,
        );
        // Duplicate or overlapping coplanar faces do not bound one patch interior.
        interior = sense < 0;
      }
      if (interior) continue;
      if (patch.length === 1) {
        segments.set(id, patch[0]!.ends);
        record(id, [patch[0]!.triangle]);
      } else
        for (let i: number = 0; i < patch.length; i++) {
          segments.set(
            `coplanar:${patch[i]!.triangle}:${id}:${i}`,
            patch[i]!.ends,
          );
          record(`coplanar:${patch[i]!.triangle}:${id}:${i}`, [
            patch[i]!.triangle,
          ]);
        }
    }
    const adjacency: Map<string, { edge: string; next: string }[]> =
      new Map();
    for (const [edge, [a, b]] of segments) {
      if (!adjacency.has(a)) adjacency.set(a, []);
      if (!adjacency.has(b)) adjacency.set(b, []);
      adjacency.get(a)!.push({ edge, next: b });
      adjacency.get(b)!.push({ edge, next: a });
    }
    const visited: Set<string> = new Set();
    const output: IAutoMovieMeshPlaneContour[] = [];
    const walk: (
      start: string,
      first: { edge: string; next: string },
    ) => IAutoMovieMeshPlaneContour = (
      start: string,
      first: { edge: string; next: string },
    ): IAutoMovieMeshPlaneContour => {
      const keys: string[] = [start];
      const traversed: string[] | undefined =
        retainSourceFaces || retainOrderedSource ? [] : undefined;
      let step: typeof first | undefined = first;
      while (step && !visited.has(step.edge)) {
        visited.add(step.edge);
        traversed?.push(step.edge);
        const current: string = step.next;
        if (current === start) {
          const closed: boolean = adjacency.get(start)!.length === 2;
          // A chain returning to a junction still has two junction terminals.
          // Keep its closing edge without publishing it as an independent loop.
          return {
            closed,
            ...provenance(traversed),
            ...ordered(traversed),
            pts: (closed ? keys : [...keys, start]).map(
              (id: string): IAutoMovieMeshPlaneIntersection =>
                points.get(id)!,
            ),
          };
        }
        keys.push(current);
        const neighbors: typeof adjacency extends Map<string, infer T>
          ? T
          : never = adjacency.get(current)!;
        if (neighbors.length !== 2) break;
        step = neighbors.find(
          (candidate: (typeof neighbors)[number]): boolean =>
            !visited.has(candidate.edge),
        );
      }
      return {
        closed: false,
        ...provenance(traversed),
        ...ordered(traversed),
        pts: keys.map(
          (id: string): IAutoMovieMeshPlaneIntersection => points.get(id)!,
        ),
      };
    };
    for (const [start, neighbors] of adjacency)
      if (neighbors.length !== 2)
        for (const first of neighbors)
          if (!visited.has(first.edge)) output.push(walk(start, first));
    for (const [start, neighbors] of adjacency)
      for (const first of neighbors)
        if (!visited.has(first.edge)) output.push(walk(start, first));
    for (const id of contacts)
      if (!adjacency.has(id) && !coplanarVertices.has(id))
        output.push({
          closed: false,
          pts: [points.get(id)!],
          ...provenance([], id),
          ...ordered([]),
        });
    return output;
  };
}
