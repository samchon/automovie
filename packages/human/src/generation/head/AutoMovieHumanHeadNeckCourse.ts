import { AutoMovieViewAxis } from "@automovie/engine";

import type { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import type { AutoMovieHumanTrunkNeckBase } from "../trunk/AutoMovieHumanTrunkNeckBase";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;
type IJet = AutoMovieHumanTrunkNeckBase.IJet;

/** Samples of the drift's quintic step from the port to FH. */
const STEPS: number = 8;

/**
 * The course of the head/neck stream (S01) in the Frankfort head frame: level
 * (FH-parallel) section planes from the trunk's level end up to the vertex
 * pole, their origins drifting from the end's axis point onto the head axis
 * (`AutoMovieViewAxis.level`). The station is the height above FH.
 *
 * - Port: `f1_trunk`'s neck-base spec (`AutoMovieHumanTrunkNeckBase`) ends
 *   S00 level at the cervicale height; its plane, axis point, four extents
 *   and shoulder with their height jets are this stream's first section.
 * - Why level: with the port about 15 mm below the menton, a jointed course
 *   that leans forward has its concave side at the front, where the chin
 *   stands about 100 mm ahead of the course; the tube rule `k r < 1` then
 *   limits the lean to a few degrees and the turn back onto the head axis
 *   reaches above the glabella (measured 2026-11-08: the chain was
 *   inadmissible). Level sections carry the neck's lean in the outlines and
 *   the origin drift.
 * - Origin: x(y) the C2 quintic step from the port's axis point to zero (the
 *   head axis through the bitragion midpoint) at FH, zero from FH to the
 *   vertex, z = 0 (the midsagittal plane); carried by a natural cubic through
 *   its samples. The S00 axis is vertical at its end, so the first interior
 *   sample is solved for a zero slope at the port (the natural end already
 *   has zero curvature): the origin leaves the port along the trunk's axis to
 *   second order and the end's extent and shoulder jets carry over unchanged
 *   (C2 across the port).
 * Chart: `u = +X` (anterior), `v = +Z` (right).
 */
export namespace AutoMovieHumanHeadNeckCourse {
  /** What the course reads, head frame, mm. */
  export interface IInput {
    /** The trunk's end-section axis point (`AutoMovieHumanTrunkNeckBase.plane`'s origin), head frame. */
    origin: Vec3;

    /** The end section's extents along +u (throat), +v, -u (C7), -v with their height jets (`AutoMovieHumanTrunkNeckBase.extents`). */
    extents: readonly [IJet, IJet, IJet, IJet];

    /** The end section's conic shoulder with its height jet. */
    shoulder: IJet;

    /** Vertex, head frame. */
    vertex: Vec3;

    /** Menton, head frame: the height of the drift's middle knot. */
    menton: Vec3;
  }

  /** The course. */
  export interface IOutput {
    /** The level port: its axis point, the unit normal into the neck, the extents' values and the end's jets. */
    base: { centre: Vec3; normal: Vec3; front: number; back: number; lateral: number; extents: readonly [IJet, IJet, IJet, IJet]; shoulder: IJet };

    /** Station of the port (its height above FH), mm. */
    start: number;

    /** Station of the vertex pole (its height above FH), mm. */
    length: number;

    /** The axis (stations are heights in the frame `create` was given: add `shift` to a head-frame station). */
    axis: AutoMovieViewAxis.IAxis;

    /** Height of the head frame's FH in the frame `create` was given, mm: the station shift. */
    shift: number;

    /** Station whose section plane holds the head-frame point `p` (its height), and its offset along `u` from the origin there. */
    locate(p: Vec3): { station: number; offset: number };

    /** The section plane at a station in the head frame: origin on the course, `u` (anterior), `v` (lateral +Z). */
    frame(station: number): { origin: Vec3; u: Vec3; v: Vec3 };
  }

  /** Build the course; `root` places it (a translation of the head frame: level sections stay level only under one). */
  export function create(input: IInput, root: AutoMovieHumanArmCurveSpec.ITransform = { origin: [0, 0, 0], axes: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] }): IOutput {
    const y: number = input.origin[1];
    const x0: number = input.origin[0];
    if (!(input.menton[1] > y + 1)) throw new Error(`head course: the menton at ${input.menton[1].toFixed(1)} mm does not stand above the port at ${y.toFixed(1)} mm`);
    const jets: number[] = [...input.origin, ...input.extents.flat(), ...input.shoulder];
    if (!jets.every(Number.isFinite)) throw new Error(`head course: the trunk's neck-base spec is not finite (origin ${input.origin.join(", ")}; extents ${input.extents.map((e: IJet): string => e.join("/")).join(", ")}; shoulder ${input.shoulder.join("/")})`);
    root.axes.forEach((a: Vec3, i: number): void => {
      if (a.some((c: number, j: number): boolean => Math.abs(c - (i === j ? 1 : 0)) > 1e-9)) throw new Error("head course: the root must be a translation of the head frame (level sections)");
    });

    // The drift's knots with the menton's value free; its end slope at the
    // port is affine in that value, so two readings solve it exactly.
    // The drift's law: the C2 quintic step from the port's axis point to the
    // head axis at FH, x0 (1 - S(u)) with u = (s - y) / (0 - y) and
    // S = 10 u^3 - 15 u^4 + 6 u^5 (zero slope and curvature at both ends,
    // monotone between), and zero from FH to the vertex. The engine's level
    // axis is a natural cubic through knots, so the law is sampled at `STEPS`
    // even stations to FH, the first interior one solved for an exact zero
    // slope at the port, and zero at quarter steps from FH to the vertex. Two
    // knots alone (the menton's and FH's) overshot ahead of the head axis
    // above FH once the port moved back, and the pole's sections drew a fin
    // (render 2026-11-08 07:08, `head-2026-11-07T22-08-25-079Z`).
    const law: (s: number) => number = (s: number): number => {
      const u: number = (s - y) / (0 - y);
      return x0 * (1 - u * u * u * (10 + u * (-15 + 6 * u)));
    };
    const knots: (v: number, dx: number) => { station: number; value: number }[] = (v: number, dx: number): { station: number; value: number }[] => [
      { station: y, value: x0 + dx },
      { station: y + (0 - y) / STEPS, value: v + dx },
      ...Array.from({ length: STEPS - 2 }, (_: unknown, k: number): { station: number; value: number } => ({ station: y + ((0 - y) * (k + 2)) / STEPS, value: law(y + ((0 - y) * (k + 2)) / STEPS) + dx })),
      ...Array.from({ length: 5 }, (_: unknown, k: number): { station: number; value: number } => ({ station: (input.vertex[1] * k) / 4, value: dx })),
    ];
    const level: (v: number, dx: number, dy: number, dz: number) => AutoMovieViewAxis.IAxis = (v: number, dx: number, dy: number, dz: number): AutoMovieViewAxis.IAxis => {
      const x: { station: number; value: number }[] = knots(v, dx).map((k: { station: number; value: number }): { station: number; value: number } => ({ station: k.station + dy, value: k.value }));
      return AutoMovieViewAxis.level(x, x.map((k: { station: number }): { station: number; value: number } => ({ station: k.station, value: dz })));
    };
    const slope: (v: number) => number = (v: number): number => {
      const j: ReturnType<NonNullable<AutoMovieViewAxis.IAxis["jet"]>> | undefined = level(v, 0, 0, 0).jet?.(y);
      if (j === undefined || j === null) throw new Error("head course: the level axis gives no jet at the port");
      return j.first.origin[0]!;
    };
    const s0: number = slope(0);
    const s1: number = slope(1);
    if (!(Math.abs(s1 - s0) > 1e-12)) throw new Error("head course: the first drift sample does not move the port slope");
    const middle: number = -s0 / (s1 - s0);

    const local: AutoMovieViewAxis.IAxis = level(middle, 0, 0, 0);
    const shift: number = root.origin[1];
    const axis: AutoMovieViewAxis.IAxis = level(middle, root.origin[0], shift, root.origin[2]);
    const frame: (s: number) => { origin: Vec3; u: Vec3; v: Vec3 } = (s: number): { origin: Vec3; u: Vec3; v: Vec3 } => ({ origin: [local.at(s).origin[0]!, s, 0], u: [1, 0, 0], v: [0, 0, 1] });
    const e: readonly [IJet, IJet, IJet, IJet] = input.extents;
    return {
      base: { centre: [x0, y, 0], normal: [0, 1, 0], front: e[0][0], back: e[2][0], lateral: e[1][0], extents: e, shoulder: input.shoulder },
      start: y,
      length: input.vertex[1],
      axis,
      shift,
      locate(p: Vec3): { station: number; offset: number } {
        return { station: p[1], offset: p[0] - frame(p[1]).origin[0] };
      },
      frame,
    };
  }
}
