import type { AutoMovieHumanBodySurface as Surface } from "./AutoMovieHumanBodySurface";
import type { AutoMovieHumanThoracicCourse as Source } from "./AutoMovieHumanThoracicCourse";
import { AutoMovieHumanSkinDirectedPath as Directed } from "./AutoMovieHumanSkinDirectedPath";

/** Unfold an actual connected triangle corridor and remove mesh-edge stair steps inside it. */
export namespace AutoMovieHumanSkinCorridor {
  /** Actual physical path, with a containing original triangle for each segment. */
  export interface IReading {
    /** Physical points on original triangles, mm. */
    points: Source.Point[];
    /** Original face offsets for consecutive point pairs. */
    triangles: number[];
    /** Material station interpolated from each actual portal edge. */
    stations: number[];
    /** Actual crossed edge and interpolation weight; endpoints instead name their containing triangle. */
    bindings: ({ edge: [number, number]; unit: number } | { triangle: number })[];
    /** Physical arclength of this unfolded-corridor shortest path, not a global geodesic certificate. */
    length: number;
    /** Refused alternative corridors, retained even when the current valid physical path remains admitted. */
    alternatives?: { triangles: number[]; reason: string; witness: unknown }[];
    /** Actual additional work for a material-constrained corridor, absent for an unchanged directed funnel path. */
    directedWork?: { sweeps: number; scalarEvaluations: number; segmentEvaluations: number; termination: string };
    /** Aggregate actual work across every evaluated local alternative, including alternatives not selected. */
    shorteningWork?: { corridorEvaluations: number; directedCalls: number; sweeps: number; scalarEvaluations: number; segmentEvaluations: number; refusedAlternatives: number; certificates: number; certificateSegments: number; certifiedPruned: number; globalRelaxations: number; splicedIntervals: number; maxLocalPortals: number; cacheHits: number; erasedFaceVisits: number };
  }

  /** A two-dimensional isometric coordinate. */
  type Point = [number, number];

  /** One actual shared edge, oriented left/right along corridor travel. */
  interface IPortal { left: Point; right: Point; vertices: [number, number] }

  /** A funnel corner and the portal it touches. */
  interface ICorner { point: Point; portal: number }

  /** Original vertex -> radial neighbor -> original incident face offsets; owned by one physical-course operation. */
  export type Connectivity = ReadonlyMap<number, ReadonlyMap<number, readonly number[]>>;

  /** Prepare actual indexed face incidence once for seed routing and every local corridor refinement. */
  export function prepare(skin: Surface.IGeometry, selectedFaces: readonly number[]): Connectivity {
    const incidence: Map<number, Map<number, number[]>> = new Map();
    for (const face of selectedFaces) {
      const ids: number[] = skin.mesh.indices.slice(face, face + 3);
      for (const vertex of ids) {
        const star: Map<number, number[]> = incidence.get(vertex) ?? new Map();
        for (const other of ids.filter((value: number): boolean => value !== vertex)) {
          const faces: number[] = star.get(other) ?? []; faces.push(face); star.set(other, faces);
        }
        incidence.set(vertex, star);
      }
    }
    return incidence;
  }

  /**
   * Expand vertex-only seed transitions through their actual incident face
   * fan, unfold adjacent triangles isometrically, and string-pull through the
   * ordered shared-edge portals. Every returned segment remains in its
   * original triangle. A different homotopy corridor may be shorter; neither
   * an edge graph nor this finite corridor certifies a global geodesic.
   */
  export function read(skin: Surface.IGeometry, seedVertices: readonly number[], seedFaces: readonly number[], from: Source.Point, to: Source.Point, coordinates: readonly number[], selectedFaces: readonly number[], incidence: Connectivity = prepare(skin, selectedFaces)): IReading {
    const ids: (face: number) => number[] = (face: number): number[] => skin.mesh.indices.slice(face, face + 3);
    const corridor: number[] = [seedFaces[0]!];
    for (let index: number = 1; index < seedFaces.length; index++) {
      const next: number = seedFaces[index]!;
      const last: number = corridor.at(-1)!;
      if (next === last) continue;
      const vertex: number = seedVertices[index]!;
      const star: ReadonlyMap<number, readonly number[]> = incidence.get(vertex)!;
      const routes: number[][] = [];

      /** A manifold vertex star has at most two simple edge-connected routes. */
      const visit: (route: number[]) => void = (route: number[]): void => {
        const current: number = route.at(-1)!;
        if (current === next) { routes.push(route); return; }
        const neighbors: Set<number> = new Set();
        for (const other of ids(current).filter((value: number): boolean => value !== vertex))
          for (const face of star.get(other) ?? [])
            if (face !== current) neighbors.add(face);
        if (neighbors.size > 2) throw new Error("A physical course vertex star has nonmanifold face incidence", { cause: { vertex, triangle: current, adjacent: [...neighbors] } });
        for (const face of neighbors) if (!route.includes(face)) visit([...route, face]);
      };
      visit([last]);
      if (routes.length === 0) throw new Error("A physical course seed jumps between disconnected face fans", { cause: { vertex, before: last, after: next, expected: "Actual edge adjacency through the shared mesh vertex" } });
      const incoming: Source.Point = seedVertices[index - 1]! * 3 < skin.mesh.positions.length ? world(skin, seedVertices[index - 1]!) : from;
      const outgoing: Source.Point = seedVertices[index + 1]! * 3 < skin.mesh.positions.length ? world(skin, seedVertices[index + 1]!) : to;

      // Fewest triangles is not the physical wedge: a coarse diagonal can
      // choose the long way around a vertex and force a planar path to bend.
      // Select the incident wedge by its intrinsic sum of triangle angles.
      routes.sort((a: number[], b: number[]): number => fanAngle(skin, a, vertex, incoming, outgoing) - fanAngle(skin, b, vertex, incoming, outgoing) || a.length - b.length);
      corridor.push(...routes[0]!.slice(1));
    }
    return within(skin, corridor, from, to, coordinates);
  }

  /** Unfold one actual edge-adjacent face corridor; route selection and local shortening have separate owners. */
  export function within(skin: Surface.IGeometry, corridor: readonly number[], from: Source.Point, to: Source.Point, coordinates: readonly number[], directed: boolean = true): IReading {
    const ids: (face: number) => number[] = (face: number): number[] => skin.mesh.indices.slice(face, face + 3);
    const first: number[] = ids(corridor[0]!);
    const p0: Source.Point = world(skin, first[0]!);
    const p1: Source.Point = world(skin, first[1]!);
    const p2: Source.Point = world(skin, first[2]!);
    const length: number = norm(subtract(p1, p0));
    const x: number = dot(subtract(p2, p0), subtract(p1, p0)) / length;
    const heightSquared: number = dot(subtract(p2, p0), subtract(p2, p0)) - x * x;
    if (!(length > 0) || !(heightSquared > 0)) throw new Error("A physical course corridor has an unresolved initial triangle", { cause: { triangle: corridor[0], points: [p0, p1, p2], heightSquared, units: "mm^2" } });
    let chart: Map<number, Point> = new Map([[first[0]!, [0, 0]], [first[1]!, [length, 0]], [first[2]!, [x, Math.sqrt(heightSquared)]]]);
    const start: Point = flatten(from, [p0, p1, p2], first.map((vertex: number): Point => chart.get(vertex)!));
    const portals: IPortal[] = [{ left: start, right: start, vertices: [-1, -1] }];
    for (let index: number = 1; index < corridor.length; index++) {
      const previous: number[] = ids(corridor[index - 1]!);
      const current: number[] = ids(corridor[index]!);
      const shared: number[] = previous.filter((vertex: number): boolean => current.includes(vertex));
      if (shared.length !== 2) throw new Error("A physical course corridor lacks one actual shared edge", { cause: { before: corridor[index - 1], after: corridor[index], shared } });
      const a: Point = chart.get(shared[0]!)!;
      const b: Point = chart.get(shared[1]!)!;
      const previousThird: Point = chart.get(previous.find((vertex: number): boolean => !shared.includes(vertex))!)!;
      const third: number = current.find((vertex: number): boolean => !shared.includes(vertex))!;
      const edge: number = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const radiusA: number = norm(subtract(world(skin, third), world(skin, shared[0]!)));
      const radiusB: number = norm(subtract(world(skin, third), world(skin, shared[1]!)));
      const along: number = (radiusA * radiusA - radiusB * radiusB + edge * edge) / (2 * edge);
      const perpendicularSquared: number = radiusA * radiusA - along * along;
      if (!(edge > 0) || !(perpendicularSquared > 0)) throw new Error("A physical course corridor cannot unfold a selected triangle", { cause: { triangle: corridor[index], shared, third, edge, perpendicularSquared, units: "mm and mm^2" } });
      const side: number = Math.sign(cross(a, b, previousThird));
      if (side === 0) throw new Error("A physical course corridor lost its previous face orientation");
      const height: number = -side * Math.sqrt(perpendicularSquared);
      const dx: number = (b[0] - a[0]) / edge;
      const dy: number = (b[1] - a[1]) / edge;
      const placed: Point = [a[0] + along * dx - height * dy, a[1] + along * dy + height * dx];
      portals.push(side > 0 ? { left: b, right: a, vertices: [shared[1]!, shared[0]!] } : { left: a, right: b, vertices: [shared[0]!, shared[1]!] });
      chart = new Map([[shared[0]!, a], [shared[1]!, b], [third, placed]]);
    }
    const last: number[] = ids(corridor.at(-1)!);
    const finish: Point = flatten(to, last.map((vertex: number): Source.Point => world(skin, vertex)), last.map((vertex: number): Point => chart.get(vertex)!));
    portals.push({ left: finish, right: finish, vertices: [-1, -1] });
    const corners: ICorner[] = funnel(portals);
    const points: Source.Point[] = [from];
    const triangles: number[] = [];
    const stations: number[] = [material(from, skin, coordinates, corridor[0]!)];
    const bindings: IReading["bindings"] = [{ triangle: corridor[0]! }];
    for (let index: number = 1; index < corners.length; index++) {
      const a: ICorner = corners[index - 1]!;
      const b: ICorner = corners[index]!;
      let progress: number = 0;
      for (let portalIndex: number = a.portal + 1; portalIndex <= b.portal; portalIndex++) {
        const portal: IPortal = portals[portalIndex]!;
        if (portalIndex === portals.length - 1) {
          points.push(to); stations.push(material(to, skin, coordinates, corridor.at(-1)!)); bindings.push({ triangle: corridor.at(-1)! });
        } else {
          const intersection: { line: number; edge: number } = intersect(a.point, b.point, portal.left, portal.right, progress);
          progress = intersection.line;
          const firstPoint: Source.Point = world(skin, portal.vertices[0]);
          const secondPoint: Source.Point = world(skin, portal.vertices[1]);
          points.push(firstPoint.map((value: number, axis: number): number => value + intersection.edge * (secondPoint[axis]! - value)) as Source.Point);
          stations.push(coordinates[3 * portal.vertices[0] + 1]! + intersection.edge * (coordinates[3 * portal.vertices[1] + 1]! - coordinates[3 * portal.vertices[0] + 1]!));
          bindings.push({ edge: portal.vertices, unit: intersection.edge });
        }
        triangles.push(corridor[portalIndex - 1]!);
      }
    }
    const physicalLength: number = points.reduce((sum: number, p: Source.Point, index: number): number => index === 0 ? sum : sum + norm(subtract(p, points[index - 1]!)), 0);
    if (triangles.length !== points.length - 1 || ![physicalLength, ...stations, ...points.flat()].every(Number.isFinite)) throw new Error("A physical course corridor omitted a finite physical segment");
    const reading: IReading = { points, triangles, stations, bindings, length: physicalLength };
    return directed ? Directed.read(skin, reading, coordinates) : reading;
  }

  /** Intrinsic angular wedge between the two actual seed rays through an incident face route. */
  function fanAngle(skin: Surface.IGeometry, faces: readonly number[], vertex: number, incoming: Source.Point, outgoing: Source.Point): number {
    const center: Source.Point = world(skin, vertex);
    let prior: Source.Point = subtract(incoming, center);
    let total: number = 0;
    for (let index: number = 0; index < faces.length; index++) {
      let after: Source.Point;
      if (index === faces.length - 1) after = subtract(outgoing, center);
      else {
        const current: number[] = skin.mesh.indices.slice(faces[index]!, faces[index]! + 3);
        const next: number[] = skin.mesh.indices.slice(faces[index + 1]!, faces[index + 1]! + 3);
        const edge: number[] = current.filter((item: number): boolean => item !== vertex && next.includes(item));
        if (edge.length !== 1) throw new Error("A physical vertex wedge omitted its actual shared radial edge", { cause: { vertex, before: faces[index], after: faces[index + 1], edge } });
        after = subtract(world(skin, edge[0]!), center);
      }
      const product: number = norm(prior) * norm(after);

      // A virtual endpoint may coincide with this exact original vertex;
      // its zero-length incident segment imposes no angular preference.
      if (product > 0) total += Math.acos(Math.max(-1, Math.min(1, dot(prior, after) / product)));
      prior = after;
    }
    if (!Number.isFinite(total)) throw new Error("A physical vertex wedge has unavailable intrinsic angles", { cause: { vertex, faces, incoming, outgoing, observed: total, units: "rad" } });
    return total;
  }

  /** Shortest polyline through the ordered portals of the unfolded corridor. */
  function funnel(portals: readonly IPortal[]): ICorner[] {
    let apex: Point = portals[0]!.left;
    let left: Point = apex;
    let right: Point = apex;
    let apexIndex: number = 0;
    let leftIndex: number = 0;
    let rightIndex: number = 0;
    const result: ICorner[] = [{ point: apex, portal: 0 }];
    for (let index: number = 1; index < portals.length; index++) {
      const next: IPortal = portals[index]!;
      if (-cross(apex, right, next.right) <= 0) {
        if (equal(apex, right) || -cross(apex, left, next.right) > 0) { right = next.right; rightIndex = index; }
        else { result.push({ point: left, portal: leftIndex }); apex = left; apexIndex = leftIndex; left = apex; right = apex; leftIndex = apexIndex; rightIndex = apexIndex; index = apexIndex; continue; }
      }
      if (-cross(apex, left, next.left) >= 0) {
        if (equal(apex, left) || -cross(apex, right, next.left) < 0) { left = next.left; leftIndex = index; }
        else { result.push({ point: right, portal: rightIndex }); apex = right; apexIndex = rightIndex; left = apex; right = apex; leftIndex = apexIndex; rightIndex = apexIndex; index = apexIndex; }
      }
    }
    if (result.at(-1)!.portal !== portals.length - 1) result.push({ point: portals.at(-1)!.left, portal: portals.length - 1 });
    return result;
  }

  /** Barycentric isometry from an actual triangle to its unfolded chart. */
  function flatten(point: Source.Point, triangle: readonly Source.Point[], chart: readonly Point[]): Point {
    const weights: [number, number, number] = barycentric(point, triangle);
    return [0, 1].map((axis: number): number => weights.reduce((sum: number, weight: number, index: number): number => sum + weight * chart[index]![axis]!, 0)) as Point;
  }

  /** Material address of an endpoint, independently of physical Y. */
  function material(point: Source.Point, skin: Surface.IGeometry, coordinates: readonly number[], face: number): number {
    const ids: number[] = skin.mesh.indices.slice(face, face + 3);
    const weights: [number, number, number] = barycentric(point, ids.map((vertex: number): Source.Point => world(skin, vertex)));
    return weights.reduce((sum: number, weight: number, index: number): number => sum + weight * coordinates[3 * ids[index]! + 1]!, 0);
  }

  /** Coordinates in a nondegenerate physical triangle. */
  function barycentric(point: Source.Point, triangle: readonly Source.Point[]): [number, number, number] {
    const a: Source.Point = subtract(triangle[1]!, triangle[0]!);
    const b: Source.Point = subtract(triangle[2]!, triangle[0]!);
    const p: Source.Point = subtract(point, triangle[0]!);
    const aa: number = dot(a, a); const ab: number = dot(a, b); const bb: number = dot(b, b);
    const ap: number = dot(a, p); const bp: number = dot(b, p);
    const determinant: number = aa * bb - ab * ab;
    if (!(determinant > 0)) throw new Error("A physical course triangle has unresolved barycentric coordinates");
    const u: number = (ap * bb - bp * ab) / determinant;
    const v: number = (bp * aa - ap * ab) / determinant;
    return [1 - u - v, u, v];
  }

  /** Ordered segment/portal crossing; arithmetic allowance never welds distinct mesh sheets. */
  function intersect(a: Point, b: Point, left: Point, right: Point, previous: number): { line: number; edge: number } {
    // A funnel corner is an existing portal endpoint. Preserve that exact
    // incidence instead of solving an ill-conditioned intersection again.
    if (equal(b, left)) return { line: 1, edge: 0 };
    if (equal(b, right)) return { line: 1, edge: 1 };
    if (equal(a, left) && previous === 0) return { line: 0, edge: 0 };
    if (equal(a, right) && previous === 0) return { line: 0, edge: 1 };
    const dx: number = b[0] - a[0]; const dy: number = b[1] - a[1];
    const ex: number = right[0] - left[0]; const ey: number = right[1] - left[1];
    const determinant: number = dx * ey - dy * ex;
    let line: number;
    let edge: number;
    if (determinant !== 0) {
      line = ((left[0] - a[0]) * ey - (left[1] - a[1]) * ex) / determinant;
      edge = ((left[0] - a[0]) * dy - (left[1] - a[1]) * dx) / determinant;
    } else {
      const squared: number = dx * dx + dy * dy;
      if (squared === 0) {
        const edgeSquared: number = ex * ex + ey * ey;
        line = previous; edge = edgeSquared === 0 ? 0 : ((a[0] - left[0]) * ex + (a[1] - left[1]) * ey) / edgeSquared;
      } else {
        const l: number = ((left[0] - a[0]) * dx + (left[1] - a[1]) * dy) / squared;
        const r: number = ((right[0] - a[0]) * dx + (right[1] - a[1]) * dy) / squared;
        line = Math.max(previous, Math.min(l, r)); edge = r === l ? 0 : (line - l) / (r - l);
      }
    }
    const arithmetic: number = 256 * Number.EPSILON * Math.max(1, Math.abs(line), Math.abs(edge));
    const error: number = Math.hypot(a[0] + line * dx - left[0] - edge * ex, a[1] + line * dy - left[1] - edge * ey);
    const coordinateBound: number = 256 * Number.EPSILON * Math.max(1, ...a.map(Math.abs), ...b.map(Math.abs), ...left.map(Math.abs), ...right.map(Math.abs));
    if (![line, edge, error].every(Number.isFinite) || line < previous - arithmetic || line < -arithmetic || line > 1 + arithmetic || edge < -arithmetic || edge > 1 + arithmetic || error > coordinateBound) throw new Error("An unfolded physical course does not cross its actual ordered portal", { cause: { a, b, left, right, previous, line, edge, error, coordinateBound, units: "mm and normalized edge fraction" } });
    return { line, edge };
  }

  /** Original mesh position in calibration millimetres. */
  function world(skin: Surface.IGeometry, vertex: number): Source.Point { return skin.mesh.positions.slice(vertex * 3, vertex * 3 + 3) as Source.Point; }
  /** World displacement. */
  function subtract(a: Source.Point, b: Source.Point): Source.Point { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  /** Euclidean norm. */
  function norm(value: Source.Point): number { return Math.hypot(...value); }
  /** Scalar product in calibration space. */
  function dot(a: Source.Point, b: Source.Point): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  /** Signed two-dimensional oriented area, doubled. */
  function cross(a: Point, b: Point, c: Point): number { return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); }
  /** Exact repeated chart point identity; no coordinate welding. */
  function equal(a: Point, b: Point): boolean { return a[0] === b[0] && a[1] === b[1]; }
}
