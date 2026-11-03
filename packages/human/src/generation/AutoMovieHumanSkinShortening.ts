import type { AutoMovieHumanBodySurface as Surface } from "./AutoMovieHumanBodySurface";
import { AutoMovieHumanSkinCorridor as Corridor } from "./AutoMovieHumanSkinCorridor";
import { AutoMovieHumanSkinDirectedPath as Directed } from "./AutoMovieHumanSkinDirectedPath";
import { AutoMovieHumanSkinLowerBound as LowerBound } from "./AutoMovieHumanSkinLowerBound";
import type { AutoMovieHumanThoracicCourse as Source } from "./AutoMovieHumanThoracicCourse";

/** Remove shorten-able actual refined vertex corners by changing the incident physical face corridor. */
export namespace AutoMovieHumanSkinShortening {
  /** A strict physical shortcut between two unchanged cut points of the current path. */
  interface IProposal {
    /** Original point index of the fixed incoming cut. */
    first: number;
    /** Original point index of the fixed outgoing cut. */
    last: number;
    /** Actual local original-face corridor between those cuts. */
    reading: Corridor.IReading;
    /** Resolved original-local minus candidate-local length, mm. */
    saving: number;
  }
  /** Opt-in copied evidence for one evaluated actual local fan, never an input to geometry. */
  export interface IAlternative {
    /** Original triangle offsets in the incident fan. */
    triangles: number[];
    /** Fixed incoming and outgoing physical cuts, mm. */
    cuts: Source.Point[];
    /** Fixed directed material interval limits, mm. */
    domain: number[];
    /** Physical length of the original cut interval, mm. */
    originalLength: number;
    /** Evaluated physical alternative length, mm. */
    candidateLength: number;
    /** Actual physical points in that alternative, mm. */
    points: Source.Point[];
    /** Actual material stations of those points, mm. */
    stations: number[];
    /** Whether the actual candidate retains its fixed directed material interval. */
    admissible: boolean;
  }
  /**
   * Solve only the incident fan between actual incoming/outgoing cuts.
   * Batch nonoverlapping strict local shortcuts, retain original cut-edge
   * identities, then relax their shared physical portal corridor once.
   * Every accepted batch strictly shortens the full physical path. No
   * geometry is remeshed or moved; public endpoints and material direction
   * remain fixed. Seed directions do not decide stationarity.
   * This is finite local corridor descent, not a global geodesic proof.
   * An optional local observer receives copied counters only; its refusal
   * aborts that observation and is never an admitted physical result.
   */
  export function read(skin: Surface.IGeometry, seed: Corridor.IReading, coordinates: readonly number[], selectedFaces: readonly number[], adjacency: Corridor.Connectivity = Corridor.prepare(skin, selectedFaces), observe?: (work: Readonly<NonNullable<Corridor.IReading["shorteningWork"]>>, stage: "pruned" | "refused" | "evaluated", alternative?: IAlternative) => void): Corridor.IReading {
    const cache: Map<string, Corridor.IReading> = new Map();
    const refusals: NonNullable<Corridor.IReading["alternatives"]> = [];
    const work: NonNullable<Corridor.IReading["shorteningWork"]> = { corridorEvaluations: 0, directedCalls: 0, sweeps: 0, scalarEvaluations: 0, segmentEvaluations: 0, refusedAlternatives: 0, certificates: 0, certificateSegments: 0, certifiedPruned: 0, globalRelaxations: 0, splicedIntervals: 0, maxLocalPortals: 0, cacheHits: 0, erasedFaceVisits: 0 };
    accumulate(seed);
    let current: Corridor.IReading = seed;
    const direction: number = Math.sign(seed.stations.at(-1)! - seed.stations[0]!);
    current = relax(current);
    for (let round: number = 0; round <= selectedFaces.length; round++) {
      const proposals: IProposal[] = [];
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
          const start: number = first - 1;
          const end: number = last + 1;
          const originalLength: number = length(current.points.slice(start, end + 1));
          const bottom: number = Math.min(current.stations[start]!, current.stations[end]!);
          const top: number = Math.max(current.stations[start]!, current.stations[end]!);
          const paths: number[][] = fans(skin, adjacency.get(vertex)!, vertex, current.triangles[first - 1]!, current.triangles[last]!);
          let best: Corridor.IReading | undefined;
          for (const fan of paths) {
            const angle: number = wedge(skin, fan, vertex, incoming, outgoing);
            const angularRoundoff: number = 32 * Math.sqrt(Number.EPSILON) * fan.length;
            if (angle >= Math.PI - angularRoundoff) continue;
            const key: string = JSON.stringify({ fan, incoming, outgoing, bottom, top });
            let candidate: Corridor.IReading;
            let pruned: boolean = false;
            try {
              const cached: Corridor.IReading | undefined = cache.get(key);
              if (cached !== undefined) { candidate = cached; work.cacheHits++; }
              else {
                work.corridorEvaluations++;
                const geometric: Corridor.IReading = Corridor.within(skin, fan, incoming, outgoing, coordinates, false);
                work.maxLocalPortals = Math.max(work.maxLocalPortals, geometric.points.length);
                const certificate: LowerBound.IReading = LowerBound.read(skin, geometric);
                work.certificates++; work.certificateSegments += certificate.segments;
                if (certificate.lower >= Math.min(originalLength, best?.length ?? Infinity)) { work.certifiedPruned++; pruned = true; candidate = geometric; }
                else { candidate = Directed.read(skin, geometric, coordinates); accumulate(candidate); cache.set(key, candidate); }
              }
            }
            catch (error) {
              accumulateFailure(error);
              if (!(error instanceof Error) || error.constructor !== Error || !["An actual face corridor has no feasible directed material path", "An unfolded physical course does not cross its actual ordered portal"].includes(error.message)) throw new Error("Physical shortening could not evaluate an alternative actual corridor", { cause: { vertex, fan, incoming, outgoing, first: start, last: end, work: { ...work, refusedAlternatives: refusals.length }, failure: error instanceof Error ? { category: error.name, reason: error.message, cause: error.cause, stack: error.stack } : error } });
              refusals.push({ triangles: fan, reason: error.message, witness: error.cause });
              observe?.({ ...work, refusedAlternatives: refusals.length }, "refused");
              continue;
            }
            if (pruned) { observe?.({ ...work, refusedAlternatives: refusals.length }, "pruned"); continue; }
            const arithmetic: number = 256 * Number.EPSILON * Math.max(1, originalLength, candidate.length) * Math.max(end - start + 1, candidate.points.length);
            const admissible: boolean = candidate.stations.every((station: number, ordinal: number): boolean => {
              const materialBound: number = 512 * Number.EPSILON * Math.max(1, Math.abs(station), Math.abs(candidate.stations[ordinal - 1] ?? station), Math.abs(bottom), Math.abs(top));
              return Number.isFinite(station) && station >= bottom - materialBound && station <= top + materialBound && (ordinal === 0 || (station - candidate.stations[ordinal - 1]!) * direction >= -materialBound);
            });
            if (!admissible) refusals.push({ triangles: fan, reason: "Alternative path leaves its fixed directed material domain", witness: { stations: candidate.stations, coordinates: candidate.points, bottom, top, direction, units: "mm" } });
            if (admissible && candidate.length < Math.min(originalLength, best?.length ?? Infinity) - arithmetic) best = candidate;
            observe?.({ ...work, refusedAlternatives: refusals.length }, "evaluated", { triangles: fan.slice(), cuts: [incoming.slice() as Source.Point, outgoing.slice() as Source.Point], domain: [bottom, top], originalLength, candidateLength: candidate.length, points: candidate.points.map((point: Source.Point): Source.Point => point.slice() as Source.Point), stations: candidate.stations.slice(), admissible });
          }
          if (best !== undefined) proposals.push({ first: start, last: end, reading: best, saving: originalLength - best.length });
        }
      }
      if (proposals.length === 0) return finish();
      const selected: IProposal[] = [];
      for (const proposal of proposals.sort((a: IProposal, b: IProposal): number => b.saving - a.saving || a.first - b.first))
        if (selected.every((other: IProposal): boolean => proposal.last <= other.first || proposal.first >= other.last)) selected.push(proposal);
      let candidate: Corridor.IReading = current;
      for (const proposal of selected.sort((a: IProposal, b: IProposal): number => b.first - a.first)) candidate = splice(candidate, proposal);
      const arithmetic: number = 256 * Number.EPSILON * Math.max(1, current.length, candidate.length) * Math.max(current.points.length, candidate.points.length);
      if (!(candidate.length < current.length - arithmetic)) {
        refusals.push({ triangles: candidate.triangles, reason: "Local shortcuts have no numerically resolved full-path descent", witness: { observed: candidate.length, expected: current.length, tolerance: arithmetic, units: "mm" } });
        return finish();
      }
      work.splicedIntervals += selected.length;
      current = relax(candidate);
    }
    throw new Error("Physical corridor shortening exhausted its finite face-work budget", { cause: { selectedFaces: selectedFaces.length, work, points: current.points, triangles: current.triangles, length: current.length, units: "mm and counts" } });

    /** Keep every outside point and original cut-edge identity unchanged while replacing one strict local interval. */
    function splice(value: Corridor.IReading, proposal: IProposal): Corridor.IReading {
      const local: Corridor.IReading = proposal.reading;
      const points: Source.Point[] = [...value.points.slice(0, proposal.first), ...local.points, ...value.points.slice(proposal.last + 1)];
      const bindings: Corridor.IReading["bindings"] = [...value.bindings.slice(0, proposal.first), value.bindings[proposal.first]!, ...local.bindings.slice(1, -1), value.bindings[proposal.last]!, ...value.bindings.slice(proposal.last + 1)];
      return { points, bindings, stations: [...value.stations.slice(0, proposal.first), value.stations[proposal.first]!, ...local.stations.slice(1, -1), value.stations[proposal.last]!, ...value.stations.slice(proposal.last + 1)], triangles: [...value.triangles.slice(0, proposal.first), ...local.triangles, ...value.triangles.slice(proposal.last)], length: length(points) };
    }

    /** String-pull the shared whole corridor once per accepted batch; solve constraints only if that exact physical path reverses material direction. */
    function relax(value: Corridor.IReading): Corridor.IReading {
      work.globalRelaxations++;
      const corridor: number[] = [];
      const visited: Map<number, number> = new Map();

      // Re-entering the same original convex triangle admits its direct chord.
      // Its affine material station stays between the two ordered cuts.
      // Contract identity-equal face visits, never coincident separate sheets.
      for (const face of value.triangles) {
        const earlier: number | undefined = visited.get(face);
        if (earlier === undefined) { visited.set(face, corridor.length); corridor.push(face); }
        else {
          for (let index: number = corridor.length - 1; index > earlier; index--) visited.delete(corridor[index]!);
          corridor.length = earlier + 1;
        }
      }
      work.erasedFaceVisits += value.triangles.length - corridor.length;
      let geometric: Corridor.IReading | undefined;
      try {
        geometric = Corridor.within(skin, corridor, value.points[0]!, value.points.at(-1)!, coordinates, false);
        const relaxed: Corridor.IReading = Directed.read(skin, geometric, coordinates);
        accumulate(relaxed);
        return relaxed.length <= value.length ? relaxed : value;
      } catch (error) {
        accumulateFailure(error);
        throw new Error("Physical shortening could not relax its actual shared corridor", { cause: { stage: "whole-corridor relaxation", work: { ...work, refusedAlternatives: refusals.length }, original: value, geometric, failure: error instanceof Error ? { category: error.name, reason: error.message, cause: error.cause, stack: error.stack } : error } });
      }
    }

    /** Retain all real alternative refusals and all actual costs even when no local change is admitted. */
    function finish(): Corridor.IReading { return { ...current, alternatives: refusals, shorteningWork: { ...work, refusedAlternatives: refusals.length } }; }

    /** Count every actually executed directed solve; the chosen final corridor alone understates its cost. */
    function accumulate(reading: Corridor.IReading): void {
      if (reading.directedWork === undefined) return;
      accumulateWork(reading.directedWork);
    }

    /** Include a real failed descent's measured work rather than losing its final sweeps. */
    function accumulateWork(value: NonNullable<Corridor.IReading["directedWork"]>): void {
      work.directedCalls++;
      work.sweeps += value.sweeps;
      work.scalarEvaluations += value.scalarEvaluations;
      work.segmentEvaluations += value.segmentEvaluations;
    }

    /** Preserve all measured sweeps of the owner's exact finite-budget refusal, including local alternatives. */
    function accumulateFailure(error: unknown): void {
      const failed: Corridor.IReading["directedWork"] | undefined = error instanceof Error && error.constructor === Error && error.message === "Directed physical corridor descent did not converge within its finite work budget" ? (error.cause as { work?: Corridor.IReading["directedWork"] } | undefined)?.work : undefined;
      if (failed !== undefined) accumulateWork(failed);
    }
  }

  /** Full physical segment sum in the original order, without prefix subtraction or a mesh-edge surrogate. */
  function length(points: readonly Source.Point[]): number { return points.reduce((sum: number, point: Source.Point, index: number): number => index === 0 ? sum : sum + Math.hypot(...subtract(point, points[index - 1]!)), 0); }

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
