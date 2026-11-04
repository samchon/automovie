import { AutoMovieHumanGuidePublish } from "../../lofting/AutoMovieHumanGuidePublish";
import { AutoMovieHumanChordArc } from "../../lofting/AutoMovieHumanChordArc";
import { AutoMovieHumanPolarSection } from "../../lofting/AutoMovieHumanPolarSection";
import { AutoMoviePolarSector } from "@automovie/engine";
import { AutoMovieHumanLegGuides } from "./AutoMovieHumanLegGuides";
import { AutoMovieHumanLegHull } from "./AutoMovieHumanLegHull";

/**
 * A neighbour's ring read as a row of the leg's shape: the foot's ankle ring
 * or the trunk's crotch ring, in the section chart about the leg's centre
 * line, as the eight guides' jets, the eight sectors' fullness and the
 * ring's taut girth.
 *
 * Each guide's `(rho, rho_theta, rho_thetatheta)` is the least-squares
 * quadratic of the ring's radius over {@link HALF_WINDOW} either side of the
 * guide's angle, the same reading the landmark rows were taken with, in units
 * of the ring's girth over 2 pi. Each sector's fullness is the ring's offset
 * from the sector's bare arc (fullness 0) at the arc's middle, along the
 * chord's outward normal, where the bump `64 xi^3 (1 - xi)^3` is 1, so the
 * sector meets the ring there. The row is the ring's own shape at the
 * resolution of the leg's guides; what the eight guides cannot hold (a ring's
 * sharp corner) is the residual the section carries from the ring over the
 * span to the first landmark row.
 */
export namespace AutoMovieHumanLegRingRow {
  /** One ring as a row. */
  export interface IRow {
    /** The guides and fullness, in units of the girth over 2 pi. */
    shape: AutoMovieHumanLegGuides.IShape;

    /** The ring's taut girth, mm. */
    girth: number;
  }

  /** Half width of the angle window a guide's jet is read over, radians (12 degrees, as the landmark rows). */
  export const HALF_WINDOW: number = (12 * Math.PI) / 180;

  /** Samples of the window. */
  export const SAMPLES: number = 13;

  /**
   * The row of a ring.
   *
   * @param ring The ring in the section chart about the centre line, `[x, z]` mm, closed, counter-clockwise or not.
   * @returns The guides, the fullness and the girth.
   */
  export function of(ring: readonly [number, number][]): IRow {
    const girth: number = AutoMovieHumanLegHull.girth(ring);
    const unit: number = girth / (2 * Math.PI);
    const radius: (t: number) => number = (t: number): number => AutoMovieHumanPolarSection.radius(ring, [0, 0], t) / unit;

    // Each guide: a quadratic in the angle offset by least squares over the
    // window, r = a + b d + c d^2, so rho = a, rho' = b, rho'' = 2 c.
    const guides: AutoMoviePolarSector.IGuide[] = AutoMovieHumanLegGuides.ANGLES.map((angle: number): AutoMoviePolarSector.IGuide => {
      const d: number[] = Array.from({ length: SAMPLES }, (_: unknown, i: number): number => -HALF_WINDOW + (2 * HALF_WINDOW * i) / (SAMPLES - 1));
      const r: number[] = d.map((x: number): number => radius(angle + x));
      const [a, b, c]: [number, number, number] = quadratic(d, r);
      return { angle, value: a, slope: b, curvature: 2 * c };
    });

    // Each sector: the ring's offset from the bare arc at its middle.
    const ends: AutoMovieHumanChordArc.IEnd[] = guides.map((g: AutoMoviePolarSector.IGuide): AutoMovieHumanChordArc.IEnd => AutoMovieHumanGuidePublish.publish(g));
    const fullness: number[] = ends.map((a: AutoMovieHumanChordArc.IEnd, j: number): number => {
      const b: AutoMovieHumanChordArc.IEnd = ends[(j + 1) % ends.length]!;
      const p: number[] = AutoMovieHumanChordArc.jet(a, b, 0, 0.5)[0];
      const c: number[] = [b.point[0]! - a.point[0]!, b.point[1]! - a.point[1]!];
      const length: number = Math.hypot(c[0]!, c[1]!);
      const outward: number[] = [c[1]! / length, -c[0]! / length];
      const phi: number = Math.atan2(p[1]!, p[0]!);
      const q: number[] = [radius(phi) * Math.cos(phi), radius(phi) * Math.sin(phi)];
      return (q[0]! - p[0]!) * outward[0]! + (q[1]! - p[1]!) * outward[1]!;
    });
    return { shape: { guides, fullness }, girth };
  }
}

/** Least-squares `[a, b, c]` of `y = a + b x + c x^2` (normal equations, Cramer's rule). */
function quadratic(x: readonly number[], y: readonly number[]): [number, number, number] {
  const s: number[] = [0, 1, 2, 3, 4].map((k: number): number => x.reduce((sum: number, v: number): number => sum + v ** k, 0));
  const t: number[] = [0, 1, 2].map((k: number): number => x.reduce((sum: number, v: number, i: number): number => sum + v ** k * y[i]!, 0));
  const m: number[][] = [
    [s[0]!, s[1]!, s[2]!],
    [s[1]!, s[2]!, s[3]!],
    [s[2]!, s[3]!, s[4]!],
  ];
  const det: (a: number[][]) => number = (a: number[][]): number =>
    a[0]![0]! * (a[1]![1]! * a[2]![2]! - a[1]![2]! * a[2]![1]!) -
    a[0]![1]! * (a[1]![0]! * a[2]![2]! - a[1]![2]! * a[2]![0]!) +
    a[0]![2]! * (a[1]![0]! * a[2]![1]! - a[1]![1]! * a[2]![0]!);
  const d: number = det(m);
  const solve: (k: number) => number = (k: number): number => det(m.map((row: number[], i: number): number[] => row.map((v: number, j: number): number => (j === k ? t[i]! : v)))) / d;
  return [solve(0), solve(1), solve(2)];
}
