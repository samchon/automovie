import { AutoMovieHumanNasalConstruction as N } from "./AutoMovieHumanNasalConstruction";

/** Ordered physical mesh sections; no angular sort or outer-envelope loss. */
export namespace AutoMovieHumanSurfaceSections {

  /** An oriented world-space cutting plane; normal length sets signed-distance scale. */
  export interface Plane {
 
    /** The physical world-space origin of this frame or ray. */
    origin: N.Point;
 
    /** The source surface normal or cutting-plane normal in world coordinates. */
    normal: N.Point; 
  }

  /** One connected plane intersection, retaining its physical boundary ownership. */
  export interface Path {

    /** Ordered physical surface vertices; paths retain their actual world heights. */
    points: N.Point[];

    /** Whether the connected section returns to its first point without boundary endpoints. */
    closed: boolean;

    /** Actual mesh-boundary label at the first endpoint; absent for closed paths. */
    startBoundary?: string;

    /** Actual mesh-boundary label at the last endpoint; absent for closed paths. */
    endBoundary?: string;
  }

  /** Every intersection component and the ambiguities encountered while connecting it. */
  export interface Result {
 
    /** Every connected component of the emitted mesh's plane intersection. */
    paths: Path[];
 
    /** Number of intersection graph vertices with more than two neighbours. */
    branching: number;
 
    /** Triangles lying in the cutting plane, reported as unresolved section ambiguity. */
    coplanarTriangles: number; 
  }

  /** Construct the actual tilted head plane y = station + x*tan(tilt), with tilt in radians. */
  export function headPlane(station: number, tilt: number): Plane {
    return { origin: [0, station, 0], normal: [-Math.sin(tilt), Math.cos(tilt), 0] };
  }

  /** Boundaries are labels of actual mesh edges, not search windows. */
  export function cut(mesh: N.Mesh, plane: Plane, boundary: (a: number, b: number) => string | undefined): Result {
    const nodes = new Map<string, {
 
    /** The physical world-space point at this boundary or intersection. */
    point: N.Point;
 
    /** Mesh-edge-connected intersection vertices, preserving every section branch. */
    neighbours: Set<string>;
 
    /** The label of the actual mesh boundary crossed at this vertex. */
    boundary?: string }>();
    let coplanarTriangles: number = 0;
    const epsilon: number = 1e-10;
    const distances: number[] = mesh.points.map((p): number => N.dot(N.sub(p, plane.origin), plane.normal));
    const node = (a: number, b: number): string => {
      const da: number = distances[a]!; const db: number = distances[b]!;
      const key: string = Math.abs(da) <= epsilon ? `v${a}` : Math.abs(db) <= epsilon ? `v${b}` : a < b ? `e${a}:${b}` : `e${b}:${a}`;
      const tag: string | undefined = boundary(a, b);
      if (!nodes.has(key)) {
        const t: number = Math.abs(da) <= epsilon ? 0 : Math.abs(db) <= epsilon ? 1 : da / (da - db);
        nodes.set(key, { point: N.add(mesh.points[a]!, N.scale(N.sub(mesh.points[b]!, mesh.points[a]!), t)), neighbours: new Set(), boundary: tag });
      } else if (tag !== undefined) nodes.get(key)!.boundary = tag;
      return key;
    };
    for (const face of mesh.triangles) {
      if (face.every((v): boolean => Math.abs(distances[v]!) <= epsilon)) { coplanarTriangles++; continue; }
      const intersections: string[] = [];
      for (let i: number = 0; i < 3; i++) {
        const a: number = face[i]!; const b: number = face[(i + 1) % 3]!;
        const da: number = distances[a]!; const db: number = distances[b]!;
        if (Math.abs(da) <= epsilon || Math.abs(db) <= epsilon || da * db < 0) intersections.push(node(a, b));
      }
      const unique: string[] = [...new Set(intersections)];
      if (unique.length === 2) {
        nodes.get(unique[0]!)!.neighbours.add(unique[1]!);
        nodes.get(unique[1]!)!.neighbours.add(unique[0]!);
      }
    }
    const visited = new Set<string>();
    const paths: Path[] = [];
    const branching: number = [...nodes.values()].filter((p): boolean => p.neighbours.size > 2).length;
    // Open paths first so their physical boundary endpoints remain endpoints.
    const seeds: string[] = [...nodes.keys()].sort((a, b): number => nodes.get(a)!.neighbours.size - nodes.get(b)!.neighbours.size);
    for (const seed of seeds) {
      if (visited.has(seed) || nodes.get(seed)!.neighbours.size === 0) continue;
      const keys: string[] = [];
      let current: string | undefined = seed;
      while (current !== undefined && !visited.has(current)) {
        keys.push(current); visited.add(current);
        current = [...nodes.get(current)!.neighbours].find((key): boolean => !visited.has(key));
      }
      const end: string = keys[keys.length - 1]!;
      const closed: boolean = keys.length > 2 && nodes.get(end)!.neighbours.has(seed);
      paths.push({ points: keys.map((key): N.Point => nodes.get(key)!.point), closed,
        startBoundary: closed ? undefined : nodes.get(seed)!.boundary,
        endBoundary: closed ? undefined : nodes.get(end)!.boundary });
    }
    return { paths, branching, coplanarTriangles };
  }

  /** Splice at actual supplied root vertices, preserving the full ordered path. */
  export function splice(base: readonly N.Point[], start: number, end: number, path: Path): {
 
    /** Ordered physical surface vertices; paths retain their actual world heights. */
    points: N.Point[];
 
    /** Actual distances between the supplied face roots and physical path endpoints. */
    seamGaps: [number, number] } {
    if (path.closed || start < 0 || end <= start || end >= base.length || path.points.length < 2)
      throw new Error("An open physical path and two ordered face roots are required.");
    const a: N.Point = base[start]!; const b: N.Point = base[end]!;
    const forward: number = Math.hypot(...N.sub(a, path.points[0]!)) + Math.hypot(...N.sub(b, path.points[path.points.length - 1]!));
    const reverse: number = Math.hypot(...N.sub(a, path.points[path.points.length - 1]!)) + Math.hypot(...N.sub(b, path.points[0]!));
    const points: N.Point[] = forward <= reverse ? [...path.points] : [...path.points].reverse();
    return { points: [...base.slice(0, start), ...points, ...base.slice(end + 1)],
      seamGaps: [Math.hypot(...N.sub(a, points[0]!)), Math.hypot(...N.sub(b, points[points.length - 1]!))] };
  }
}
