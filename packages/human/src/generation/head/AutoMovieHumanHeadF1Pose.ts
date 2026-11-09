import type { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanHeadF1Lines } from "./AutoMovieHumanHeadF1Lines";
import type { AutoMovieHumanHeadFrankfort } from "./AutoMovieHumanHeadFrankfort";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * f1's head pose in her reference's world (owner's order, 2026-11-08: match
 * every 2D line in absolute coordinates in her own pose first, then re-base
 * to the zero origin): the map `p_world = O + R p_head` from the head frame
 * (Frankfort about the tragia, +X forward, +Y up, +Z right) into her loaded
 * reference (mm, +X forward, +Y up, +Z to her right), and its exact inverse.
 *
 * Basis: the receipt `.shots/f1_head/measure-2026-11-08T03-22-03-851Z`
 * (`node:head-measure`, head.json `frame`): origin her tragia's midpoint in
 * native mm, and her Frankfort axes X, Y, Z in the native frame (FH 5.51
 * degrees chin-up; her CVA 58.9). The loaded reference negates the native Z
 * (`NodeHeadReference.load`), so the world map is `D (O + X h0 + Y h1 + Z h2)`
 * with `D = diag(1, 1, -1)`, the inverse of `NodeHeadReference.frankfort`'s
 * registration `h = M D (w) - M O` (M's rows X, Y, Z). The inverse here is
 * M's adjugate over its determinant, not its transpose, so the round trip
 * holds to machine precision even though the receipt's axes are orthonormal
 * only to its own rounding.
 *
 * The head's construction runs in her upright frame about the tragia (native
 * axes, `upright(p) = M^-1 p`), where the trunk's neck end is level; the
 * authored lines stay in the zero frame (`AutoMovieHumanHeadF1Lines`) and
 * pass through `upright` where they are consumed; `frankfort(q) = M q` is the
 * re-base.
 */
export namespace AutoMovieHumanHeadF1Pose {
  /** Her tragia's midpoint, native mm (receipt as above, frame.origin). */
  export const ORIGIN: Vec3 = [17.139806151390076, 1571.2178039550781, 0.15453577041625977];

  /** Her Frankfort axes in the native frame (receipt as above, frame.X, frame.Y, frame.Z): the rows of M. */
  export const AXES: readonly [Vec3, Vec3, Vec3] = [
    [0.9953746336416882, 0.09606717714773232, 0.0006604373864787151],
    [-0.09606228839937977, 0.9953608647482698, -0.005365228331637705],
    [-0.0011727958686910127, 0.005276969058318236, 0.9999853889669628],
  ];

  /** M's exact inverse (adjugate over determinant), columns-as-rows of the head-to-native rotation. */
  const INVERSE: readonly [Vec3, Vec3, Vec3] = ((): [Vec3, Vec3, Vec3] => {
    const [a, b, c] = AXES;
    const det: number = a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
    return [
      [(b[1] * c[2] - b[2] * c[1]) / det, (a[2] * c[1] - a[1] * c[2]) / det, (a[1] * b[2] - a[2] * b[1]) / det],
      [(b[2] * c[0] - b[0] * c[2]) / det, (a[0] * c[2] - a[2] * c[0]) / det, (a[2] * b[0] - a[0] * b[2]) / det],
      [(b[0] * c[1] - b[1] * c[0]) / det, (a[1] * c[0] - a[0] * c[1]) / det, (a[0] * b[1] - a[1] * b[0]) / det],
    ];
  })();

  /** Her FH's pitch against her native horizontal, radians (chin up positive): the rise of X. */
  export const PITCH: number = Math.atan2(AXES[0][1], Math.hypot(AXES[0][0], AXES[0][2]));

  /** Head frame to her world: `p_world = D (O + M^-1 p_head)`. */
  export function toWorld(p: Vec3): Vec3 {
    const R: readonly [Vec3, Vec3, Vec3] = INVERSE;
    const q: Vec3 = [0, 1, 2].map((i: number): number => ORIGIN[i]! + R[i]![0] * p[0] + R[i]![1] * p[1] + R[i]![2] * p[2]) as Vec3;
    return [q[0], q[1], -q[2]];
  }

  /** Her world to the head frame: `p_head = M (D p_world - O)`, `NodeHeadReference.frankfort`'s registration. */
  export function toHead(p: Vec3): Vec3 {
    const d: Vec3 = [p[0] - ORIGIN[0], p[1] - ORIGIN[1], -p[2] - ORIGIN[2]];
    return AXES.map((a: Vec3): number => a[0] * d[0] + a[1] * d[1] + a[2] * d[2]) as Vec3;
  }

  /** A head-frame point in her upright frame about the tragia (native axes): `M^-1 p`. */
  export function upright(p: readonly number[]): Vec3 {
    const R: readonly [Vec3, Vec3, Vec3] = INVERSE;
    return [0, 1, 2].map((i: number): number => R[i]![0] * p[0]! + R[i]![1] * p[1]! + R[i]![2] * p[2]!) as Vec3;
  }

  /** An upright point in the head frame: `M q`, the re-base. */
  export function frankfort(q: readonly number[]): Vec3 {
    return AXES.map((a: Vec3): number => a[0] * q[0]! + a[1] * q[1]! + a[2] * q[2]!) as Vec3;
  }

  /** A head-frame point in her loaded world (`toWorld`). */
  export function world(p: readonly number[]): Vec3 {
    return toWorld([p[0]!, p[1]!, p[2]!]);
  }

  /** A loaded-world point in the head frame (`toHead`). */
  export function head(w: readonly number[]): Vec3 {
    return toHead([w[0]!, w[1]!, w[2]!]);
  }

  /** A midsagittal slope dX/dY read in the head frame, read in the upright frame (null stays null). */
  export function slope(s: number | null): number | null {
    if (s === null) return null;
    const d: Vec3 = upright([s, 1, 0]);
    return d[0] / d[1];
  }

  /** The Frankfort frame's landmarks carried into the upright frame (points, records, measured pogonion and nape); dimensions and arcs are lengths and stay. */
  export function frame(f: AutoMovieHumanHeadFrankfort.IOutput): AutoMovieHumanHeadFrankfort.IOutput {
    const points: Record<AutoMovieHumanHeadFrankfort.Name, Vec3> = Object.fromEntries(Object.entries(f.points).map(([k, p]: [string, Vec3]): [string, Vec3] => [k, upright(p)])) as Record<AutoMovieHumanHeadFrankfort.Name, Vec3>;
    return {
      ...f,
      points,
      list: f.list.map((l: AutoMovieHumanHeadFrankfort.ILandmark): AutoMovieHumanHeadFrankfort.ILandmark => ({ ...l, point: upright(l.point) })),
      measured: { ...f.measured, pogonion: f.measured.pogonion === null ? null : upright(f.measured.pogonion), nape: f.measured.nape === null ? null : upright(f.measured.nape) },
    };
  }

  /** The largest coordinate error of `frankfort(upright(p))` against `p` over the given points, mm: the re-base's round trip. */
  export function roundTrip(points: readonly Vec3[]): number {
    return Math.max(0, ...points.map((p: Vec3): number => {
      const back: Vec3 = frankfort(upright(p));
      return Math.max(Math.abs(back[0] - p[0]), Math.abs(back[1] - p[1]), Math.abs(back[2] - p[2]));
    }));
  }

  /** One authored line: its name and its knots in the head frame. */
  export interface ILine {
    /** Line name. */
    name: string;

    /** Knots, head frame, mm. */
    knots: Vec3[];
  }

  /** The places the knots' frames read from the build: the stomion, the half bitragion, and the lateral outline's X at a height (the course's origin there). */
  export interface IPlaces {
    /** Stomion, head frame: the mouth frame's origin. */
    sto: Vec3;

    /** Half the bitragion breadth: the auricle frame's origin at +Z. */
    tragion: number;

    /** Head-frame X of the lateral outline's plane at a height above FH. */
    lateralX(y: number): number;
  }

  /**
   * Every `AutoMovieHumanHeadF1Lines` knot as a 3D line in the head frame:
   * the midlines (anterior, posterior, nose with the pronasale and labrale
   * inferius, throat, submental), the lateral outline on both sides, the
   * vermilion borders, both eyes' lid margins and creases, and both
   * auricles' plate edges.
   */
  export function lines(places: IPlaces): ILine[] {
    const L: typeof AutoMovieHumanHeadF1Lines = AutoMovieHumanHeadF1Lines;
    const out: ILine[] = [
      { name: "anterior", knots: L.ANTERIOR.map((k: AutoMovieHumanHeadF1Lines.IKnot): Vec3 => [k.at, k.y, 0]) },
      { name: "posterior", knots: L.POSTERIOR.map((k: AutoMovieHumanHeadF1Lines.IKnot): Vec3 => [k.at, k.y, 0]) },
      { name: "nose", knots: [L.PRONASALE, ...L.NOSE.map((k: { y: number; x: number }): Vec3 => [k.x, k.y, 0])] },
      { name: "lower lip", knots: [L.LOWER_LIP] },
      { name: "throat", knots: L.THROAT.map(([y, x]: [number, number]): Vec3 => [x, y, 0]) },
      { name: "submental", knots: L.SUBMENTAL.map(([x, y]: [number, number]): Vec3 => [x, y, 0]) },
    ];
    for (const sign of [1, -1]) {
      const side: string = sign > 0 ? "right" : "left";
      out.push({ name: `lateral ${side}`, knots: L.LATERAL.map((k: AutoMovieHumanHeadF1Lines.IKnot): Vec3 => [places.lateralX(k.y), k.y, sign * k.at]) });
      // The mouth's frame: origin the stomion, +Y up, |z| from the midline; the borders stand on the stomion's X.
      for (const border of ["upper", "lower"] as const) out.push({ name: `mouth ${border} ${side}`, knots: L.MOUTH[border].map(([z, h]: [number, number]): Vec3 => [places.sto[0], places.sto[1] + h, sign * z]) });
      // Each eye's frame: origin the fissure's centre, +Z lateral; the lid lines stand on the globe's front (`cornea`).
      const E: typeof AutoMovieHumanHeadF1Lines.EYE = L.EYE;
      for (const lid of ["upper", "lower", "crease"] as const) out.push({ name: `eye ${lid} ${side}`, knots: E[lid].map(([z, y]: [number, number]): Vec3 => [E.cornea, E.centre[1] + y, sign * (E.centre[2] + z)]) });
      // The auricle's frame: origin the tragion, axes `EAR_AXES` (the left mirrored across the midsagittal plane); the plate's lower and upper edges.
      const A: typeof AutoMovieHumanHeadF1Lines.EAR_AXES = L.EAR_AXES;
      const ear: (x: number, y: number) => Vec3 = (x: number, y: number): Vec3 => [A.x[0] * x + A.y[0] * y, A.x[1] * x + A.y[1] * y, sign * (places.tragion + A.x[2] * x + A.y[2] * y)];
      out.push({ name: `ear ${side}`, knots: [...L.EAR.map((k: [number, number, number, number]): Vec3 => ear(k[0], k[1])), ear(L.EAR_RIM[0], L.EAR_RIM[1]), ...[...L.EAR].reverse().map((k: [number, number, number, number]): Vec3 => ear(k[0], k[2]))] });
    }
    return out;
  }
}
