import { AutoMovieHumanLoftChain as Loft } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain as Chain } from "../lofting/IAutoMovieHumanLoftChain";
import type { AutoMovieHumanLoftMesh as Mesh } from "../lofting/AutoMovieHumanLoftMesh";

/** Actual source-chart to shared emitted-boundary correspondence, observed at its mesher owner. */
export namespace AutoMovieHumanSurfaceCorrespondence {
  /** One actual inherited or owned boundary; vertex indices are from this exact emitted mesh. */
  export interface IBoundary {
    /** Child or owning column whose chart is evaluated. */
    chain: string;
    /** Adjacent end and its own material station, mm. */
    end: "bottom" | "top";
    /** Actual source material address, independent of world Y. */
    station: number;
    /** Shared incidence is distinct from equality of the source curves. */
    kind: "own" | "inherited";
    /** Original mesh vertex indices in the order consumed by the zipper. */
    vertices: number[];
    /** Actual source chart phases consumed by that same zipper. */
    phases: number[];
    /** Every evaluated source and inherited physical point, without a tolerance-based substitution. */
    points: { vertex: number; phase: number; source: [number, number, number]; emitted: [number, number, number]; residual: number }[];
    /** Position and residual units; no anatomy or meshing allowance is applied. */
    units: "mm";
  }

  /** Operation-local read-only observation; persistence belongs to the development/test consumer. */
  export type Listener = (boundary: IBoundary) => void;

  /** Preserve the actual mesh boundary and the exact chart correspondence used to connect it. */
  export function read(chain: Chain, end: "bottom" | "top", station: number, kind: "own" | "inherited", mesh: Mesh.IContext, vertices: readonly number[], phases: readonly number[]): IBoundary {
    if (vertices.length !== phases.length) throw new Error("A shared surface boundary omitted its source chart correspondence", { cause: { chain: chain.name, end, station, vertices: vertices.length, phases: phases.length, units: "count" } });
    const sample: ReturnType<typeof Loft.sampler> = Loft.sampler(chain, station);
    return { chain: chain.name, end, station, kind, vertices: [...vertices], phases: [...phases], units: "mm", points: vertices.map((vertex: number, index: number): IBoundary["points"][number] => {
      const phase: number = phases[index]!;
      const source: [number, number, number] = sample(phase);
      const emitted: [number, number, number] = mesh.positions.slice(3 * vertex, 3 * vertex + 3) as [number, number, number];
      const residual: number = Math.hypot(source[0] - emitted[0], source[1] - emitted[1], source[2] - emitted[2]);
      if (source.length !== 3 || emitted.length !== 3 || ![...source, ...emitted, residual].every(Number.isFinite)) throw new Error("A shared surface boundary has unavailable physical coordinates", { cause: { chain: chain.name, end, station, vertex, phase, source, emitted, residual, units: "mm" } });
      return { vertex, phase, source, emitted, residual };
    }) };
  }
}
