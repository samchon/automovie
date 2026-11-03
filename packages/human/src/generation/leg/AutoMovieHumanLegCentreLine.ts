import { AutoMovieHumanNaturalSpline } from "../../lofting/AutoMovieHumanNaturalSpline";
import { AutoMovieHumanLegAxis } from "./AutoMovieHumanLegAxis";

/**
 * The leg's centre line: where each section's chart origin stands in its
 * plane, as an offset from the bone axis along the plane's forward `u` and
 * lateral `v`.
 *
 * The guides' rows were read about each reference section's area centroid,
 * so the chart origin is the section's centroid. Three places fix it without
 * a fitted line: the foot's ankle ring and the trunk's crotch arc, whose
 * centroids are the neighbours' own (read off their rings at the leg's two
 * end stations), and the knee, whose joint centre (the midpoint of the
 * femoral condyles, de Leva 1996) is the centre of the knee's section. The
 * offset in each direction is the natural cubic spline through the three,
 * so the line is C2 along the leg, meets each ring's centroid exactly and
 * crosses the knee on its joint.
 */
export namespace AutoMovieHumanLegCentreLine {
  /** A centroid the line passes through. */
  export interface IAnchor {
    /** Station, mm. */
    at: number;

    /** The centroid in the canonical body frame, `[x, z]` mm (the ring's plane is horizontal). */
    point: readonly [number, number];
  }

  /** What the line is placed from. */
  export interface IInput {
    /** The leg's frames. */
    frames: AutoMovieHumanLegAxis.IFrames;

    /** The ankle ring's centroid at the leg's first station. */
    ankle: IAnchor;

    /** The crotch arc's centroid at the leg's last station. */
    crotch: IAnchor;

    /** Station of the knee centre, mm. */
    knee: number;
  }

  /**
   * The centre line.
   *
   * @param input The frames and the three places.
   * @returns The chart origin's offset from the frame origin at a station, `[along u, along v]` mm.
   */
  export function of(input: IInput): (s: number) => [number, number] {
    const offset: (a: IAnchor) => [number, number] = (a: IAnchor): [number, number] => {
      const f: AutoMovieHumanLegAxis.IFrame = AutoMovieHumanLegAxis.frameAt(input.frames, a.at);
      const d: number[] = [a.point[0] - f.origin[0], 0, a.point[1] - f.origin[2]];
      return [d[0]! * f.u[0] + d[2]! * f.u[2], d[0]! * f.v[0] + d[2]! * f.v[2]];
    };
    const low: [number, number] = offset(input.ankle);
    const high: [number, number] = offset(input.crotch);
    const stations: number[] = [input.ankle.at, input.knee, input.crotch.at];
    const channel: (k: 0 | 1) => AutoMovieHumanNaturalSpline.ISpline = (k: 0 | 1): AutoMovieHumanNaturalSpline.ISpline => AutoMovieHumanNaturalSpline.create(stations, [low[k], 0, high[k]]);
    const u: AutoMovieHumanNaturalSpline.ISpline = channel(0);
    const v: AutoMovieHumanNaturalSpline.ISpline = channel(1);
    return (s: number): [number, number] => [AutoMovieHumanNaturalSpline.evaluate(u, s), AutoMovieHumanNaturalSpline.evaluate(v, s)];
  }
}
