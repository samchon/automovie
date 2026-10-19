import type { IAutoMovieCurve64 as C } from "../../../../packages/engine/src/geometry/curve/IAutoMovieCurve64.ts";

/** Independent small-polygon enumeration and incidence algebra for contour tests. */
export namespace contourStripOracle {
  /** Mutable tuple accepted by the strip receiver. */
  export type V = [number, number, number];
  /** Oriented physical triangle retaining its input object identities. */
  export type Triangle = [V, V, V];

  /** Formula-only regular polygon in a common XZ chart. */
  export function polygon(
    count: number,
    y: number,
    radius: number = 1,
    phase: number = 0,
    centerX: number = 0,
  ): V[] {
    return Array.from({ length: count }, (_: unknown, i: number): V => {
      const angle: number = 2 * Math.PI * (i / count + phase);
      return [centerX + radius * Math.cos(angle), y, radius * Math.sin(angle)];
    });
  }

  /** Oriented doubled area, computed directly from coordinate differences. */
  export function normal([a, b, c]: Triangle): V {
    const x: number = b[0] - a[0],
      y: number = b[1] - a[1],
      z: number = b[2] - a[2];
    const u: number = c[0] - a[0],
      v: number = c[1] - a[1],
      w: number = c[2] - a[2];
    return [y * w - z * v, z * u - x * w, x * v - y * u];
  }

  /** Unsigned Euclidean area in squared input units. */
  export function area(triangles: readonly Triangle[]): number {
    return triangles.reduce(
      (sum: number, triangle: Triangle): number =>
        sum + Math.hypot(...normal(triangle)) / 2,
      0,
    );
  }

  /** Undirected identity edge with a stable integer spelling. */
  export function edge(a: number, b: number): string {
    return a < b ? `${a}:${b}` : `${b}:${a}`;
  }

  /** Check a triangulated sheet using boundary chains and connected vertex links, independently of the optimizer. */
  export function admits(
    a: readonly V[],
    b: readonly V[],
    triangles: readonly Triangle[],
  ): boolean {
    const vertices: V[] = [...new Set([...a, ...b])];
    const boundaries: Map<string, number[]> = new Map();
    for (const [ring, orientation] of [
      [a, 1],
      [b, -1],
    ] as const)
      for (let i: number = 0; i < ring.length; i++) {
        const u: number = vertices.indexOf(ring[i]),
          v: number = vertices.indexOf(ring[(i + 1) % ring.length]);
        const key: string = edge(u, v);
        if (u === v) return false;
        if (!boundaries.has(key)) boundaries.set(key, []);
        boundaries.get(key)!.push(orientation * (u < v ? 1 : -1));
      }
    const boundaryVertices: Set<number> = new Set();
    for (const [key, signs] of boundaries) {
      if (signs.length === 1)
        for (const id of key.split(":").map(Number)) boundaryVertices.add(id);
      else if (signs.length !== 2 || signs[0] + signs[1] !== 0) return false;
    }
    const faces: Set<string> = new Set();
    const edges: Map<string, number[]> = new Map();
    const links: Map<number, [number, number][]> = new Map();
    for (const triangle of triangles) {
      const ids: number[] = triangle.map((point: V): number =>
        vertices.indexOf(point),
      );
      if (
        ids.includes(-1) ||
        new Set(ids).size !== 3 ||
        !(Math.hypot(...normal(triangle)) > 0)
      )
        return false;
      const face: string = [...ids]
        .sort((x: number, y: number): number => x - y)
        .join(":");
      if (faces.has(face)) return false;
      faces.add(face);
      for (let k: number = 0; k < 3; k++) {
        const u: number = ids[k],
          v: number = ids[(k + 1) % 3],
          w: number = ids[(k + 2) % 3];
        const key: string = edge(u, v);
        if (!edges.has(key)) edges.set(key, []);
        edges.get(key)!.push(u < v ? 1 : -1);
        if (!links.has(u)) links.set(u, []);
        links.get(u)!.push([v, w]);
      }
    }
    for (const key of boundaries.keys()) if (!edges.has(key)) return false;
    for (const [key, signs] of edges) {
      const boundary: number[] | undefined = boundaries.get(key);
      if (boundary?.length === 1) {
        if (signs.length !== 1 || signs[0] !== boundary[0]) return false;
      } else if (signs.length !== 2 || signs[0] + signs[1] !== 0) return false;
    }
    for (const vertex of vertices.keys()) {
      const rows: [number, number][] | undefined = links.get(vertex);
      if (rows === undefined) return false;
      const neighbors: number[] = [...new Set(rows.flat())];
      const degrees: number[] = neighbors.map(
        (id: number): number =>
          rows.filter((pair: [number, number]): boolean => pair.includes(id))
            .length,
      );
      if (
        degrees.some(
          (degree: number): boolean => degree !== 1 && degree !== 2,
        ) ||
        degrees.filter((degree: number): boolean => degree === 1).length !==
          (boundaryVertices.has(vertex) ? 2 : 0)
      )
        return false;
      const reached: Set<number> = new Set([neighbors[0]]);
      let previous: number = -1;
      while (previous !== reached.size) {
        previous = reached.size;
        for (const [u, v] of rows)
          if (reached.has(u) || reached.has(v)) {
            reached.add(u);
            reached.add(v);
          }
      }
      if (reached.size !== neighbors.length) return false;
    }
    return true;
  }

  /** Reproduce the documented seam with a linear arclength integration oracle, without calling any production helper. */
  export function seam(rawA: V[], rawB: V[]): [V[], V[]] {
    const lengths: number[] = rawA.map((p: V, i: number): number =>
      Math.hypot(
        ...p.map(
          (x: number, k: number): number => rawA[(i + 1) % rawA.length][k] - x,
        ),
      ),
    );
    const perimeter: number = lengths.reduce(
      (sum: number, length: number): number => sum + length,
      0,
    );
    const center: V = [0, 0, 0];
    for (let sample: number = 0; sample < 64; sample++) {
      const target: number = (perimeter * sample) / 64;
      let start: number = 0,
        index: number = 0;
      while (index < rawA.length - 1 && start + lengths[index] <= target) {
        start += lengths[index];
        index++;
      }
      const t: number =
        lengths[index] === 0 ? 0 : (target - start) / lengths[index];
      for (let k: number = 0; k < 3; k++)
        center[k] +=
          rawA[index][k] +
          (rawA[(index + 1) % rawA.length][k] - rawA[index][k]) * t;
    }
    for (let k: number = 0; k < 3; k++) center[k] /= 64;
    /** Euclidean distance used only to select the declared seam. */
    const distance: (p: V, q: V) => number = (p: V, q: V): number =>
      Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
    let first: number = 0,
      second: number = 0;
    rawA.forEach((p: V, i: number): void => {
      if (distance(p, center) > distance(rawA[first], center)) first = i;
    });
    rawB.forEach((p: V, i: number): void => {
      if (distance(p, rawA[first]) < distance(rawB[second], rawA[first]))
        second = i;
    });
    return [
      [...rawA.slice(first), ...rawA.slice(0, first)],
      [...rawB.slice(second), ...rawB.slice(0, second)],
    ];
  }

  /** Enumerate every monotone elementary tiling; incidence filters the complete leaves rather than a copied recurrence. */
  export function minimum(
    rawA: V[],
    rawB: V[],
  ): { visited: number; admitted: number; area: number } {
    const [a, b]: [V[], V[]] = seam(rawA, rawB);
    let visited: number = 0,
      admitted: number = 0,
      best: number = Infinity;
    const triangles: Triangle[] = [];
    /** Visit complete paths without pruning or retaining a production DP state. */
    const visit: (i: number, j: number) => void = (
      i: number,
      j: number,
    ): void => {
      if (i === a.length && j === b.length) {
        visited++;
        if (admits(a, b, triangles)) {
          admitted++;
          best = Math.min(best, area(triangles));
        }
        return;
      }
      if (i < a.length) {
        triangles.push([a[i], a[(i + 1) % a.length], b[j % b.length]]);
        visit(i + 1, j);
        triangles.pop();
      }
      if (j < b.length) {
        triangles.push([a[i % a.length], b[(j + 1) % b.length], b[j]]);
        visit(i, j + 1);
        triangles.pop();
      }
    };
    visit(0, 0);
    return { visited, admitted, area: best };
  }

  /** A cubic with exactly the polygon trace and positive millimetre parameter widths; these widths do not claim arc length. */
  export function curve(
    name: string,
    points: readonly V[],
    widths?: readonly number[],
  ): C.Cubic {
    return {
      type: "cubicBezier",
      name,
      closed: true,
      unit: "mm",
      phaseUnit: "mm",
      phaseIntervals: widths ?? points.map((): number => 1),
      spans: points.map(
        (p: V, i: number): C.Span => [
          p,
          p,
          points[(i + 1) % points.length],
          points[(i + 1) % points.length],
        ],
      ),
    };
  }

  /** Explicit cubic Bernstein formula, independent of the engine's evaluator and subdivision. */
  export function evaluate(curve: C.Cubic, phase: number): V {
    let start: number = 0,
      index: number = 0;
    while (
      index < curve.spans.length - 1 &&
      start + curve.phaseIntervals[index] <= phase
    ) {
      start += curve.phaseIntervals[index];
      index++;
    }
    const t: number = (phase - start) / curve.phaseIntervals[index],
      u: number = 1 - t;
    const span: C.Span = curve.spans[index];
    return [0, 1, 2].map(
      (k: number): number =>
        u ** 3 * span[0][k] +
        3 * u * u * t * span[1][k] +
        3 * u * t * t * span[2][k] +
        t ** 3 * span[3][k],
    ) as V;
  }
}
