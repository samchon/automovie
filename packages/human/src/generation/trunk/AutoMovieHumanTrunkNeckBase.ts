import { type AutoMovieLoftFrame, AutoMovieViewSection } from "@automovie/engine";

import { AutoMovieHumanBackProfile } from "../AutoMovieHumanBackProfile";
import type { IAutoMovieHumanBodyMeasures } from "../IAutoMovieHumanBodyMeasures";
import { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanFairOutline } from "../arm/AutoMovieHumanFairOutline";
import type { AutoMovieHumanHeadThroat } from "../head/AutoMovieHumanHeadThroat";
import { AutoMovieHumanTrunkComposedSection } from "./AutoMovieHumanTrunkComposedSection";
import type { AutoMovieHumanTrunkSegmentFrames } from "./AutoMovieHumanTrunkSegmentFrames";
import { AutoMovieHumanTrunkSpecLandmarks } from "./AutoMovieHumanTrunkSpecLandmarks";
import type { AutoMovieHumanTrunkViewCurves } from "./AutoMovieHumanTrunkViewCurves";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * The neck-base spec the head's neck continues from, written once by its
 * owner (the trunk) and read by the head through the thorax frame:
 *
 * 1. S00's open top end, the level section at the cervicale height, where
 *    C7 and both side neck points stand (ANSUR): its centre, its four
 *    extents and shoulder with their first and second derivatives per mm of
 *    height (the S00 view curves' own, so the neck can continue it C2), and
 *    its ring. The chart is +u = +X anterior, +v = +Z right.
 * 2. The ISO 8559-1 5.3.3 neck-base loop as a curve on S00 over C7, both
 *    side neck points and IJ: at phase `phi` about the section axis its height
 *    is the top less the IJ drop times `w(phi) = cos(phi)^3` on the front half
 *    (zero, with zero slope and curvature, at the side neck points and over
 *    the back), so the loop is C2 and dips to IJ only in front; its points are
 *    S00's own composed section there (the loop's shape between its named
 *    points is a declared construction, drawn for the head). The girth's
 *    check is the taut tape through the same four points ({@link tape}).
 * The end's front extent is f1_head's throat contour
 * (`AutoMovieHumanHeadThroat`), which S00's anterior outline reads with its
 * value, slope and curvature; the trunk keeps no second definition of it.
 *
 * The oblique planar C7-IJ end was tried and crushes the shoulder line: the
 * ISO loop is a saddle, its side neck points 34 mm above that plane.
 */
export namespace AutoMovieHumanTrunkNeckBase {
  /** A scalar's value and its first two derivatives per mm of height. */
  export type IJet = [number, number, number];

  /** The level end section alone, readable without building S00 ({@link end}). */
  export interface IEnd {
    /** The end section's height (S00's top station), mm. */
    station: number;

    /** The end section's plane in the world: origin (the section's axis point), u (+X), v (+Z). */
    plane: AutoMovieLoftFrame.IFrame;

    /** The plane's unit normal (+Y): the direction the neck continues along. */
    normal: Vec3;

    /** The end section's axis point in the thorax frame, mm. */
    origin: Vec3;

    /** Extents from the axis point along +u (throat), +v (right SNP), -u (C7), -v (left SNP), with their height jets. */
    extents: [IJet, IJet, IJet, IJet];

    /** Conic shoulder with its height jet. */
    shoulder: IJet;

    /** The end section's world points at `n` uniform phases from +u toward +v. */
    ring(n: number): Vec3[];
  }

  /**
   * The level end alone from the datums S00 fixes there, without building
   * S00 (microseconds): every outline's top knot fixes its value, slope and
   * curvature (the throat contour's jet; VP's lean with zero curvature, the
   * cervicothoracic inflection; the side neck point's half breadth with zero
   * slope and curvature; the ellipse shoulder with zero slope and curvature;
   * no departure), so the fair outlines pass them exactly and this equals
   * {@link of}'s end on a built S00.
   */
  export function end(frames: AutoMovieHumanTrunkSegmentFrames.IOutput, landmarks: AutoMovieHumanTrunkSpecLandmarks.IOutput, measures: IAutoMovieHumanBodyMeasures, throat: AutoMovieHumanHeadThroat.IOutput): IEnd {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const at: (name: string) => Vec3 = (name: string): Vec3 => {
      const l: AutoMovieHumanTrunkSpecLandmarks.ILandmark = AutoMovieHumanTrunkSpecLandmarks.get(landmarks, name);
      return S.apply(frames.world(l.frame), l.point);
    };
    const s: number = measures.cervicaleHeight;
    const ij: Vec3 = at("IJ");
    // The end's axis point: the neck's centre, the X midpoint of C7 and IJ (S00's course ends there).
    const xs: number = (ij[0] + at("C7")[0]) / 2;
    const vp: AutoMovieHumanBackProfile.IKnot | undefined = AutoMovieHumanBackProfile.of(measures).knots.find((k: AutoMovieHumanBackProfile.IKnot): boolean => k.name === "cervicale");
    const [tx, t1, t2] = throat.at(s - ij[1]);
    const half: number = at("side neck point.right")[2];
    const extents: [IJet, IJet, IJet, IJet] = [[ij[0] + tx - xs, t1, t2], [half, 0, 0], [xs - at("C7")[0], -(vp?.slope ?? NaN), 0], [half, 0, 0]];
    const shoulder: IJet = [AutoMovieViewSection.ELLIPSE, 0, 0];
    const plane: AutoMovieLoftFrame.IFrame = { origin: [xs, s, 0], u: [1, 0, 0], v: [0, 0, 1] };
    const section: AutoMovieViewSection.ISection = AutoMovieViewSection.bare({ extents: [extents[0][0], extents[1][0], extents[2][0], extents[3][0]] }, [shoulder[0], shoulder[0], shoulder[0], shoulder[0]]);
    return {
      station: s,
      plane,
      normal: [0, 1, 0],
      origin: S.apply(S.inverse(frames.world("thorax")), plane.origin as Vec3),
      extents,
      shoulder,
      ring: (n: number): Vec3[] => ring(section, plane, n),
    };
  }

  /** The neck-base spec on a built S00: the end and the ISO loop. */
  export interface IOutput extends IEnd {
    /** The ISO neck-base loop's world points at `n` uniform phases. */
    loop(n: number): Vec3[];

    /** The loop's length ({@link LOOP_POINTS}-gon) against the neck-base girth input, mm. */
    girth: { loop: number; input: number };

    /** Basis of each quantity. */
    basis: string[];
  }

  /** Build the spec from the trunk frames and the S00 view curves. */
  export function of(frames: AutoMovieHumanTrunkSegmentFrames.IOutput, curves: AutoMovieHumanTrunkViewCurves.IOutput, neckBaseGirth: number, ij: Vec3): IOutput {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const s: number = curves.top;
    const read: (knots: AutoMovieHumanTrunkViewCurves.IKnot[]) => IJet = (knots: AutoMovieHumanTrunkViewCurves.IKnot[]): IJet =>
      AutoMovieHumanFairOutline.evaluate(
        knots.map((k: AutoMovieHumanTrunkViewCurves.IKnot): number => k.q),
        knots.map((k: AutoMovieHumanTrunkViewCurves.IKnot): AutoMovieHumanFairOutline.IJet => k.jet),
        s,
      );
    const anterior: IJet = read(curves.outlines.anterior);
    const posterior: IJet = read(curves.outlines.posterior);
    const lateral: IJet = read(curves.outlines.lateral);
    const shoulder: IJet = read(curves.fullness);
    const extents: [IJet, IJet, IJet, IJet] = [anterior, lateral, [-posterior[0], -posterior[1], -posterior[2]], lateral];
    const plane: AutoMovieLoftFrame.IFrame = curves.axis.turn.frame(s);
    const wall: AutoMovieHumanTrunkComposedSection.IInputs = AutoMovieHumanTrunkComposedSection.inputs(curves.source, s);
    const section: AutoMovieViewSection.ISection = AutoMovieViewSection.bare({ extents: wall.extents }, AutoMovieHumanTrunkComposedSection.shoulders(wall));
    const loopAt: (n: number) => Vec3[] = (n: number): Vec3[] => loop(curves.source, curves.axis.xs, s, ij[1], n);
    return {
      station: s,
      plane,
      normal: [0, 1, 0],
      origin: S.apply(S.inverse(frames.world("thorax")), plane.origin as Vec3),
      extents,
      shoulder,
      ring: (n: number): Vec3[] => ring(section, plane, n),
      loop: loopAt,
      girth: { loop: length(loopAt(LOOP_POINTS)), input: neckBaseGirth },
      basis: [
        "end: level at the cervicale height (ANSUR II on stature), C7 and both side neck points on it (side neck height, ANSUR 1988, 0.4 mm below for f1)",
        "C7 (back extent): behind IJ by the neck-base loop's plan diameter (AutoMovieHumanTrunkNeckBasePlan, input gap: neck-base depth; the chest-depth closure through C7 ran away for want of a sternal line)",
        "SNP (lateral extent): the plan's radius (input gap: neck base breadth); shoulder: the ellipse value at the end (the front quarters' supraclavicular departures vanish there)",
        "throat (front extent): f1_head's throat contour (AutoMovieHumanHeadThroat) at the end, value, slope and curvature",
        "ISO loop: S00's own section heights dipping to IJ in front by cos^3 of the phase (declared shape between the named points); its length checks the girth",
      ],
    };
  }

  /** Points of the loop's length reading (a 256-gon: its chord error is below 0.01 mm on this loop). */
  export const LOOP_POINTS: number = 256;

  /**
   * The ISO neck-base loop on a composed source: at phase `phi` about the
   * section axis its height is the top less the IJ drop times `cos(phi)^3`
   * on the front half (zero, with zero slope and curvature, at the side neck
   * points and over the back), its point the source's own section there; so
   * its front point is IJ, its rear point C7 and its side points the side
   * neck points at the top.
   */
  export function loop(source: AutoMovieHumanTrunkComposedSection.ISource, xs: number, top: number, ijY: number, n: number): Vec3[] {
    const drop: number = top - ijY;
    return Array.from({ length: n }, (_: unknown, k: number): Vec3 => {
      const phi: number = (2 * Math.PI * k) / n;
      const c: number = Math.cos(phi);
      const y: number = top - drop * (c > 0 ? c * c * c : 0);
      const r: number = AutoMovieHumanTrunkComposedSection.radius(source, y, phi);
      return [(source.axis?.(y) ?? xs) + r * c, y, r * Math.sin(phi)];
    });
  }

  /** A level section's world points at `n` uniform phases from +u toward +v. */
  function ring(section: AutoMovieViewSection.ISection, plane: AutoMovieLoftFrame.IFrame, n: number): Vec3[] {
    return Array.from({ length: n }, (_: unknown, k: number): Vec3 => {
      const phi: number = (2 * Math.PI * k) / n;
      const r: number = AutoMovieViewSection.radius(section, phi)[0];
      return [plane.origin[0]! + r * Math.cos(phi), plane.origin[1]!, plane.origin[2]! + r * Math.sin(phi)];
    });
  }

  /** A tape reading: the girth, its four legs (C7-right SNP, right SNP-IJ, IJ-left SNP, left SNP-C7), the path and its greatest lift off the skin. */
  export interface ITape {
    /** The tape's length, mm. */
    girth: number;

    /** Each leg's length, mm, in the path's order. */
    legs: [number, number, number, number];

    /** The path's world points (`n` per leg, each leg's start included). */
    points: Vec3[];

    /** The greatest distance of a path point outside the skin along its level radius, mm (0 for a tape held on the skin). */
    lift: number;

    /** Sweeps spent over every level and leg. */
    sweeps: number;
  }

  /**
   * The ISO 8559-1 5.3.3 neck-base girth as a tape laid around S00 through
   * C7 (the end's back, phase pi), the right side neck point (phase pi / 2),
   * IJ (phase 0 at its height), the left side neck point and back to C7.
   *
   * A tape is taut: between its named points it takes the shortest path that
   * does not enter the body, so it bridges every concavity along its way (the
   * convex hull's surface where it touches the skin, straight spans across a
   * hollow). With `bridge` false it is held on the skin instead (the surface
   * geodesic), which follows each hollow and reads long wherever the skin is
   * concave along the path; the two agree where the skin is convex along it.
   *
   * Each leg ({@link leg}) is a polyline in the chart (height `y` at most the
   * end's, phase `phi`, lift `d >= 0` outside the composed skin along the
   * level radius: the point `axis(y) + (r(y, phi) + d) (cos phi, sin phi)`
   * plus the reliefs' displacement there, which covers the space outside
   * S00's sections one to one while the reliefs keep them star-shaped). The
   * polyline minimises the energy of its spans, `sum |p_(k+1) - p_k|^2`: under
   * fixed ends and the same constraint its minimiser is the shortest path with
   * equal spans (Cauchy-Schwarz, `L^2 <= n E`, equal only for equal spans), so
   * no long span can cut through the body, which a length descent allows by
   * bunching its points. The mirror legs are relaxed independently, so their
   * agreement is the reading's own check.
   *
   * Debt (supervisor decision 2026-11-08): the girth closes on the plan
   * (`AutoMovieHumanTrunkNeckBasePlan`), whose landmarks admit it (f1: the
   * least tape through them, 345.4 mm, against 356.2), but not on S00. The
   * tape over S00 reads 411.15 (f1) and 429.08 (the changed person) because
   * its band from IJ to the end makes the path detour forward: right below
   * the side neck point the lateral outline flares to the shoulder line, the
   * end's front is f1_head's throat 35 mm ahead of IJ, and the front quarters
   * between them are single convex conics that fill the supraclavicular
   * hollow (front legs 130.05 mm against the plan's 102.57). Hollows carved
   * in the front quarter could not close it (08:48: 391.3 at a 30 mm bound,
   * the SCM line cut 27 mm). The orthodox fix is a neck-column piece composed
   * into the band's sections by an engine union, scheduled with the head-trunk
   * integration.
   */
  export function tape(source: AutoMovieHumanTrunkComposedSection.ISource, xs: number, top: number, ijY: number, bridge: boolean = true, n: number = 32, tolerance: number = TAPE_TOLERANCE): ITape {
    const ends: [number, number][] = [[top, Math.PI], [top, Math.PI / 2], [ijY, 0], [top, -Math.PI / 2], [top, -Math.PI]];
    const points: Vec3[] = [];
    const legs: number[] = [];
    let lift: number = 0;
    let sweeps: number = 0;
    for (let k: number = 0; k < 4; ++k) {
      const one: ITape = leg(source, xs, top, ends[k]!, ends[k + 1]!, bridge, n, tolerance);
      points.push(...one.points);
      legs.push(one.girth);
      lift = Math.max(lift, one.lift);
      sweeps += one.sweeps;
    }
    return { girth: legs[0]! + legs[1]! + legs[2]! + legs[3]!, legs: [legs[0]!, legs[1]!, legs[2]!, legs[3]!], points, lift, sweeps };
  }

  /**
   * One leg of the tape between two chart points `[y, phi]` on the skin; its
   * reading's `girth` is the leg's length and `legs` repeats it.
   *
   * Nested iteration (coarse to fine, the textbook cure for the slow smooth
   * modes of Gauss-Seidel): 2 spans, converged, then each span halved, up to
   * `n` spans. Each sweep moves every inner point by the Gauss-Newton step of
   * its spans' energy, which aims at `m`, the midpoint of its neighbours: the
   * chart step `delta` solves `(J^T J) delta = J^T (m - p)` with `J` the
   * point's derivatives in height, phase and lift (central differences in
   * height and phase, the radius in lift), over-relaxed by
   * {@link TAPE_RELAXATION} (successive over-relaxation, Young 1950) and
   * projected: the height held at most the end's, a lift that would go below
   * the skin set on it with the height and phase step re-solved there. A
   * level stops when no point moves more than `tolerance`.
   */
  export function leg(source: AutoMovieHumanTrunkComposedSection.ISource, xs: number, top: number, from: [number, number], to: [number, number], bridge: boolean = true, n: number = 32, tolerance: number = TAPE_TOLERANCE): ITape {
    const at: (y: number, phi: number, d: number) => Vec3 = (y: number, phi: number, d: number): Vec3 => {
      const r: number = AutoMovieHumanTrunkComposedSection.radius(source, y, phi) + d;
      const [dx, dz] = AutoMovieHumanTrunkComposedSection.displacement(source, y, phi);
      return [(source.axis?.(y) ?? xs) + r * Math.cos(phi) + dx, y, r * Math.sin(phi) + dz];
    };
    let chart: [number, number, number][] = [[from[0], from[1], 0], [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, 0], [to[0], to[1], 0]];
    let sweeps: number = 0;
    for (;;) {
      const world: Vec3[] = chart.map((c: [number, number, number]): Vec3 => at(...c));
      for (let sweep: number = 0; sweep < TAPE_SWEEPS; ++sweep) {
        ++sweeps;
        let moved: number = 0;
        for (let k: number = 1; k < chart.length - 1; ++k) {
          const [y, phi, d] = chart[k]!;
          const p: Vec3 = world[k]!;
          const u: Vec3 = world[k - 1]!;
          const w: Vec3 = world[k + 1]!;
          const e: Vec3 = [(u[0] + w[0]) / 2 - p[0], (u[1] + w[1]) / 2 - p[1], (u[2] + w[2]) / 2 - p[2]];
          const vy: Vec3 = sub(at(y + 0.05, phi, d), at(y - 0.05, phi, d), 0.1);
          const vp: Vec3 = sub(at(y, phi + 5e-4, d), at(y, phi - 5e-4, d), 1e-3);
          const vd: Vec3 = [Math.cos(phi), 0, Math.sin(phi)];
          let step: [number, number, number] = bridge ? solve3(vy, vp, vd, e) : [...solve2(vy, vp, e), 0];
          if (d + TAPE_RELAXATION * step[2] < 0) {
            // Onto the skin, then the best height and phase step from there.
            const e0: Vec3 = [e[0] + d * vd[0], e[1], e[2] + d * vd[2]];
            step = [...solve2(vy, vp, e0), -d / TAPE_RELAXATION];
          }
          const next: [number, number, number] = [Math.min(top, y + TAPE_RELAXATION * step[0]), phi + TAPE_RELAXATION * step[1], Math.max(0, d + TAPE_RELAXATION * step[2])];
          const q: Vec3 = at(...next);
          moved = Math.max(moved, Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]));
          chart[k] = next;
          world[k] = q;
        }
        if (moved < tolerance) break;
      }
      if (chart.length - 1 >= n) {
        let sum: number = 0;
        let lift: number = 0;
        for (let k: number = 0; k < chart.length - 1; ++k) {
          const a: Vec3 = world[k]!;
          const b: Vec3 = world[k + 1]!;
          sum += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
          lift = Math.max(lift, chart[k]![2]);
        }
        return { girth: sum, legs: [sum, sum, sum, sum], points: world.slice(0, -1), lift, sweeps };
      }
      // Halve every span in the chart.
      chart = chart.flatMap((c: [number, number, number], k: number): [number, number, number][] => {
        const d: [number, number, number] | undefined = chart[k + 1];
        return d === undefined ? [c] : [c, [(c[0] + d[0]) / 2, (c[1] + d[1]) / 2, (c[2] + d[2]) / 2]];
      });
    }
  }

  /** A tape level's stop: the largest point move in one sweep, mm. */
  export const TAPE_TOLERANCE: number = 1e-4;

  /** A tape level's most sweeps. */
  export const TAPE_SWEEPS: number = 4000;

  /**
   * The tape's relaxation factor: 1, plain Gauss-Seidel, which lowers the
   * span energy at every step. Over-relaxed at 1.6 (2026-11-08 08:48 render)
   * the right front leg crossed the midline and read 461 mm against its mirror's
   * 120 over deep reliefs, so the faster factor is not admitted.
   */
  export const TAPE_RELAXATION: number = 1;

  /** The least-squares step `x` of `[a b c] x = e` (normal equations by Cramer's rule); zero when singular. */
  function solve3(a: Vec3, b: Vec3, c: Vec3, e: Vec3): [number, number, number] {
    const m: number[][] = [
      [dot(a, a), dot(a, b), dot(a, c)],
      [dot(a, b), dot(b, b), dot(b, c)],
      [dot(a, c), dot(b, c), dot(c, c)],
    ];
    const r: number[] = [dot(a, e), dot(b, e), dot(c, e)];
    const det: (x: number[][]) => number = (x: number[][]): number =>
      x[0]![0]! * (x[1]![1]! * x[2]![2]! - x[1]![2]! * x[2]![1]!) - x[0]![1]! * (x[1]![0]! * x[2]![2]! - x[1]![2]! * x[2]![0]!) + x[0]![2]! * (x[1]![0]! * x[2]![1]! - x[1]![1]! * x[2]![0]!);
    const d: number = det(m);
    if (!(Math.abs(d) > 1e-12)) return [0, 0, 0];
    const column: (j: number) => number = (j: number): number => det(m.map((row: number[], i: number): number[] => row.map((v: number, k: number): number => (k === j ? r[i]! : v)))) / d;
    return [column(0), column(1), column(2)];
  }

  /** The least-squares step `x` of `[a b] x = e`; zero when singular. */
  function solve2(a: Vec3, b: Vec3, e: Vec3): [number, number] {
    const aa: number = dot(a, a);
    const ab: number = dot(a, b);
    const bb: number = dot(b, b);
    const d: number = aa * bb - ab * ab;
    if (!(Math.abs(d) > 1e-12)) return [0, 0];
    const ae: number = dot(a, e);
    const be: number = dot(b, e);
    return [(bb * ae - ab * be) / d, (aa * be - ab * ae) / d];
  }

  /** The dot product. */
  function dot(a: Vec3, b: Vec3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** `(a - b) / h`, the central difference of two points. */
  function sub(a: Vec3, b: Vec3, h: number): Vec3 {
    return [(a[0] - b[0]) / h, (a[1] - b[1]) / h, (a[2] - b[2]) / h];
  }

  /** Length of a closed polygon, mm. */
  export function length(points: readonly Vec3[]): number {
    let sum: number = 0;
    for (let k: number = 0; k < points.length; ++k) {
      const a: Vec3 = points[k]!;
      const b: Vec3 = points[(k + 1) % points.length]!;
      sum += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    }
    return sum;
  }
}
