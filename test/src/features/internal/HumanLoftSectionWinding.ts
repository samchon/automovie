import { AutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { AutoMovieHumanLoftFrame } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftFrame";
import type { IAutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";

/** The oriented area of an evaluated section in its own anatomical plane. */
interface IReading {
  /** Physical station along the part. */
  station: number;
  /** False when an emitted coordinate or projected area is nonfinite. */
  finite: boolean;
  /** Signed square millimetres, retaining the section's phase orientation. */
  area: number;
  /** Conservative roundoff allowance of the area reading, in square millimetres. */
  areaError: number;
  /** Whether the emitted section has an area distinguishable from zero. */
  resolved: boolean;
}

/**
 * Read actual section orientation after interpolation, relief and lift.
 * Frames locate the measurement plane; only emitted points supply the area.
 * Finite sampling does not prove the absence of a narrower unsampled fold.
 */
export function HumanLoftSectionWinding(
  chain: IAutoMovieHumanLoftChain,
  stations: readonly number[],
  rings: readonly (readonly [number, number, number][])[],
): IReading[] {
  if (stations.length !== rings.length) throw new Error("Every section needs its physical station");
  return stations.map((station: number, ordinal: number): IReading => {
    const ring: readonly [number, number, number][] = rings[ordinal]!;
    const frame: AutoMovieHumanLoftFrame.IFrame = AutoMovieHumanLoftChain.frame(chain, station);
    const normal: [number, number, number] = [
      frame.u[1] * frame.v[2] - frame.u[2] * frame.v[1],
      frame.u[2] * frame.v[0] - frame.u[0] * frame.v[2],
      frame.u[0] * frame.v[1] - frame.u[1] * frame.v[0],
    ];
    let twiceArea: number = 0;
    let magnitude: number = 0;
    for (let i: number = 0; i < ring.length; i++) {
      const a: [number, number, number] = ring[i]!;
      const b: [number, number, number] = ring[(i + 1) % ring.length]!;
      const ax: number = a[0] - frame.origin[0];
      const ay: number = a[1] - frame.origin[1];
      const az: number = a[2] - frame.origin[2];
      const bx: number = b[0] - frame.origin[0];
      const by: number = b[1] - frame.origin[1];
      const bz: number = b[2] - frame.origin[2];
      twiceArea += (ay * bz - az * by) * normal[0] + (az * bx - ax * bz) * normal[1] + (ax * by - ay * bx) * normal[2];
      magnitude += (Math.abs(ay * bz) + Math.abs(az * by)) * Math.abs(normal[0]) + (Math.abs(az * bx) + Math.abs(ax * bz)) * Math.abs(normal[1]) + (Math.abs(ax * by) + Math.abs(ay * bx)) * Math.abs(normal[2]);
    }
    const divisor: number = 2 * Math.hypot(...normal);
    const area: number = twiceArea / divisor;

    // The standard gamma_n summation bound covers fewer than 32 arithmetic
    // operations per edge and 16 for the shared normal and final division.
    // It resolves this sampled area only; it is not an anatomical tolerance
    // or a guarantee about source-evaluation error or unsampled sections.
    const operations: number = 32 * ring.length + 16;
    const accumulated: number = operations * Number.EPSILON / 2;
    const gamma: number = accumulated < 1 ? accumulated / (1 - accumulated) : Infinity;
    // Relative error alone omits gradual underflow. Each rounded operation
    // contributes at most one minimum subnormal in absolute error; normal
    // projection can amplify product error by its component magnitudes.
    // Keep a representable positive floor after the final division as well.
    const underflowError: number = operations * Number.MIN_VALUE * (1 + normal.reduce((sum: number, value: number): number => sum + Math.abs(value), 0)) / divisor;
    const areaError: number = gamma * magnitude / divisor + Math.max(Number.MIN_VALUE, underflowError);
    const finite: boolean = ring.length >= 3 && ring.every((point: [number, number, number]): boolean => point.every(Number.isFinite)) && Number.isFinite(area) && Number.isFinite(areaError);
    return { station, finite, area, areaError, resolved: finite && Math.abs(area) > areaError };
  });
}
