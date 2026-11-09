import { AutoMovieViewSection, type IAutoMovieLoftRelief } from "@automovie/engine";

import type { AutoMovieHumanArmCurveSpec } from "../arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanFairOutline } from "../arm/AutoMovieHumanFairOutline";
import { AutoMovieHumanHeadF1Lines } from "./AutoMovieHumanHeadF1Lines";
import { AutoMovieHumanHeadF1Pose } from "./AutoMovieHumanHeadF1Pose";
import type { AutoMovieHumanHeadFrankfort } from "./AutoMovieHumanHeadFrankfort";
import { AutoMovieHumanHeadMassCurves } from "./AutoMovieHumanHeadMassCurves";
import type { AutoMovieHumanHeadNeckCourse } from "./AutoMovieHumanHeadNeckCourse";

type Vec3 = AutoMovieHumanArmCurveSpec.Vec3;
type Knot = AutoMovieHumanHeadMassCurves.IKnot;

/**
 * The orbits and the malar eminences as reliefs over head.mass, one each per
 * side, in the Frankfort head frame (+X forward, +Y up, +Z right).
 *
 * Orbit: the skin inside the bony orbital opening drapes over the globe. The
 * opening is an ellipse of the women's orbital breadth and height
 * (`ORBIT`), its lowest point orbitale on FH (FH's own definition), its
 * centre over the palpebral fissure's centre (half the public intercanthal
 * width plus half this side's public fissure length). The globe's front is
 * the paraboloid `x = x_c + LID - rho^2 / (2 GLOBE)` about the corneal apex
 * `x_c` (Bekerman 2014's axial radius; the paraboloid is the sphere's
 * osculating approximation), the apex `HERTEL` ahead of the lateral orbital
 * rim's skin (Hertel exophthalmometry, women), read as head.mass's surface at
 * the opening's lateral end. The relief pushes the base point back by
 * `R(x_b - front) * W(u)`, `R` the C2 ramp, `u` the elliptical radius over
 * the opening, `W(u) = (1 - u^2)^3`: the skin follows the globe where the mass
 * stands ahead of it and joins the mass at the rim with zero value, slope and
 * curvature.
 *
 * Malar eminence: Hinderer's construction (1975): the line from the alar base
 * to the tragion and the line from the lateral canthus to the oral commissure
 * cross below the eminence, which lies in their upper outer quadrant; the
 * relief is a bump `MALAR` high (DEBT) of radius `MALAR_RADIUS` (DEBT) centred
 * `MALAR_OFFSET` (DEBT) up and out from that crossing in the front view,
 * pushed along the section's outward radial direction there.
 *
 * Nets follow the sampling rule (`AutoMovieHumanHeadJawRelief`): spans no
 * wider than `SPACING`, controls at Greville abscissae, three outer rings
 * zero (C2 edges).
 */
export namespace AutoMovieHumanHeadMidfaceRelief {
  /** Women's bony orbital breadth and height, mm: 39.2 and 32.7 (166 skulls, 332 orbits; journals.indexcopernicus.com 1107376, means of both sides). */
  export const ORBIT: [number, number] = [39.2, 32.7];

  /** Globe's axial radius, mm: half of 23.56 (Bekerman 2014 Table 1, emmetropic, as in `AutoMovieHumanHeadEyeParts`). */
  export const GLOBE: number = 23.56 / 2;

  /** Corneal apex ahead of the lateral orbital rim, women, mm: 15.3 (Hertel exophthalmometry: Turkish 15.2, Brazilian 15.42, Japanese 15.1). */
  export const HERTEL: number = 15.3;

  /** DEBT: the closed lids' thickness over the cornea, mm (no published value read). */
  export const LID: number = 1;

  /** DEBT: the malar eminence's soft-tissue projection over head.mass, mm. */
  export const MALAR: number = 3;

  /** DEBT: the malar eminence's radius, mm. */
  export const MALAR_RADIUS: number = 16;

  /** DEBT: the eminence's centre up and out from Hinderer's crossing, mm. */
  export const MALAR_OFFSET: [number, number] = [6, 6];

  /** Net spacing, mm: a quarter of the narrowest edge (the orbit's falloff over its half height). */
  export const SPACING: number = 2;

  /** The lid margin's roll across the fissure's edge, mm (f1's authored eye: the skin turns from the lid's front onto the globe over this width). */
  export const EYE_ROLL: number = 2.4;

  /** The eye's net spacing: a quarter of `EYE_ROLL` (the sampling rule). */
  export const EYE_SPACING: number = EYE_ROLL / 4;

  /** The deepest the eye's relief pushes the mass back, mm (f1's authored eye: the push saturates smoothly toward it). */
  export const EYE_DEPTH: number = 5;

  /** The upper lid crease's groove, f1's authored eye: depth and half width, mm. */
  export const CREASE: [number, number] = [0.8, 1.6];

  /** A fair chain through authored knots `[z, y]`, held at its end values beyond them. */
  function chain(knots: [number, number][]): (z: number) => number {
    const zs: number[] = knots.map((k: [number, number]): number => k[0]);
    const jets: AutoMovieHumanFairOutline.IJet[] = AutoMovieHumanFairOutline.solve(knots.map((k: [number, number]): AutoMovieHumanFairOutline.IKnot => ({ q: k[0], value: k[1], slope: null })));
    return (z: number): number => AutoMovieHumanFairOutline.evaluate(zs, jets, Math.min(zs[zs.length - 1]!, Math.max(zs[0]!, z)))[0];
  }

  /** The C2 quintic smoothstep on [0, 1], clamped outside. */
  function smoothstep(t: number): number {
    const x: number = Math.min(1, Math.max(0, t));
    return x * x * x * (10 + x * (-15 + 6 * x));
  }

  /** What the reliefs read, head frame. */
  export interface IInput {
    /** Frankfort frame, landmarks and dimensions. */
    head: AutoMovieHumanHeadFrankfort.IOutput;

    /** The course. */
    course: AutoMovieHumanHeadNeckCourse.IOutput;

    /** Vertex station, mm. */
    length: number;

    /** head.mass's outlines. */
    outlines: Record<AutoMovieHumanHeadMassCurves.Label, Knot[]>;

    /** head.mass's fullness laws. */
    fullness: { anterior: Knot[]; posterior: Knot[] };
  }

  /** The base surface at a station: its section and origin. */
  interface IRow {
    y: number;
    origin: number;
    section: AutoMovieViewSection.ISection;
  }

  /** Both orbits and both malar eminences (+v side first), stations in the head frame. */
  export function create(input: IInput): IAutoMovieLoftRelief[] {
    const M: typeof AutoMovieHumanHeadMassCurves = AutoMovieHumanHeadMassCurves;
    const L: number = input.length;
    const D: AutoMovieHumanHeadFrankfort.IDims = input.head.dims;
    const P: Record<AutoMovieHumanHeadFrankfort.Name, Vec3> = input.head.points;
    const row: (y: number) => IRow = (y: number): IRow => {
      const l: number = M.value(input.outlines.lateral, y, L)[0];
      return {
        y,
        origin: input.course.frame(y).origin[0],
        section: AutoMovieViewSection.of(
          { extents: [M.value(input.outlines.anterior, y, L)[0], l, M.value(input.outlines.posterior, y, L)[0], l] },
          [M.fullness(input.fullness.anterior, y), M.fullness(input.fullness.posterior, y), M.fullness(input.fullness.posterior, y), M.fullness(input.fullness.anterior, y)],
        ),
      };
    };
    // The base point at a phase on the +v side: forward place and half breadth.
    const at: (r: IRow, phi: number) => [number, number] = (r: IRow, phi: number): [number, number] => {
      const radius: number = AutoMovieViewSection.radius(r.section, phi)[0];
      return [r.origin + radius * Math.cos(phi), radius * Math.sin(phi)];
    };
    // The phase on the +v side whose half breadth is z (bisection on [0, pi/2]).
    const phaseAt: (r: IRow, z: number) => number = (r: IRow, z: number): number => {
      let lo: number = 0;
      let hi: number = Math.PI / 2;
      for (let k: number = 0; k < 40; ++k) {
        const mid: number = (lo + hi) / 2;
        if (at(r, mid)[1] < z) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    };

    const out: IAutoMovieLoftRelief[] = [];
    for (const side of ["right", "left"] as const) {
      const sign: 1 | -1 = side === "right" ? 1 : -1;
      // f1 first (owner, 2026-11-08 13:1x): the eye in its own frame (`AutoMovieHumanHeadF1Lines.EYE`: origin the fissure's centre, +Z lateral). The globe's front is the paraboloid about her cornea's place at the fissure's centre; over it the lids stand `LID` proud except inside the palpebral fissure, between the authored lid margins and the canthi (a C2 step over `EYE_ROLL` across each margin), and the upper lid's crease is a C2 groove along its authored line. Later algorithmization: the globe's apex `HERTEL` ahead of the lateral orbital rim read on the mass, at the bony orbit's centre (`ORBIT`'s half height above FH, 3.4 mm above her fissure).
      const E: typeof AutoMovieHumanHeadF1Lines.EYE = AutoMovieHumanHeadF1Lines.EYE;
      // Her pose (`AutoMovieHumanHeadF1Pose`): the eye's zero-frame centre and cornea carried into her upright frame, where the course's stations run.
      const zc: number = E.centre[2];
      const yc: number = AutoMovieHumanHeadF1Pose.upright(E.centre)[1];
      const centre: IRow = row(yc);
      const apex: number = AutoMovieHumanHeadF1Pose.upright([E.cornea, E.centre[1], E.centre[2]])[0];
      const upper: (z: number) => number = chain(E.upper);
      const lower: (z: number) => number = chain(E.lower);
      const crease: (z: number) => number = chain(E.crease);
      const inner: number = E.upper[0]![0];
      const outer: number = E.upper[E.upper.length - 1]![0];
      const c0: number = E.crease[0]![0];
      const c1: number = E.crease[E.crease.length - 1]![0];
      const orbit: (r: IRow, phi: number) => number = (r: IRow, phi: number): number => {
        const [x, z] = at(r, phi);
        const ey: number = r.y - yc;
        const ez: number = z - zc;
        const dy: number = ey / (ORBIT[1] / 2);
        const dz: number = ez / (ORBIT[0] / 2);
        const u2: number = dy * dy + dz * dz;
        if (!(u2 < 1)) return 0;
        const globe: number = apex - (ey * ey + ez * ez) / (2 * GLOBE);
        const fissure: number = ez > inner && ez < outer ? smoothstep((upper(ez) - ey) / EYE_ROLL + 0.5) * smoothstep((ey - lower(ez)) / EYE_ROLL + 0.5) : 0;
        // The crease's groove: (1 - t^2)^3 across its line (half width `CREASE[1]`) and along it (zero at its ends), depth `CREASE[0]`.
        const s: number = ez > c0 && ez < c1 ? (2 * (ez - c0)) / (c1 - c0) - 1 : 1;
        const t: number = (ey - crease(Math.min(c1, Math.max(c0, ez)))) / CREASE[1];
        const groove: number = Math.abs(s) < 1 && Math.abs(t) < 1 ? CREASE[0] * (1 - s * s) ** 3 * (1 - t * t) ** 3 : 0;
        const front: number = globe + LID * (1 - fissure) - groove;
        const w: number = 1 - u2;
        // The target never stands more than `EYE_DEPTH` behind the mass (a C2 maximum of the eye's front and that floor over `EYE_ROLL`): the lids and the fissure keep the globe's front where the mass stands within a few millimetres of it, while beyond the lids the paraboloid falls away from the mass (9.5 mm at 15 mm from the apex) and dug a pit around each eye (front.4, 14:21); the periorbital skin rests on the orbit's fat, not on the globe.
        const target: number = front + ramp(x - EYE_DEPTH - front, EYE_ROLL);
        return ramp(x - target, EYE_SPACING) * w * w * w;
      };
      out.push(net(`orbit.${side}`, [yc - ORBIT[1] / 2, yc + ORBIT[1] / 2], centre, zc, ORBIT[0] / 2 + 4, row, at, orbit, [-1, 0, 0], sign, EYE_SPACING));

      // Malar eminence: Hinderer's crossing in the front view (y, z).
      const ex: [number, number] = [AutoMovieHumanHeadF1Pose.upright([E.centre[0], ORBIT[1] / 2, 0])[1], D.intercanthal / 2 + D.fissure[side]];
      const ch: [number, number] = [P.sto[1], D.mouth / 2];
      const ac: [number, number] = [P.ac[1], P.ac[2]];
      const tr: [number, number] = [0, P.t[2]];
      const cross: [number, number] = meet(ac, tr, ex, ch);
      const mc: [number, number] = [cross[0] + MALAR_OFFSET[0], cross[1] + MALAR_OFFSET[1]];
      const malarRow: IRow = row(mc[0]);
      const phi: number = phaseAt(malarRow, mc[1]);
      const axis: Vec3 = [Math.cos(phi), 0, sign * Math.sin(phi)];
      const malar: (r: IRow, p: number) => number = (r: IRow, p: number): number => {
        const z: number = at(r, p)[1];
        const u2: number = ((r.y - mc[0]) ** 2 + (z - mc[1]) ** 2) / (MALAR_RADIUS * MALAR_RADIUS);
        if (!(u2 < 1)) return 0;
        const w: number = 1 - u2;
        return MALAR * w * w * w;
      };
      out.push(net(`malar.${side}`, [mc[0] - MALAR_RADIUS, mc[0] + MALAR_RADIUS], malarRow, mc[1], MALAR_RADIUS + 4, row, at, malar, axis, sign, SPACING));
    }
    return out;
  }

  /** A relief net over a station range and the phases spanning `z0 +- reach` on one side, sampled at its Greville abscissae with three zero outer rings. */
  function net(
    name: string,
    span: [number, number],
    centre: IRow,
    z0: number,
    reach: number,
    row: (y: number) => IRow,
    at: (r: IRow, phi: number) => [number, number],
    height: (r: IRow, phi: number) => number,
    axis: Vec3,
    sign: 1 | -1,
    spacing: number,
  ): IAutoMovieLoftRelief {
    const radius: number = Math.hypot(...at(centre, 0.6));
    const p0: number = Math.max(0, Math.atan2(z0 - reach, radius));
    const p1: number = Math.min(Math.PI * 0.9, Math.atan2(z0 + reach, Math.max(1, radius * 0.5)));
    const rows: number = Math.ceil((span[1] - span[0]) / spacing) + 7;
    const ds: number = (span[1] - span[0]) / (rows - 7);
    const s0: number = span[0] - 2 * ds;
    const columns: number = Math.ceil(((p1 - p0) * radius) / spacing) + 7;
    const dphi: number = (p1 - p0) / (columns - 7);
    const q0: number = p0 - 2 * dphi;
    const heights: number[] = [];
    for (let i: number = 0; i < rows; ++i) {
      const r: IRow | null = i >= 3 && i < rows - 3 ? row(s0 + (i - 1) * ds) : null;
      for (let j: number = 0; j < columns; ++j) heights.push(r === null || j < 3 || j >= columns - 3 ? 0 : height(r, q0 + (j - 1) * dphi));
    }
    // The -v side mirrors the phases: phase phi there is 2 pi - phi.
    const phases: [number, number] = sign > 0 ? [q0, q0 + (columns - 3) * dphi] : [2 * Math.PI - (q0 + (columns - 3) * dphi), 2 * Math.PI - q0];
    const ordered: number[] = sign > 0 ? heights : heights.map((_: number, k: number): number => heights[Math.floor(k / columns) * columns + (columns - 1 - (k % columns))]!);
    return { name, stations: [s0, s0 + (rows - 3) * ds], phases, axis, rows, columns, heights: ordered };
  }

  /** Where the line through a and b meets the line through c and d, in the (y, z) plane. */
  function meet(a: [number, number], b: [number, number], c: [number, number], d: [number, number]): [number, number] {
    const r: [number, number] = [b[0] - a[0], b[1] - a[1]];
    const s: [number, number] = [d[0] - c[0], d[1] - c[1]];
    const det: number = r[0] * s[1] - r[1] * s[0];
    if (!(Math.abs(det) > 1e-9)) throw new Error("head malar: Hinderer's lines are parallel");
    const t: number = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / det;
    return [a[0] + t * r[0], a[1] + t * r[1]];
  }

  /** The C2 ramp: zero below `-w/2`, the identity above `w/2`, between them `w` times the smoothstep's integral. */
  function ramp(t: number, w: number): number {
    const u: number = t / w + 0.5;
    if (u <= 0) return 0;
    if (u >= 1) return t;
    return w * u * u * u * u * (2.5 + u * (-3 + u));
  }
}
