import type { AutoMovieHumanLoftFrame } from "../../lofting/AutoMovieHumanLoftFrame";
import { AutoMovieHumanSeamStation } from "../../lofting/AutoMovieHumanSeamStation";
import { AutoMovieHumanFootFan } from "./AutoMovieHumanFootFan";
import type { AutoMovieHumanFootFrame } from "./AutoMovieHumanFootFrame";
import { AutoMovieHumanFootGeometry as G } from "./AutoMovieHumanFootGeometry";
import type { AutoMovieHumanFootWebLine } from "./AutoMovieHumanFootWebLine";

type Vec3 = G.Vec3;

/**
 * One guide curve of the body, built from its landmarks' knots: the shared
 * rule that turns a list of world points, from the toes back and up to the
 * ankle ring, into a curve the section planes read.
 *
 * The guide is parametrised by the fan's own station: each knot is read as its
 * plane's station and its place in that plane, and the place is the natural
 * cubic spline of the station through them (the shared C2 rule,
 * `AutoMovieHumanSeamStation`). So the guide meets every plane once by
 * construction, through the yaw fan, the hand-over and the turn alike, and its
 * place in the planes is C2; a guide over chord length climbed within a few
 * planes where it joined a vertical cut's low extreme to a horizontal cut's
 * high one, and kinked the pieces it bounds. Each guide's own landmarks (which
 * knots, read how) live in its own file.
 */
export namespace AutoMovieHumanFootGuide {
  /** A guide: its kept knots' stations and places, and their spline's jets. */
  export interface IGuide {
    /** Strictly increasing stations of the kept knots. */
    stations: number[];

    /** Each kept knot's `[across, up]` in its plane, mm. */
    values: number[][];

    /** The spline's first derivatives at the knots. */
    slopes: number[][];

    /** The spline's second derivatives at the knots. */
    curvatures: number[][];
  }

  /**
   * A knot read in the fan's own plane: `[share, a, u, y/L, y/H]`, the plane's
   * station as a share of the web ring to the ankle ring, and the landmark's
   * place with its height both in foot lengths and in lateral malleolus
   * heights (handed from the first to the second over the turn).
   */
  export type IFanKnot = readonly [number, number, number, number, number];

  /**
   * World points of knots read in the fan's own planes.
   *
   * A height scales with the foot's length in the yaw fan and with the
   * malleolus at the ankle ring, handed over by a smoothstep across the turn
   * (from the square plane's share of the stations to the ring), so no
   * person's knots fall out of order where a length-scaled and a
   * malleolus-scaled height would disagree.
   *
   * @param frame The foot's frame.
   * @param line The web line.
   * @param knots The knots.
   */
  export function fanned(
    frame: AutoMovieHumanFootFrame.IFrame,
    line: AutoMovieHumanFootWebLine.IWebLine,
    knots: readonly IFanKnot[],
  ): Vec3[] {
    const square: number = line.square / line.end;

    return knots.map((q: IFanKnot): Vec3 => {
      const w: number = G.smooth((q[0] - square) / (1 - square));

      return frame.at(q[1], q[2], (1 - w) * q[3] * frame.L + w * q[4] * frame.H);
    });
  }

  /**
   * A guide through world knots.
   *
   * @param frame The foot's frame; the last knot is put on its ankle ring.
   * @param line The web line.
   * @param knots World points from the toes back and up to the ring, at least two.
   */
  export function of(
    frame: AutoMovieHumanFootFrame.IFrame,
    line: AutoMovieHumanFootWebLine.IWebLine,
    knots: readonly Vec3[],
  ): IGuide {
    // The last knot stands on the ankle ring.
    const list: Vec3[] = knots.map((p: Vec3): Vec3 => [...p]);
    const top: Vec3 = list[list.length - 1]!;
    list[list.length - 1] = [top[0], frame.ring, top[2]];

    // Each knot read as its station and its place in that station's plane.
    const read: IKnot[] = list.map((p: Vec3): IKnot => {
      const station: number = AutoMovieHumanFootFan.station(line, p);
      const f: AutoMovieHumanLoftFrame.IFrame = AutoMovieHumanFootFan.plane(line, station);
      const r: Vec3 = G.sub(p, f.origin);

      return { station, across: G.dot(r, f.v), up: G.dot(r, f.u) };
    });

    // A knot behind a plane its predecessor already passed would turn the
    // guide back within planes it has crossed; the guide keeps the first.
    const kept: IKnot[] = [];
    for (const q of read) if (kept.length === 0 || q.station > kept[kept.length - 1]!.station + MIN_GAP) kept.push(q);
    const t: number[] = kept.map((q: IKnot): number => q.station);
    const values: number[][] = kept.map((q: IKnot): number[] => [q.across, q.up]);
    const curvatures: number[][] = AutoMovieHumanSeamStation.curvatures(t, values);
    const slopes: number[][] = AutoMovieHumanSeamStation.slopes(t, values, curvatures);

    return { stations: t, values, slopes, curvatures };
  }

  /** A guide's point in the plane at a station. */
  export function at(g: IGuide, line: AutoMovieHumanFootWebLine.IWebLine, station: number): Vec3 {
    const t: readonly number[] = g.stations;
    const n: number = t.length;
    let q: [number, number];
    if (station <= t[0]!) q = tangent(g, 0, station);
    else if (station >= t[n - 1]!) q = tangent(g, n - 1, station);
    else {
      let lo: number = 0;
      let hi: number = n - 1;
      while (hi - lo > 1) {
        const m: number = (lo + hi) >> 1;
        if (t[m]! <= station) lo = m;
        else hi = m;
      }

      // The natural spline's cubic on this interval, from its end values and
      // second derivatives.
      const h: number = t[hi]! - t[lo]!;
      const a: number = (t[hi]! - station) / h;
      const b: number = 1 - a;
      q = [0, 1].map(
        (c: number): number =>
          a * g.values[lo]![c]! +
          b * g.values[hi]![c]! +
          (((a ** 3 - a) * g.curvatures[lo]![c]! + (b ** 3 - b) * g.curvatures[hi]![c]!) * h * h) / 6,
      ) as [number, number];
    }
    const f: AutoMovieHumanLoftFrame.IFrame = AutoMovieHumanFootFan.plane(line, station);

    return G.plus(f.origin, G.plus(G.scale(f.v, q[0]), G.scale(f.u, q[1])));
  }

  /** A guide beyond its first or last knot: the end's tangent line. */
  function tangent(g: IGuide, i: number, station: number): [number, number] {
    const d: number = station - g.stations[i]!;

    return [0, 1].map((c: number): number => g.values[i]![c]! + d * g.slopes[i]![c]!) as [number, number];
  }

  /** A knot as the guide reads it. */
  interface IKnot {
    /** The station of the fan's plane through the knot. */
    station: number;

    /** The knot along that plane's `v` axis from the fan's shared point, mm. */
    across: number;

    /** The knot along that plane's `u` axis from the fan's shared point, mm. */
    up: number;
  }
}

/**
 * Least station between kept knots, mm. A convention: closer knots would leave
 * the spline's interval too short to carry their places' difference without a
 * spike.
 */
const MIN_GAP: number = 0.5;
