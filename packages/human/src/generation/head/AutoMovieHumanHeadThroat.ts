import type { IAutoMovieHumanHeadIdentity } from "../../structures/head/IAutoMovieHumanHeadIdentity";
import { AutoMovieHumanSex } from "../../typings/AutoMovieHumanSex";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanFairOutline } from "../arm/AutoMovieHumanFairOutline";
import type { AutoMovieHumanTrunkJointDatums } from "../trunk/AutoMovieHumanTrunkJointDatums";
import { AutoMovieHumanTrunkSpecLandmarks } from "../trunk/AutoMovieHumanTrunkSpecLandmarks";
import { AutoMovieHumanHeadF1Lines } from "./AutoMovieHumanHeadF1Lines";
import { AutoMovieHumanHeadF1Pose } from "./AutoMovieHumanHeadF1Pose";
import { AutoMovieHumanHeadFrankfort } from "./AutoMovieHumanHeadFrankfort";
import { AutoMovieHumanHeadPlacement } from "./AutoMovieHumanHeadPlacement";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * The anterior neck's midline contour in the side view, written once by its
 * owner (the head) and read by both streams that meet across it: the trunk's
 * S00 reads its front extent from it up to its level end, head.mass its
 * anterior outline from that end up to the chin. In f1 the throat-submental
 * corner stands at the cervicale height, where the trunk's level end cuts the
 * neck (measured 2026-11-08: the cervical point 2 mm below the end, the
 * fillet's lower end 13 mm below it), so the front continues across the end
 * only if both streams read this one contour.
 *
 * Three pieces in the midsagittal plane of the frame the inputs are given in
 * (+X anterior, +Y up):
 * 1. the throat line through IJ, leaning forward of the vertical by
 *    `CERVICOMENTAL - 90 degrees`;
 * 2. the submental line from the gnathion, backward and down at `SUBMENTAL`
 *    below the horizontal;
 * 3. at their corner C (the cervical point) the classic conic fillet of
 *    Liming's conic lofting: the rational quadratic whose ends lie on the two
 *    lines `FILLET` from C, whose middle control point is C and whose weight
 *    is the exact quarter ellipse's `1 / sqrt 2` (its shoulder point at the
 *    share `sqrt 2 - 1` of the corner diagonal from the chord's midpoint).
 * Both lines rise toward the chin, so the contour is single-valued in height;
 * it is G1 at the fillet's ends (a conic fillet's curvature jumps there).
 */
export namespace AutoMovieHumanHeadThroat {
  /**
   * Cervicomental angle, radians: the midpoint of Ellenbogen and Karlin's
   * youthful range 105-120 degrees (Plast Reconstr Surg 1980;66:826-837, read
   * through secondary sources). Those sources give two definitions; the one
   * used is the angle between the horizontal through the menton and the line
   * along the anterior neck, so the throat line leans `CERVICOMENTAL - 90
   * degrees` forward of the vertical. The other (between the submental and the
   * neck tangents) awaits the original paper.
   */
  export const CERVICOMENTAL: number = (112.5 * Math.PI) / 180;

  /** DEBT: the submental line's descent below the horizontal, backward from the gnathion, radians (no published norm read; f1's own value is to be measured on the reference by node:head-measure). */
  export const SUBMENTAL: number = (20 * Math.PI) / 180;

  /** DEBT: the throat fillet's tangent length from the cervical point along each line, mm (no published submental-neck radius read). */
  export const FILLET: number = 12;

  /** f1's throat fillet: its ends' distance from the crossing of the authored throat and the submental tangent, mm (a construction length under the submental lift, which carries her cervical point). */
  export const FILLET_F1: number = 16;

  /** The two points the contour is built from, in one frame (+X anterior, +Y up, midsagittal Z). */
  export interface IInput {
    /** Jugular notch (IJ), the throat line's foot. */
    ij: Vec3;

    /** Gnathion, the submental line's front end. */
    gn: Vec3;

    /** The person's head identity, for her measured submental inclination when given. */
    head?: IAutoMovieHumanHeadIdentity;

    /** The head frame's origin in the inputs' frame (a translation: the frames share their axes); f1's authored throat knots are head-frame places. Absent: the inputs are head-frame places. */
    offset?: Vec3;
  }

  /** The contour in the inputs' frame. */
  export interface IOutput {
    /** The throat line's forward lean from the vertical, radians. */
    lean: number;

    /** The submental line's descent below the horizontal, backward from the gnathion, radians. */
    submental: number;

    /** Jugular notch. */
    ij: Vec3;

    /** Gnathion. */
    gn: Vec3;

    /** The cervical point C: the corner of the throat and submental lines. */
    corner: Vec3;

    /** The fillet's end on the throat line. */
    from: Vec3;

    /** The fillet's shoulder point. */
    shoulder: Vec3;

    /** The fillet's end on the submental line. */
    to: Vec3;

    /**
     * The contour's forward place at a height and its first two derivatives
     * per mm of height, `[x, dx/dy, d2x/dy2]`, for any height up to the
     * gnathion's (the throat line continues below IJ).
     */
    at(y: number): [number, number, number];

    /** Basis of each piece. */
    basis: string[];

    /** The authored throat chain's forward place at a height, from IJ to her cervical point (the contour leaves it at `from`). */
    chain(y: number): number;

    /** Where the authored throat and the submental tangent cross (C'), in the inputs' frame. */
    crossing: Vec3;
  }

  /** Build the contour from IJ and the gnathion; throws when the lines do not meet between them or the fillet does not fit. */
  export function create(input: IInput): IOutput {
    // f1 first (owner, 2026-11-08 13:1x): the throat is f1's authored chain in the head frame (`AutoMovieHumanHeadF1Lines.THROAT`) from the trunk's IJ up to her cervical point, leaning `THROAT_LEAN` there, and the submental tangent from the gnathion (her measured inclination) meets it at the corner C'; a conic of weight 1/sqrt 2 joins them, tangent to the chain at `from` and to the line at `to`. Later algorithmization: the straight throat line through IJ at the cervicomental mean (`CERVICOMENTAL`) met the submental line at C, filleted by `FILLET`.
    const F: typeof AutoMovieHumanHeadF1Lines = AutoMovieHumanHeadF1Lines;
    const o: Vec3 = input.offset ?? [0, 0, 0];
    const lean: number = F.THROAT_LEAN;
    // Follow-up (main, 2026-11-08 22:06): her submental floor sags below this tangent from the gnathion: her menton (72.5, -101.0, head frame) stands 9.7 mm under it and her floor knots at x 55 and 63 7.6 and 8.8 mm under it (`AutoMovieHumanHeadF1Lines.SUBMENTAL`), while the 9 deg line already passes her C within 0.6 mm. Her floor makes heights -101 to -97.8 double-valued (chin front and floor), so no single front contour on level sections holds it; the floor needs a turned head course under the chin (sections normal to the floor there).
    // f1's authored submental floor line (`AutoMovieHumanHeadF1Lines.SUBMENTAL_INCLINATION`, through her menton and her sag's lowest place); later algorithmization: the person's measured submental tangent (`submentalInclination`), else `SUBMENTAL`.
    const measured: number = input.head?.submentalInclination !== undefined ? (input.head.submentalInclination * Math.PI) / 180 : SUBMENTAL;
    // The authored lines are zero-frame (Frankfort) values; the contour is built in her upright frame (`AutoMovieHumanHeadF1Pose`): the floor's direction and the throat's knots and lean pass through the pose's rotation.
    const floor: Vec3 = AutoMovieHumanHeadF1Pose.upright([-Math.cos(F.SUBMENTAL_INCLINATION), -Math.sin(F.SUBMENTAL_INCLINATION), 0]);
    const submental: number = Math.atan2(-floor[1], -floor[0]);
    const back: Vec3 = [-Math.cos(submental), -Math.sin(submental), 0];
    const { ij, gn } = input;
    const knots: AutoMovieHumanFairOutline.IKnot[] = [
      { q: ij[1], value: ij[0], slope: null },
      ...F.THROAT.map(([y, x]: [number, number], i: number): AutoMovieHumanFairOutline.IKnot => {
        const p: Vec3 = AutoMovieHumanHeadF1Pose.upright([x, y, 0]);
        return { q: p[1] + o[1], value: p[0] + o[0], slope: i === F.THROAT.length - 1 ? AutoMovieHumanHeadF1Pose.slope(Math.tan(lean)) : null };
      }),
    ];
    for (let i: number = 1; i < knots.length; ++i) if (!(knots[i]!.q > knots[i - 1]!.q)) throw new Error(`head throat: the authored throat knot at ${knots[i]!.q.toFixed(1)} mm does not stand above the one at ${knots[i - 1]!.q.toFixed(1)} mm (IJ at ${ij[1].toFixed(1)})`);
    const ys: number[] = knots.map((k: AutoMovieHumanFairOutline.IKnot): number => k.q);
    const jets: AutoMovieHumanFairOutline.IJet[] = AutoMovieHumanFairOutline.solve(knots);
    const chain: (y: number) => [number, number, number] = (y: number): [number, number, number] => AutoMovieHumanFairOutline.evaluate(ys, jets, y);
    const run: number = 1 / Math.tan(submental);
    const line: (y: number) => number = (y: number): number => gn[0] - (gn[1] - y) * run;
    // C': where the chain meets the submental tangent (bisection between IJ and the chain's top).
    let lo: number = ys[0]! + 1e-6;
    let hi: number = ys[ys.length - 1]!;
    if (!(chain(lo)[0] - line(lo) > 0) || !(chain(hi)[0] - line(hi) < 0)) throw new Error("head throat: the authored throat and the submental tangent do not cross between IJ and the cervical point");
    for (let k: number = 0; k < 60; ++k) {
      const mid: number = (lo + hi) / 2;
      if (chain(mid)[0] - line(mid) > 0) lo = mid;
      else hi = mid;
    }
    const cy: number = (lo + hi) / 2;
    // The conic's ends: on the chain `FILLET_F1` below C' (its own tangent there) and on the line `FILLET_F1` ahead of C'; its control point is where their tangents meet.
    const ya: number = cy - FILLET_F1 * Math.cos(lean);
    if (!(ya > ys[0]!)) throw new Error(`head throat: the throat fillet's lower end at ${ya.toFixed(1)} mm falls below IJ at ${ys[0]!.toFixed(1)} mm`);
    const [xa, ma]: [number, number, number] = chain(ya);
    const from: Vec3 = [xa, ya, 0];
    const to: Vec3 = [line(cy) - FILLET_F1 * back[0], cy - FILLET_F1 * back[1], 0];
    const ky: number = (gn[0] - gn[1] * run - xa + ma * ya) / (ma - run);
    const corner: Vec3 = [xa + ma * (ky - ya), ky, 0];
    if (!(corner[1] > from[1]) || !(to[1] > corner[1])) throw new Error("head throat: the throat fillet's control point does not stand between its ends");
    const w: number = Math.SQRT1_2;
    const shoulder: Vec3 = [(from[0] + 2 * w * corner[0] + to[0]) / (2 + 2 * w), (from[1] + 2 * w * corner[1] + to[1]) / (2 + 2 * w), 0];
    const conic: (y: number) => [number, number, number] = (y: number): [number, number, number] => {
      const t: number = parameter(from[1] - y, corner[1] - y, to[1] - y, w);
      const b: [number, number, number] = [(1 - t) * (1 - t), 2 * w * t * (1 - t), t * t];
      const d: [number, number, number] = [-2 * (1 - t), 2 * w * (1 - 2 * t), 2 * t];
      const e: [number, number, number] = [2, -4 * w, 2];
      const D: [number, number, number] = [b[0] + b[1] + b[2], d[0] + d[1] + d[2], e[0] + e[1] + e[2]];
      const coordinate: (k: 0 | 1) => [number, number, number] = (k: 0 | 1): [number, number, number] => {
        const n: [number, number, number] = [0, 1, 2].map((j: number): number => {
          const c: [number, number, number] = j === 0 ? b : j === 1 ? d : e;
          return c[0] * from[k] + c[1] * corner[k] + c[2] * to[k];
        }) as [number, number, number];
        const v: number = n[0] / D[0];
        const v1: number = (n[1] - v * D[1]) / D[0];
        const v2: number = (n[2] - 2 * v1 * D[1] - v * D[2]) / D[0];
        return [v, v1, v2];
      };
      const [x, x1, x2]: [number, number, number] = coordinate(0);
      const [, y1, y2]: [number, number, number] = coordinate(1);
      return [x, x1 / y1, (x2 * y1 - x1 * y2) / (y1 * y1 * y1)];
    };
    return {
      lean,
      submental,
      ij,
      gn,
      corner,
      from,
      shoulder,
      to,
      at(y: number): [number, number, number] {
        if (!(y <= gn[1] + 1e-9)) throw new RangeError(`head throat: height ${y.toFixed(2)} mm is above the gnathion at ${gn[1].toFixed(2)} mm`);
        if (y <= from[1]) return y >= ys[0]! ? chain(y) : [ij[0] + (y - ij[1]) * chain(ys[0]!)[1], chain(ys[0]!)[1], 0];
        if (y >= to[1]) return [line(y), run, 0];
        return conic(y);
      },
      basis: [
        `throat: f1's authored chain from IJ through ${F.THROAT.length} knots to her cervical point, leaning ${((lean * 180) / Math.PI).toFixed(1)} deg forward of the vertical there (her neck line)`,
        `submental line from the gnathion ${((submental * 180) / Math.PI).toFixed(1)} deg below the horizontal (f1's authored floor line through her menton and her sag's lowest place; the measured or declared tangent ${((measured * 180) / Math.PI).toFixed(1)} deg waits for the later algorithmization)`,
        `throat fillet: the conic of weight 1/sqrt 2 tangent to the chain and the line, ${FILLET_F1} mm from their crossing`,
      ],
      chain(y: number): number {
        return chain(Math.min(ys[ys.length - 1]!, Math.max(ys[0]!, y)))[0];
      },
      crossing: [line(cy), cy, 0],
    };
  }

  /** The contour in the trunk's thorax frame (origin IJ) for one person, from the same Frankfort frame and placement the head builds with. */
  export function of(measures: IAutoMovieHumanBodyMeasures, head: IAutoMovieHumanHeadIdentity, trunk: AutoMovieHumanTrunkJointDatums.IOutput): IOutput {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const female: boolean = measures.sex === AutoMovieHumanSex.Female;
    const frame: AutoMovieHumanHeadFrankfort.IOutput = AutoMovieHumanHeadF1Pose.frame(AutoMovieHumanHeadFrankfort.create({ head, stature: measures.stature, female }));
    const placement: AutoMovieHumanHeadPlacement.IOutput = AutoMovieHumanHeadPlacement.create(trunk, frame, measures.stature, female);
    const l: AutoMovieHumanTrunkSpecLandmarks.ILandmark = AutoMovieHumanTrunkSpecLandmarks.get(trunk.landmarks, "IJ");
    const ij: Vec3 = S.apply(S.inverse(trunk.frames.world("thorax")), S.apply(trunk.frames.world(l.frame), l.point));
    return create({ ij, gn: S.apply(placement.frame.relative, frame.points.gn), head, offset: S.apply(placement.frame.relative, [0, 0, 0]) });
  }

  /** A conic fillet at the corner `c` of two tangent lines leaving it along the unit directions `d1` and `d2`: its end on the first line, its shoulder point (the exact quarter ellipse's share `sqrt 2 - 1` of the corner diagonal from the chord's midpoint), its end on the second line. */
  export function fillet(c: Vec3, d1: Vec3, d2: Vec3, length: number): [Vec3, Vec3, Vec3] {
    const a: Vec3 = [c[0] + length * d1[0], c[1] + length * d1[1], 0];
    const b: Vec3 = [c[0] + length * d2[0], c[1] + length * d2[1], 0];
    const m: Vec3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0];
    const rho: number = Math.SQRT2 - 1;
    return [a, [m[0] + rho * (c[0] - m[0]), m[1] + rho * (c[1] - m[1]), 0], b];
  }

  /** The rational quadratic's parameter in [0, 1] where its height reaches the given one: the root of `(1-t)^2 a0 + 2 w t (1-t) a1 + t^2 a2` with the control heights `a` measured from that height (`a0 <= 0 <= a2`). */
  function parameter(a0: number, a1: number, a2: number, w: number): number {
    const A: number = a0 - 2 * w * a1 + a2;
    const B: number = 2 * (w * a1 - a0);
    const C: number = a0;
    if (Math.abs(A) < 1e-12) return Math.min(1, Math.max(0, -C / B));
    const d: number = Math.sqrt(Math.max(0, B * B - 4 * A * C));
    const q: number = -(B + (B >= 0 ? d : -d)) / 2;
    const roots: number[] = [q / A, q !== 0 ? C / q : NaN];
    const t: number | undefined = roots.find((x: number): boolean => x >= -1e-9 && x <= 1 + 1e-9);
    if (t === undefined) throw new Error(`head throat: no fillet parameter for the control heights ${a0.toFixed(3)}, ${a1.toFixed(3)}, ${a2.toFixed(3)}`);
    return Math.min(1, Math.max(0, t));
  }
}
