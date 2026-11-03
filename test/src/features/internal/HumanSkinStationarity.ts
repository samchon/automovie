import type { AutoMovieHumanBodySurface as Surface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import type { AutoMovieHumanSkinCourse as Course } from "../../../../packages/human/src/generation/AutoMovieHumanSkinCourse";

/** Independently reject a refined physical vertex corner that can shorten through an available actual face fan. */
export namespace HumanSkinStationarity {
  /** Read original triangle incidence and the cosine law, without importing any production route/unfolding code. */
  export function inspect(skin: Surface.IGeometry, course: Pick<Course.IReading, "bindings" | "triangles">, points: readonly Point[], bottom: number, top: number): object[] {
    const radial: Map<number, Map<number, number[]>> = new Map();
    for (let offset: number = 0; offset < skin.mesh.indices.length; offset += 3) {
      const ids: number[] = skin.mesh.indices.slice(offset, offset + 3);
      const stations: number[] = ids.map((vertex: number): number => skin.coordinates[3 * vertex + 1]!);
      if (stations.some((station: number): boolean => !Number.isFinite(station))) throw new Error("Independent stationarity has unavailable original material ownership", { cause: { triangle: offset, ids, stations, units: "mm" } });
      if (Math.max(...stations) < bottom || Math.min(...stations) > top) continue;
      const left: boolean = ids.some((vertex: number): boolean => {
        const phase: number = skin.coordinates[3 * vertex + 2]!;
        const canonical: number = ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        return Number.isFinite(phase) && canonical <= Math.PI;
      });
      if (!left) continue;
      for (const vertex of ids) {
        const star: Map<number, number[]> = radial.get(vertex) ?? new Map();
        for (const neighbor of ids.filter((item: number): boolean => item !== vertex)) {
          const faces: number[] = star.get(neighbor) ?? []; faces.push(offset); star.set(neighbor, faces);
        }
        radial.set(vertex, star);
      }
    }
    const failures: object[] = [];
    const handled: Set<number> = new Set();
    for (let index: number = 1; index < points.length - 1; index++) {
      const binding: Course.IReading["bindings"][number] = course.bindings[index]!;
      if (!("edge" in binding)) continue;
      for (const vertex of binding.edge) {
        if (handled.has(vertex)) continue;
        const center: Point = point(skin, vertex);
        const resolution: number = 512 * Number.EPSILON * Math.max(1, ...center.map(Math.abs), ...points[index]!.map(Math.abs));
        if (distance(points[index]!, center) > resolution) continue;
        handled.add(vertex);
        let first: number = index;
        let last: number = index;
        while (first > 0 && distance(points[first - 1]!, center) <= resolution) first--;
        while (last < points.length - 1 && distance(points[last + 1]!, center) <= resolution) last++;
        if (first === 0 || last === points.length - 1) continue;
        const start: number = course.triangles[first - 1]!;
        const end: number = course.triangles[last]!;
        const star: Map<number, number[]> | undefined = radial.get(vertex);
        if (star === undefined) { failures.push({ stage: "independent vertex ownership", vertex, coordinates: center, observed: "unavailable original face star", expected: "Actual admitted material-domain face incidence" }); continue; }
        const paths: number[][] = [];
        const pending: number[][] = [[start]];
        while (pending.length > 0) {
          const path: number[] = pending.pop()!;
          const current: number = path.at(-1)!;
          if (current === end) { paths.push(path); continue; }
          const neighbors: Set<number> = new Set(skin.mesh.indices.slice(current, current + 3).filter((item: number): boolean => item !== vertex).flatMap((neighbor: number): number[] => star.get(neighbor) ?? []).filter((face: number): boolean => face !== current));
          if (neighbors.size > 2) throw new Error("Independent stationarity found nonmanifold face incidence", { cause: { vertex, triangle: current, adjacent: [...neighbors] } });
          for (const next of neighbors) if (!path.includes(next)) pending.push([...path, next]);
        }
        if (paths.length === 0) { failures.push({ stage: "independent vertex fan continuity", vertex, coordinates: center, start, end, observed: "unavailable", expected: "At least one actual connected face fan" }); continue; }
        for (const path of paths) {
          const rays: Point[] = [points[first - 1]!];
          const materials: number[] = [material(skin, points[first - 1]!, start)];
          for (let ordinal: number = 1; ordinal < path.length; ordinal++) {
            const previous: number[] = skin.mesh.indices.slice(path[ordinal - 1]!, path[ordinal - 1]! + 3);
            const current: number[] = skin.mesh.indices.slice(path[ordinal]!, path[ordinal]! + 3);
            const shared: number[] = previous.filter((item: number): boolean => item !== vertex && current.includes(item));
            if (shared.length !== 1) throw new Error("Independent stationarity omitted an original radial edge", { cause: { vertex, path, ordinal, shared } });
            rays.push(point(skin, shared[0]!));
            materials.push(skin.coordinates[3 * shared[0]! + 1]!);
          }
          rays.push(points[last + 1]!);
          materials.push(material(skin, points[last + 1]!, end));
          let angle: number = 0;
          const angles: number[] = [0];
          for (let ordinal: number = 1; ordinal < rays.length; ordinal++) {
            const a: number = distance(center, rays[ordinal - 1]!);
            const b: number = distance(center, rays[ordinal]!);
            const opposite: number = distance(rays[ordinal - 1]!, rays[ordinal]!);
            const cosine: number = (a * a + b * b - opposite * opposite) / (2 * a * b);
            if (!(a > 0) || !(b > 0) || !Number.isFinite(cosine)) throw new Error("Independent stationarity has unresolved physical ray lengths", { cause: { vertex, path, rays, a, b, opposite, units: "mm" } });
            angle += Math.acos(Math.max(-1, Math.min(1, cosine)));
            angles.push(angle);
          }
          const tolerance: number = 64 * Math.sqrt(Number.EPSILON) * path.length;
          if (!Number.isFinite(angle)) throw new Error("Independent stationarity has an unavailable intrinsic angle", { cause: { vertex, path, angle, units: "rad" } });
          if (angle >= Math.PI - tolerance) continue;

          // A geometric shortcut is an admissible counterexample only when
          // its actual affine material field also retains the fixed domain
          // and travel direction. Equal-radius endpoint cuts give an exact
          // local chord in this independently unfolded angular fan.
          const radius: number = Math.min(...rays.map((ray: Point): number => distance(center, ray))) / 4;
          const station: number = skin.coordinates[3 * vertex + 1]!;
          const chord: number[] = rays.map((ray: Point, ordinal: number): number => station + radius * Math.cos(angle / 2) / Math.cos(angles[ordinal]! - angle / 2) * (materials[ordinal]! - station) / distance(center, ray));
          const direction: number = Math.sign(material(skin, points.at(-1)!, course.triangles.at(-1)!) - material(skin, points[0]!, course.triangles[0]!));
          const admitted: boolean = chord.every((value: number, ordinal: number): boolean => Number.isFinite(value) && value >= bottom && value <= top && (ordinal === 0 || direction * (value - chord[ordinal - 1]!) >= 0));
          if (admitted) failures.push({ stage: "independent intrinsic shortening condition", vertex, coordinates: center, incoming: points[first - 1], outgoing: points[last + 1], triangles: path, observed: angle, expected: Math.PI, deviation: Math.PI - angle, tolerance, units: "rad", materialChord: chord, materialDirection: direction, materialUnits: "mm", reason: "An actual incident wedge below pi admits a shorter chord inside the unchanged directed material domain" });
        }
      }
    }
    return failures;
  }

  /** Physical coordinate triple, mm. */
  type Point = [number, number, number];

  /** Independent original physical vertex. */
  function point(skin: Surface.IGeometry, vertex: number): Point { return [skin.mesh.positions[3 * vertex]!, skin.mesh.positions[3 * vertex + 1]!, skin.mesh.positions[3 * vertex + 2]!]; }

  /** Independent Euclidean distance for cosine-law construction. */
  function distance(a: Point, b: Point): number { return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2); }

  /** Independently interpolate the original affine material field inside the named actual triangle. */
  function material(skin: Surface.IGeometry, p: Point, face: number): number {
    const ids: number[] = skin.mesh.indices.slice(face, face + 3);
    const vertices: Point[] = ids.map((vertex: number): Point => point(skin, vertex));
    const a: Point = vertices[1]!.map((value: number, axis: number): number => value - vertices[0]![axis]!) as Point;
    const b: Point = vertices[2]!.map((value: number, axis: number): number => value - vertices[0]![axis]!) as Point;
    const d: Point = p.map((value: number, axis: number): number => value - vertices[0]![axis]!) as Point;
    const dot: (left: Point, right: Point) => number = (left: Point, right: Point): number => left.reduce((sum: number, value: number, axis: number): number => sum + value * right[axis]!, 0);
    const aa: number = dot(a, a); const ab: number = dot(a, b); const bb: number = dot(b, b);
    const determinant: number = aa * bb - ab * ab;
    if (!(determinant > 0)) throw new Error("Independent stationarity has a degenerate original material triangle", { cause: { face, vertices, determinant, units: "mm^4" } });
    const u: number = (dot(d, a) * bb - dot(d, b) * ab) / determinant;
    const v: number = (dot(d, b) * aa - dot(d, a) * ab) / determinant;
    return (1 - u - v) * skin.coordinates[3 * ids[0]! + 1]! + u * skin.coordinates[3 * ids[1]! + 1]! + v * skin.coordinates[3 * ids[2]! + 1]!;
  }
}
