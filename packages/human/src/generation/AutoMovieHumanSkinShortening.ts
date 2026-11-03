import type { AutoMovieHumanBodySurface as Surface } from "./AutoMovieHumanBodySurface";
import { AutoMovieHumanSkinCorridor as Corridor } from "./AutoMovieHumanSkinCorridor";
import { AutoMovieHumanSkinDirectedPath as Directed } from "./AutoMovieHumanSkinDirectedPath";
import { AutoMovieHumanSkinLowerBound as LowerBound } from "./AutoMovieHumanSkinLowerBound";
import type { AutoMovieHumanThoracicCourse as Source } from "./AutoMovieHumanThoracicCourse";

/** Remove shorten-able actual refined vertex corners by changing the incident physical face corridor. */
export namespace AutoMovieHumanSkinShortening {
  /**
   * Compare every actual refined corner's manifold fan routes, re-unfold
   * eligible alternatives and accept only a numerically resolved physical
   * shortening. Seed directions do not decide stationarity. No geometry is
   * remeshed or moved, and endpoints/material direction remain fixed.
   * This is finite local corridor descent, not a global geodesic proof.
   * An optional local observer receives copied counters only; its refusal
   * aborts that observation and is never an admitted physical result.
   */
  export function read(skin: Surface.IGeometry, seed: Corridor.IReading, coordinates: readonly number[], selectedFaces: readonly number[], adjacency: Corridor.Connectivity = Corridor.prepare(skin, selectedFaces), observe?: (work: Readonly<NonNullable<Corridor.IReading["shorteningWork"]>>, stage: "pruned" | "refused" | "evaluated") => void): Corridor.IReading {
    const visited: Set<string> = new Set([seed.triangles.join(",")]);
    const refusals: NonNullable<Corridor.IReading["alternatives"]> = [];
    const work: NonNullable<Corridor.IReading["shorteningWork"]> = { corridorEvaluations: 0, directedCalls: 0, sweeps: 0, scalarEvaluations: 0, segmentEvaluations: 0, refusedAlternatives: 0, certificates: 0, certificateSegments: 0, certifiedPruned: 0 };
    accumulate(seed);
    let current: Corridor.IReading = seed;
    const from: Source.Point = seed.points[0]!;
    const to: Source.Point = seed.points.at(-1)!;
    const bottom: number = Math.min(seed.stations[0]!, seed.stations.at(-1)!);
    const top: number = Math.max(seed.stations[0]!, seed.stations.at(-1)!);
    const direction: number = Math.sign(seed.stations.at(-1)! - seed.stations[0]!);
    for (let round: number = 0; round <= selectedFaces.length; round++) {
      let best: Corridor.IReading = current;
      const handled: Set<number> = new Set();
      for (let index: number = 1; index < current.points.length - 1; index++) {
        const binding: Corridor.IReading["bindings"][number] = current.bindings[index]!;
        if (!("edge" in binding)) continue;
        for (const vertex of binding.edge) {
          if (handled.has(vertex) || !atVertex(skin, current.points[index]!, vertex)) continue;
          handled.add(vertex);
          let first: number = index;
          let last: number = index;
          while (first > 0 && atVertex(skin, current.points[first - 1]!, vertex)) first--;
          while (last < current.points.length - 1 && atVertex(skin, current.points[last + 1]!, vertex)) last++;
          if (first === 0 || last === current.points.length - 1) continue;
          const incoming: Source.Point = current.points[first - 1]!;
          const outgoing: Source.Point = current.points[last + 1]!;
          const paths: number[][] = fans(skin, adjacency.get(vertex)!, vertex, current.triangles[first - 1]!, current.triangles[last]!);
          for (const fan of paths) {
            const angle: number = wedge(skin, fan, vertex, incoming, outgoing);
            const angularRoundoff: number = 32 * Math.sqrt(Number.EPSILON) * fan.length;
            if (angle >= Math.PI - angularRoundoff) continue;
            const faces: number[] = [...current.triangles.slice(0, first - 1), ...fan, ...current.triangles.slice(last + 1)];
            const key: string = faces.join(",");
            if (visited.has(key)) continue;
            visited.add(key);
            work.corridorEvaluations++;
            let candidate: Corridor.IReading;
            let pruned: boolean = false;
            try {
              const geometric: Corridor.IReading = Corridor.within(skin, faces, from, to, coordinates, false);
              const certificate: LowerBound.IReading = LowerBound.read(skin, geometric);
              work.certificates++; work.certificateSegments += certificate.segments;
              if (certificate.lower >= best.length) { work.certifiedPruned++; pruned = true; candidate = geometric; }
              else candidate = Directed.read(skin, geometric, coordinates);
            }
            catch (error) {
              if (!(error instanceof Error) || error.constructor !== Error || !["An actual face corridor has no feasible directed material path", "An unfolded physical course does not cross its actual ordered portal"].includes(error.message)) throw new Error("Physical shortening could not evaluate an alternative actual corridor", { cause: { vertex, fan, faces, incoming, outgoing, failure: error instanceof Error ? { category: error.name, reason: error.message, cause: error.cause, stack: error.stack } : error } });
              refusals.push({ triangles: faces, reason: error.message, witness: error.cause });
              observe?.({ ...work, refusedAlternatives: refusals.length }, "refused");
              continue;
            }
            if (pruned) { observe?.({ ...work, refusedAlternatives: refusals.length }, "pruned"); continue; }
            accumulate(candidate);
            const arithmetic: number = 256 * Number.EPSILON * Math.max(1, current.length, candidate.length) * Math.max(current.points.length, candidate.points.length);
            const admissible: boolean = candidate.stations.every((station: number, ordinal: number): boolean => {
              const materialBound: number = 512 * Number.EPSILON * Math.max(1, Math.abs(station), Math.abs(candidate.stations[ordinal - 1] ?? station), Math.abs(bottom), Math.abs(top));
              return Number.isFinite(station) && station >= bottom - materialBound && station <= top + materialBound && (ordinal === 0 || (station - candidate.stations[ordinal - 1]!) * direction >= -materialBound);
            });
            if (!admissible) refusals.push({ triangles: faces, reason: "Alternative path leaves its fixed directed material domain", witness: { stations: candidate.stations, coordinates: candidate.points, bottom, top, direction, units: "mm" } });
            if (admissible && candidate.length < best.length - arithmetic) best = candidate;
            observe?.({ ...work, refusedAlternatives: refusals.length }, "evaluated");
          }
        }
      }
      if (best === current) return { ...current, alternatives: refusals, shorteningWork: { ...work, refusedAlternatives: refusals.length } };
      current = best;
    }
    throw new Error("Physical corridor shortening exhausted its finite face-work budget", { cause: { selectedFaces: selectedFaces.length, examinedCorridors: visited.size, points: current.points, triangles: current.triangles, length: current.length, units: "mm and counts" } });

    /** Count every actually executed directed solve; the chosen final corridor alone understates its cost. */
    function accumulate(reading: Corridor.IReading): void {
      if (reading.directedWork === undefined) return;
      work.directedCalls++;
      work.sweeps += reading.directedWork.sweeps;
      work.scalarEvaluations += reading.directedWork.scalarEvaluations;
      work.segmentEvaluations += reading.directedWork.segmentEvaluations;
    }
  }

  /** Enumerate actual edge-connected simple routes in one manifold indexed vertex star. */
  function fans(skin: Surface.IGeometry, star: ReadonlyMap<number, readonly number[]>, vertex: number, start: number, end: number): number[][] {
    const result: number[][] = [];
    const visit: (route: number[]) => void = (route: number[]): void => {
      const face: number = route.at(-1)!;
      if (face === end) { result.push(route); return; }
      const neighbors: Set<number> = new Set();
      for (const other of skin.mesh.indices.slice(face, face + 3).filter((value: number): boolean => value !== vertex))
        for (const adjacent of star.get(other) ?? []) if (adjacent !== face) neighbors.add(adjacent);
      if (neighbors.size > 2) throw new Error("Physical shortening encountered a nonmanifold vertex star", { cause: { vertex, face, adjacent: [...neighbors] } });
      for (const next of neighbors) if (!route.includes(next)) visit([...route, next]);
    };
    visit([start]);
    if (result.length === 0) throw new Error("Physical shortening lost actual indexed fan continuity", { cause: { vertex, start, end } });
    return result;
  }

  /** Intrinsic wedge between actual refined rays, using original physical radial edges between them. */
  function wedge(skin: Surface.IGeometry, faces: readonly number[], vertex: number, incoming: Source.Point, outgoing: Source.Point): number {
    const center: Source.Point = world(skin, vertex);
    let before: Source.Point = subtract(incoming, center);
    let angle: number = 0;
    for (let index: number = 0; index < faces.length; index++) {
      let after: Source.Point;
      if (index === faces.length - 1) after = subtract(outgoing, center);
      else {
        const next: number[] = skin.mesh.indices.slice(faces[index + 1]!, faces[index + 1]! + 3);
        const shared: number[] = skin.mesh.indices.slice(faces[index]!, faces[index]! + 3).filter((value: number): boolean => value !== vertex && next.includes(value));
        if (shared.length !== 1) throw new Error("A physical shortening wedge omitted its radial edge", { cause: { vertex, faces, index } });
        after = subtract(world(skin, shared[0]!), center);
      }
      const product: number = Math.hypot(...before) * Math.hypot(...after);
      if (!(product > 0) || !Number.isFinite(product)) throw new Error("Physical shortening has an unresolved actual corner ray", { cause: { vertex, incoming, outgoing, faces, product, units: "mm^2" } });
      const cosine: number = before.reduce((sum: number, value: number, axis: number): number => sum + value * after[axis]!, 0) / product;
      angle += Math.acos(Math.max(-1, Math.min(1, cosine)));
      before = after;
    }
    if (!Number.isFinite(angle)) throw new Error("Physical shortening has an unavailable intrinsic angle", { cause: { vertex, faces, incoming, outgoing, angle, units: "rad" } });
    return angle;
  }

  /** Test only the named original edge endpoint at floating-point coordinate resolution; no sheet welding. */
  function atVertex(skin: Surface.IGeometry, point: Source.Point, vertex: number): boolean {
    const actual: Source.Point = world(skin, vertex);
    const arithmetic: number = 512 * Number.EPSILON * Math.max(1, ...point.map(Math.abs), ...actual.map(Math.abs));
    return Math.hypot(...subtract(point, actual)) <= arithmetic;
  }

  /** Original physical mesh point. */
  function world(skin: Surface.IGeometry, vertex: number): Source.Point { return skin.mesh.positions.slice(3 * vertex, 3 * vertex + 3) as Source.Point; }
  /** Physical displacement in millimetres. */
  function subtract(a: Source.Point, b: Source.Point): Source.Point { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
}
