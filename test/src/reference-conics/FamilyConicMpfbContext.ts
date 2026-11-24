import { AutoMovieSolidVector as V } from "@automovie/engine";
import type {
  IAutoMovieMillimeterMesh,
  AutoMovieVector3Tuple as Point,
} from "@automovie/interface";

type Edge = [number, number];

/** Clip the evaluated public context to the independent analytic parent outlet. */
export namespace FamilyConicMpfbContext {
  /** Indexed local proof with explicit public context ownership. */
  export interface IAttachment {
    /** Analytic shoulder/arm followed by the retained evaluated public context. */
    mesh: { positions: number[]; indices: number[] };
    /** Index ranges in the emitted mesh. */
    owners: { analyticTriangles: number; publicTriangles: number };
    /**
     * Matching rim edge count, after both boundary meshes receive the same
     * subdivision.
     */
    sewnEdges: number;
    /**
     * Greatest physical movement of a clipped public rim vertex to the analytic
     * mesh edge, mm.
     */
    maximumSnap: number;
  }

  /**
   * Keep the inside of the sampled outlet on the Catmull–Clark source. Both
   * adjacent meshes are split along one union of their boundary vertices. The
   * independent analytic outlet supplies all common points.
   */
  export function attach(
    analytic: IAutoMovieMillimeterMesh,
    ring: readonly number[],
    publicSkin: IAutoMovieMillimeterMesh,
    origin: Point,
    normal: Point,
    elbow: Point,
  ): IAttachment {
    const rail: Point[] = ring.map((i): Point => point(analytic.positions, i));
    const address = prepareAddress(rail, origin, normal);
    const cut = clip(publicSkin, elbow, (p): number =>
      V.dot(V.sub(p, address(p).point), normal),
    );
    const raw = walk(cut.rim);
    let maximumSnap: number = 0;
    const positions: number[] = Array.from(analytic.positions);
    const subjects = raw.map((index) => {
      const p: Point = point(cut.positions, index);
      const at = address(p);
      maximumSnap = Math.max(maximumSnap, V.norm(V.sub(p, at.point)));
      const into: number = positions.length / 3;
      positions.push(...at.point);
      return {
        clock: at.segment + at.share,
        segment: at.segment,
        share: at.share,
        index,
        into,
      };
    });
    const sorted = [...subjects].sort((a, b): number => a.clock - b.clock);
    if (
      sorted.some(
        (row, i): boolean =>
          !(row.share > 0 && row.share < 1) ||
          (i > 0 && row.clock <= sorted[i - 1]!.clock),
      )
    )
      throw new Error(
        "The exact public trim has duplicate angles or a vertex on the analytic grid",
      );
    const rank: Map<number, number> = new Map(
      sorted.map((row, i): [number, number] => [row.index, i]),
    );
    const advance: number =
      (rank.get(raw[1]!)! + sorted.length - rank.get(raw[0]!)!) % sorted.length;
    if (
      (advance !== 1 && advance !== sorted.length - 1) ||
      raw.some(
        (id, i): boolean =>
          (rank.get(raw[(i + 1) % raw.length]!)! +
            sorted.length -
            rank.get(id)!) %
            sorted.length !==
          advance,
      )
    )
      throw new Error("The public outer rail is not a single angular walk");

    const left: number[][] = ring.map((): number[] => []);
    for (const row of sorted) left[row.segment]!.push(row.into);
    const analyticEdges: Map<string, number[]> = new Map(
      ring.map((a, i): [string, number[]] => [
        stamp(a, ring[(i + 1) % ring.length]!),
        left[i]!,
      ]),
    );
    const first = splitTriangles(Array.from(analytic.indices), analyticEdges);

    // Both rim owners have the same cyclic order. Insert only the opposing owner's original vertices.
    const sourceEdges: Map<string, number[]> = new Map();
    for (let i: number = 0; i < sorted.length; ++i) {
      const a = sorted[i]!,
        b = sorted[(i + 1) % sorted.length]!;
      const end: number = b.clock + (i + 1 === sorted.length ? ring.length : 0);
      const entries: number[] = [];
      for (let j: number = Math.ceil(a.clock); j < end; ++j)
        entries.push(ring[j % ring.length]!);
      sourceEdges.set(stamp(a.into, b.into), entries);
    }
    const published: Int32Array = new Int32Array(cut.positions.length / 3).fill(
      -1,
    );
    for (const row of sorted) published[row.index] = row.into;
    const context = cut.indices.map((index): number => {
      if (published[index]! >= 0) return published[index]!;
      const into: number = positions.length / 3;
      positions.push(...point(cut.positions, index));
      published[index] = into;
      return into;
    });
    const second = splitTriangles(context, sourceEdges);
    const sewnEdges: number = ring.length + raw.length;
    return {
      mesh: { positions, indices: [...first, ...second] },
      owners: {
        analyticTriangles: first.length / 3,
        publicTriangles: second.length / 3,
      },
      sewnEdges,
      maximumSnap,
    };
  }
}

function point(positions: ArrayLike<number>, i: number): Point {
  return [positions[i * 3]!, positions[i * 3 + 1]!, positions[i * 3 + 2]!];
}

function stamp(a: number, b: number): string {
  return `${a}:${b}`;
}

/** Read the supporting polygon on the same divider ray as the query. */
function prepareAddress(rail: readonly Point[], origin: Point, normal: Point) {
  const delta: Point = V.sub(rail[0]!, origin);
  const u: Point | null = V.unit(
    V.sub(delta, V.scale(normal, V.dot(delta, normal))),
  );
  if (u === null) throw new Error("The outer rail meets its meridian axis");
  const v: Point = V.cross(normal, u);
  const turn = (p: Point, across: Point): number => {
    const q: Point = V.sub(p, origin);
    return Math.atan2(V.dot(q, across), V.dot(q, u));
  };
  const first: number = turn(rail[1]!, v);
  const across: Point = first > 0 ? v : V.scale(v, -1);
  const end: number = 2 * Math.PI;
  const wrap = (angle: number): number => (angle < 0 ? angle + end : angle);
  const knots: number[] = [
    0,
    ...rail.slice(1).map((p): number => wrap(turn(p, across))),
    end,
  ];
  if (knots.some((angle, i): boolean => i > 0 && !(angle > knots[i - 1]!)))
    throw new Error("The analytic outer rail reverses around the divider");
  return (p: Point): { segment: number; share: number; point: Point } => {
    const theta: number = wrap(turn(p, across));
    let from: number = 0,
      to: number = rail.length;
    while (to - from > 1) {
      const middle: number = (to + from) >>> 1;
      if (theta < knots[middle]!) to = middle;
      else from = middle;
    }
    const radial: Point = V.combine([
      [Math.cos(theta), u],
      [Math.sin(theta), across],
    ]);
    const tangent: Point = V.cross(normal, radial);
    const a: Point = rail[from]!,
      b: Point = rail[(from + 1) % rail.length]!;
    const step: Point = V.sub(b, a);
    const share: number =
      V.dot(V.sub(origin, a), tangent) / V.dot(step, tangent);
    return { segment: from, share, point: V.add(a, V.scale(step, share)) };
  };
}

/** Prepare an indexed polygonal trim by intersecting each cut edge once. */
function clip(
  mesh: IAutoMovieMillimeterMesh,
  elbow: Point,
  side: (p: Point) => number,
) {
  const positions: number[] = Array.from(mesh.positions);
  const faces: number[] = [];
  const rim: Edge[] = [];
  const values: number[] = Array.from(
    { length: positions.length / 3 },
    (_, i): number => side(point(positions, i)),
  );
  ownArm(mesh, values, elbow);
  const crossings: Map<string, number> = new Map();
  const crossing = (a: number, b: number): number => {
    const key: string = stamp(Math.min(a, b), Math.max(a, b));
    const existing: number | undefined = crossings.get(key);
    if (existing !== undefined) return existing;
    const sign: boolean = values[a]! > 0;
    let lo: Point = point(positions, a),
      hi: Point = point(positions, b);
    // One micrometre is below the mesh-contact admission distance.
    while (V.norm(V.sub(hi, lo)) > 0.001) {
      const middle: Point = V.scale(V.add(lo, hi), 1 / 2);
      if (side(middle) > 0 === sign) lo = middle;
      else hi = middle;
    }
    const index: number = positions.length / 3;
    positions.push(...V.scale(V.add(lo, hi), 1 / 2));
    crossings.set(key, index);
    return index;
  };
  for (let i: number = 0; i < mesh.indices.length; i += 3) {
    const a: number = mesh.indices[i]!,
      b: number = mesh.indices[i + 1]!,
      c: number = mesh.indices[i + 2]!;
    const inside: [boolean, boolean, boolean] = [
      values[a]! <= 0,
      values[b]! <= 0,
      values[c]! <= 0,
    ];
    if (inside.every(Boolean)) {
      faces.push(a, b, c);
      continue;
    }
    if (!inside.some(Boolean)) continue;
    const triangle: number[] = [a, b, c];
    const polygon: number[] = [];
    for (let j: number = 0; j < 3; ++j) {
      const next: number = (j + 1) % 3;
      if (inside[j]) polygon.push(triangle[j]!);
      if (inside[j] !== inside[next])
        polygon.push(crossing(triangle[j]!, triangle[next]!));
    }
    for (let j: number = 0; j < polygon.length; ++j) {
      const a: number = polygon[j]!,
        b: number = polygon[(j + 1) % polygon.length]!;
      if (a >= values.length && b >= values.length) rim.push([a, b]);
    }
    for (let j: number = 1; j < polygon.length - 1; ++j)
      faces.push(polygon[0]!, polygon[j]!, polygon[j + 1]!);
  }
  return { positions, indices: faces, rim };
}

/** Keep unrelated limbs even when they lie beyond the same mathematical divider. */
function ownArm(
  mesh: IAutoMovieMillimeterMesh,
  values: number[],
  elbow: Point,
): void {
  const parents: Int32Array = Int32Array.from(
    { length: values.length },
    (_, i): number => i,
  );
  const find = (i: number): number => {
    while (parents[i] !== i) {
      parents[i] = parents[parents[i]!]!;
      i = parents[i]!;
    }
    return i;
  };
  for (let i: number = 0; i < mesh.indices.length; i += 3)
    for (let k: number = 0; k < 3; ++k) {
      const a: number = mesh.indices[i + k]!,
        b: number = mesh.indices[i + ((k + 1) % 3)]!;
      if (values[a]! > 0 && values[b]! > 0) parents[find(a)] = find(b);
    }
  let nearest: number = -1,
    distance: number = Infinity;
  values.forEach((value, i): void => {
    if (value <= 0) return;
    const delta: Point = V.sub(point(mesh.positions, i), elbow);
    const square: number = V.dot(delta, delta);
    if (square < distance) {
      nearest = i;
      distance = square;
    }
  });
  if (nearest < 0)
    throw new Error(
      "The physical trim does not reach the observed child marker",
    );
  const owned: number = find(nearest);
  values.forEach((value, i): void => {
    if (value > 0 && find(i) !== owned) values[i] = -value;
  });
}

function walk(edges: readonly Edge[]): number[] {
  const next: Map<number, number> = new Map(edges);
  if (
    edges.length === 0 ||
    next.size !== edges.length ||
    new Set(next.values()).size !== edges.length
  )
    throw new Error(
      "The evaluated source trim is not a disjoint set of rim cycles",
    );
  const first: number = edges[0]![0];
  const visited: number[] = [first];
  let current: number = next.get(first)!;
  while (
    current !== first &&
    current !== undefined &&
    visited.length < edges.length
  ) {
    visited.push(current);
    current = next.get(current)!;
  }
  if (current !== first || visited.length !== edges.length)
    throw new Error(
      `The evaluated source trim has ${edges.length - visited.length} edges outside the shoulder rim`,
    );
  return visited;
}

/** Insert each shared boundary subdivision into the owning indexed triangle. */
function splitTriangles(
  indices: readonly number[],
  edges: ReadonlyMap<string, readonly number[]>,
): number[] {
  const result: number[] = [];
  for (let i: number = 0; i < indices.length; i += 3) {
    const a: number = indices[i]!,
      b: number = indices[i + 1]!,
      c: number = indices[i + 2]!;
    const triangle: number[] = [a, b, c];
    let found: boolean = false;
    for (let j: number = 0; j < 3; ++j) {
      const first: number = triangle[j]!,
        last: number = triangle[(j + 1) % 3]!;
      const pivot: number = triangle[(j + 2) % 3]!;
      const forward = edges.get(stamp(first, last));
      const reverse =
        forward === undefined ? edges.get(stamp(last, first)) : undefined;
      if (forward === undefined && reverse === undefined) continue;
      const points: readonly number[] = forward ?? [...reverse!].reverse();
      const rim: number[] = [first, ...points, last];
      for (let k: number = 1; k < rim.length; ++k)
        result.push(rim[k - 1]!, rim[k]!, pivot);
      found = true;
      break;
    }
    if (!found) result.push(a, b, c);
  }
  return result;
}
