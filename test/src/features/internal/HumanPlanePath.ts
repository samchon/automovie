import type { AutoMovieHumanMeasurementProtocol as P } from "../../../../packages/human/src/generation/AutoMovieHumanMeasurementProtocol";
import { HumanAnatomy as A } from "./HumanAnatomy";

/** Final skin measured under one physically owned family of section frames. */
export namespace HumanPlanePath {
  /** A measured frame with physical arc station relative to the exact crease. */
  export interface IReading extends P.IPlaneStation {
    /** Signed cumulative origin-path distance from the crease, mm. */
    station: number;
    /** Taut perimeter of this actual final-skin section, mm. */
    girth: number;
    /** Actual final-skin section points. */
    points: A.V3[];
    /** Actual thumb-side support within the same section plane, mm. */
    reach: number;
  }
  /** Missing frames or cuts fail explicitly rather than falling back to other axes. */
  export interface IResult {
    /** Every sampled frame, including all exact construction knots. */
    samples: IReading[];
    /** Exact published crease frame and its final skin. */
    crease?: IReading;
    /** Least final-skin perimeter in this same family. */
    least?: IReading;
    /** Unavailable geometry or skin evidence. */
    reason?: string;
  }

  /**
   * Interpolate physical origins linearly, shortest-arc section normals, and
   * thumb-side vectors followed by in-plane projection. Every path knot is
   * retained; intermediate pitch is at most one millimetre. These premises
   * define a model family, not a palpable stylion observation.
   */
  export function read(skin: A.ISkin, path: P.IPlanePath, region?: Uint32Array): IResult {
    const unavailable = (reason: string): IResult => ({ samples: [], reason });
    if (path.stations.length < 2 || !Number.isInteger(path.crease) || path.crease < 0 || path.crease >= path.stations.length)
      return unavailable("The physical plane family needs distinct stations and an exact crease ordinal.");
    const cumulative: number[] = [0];
    for (let k: number = 0; k < path.stations.length; k++) {
      const frame: P.IPlaneStation = path.stations[k]!;
      if (![...frame.origin, ...frame.normal, ...frame.thumbSide].every(Number.isFinite) || !(Math.hypot(...frame.normal) > 0) || !(Math.hypot(...A.reject(frame.thumbSide, A.unit(frame.normal))) > 0))
        return unavailable("The owned section frame has an invalid origin, normal or in-plane thumb-side direction.");
      if (k === 0) continue;
      const length: number = A.dist(path.stations[k - 1]!.origin, frame.origin);
      if (!(length > 0)) return unavailable("A zero-length physical plane-path interval has no supported interpolation.");
      cumulative.push(cumulative[k - 1]! + length);
    }
    const samples: IReading[] = [];
    let crease: IReading | undefined;
    for (let k: number = 0; k + 1 < path.stations.length; k++) {
      const from: P.IPlaneStation = path.stations[k]!;
      const to: P.IPlaneStation = path.stations[k + 1]!;
      const length: number = cumulative[k + 1]! - cumulative[k]!;
      const steps: number = Math.ceil(length);
      const first: A.V3 = A.unit(from.normal);
      let last: A.V3 = A.unit(to.normal);
      if (A.dot(first, last) < 0) last = A.scale(last, -1);
      const cosine: number = Math.max(-1, Math.min(1, A.dot(first, last)));
      const angle: number = Math.acos(cosine);
      for (let j: number = k === 0 ? 0 : 1; j <= steps; j++) {
        const t: number = j / steps;
        const normal: A.V3 = angle < 1e-8 ? A.unit(A.lerp(first, last, t)) : A.add(A.scale(first, Math.sin((1 - t) * angle) / Math.sin(angle)), A.scale(last, Math.sin(t * angle) / Math.sin(angle)));
        const origin: A.V3 = A.lerp(from.origin, to.origin, t);
        const thumbSide: A.V3 = A.unit(A.reject(A.lerp(from.thumbSide, to.thumbSide, t), normal));
        if (!thumbSide.every(Number.isFinite)) return unavailable("The thumb-side frame reverses or degenerates inside the physical interval.");
        const section: A.ICut | null = A.cut(skin, origin, normal, origin, region);
        if (section === null) return unavailable("The final skin has a missing section in the complete owned plane family.");
        const reading: IReading = { origin, normal, thumbSide, station: cumulative[k]! + length * t - cumulative[path.crease]!, girth: section.girth, points: section.points, reach: Math.max(...section.points.map((point: A.V3): number => A.dot(A.sub(point, origin), thumbSide))) };
        samples.push(reading);
        if ((k === path.crease && j === 0) || (k + 1 === path.crease && j === steps)) crease = reading;
      }
    }
    if (crease === undefined) return unavailable("The exact crease frame was not included in the owned plane family.");
    const least: IReading = samples.reduce((best: IReading, sample: IReading): IReading => sample.girth < best.girth ? sample : best, crease);
    return { samples, crease, least };
  }

  /** Retain the original crease-relative engineering window under the same frames. */
  export function bulge(samples: readonly IReading[], chord: number = 10, from: number = -40, to: number = 10): number {
    if (samples.length < 3 || !(chord > 0)) return NaN;
    let worst: number = 0;
    let observed: boolean = false;
    for (const sample of samples) {
      if (sample.station < from || sample.station > to) continue;
      const before: number = reachAt(samples, sample.station - chord / 2);
      const after: number = reachAt(samples, sample.station + chord / 2);
      if (Number.isFinite(before) && Number.isFinite(after)) { observed = true; worst = Math.max(worst, sample.reach - (before + after) / 2); }
    }
    return observed ? worst : NaN;
  }

  /** Piecewise-linear interpolation of observed support, without target access. */
  function reachAt(samples: readonly IReading[], station: number): number {
    for (let k: number = 0; k + 1 < samples.length; k++) {
      const a: IReading = samples[k]!;
      const b: IReading = samples[k + 1]!;
      if (station >= a.station && station <= b.station) return a.reach + (b.reach - a.reach) * (station - a.station) / (b.station - a.station);
    }
    return NaN;
  }
}
