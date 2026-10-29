import { AutoMovieHumanLoftChain as Loft } from "../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanMonotoneCubic as Cubic } from "../lofting/AutoMovieHumanMonotoneCubic";
import type { IAutoMovieHumanLoftChain as Chain } from "../lofting/IAutoMovieHumanLoftChain";
import type { AutoMovieHumanBodyWarpField as Field } from "./AutoMovieHumanBodyWarpField";

/** Separate material size courses from attachment placement of retained curves. */
export namespace AutoMovieHumanBodyPlacement {
  /** Radial size constraints at existing material addresses. */
  export interface IKnots {
    /** Forward size ratios, independent of the centre's placement. */
    x: [number, number][];
    /** Lateral size ratios at the same source chart addresses. */
    z: [number, number][];
  }

  /**
   * Construct one part map without blending the parent's global radial field
   * into its intrinsic size courses. The parent carries only the attachment
   * reference position; the existing parent split arc and event join own the
   * actual skin boundary and its reconciliation with the child interior.
   * This reference is a phase-mean axis point, not an anatomical joint pivot.
   */
  export function create(
    chain: Chain,
    knots: IKnots,
    advance: (station: number) => [number, number, number],
    carry: readonly [number, number],
  ): (station: number) => Field.IMap {
    const lo: number = chain.layers[0]!.y;
    const hi: number = chain.layers[chain.layers.length - 1]!.y;
    return (station: number): Field.IMap => {
      const c: [number, number, number] = Loft.axis(chain, Math.max(lo, Math.min(hi, station)));
      const d: [number, number, number] = advance(station);
      const ax: number = Cubic.interpolate(knots.x, station, 1);
      const az: number = Cubic.interpolate(knots.z, station, 1);
      return {
        ax, az,
        bx: (1 - ax) * c[0] + d[0] + carry[0],
        bz: (1 - az) * c[2] + d[2] + carry[1],
      };
    };
  }
}
