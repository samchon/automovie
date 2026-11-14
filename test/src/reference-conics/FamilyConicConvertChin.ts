import fs from "node:fs/promises";
import path from "node:path";
import { AutoMovieViewAxis, realizeAutoMovieConstruction } from "@automovie/engine";
import { AutoMovieHumanConicLoft as H } from "@automovie/human";
import { FamilyConicConvert as T } from "./FamilyConicConvert";
import { FamilyConicFit as F } from "./FamilyConicFit";
import { FamilyConicLayout as L } from "./FamilyConicLayout";
import { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { FamilyConicStar as S } from "./FamilyConicStar";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/**
 * The chin's region entry of the conversion tool. The trunk's level sections fold under the chin (F7, the overhang at stations 696 to 716),
 * and the trunk already leaves the chin out of its sections past a cone about its course (`FamilyConicBody.ts`, `CHIN`: 58 mm round at
 * 1,476 mm, widening 1.9 mm a millimetre up), carrying it by a cast relief. So the chin is a family of its own, merged on the trunk
 * (construction.md, Connections), and the cast is removed.
 *
 * Its region is exactly the skin the trunk's cut leaves out, the cone's outside above its start, and `INSIDE_MM` more inside the cone, so
 * the family's edge and its closure lie inside the trunk. Its course runs forward under the chin at 1,484 mm from x 59, then turns up and
 * runs out through pogonion, the chin's most anterior point on the median profile (`profile`): on a level course the skin left the course
 * at x 103 while the chin's front stood 15 to 18 mm higher, out to x 110.7, beyond any cap. The turn is laid by `design`. The course's
 * planes cut the region's skin, and each piece star-shaped about the course is closed by its chord; the cone is convex and both ends of a
 * chord lie inside it, so the whole chord does.
 *
 * The conversion's bridge is then fitted as one featured family by the fit tool (`FamilyConicFit.fit`, run with `--barrier`): its groove lines
 * appear and fade along the one family, and every stored share stays
 * inside the model's bounds by the fit's own barrier instead of a clamp where the model reads it; the chord's points are no observation
 * there, only held on the trunk's side of the cone. The fitted family as stored, capped at both ends, is realized alone and every reference
 * skin vertex the trunk's cut removes is measured to it (`coverage`), each section's farthest skin point is placed (`corners`), and it is
 * drawn under the conversion's cameras.
 *
 * Run from `test` after bundling: `node <bundle>/FamilyConicConvertChin.cjs --barrier [--emit]`. With `--emit` a fitted family that passes the proof is written
 * as `packages/human/src/generation/f1/AutoMovieHumanF1Chin.ts`, its values rounded as stored and both ends capped.
 */
export namespace FamilyConicConvertChin {
  type V3 = [number, number, number];

  /**
   * The trunk's chin cone, as `FamilyConicBody.ts` holds it (`CHIN`, private there): its radius about the trunk's vertical axis at its start
   * height, mm, and how many millimetres it widens a millimetre up. Kept equal to that file's by hand; an export from it would hold one copy.
   */
  export const CHIN: { y: number; radius: number; slope: number } = { y: 1476, radius: 58, slope: 1.9 };

  /**
   * How far inside the cone the region reaches, mm, normal to its wall. Twelve layout tolerances (`FamilyConicConvert.LAYOUT_TOLERANCE_MM`):
   * the family is fitted to its skin within the layout tolerance, so its edge stays inside the trunk's cut however its fit errs there; and
   * less than the cap's `CAP_MM`, so the skin both carry is a band for the merge to cross, not a second chin.
   */
  export const INSIDE_MM: number = 3;

  /** How far a reference point stands outside the trunk's chin cone, mm, normal to its wall; negative inside it. */
  export function cone(w: readonly number[]): number {
    return (Math.hypot(w[0]!, w[2]!) - CHIN.radius - CHIN.slope * (w[1]! - CHIN.y)) / Math.hypot(1, CHIN.slope);
  }

  /** Whether the trunk's cut removes a reference point: `FamilyConicBody.ts`'s `chin(p) > 0`, in front of the course and above the cone's start. */
  export function removed(w: readonly number[]): boolean {
    return w[0]! > 0 && w[1]! >= CHIN.y && cone(w) > 0;
  }

  /** Whether a reference point is the chin region's: the trunk's cut and `INSIDE_MM` inside it. */
  export function region(w: readonly number[]): boolean {
    return w[0]! > 0 && w[1]! >= CHIN.y - INSIDE_MM && cone(w) > -INSIDE_MM;
  }

  /** Where the course starts, mm: inside the trunk behind the cut's first skin (x 59.6 at the cone's start), on the level course's height. */
  export const START: V3 = [59, 1484, 0];

  /**
   * The least bend radius of the course's turn, mm. Neighbouring sections cross where they meet, at the bend radius on the turn's inner side
   * (`FamilyConicStar.reach`), so the radius must pass every section's reach toward the bend's centre; and it is held to the sections'
   * half-width at the chin's front. On the level course the sections from x 91 to 103 reached 16.2 to 20.2 mm above the course point, the
   * turn's inner side, and stood 24.4 to 35 mm half-wide, 24.4 at x 103; 25 passes the first and meets the second where the turn lies.
   * Each station's reach is read again on the turned course (`main`).
   */
  export const BEND_RADIUS_MM: number = 25;

  /** The quintic turn's peak rate over its mean (`AutoMovieViewAxis.jointed`: the angle `10 x^3 - 15 x^4 + 6 x^5`, its slope at most 15/8). */
  const QUINTIC_PEAK: number = 15 / 8;

  /** How far before pogonion the turn must end, mm, so the course runs out through it on its straight line. */
  export const CLEAR_MM: number = 2;

  /** How far past pogonion the course runs on, mm: out of the skin, so its last sections are the tip's. */
  export const EXIT_MM: number = 6;

  /** The anterior median profile's landmarks, mm. */
  export interface IProfile {
    /** The chin's most anterior point on the median profile: the profile's first forward bulge above the cone's start. */
    pogonion: V3;

    /** The mentolabial sulcus: the profile's least x between pogonion and the lower lip's bulge above it; null when the profile ends first. */
    sulcus: V3 | null;
  }

  /** Bin of the median profile along y, mm. */
  const PROFILE_BIN_MM: number = 1;

  /** Half the window a bin must lead to be a bulge, mm: three bins either side, wider than the facets' steps. */
  const PROFILE_WINDOW_MM: number = 3;

  /** How far the profile must fall back above a bulge for it to be one, mm: twice the layout tolerance. */
  const PROFILE_FALL_MM: number = 0.5;

  /**
   * Pogonion read by its definition, the most anterior point of the chin: the skin's median section, its front edge binned along y as the
   * greatest x of each bin from the cone's start up 60 mm; the first bin up from below that leads its neighbours within
   * `PROFILE_WINDOW_MM` and that the profile falls back from by `PROFILE_FALL_MM` above it.
   */
  export function profile(skin: R.ISource["all"]): IProfile {
    const axis = H.axis({ centres: [[0, CHIN.y + 30, -10], [0, CHIN.y + 30, 10]], halves: [], up: [1, 0, 0] });
    const frame = axis.at(10);
    const loop: C.P[] | null = R.cut(skin, frame).loop;
    if (loop === null) throw new Error("the median section has no loop");
    const world: V3[] = loop.map((p: C.P): V3 => [0, 1, 2].map((c: number): number => frame.origin[c]! + p[0] * frame.u[c]! + p[1] * frame.v[c]!) as V3);
    const bins: (V3 | null)[] = Array.from({ length: Math.round(60 / PROFILE_BIN_MM) }, (_: unknown, k: number): V3 | null => {
      const inside: V3[] = world.filter((w: V3): boolean => w[0] > 0 && w[1] >= CHIN.y + k * PROFILE_BIN_MM && w[1] < CHIN.y + (k + 1) * PROFILE_BIN_MM);
      return inside.length === 0 ? null : inside.reduce((a: V3, b: V3): V3 => (b[0] > a[0] ? b : a));
    });
    const reach: number = Math.round(PROFILE_WINDOW_MM / PROFILE_BIN_MM);
    for (let k: number = 0; k < bins.length; ++k) {
      const here: V3 | null = bins[k]!;
      if (here === null) continue;
      const near: V3[] = bins.slice(Math.max(0, k - reach), k + reach + 1).filter((b: V3 | null): b is V3 => b !== null);
      if (near.some((b: V3): boolean => b[0] > here[0])) continue;
      const above: V3[] = bins.slice(k + 1).filter((b: V3 | null): b is V3 => b !== null);
      const fall: number = above.findIndex((b: V3): boolean => b[0] <= here[0] - PROFILE_FALL_MM);
      if (fall < 0) continue;
      // The sulcus: the least x above pogonion before the profile rises past pogonion's x again.
      const rise: number = above.findIndex((b: V3): boolean => b[0] > here[0]);
      const span: V3[] = above.slice(0, rise < 0 ? above.length : rise);
      return { pogonion: here, sulcus: span.length === 0 ? null : span.reduce((a: V3, b: V3): V3 => (b[0] < a[0] ? b : a)) };
    }
    throw new Error("the median profile has no forward bulge above the cone's start");
  }

  /** The course's design: its centres and turn, and where the turn starts and ends. */
  export interface IDesign {
    /** The start, the joint and the end, mm. */
    centres: V3[];

    /** The joint's half turn arclength, mm. */
    halves: number[];

    /** The turn's angle, radians. */
    turn: number;

    /** Where the turn starts, x mm on the level line. */
    bendX: number;

    /** How far before pogonion the turn ends, mm along the second line. */
    clear: number;

    /** The course's length, mm. */
    length: number;
  }

  /**
   * The course: level along +x from `START`, then one turn of least radius `BEND_RADIUS_MM` onto the straight line through pogonion, ending
   * `CLEAR_MM` or more before it, and `EXIT_MM` past it. Of the joints on the level line every quarter millimetre, the one whose turn starts
   * farthest forward, so the course stays level under the chin as far as the radius lets it.
   */
  export function design(pogonion: V3): IDesign {
    let best: IDesign | null = null;
    for (let x: number = START[0] + 1; x <= pogonion[0] - 1; x += 0.25) {
      const joint: V3 = [x, START[1], 0];
      const d: number[] = [pogonion[0] - x, pogonion[1] - START[1], pogonion[2]];
      const length: number = Math.hypot(d[0]!, d[1]!, d[2]!);
      const turn: number = Math.atan2(Math.hypot(d[1]!, d[2]!), d[0]!);
      const end: V3 = [0, 1, 2].map((c: number): number => pogonion[c]! + (d[c]! / length) * EXIT_MM) as V3;
      const half: number = (BEND_RADIUS_MM * QUINTIC_PEAK * turn) / 2;
      const runs = AutoMovieViewAxis.runs([START, joint, end], [half]);
      if (typeof runs === "string" || runs[0]!.to <= 0 || runs[1]!.from > length - CLEAR_MM) continue;
      const bendX: number = START[0] + runs[0]!.to;
      if (best === null || bendX > best.bendX) best = { centres: [START, joint, end], halves: [Math.round(half * 1e4) / 1e4], turn, bendX, clear: length - runs[1]!.from, length: runs[1]!.end };
    }
    if (best === null) throw new Error("no turn of the least radius reaches pogonion");
    return best;
  }

  /** The chin's trial course and its region: `u` up at the start; the box only bounds the search. */
  export function trial(course: IDesign): S.ITrial {
    return { label: "chin", centres: course.centres, halves: course.halves, up: [0, 1, 0], box: [0, 125, 1440, 1560, -90, 90], region, step: 1 };
  }

  /**
   * How far each end's cap runs past the family's last section, mm. The back end lies inside the trunk, inside the cone's edge; the front
   * end closes on the chin's tip. Four millimetres is a cap of a section about 30 mm across, as the trunk's crown closes its last 13 mm of
   * a head 140 mm across within its own share.
   */
  export const CAP_MM: number = 4;

  /**
   * The reference's skin: its components of at least this many triangles. The skin is one component of 110,376; the next, 8,350, is the
   * mouth's lining, then the eyeballs and the lashes (`FamilyConicStar.components`).
   */
  export const SKIN_LEAST: number = 10_000;

  /** The reference's vertices the frames are framed on, metres: the same zone as every earlier chin frame, so the cameras are the same. */
  export const ZONE = (p: N.Point): boolean => p[0] > 0.05 && p[0] < 0.112 && p[1] > 1.445 && p[1] < 1.51 && Math.abs(p[2]) < 0.04;

  /** The chin's course for the loft, as its sections read it. */
  export function loftCourse(course: IDesign): T.ICourse {
    return { centres: course.centres, halves: course.halves, up: [0, 1, 0], station: (s: number): number => s, depth: 1, zone: ZONE };
  }

  /** A family as the convert tool writes it (`<part>.family.json`). */
  export interface IConverted {
    /** Course centres, mm. */
    centres: H.V3[];

    /** Joint half turns, mm. */
    halves: number[];

    /** The chart's first axis. */
    up: H.V3;

    /** Phase pitch, mm. */
    pitch?: number;

    /** The section layout. */
    layout: C.ILayout;

    /** Knots, mm along the course. */
    knots: number[];

    /** One field of values per layout field, at the knots. */
    values: number[][];
  }

  /** Round a stored field as the fit tool stores it: millimetres to 0.01, shares to 0.0001. */
  const rounded = (field: readonly number[], unit: string | undefined): number[] => field.map((x: number): number => (unit === "mm" ? Math.round(x * 100) / 100 : Math.round(x * 1e4) / 1e4));

  /** The family as its module stores it: knots and values rounded, both ends capped `CAP_MM` past their last section. */
  export function stored(family: IConverted): H.IFamily {
    const units: string[] = C.units(family.layout);
    const knots: number[] = family.knots.map((k: number): number => Math.round(k * 100) / 100);
    return {
      name: "chin",
      centres: family.centres,
      halves: family.halves,
      up: family.up,
      ...(family.pitch === undefined ? {} : { pitch: Math.round(family.pitch * 1e4) / 1e4 }),
      layout: family.layout,
      knots,
      values: family.values.map((field: number[], f: number): number[] => rounded(field, units[f])),
      tips: [
        { from: knots[0]!, tip: Math.round((knots[0]! - CAP_MM) * 100) / 100 },
        { from: knots.at(-1)!, tip: Math.round((knots.at(-1)! + CAP_MM) * 100) / 100 },
      ],
    };
  }

  /** The module text of the stored family. */
  export function module(family: H.IFamily, source: string): string {
    const lines: string[] = [
      'import type { AutoMovieHumanConicLoft } from "../conic/AutoMovieHumanConicLoft";',
      "",
      "/**",
      " * f1's chin, a family of its own merged on the trunk.",
      " *",
      " * The trunk's level sections fold under the chin, and the trunk leaves the chin out past a cone about its course; this family carries",
      ` * that skin and ${INSIDE_MM} mm more inside the cone, on a course forward under the chin at 1,484 mm that turns up and runs out through`,
      " * pogonion. Each section is the reference's skin in that region, closed by its chord, which lies inside the trunk.",
      " *",
      ` * Source: ${source}, converted and fitted by \`test/src/reference-conics/FamilyConicConvertChin.ts\`; both ends capped ${CAP_MM} mm past`,
      ` * their last section. ${family.knots.length * (1 + family.values.length)} independent numbers.`,
      " */",
      "export const AutoMovieHumanF1Chin: AutoMovieHumanConicLoft.IFamily = {",
      `  name: ${JSON.stringify(family.name)},`,
      `  centres: ${JSON.stringify(family.centres)},`,
      `  halves: ${JSON.stringify(family.halves)},`,
      `  up: ${JSON.stringify(family.up)},`,
      ...(family.pitch === undefined ? [] : [`  pitch: ${family.pitch},`]),
      `  layout: ${JSON.stringify(family.layout)},`,
      `  knots: ${JSON.stringify(family.knots)},`,
      "  values: [",
      ...family.values.map((field: number[]): string => `    ${JSON.stringify(field)},`),
      "  ],",
      `  tips: ${JSON.stringify(family.tips)},`,
      "};",
      "",
    ];
    return lines.join("\n");
  }

  /**
   * The model's bounds on a stored value (`AutoMovieHumanConicSection`, `EDGE` and `FAIR`, private there): every share inside
   * `[EDGE, 1 - EDGE]`, and every shoulder at most `FAIR`. The model reads a value past them at the bound.
   */
  const BOUNDS: { edge: number; fair: number } = { edge: 0.03, fair: 0.85 };

  /** Every stored value past the model's bounds, as `field@knot=value`. */
  export function outOfBounds(family: H.IFamily): string[] {
    const units: string[] = C.units(family.layout);
    const { shoulders } = C.offsets(family.layout);
    const out: string[] = [];
    family.values.forEach((field: number[], f: number): void => {
      if (units[f] !== "share") return;
      const high: number = f >= shoulders ? BOUNDS.fair : 1 - BOUNDS.edge;
      field.forEach((x: number, k: number): void => {
        if (x < BOUNDS.edge || x > high) out.push(`${f >= shoulders ? "rho" + (f - shoulders) : "f" + f}@${family.knots[k]}=${x}`);
      });
    });
    return out;
  }

  /** The shares' and shoulders' least and greatest stored values. */
  function shareRange(family: H.IFamily): string {
    const units: string[] = C.units(family.layout);
    const { shoulders } = C.offsets(family.layout);
    const of = (keep: (f: number) => boolean): number[] => family.values.flatMap((field: number[], f: number): number[] => (units[f] === "share" && keep(f) ? field : []));
    const span = (xs: number[]): string => (xs.length === 0 ? "-" : `${Math.min(...xs).toFixed(4)}..${Math.max(...xs).toFixed(4)}`);
    return `shoulders ${span(of((f: number): boolean => f >= shoulders))}, other shares ${span(of((f: number): boolean => f < shoulders))}`;
  }

  /** The point of triangle `abc` nearest `p`: the face's projection when it falls inside, else the nearest point of its three edges. */
  function nearest(p: V3, a: V3, b: V3, c: V3): V3 {
    const sub = (x: V3, y: V3): V3 => [x[0] - y[0], x[1] - y[1], x[2] - y[2]];
    const dot = (x: V3, y: V3): number => x[0] * y[0] + x[1] * y[1] + x[2] * y[2];
    const ab: V3 = sub(b, a), ac: V3 = sub(c, a), ap: V3 = sub(p, a);
    const d00: number = dot(ab, ab), d01: number = dot(ab, ac), d11: number = dot(ac, ac), d20: number = dot(ap, ab), d21: number = dot(ap, ac);
    const den: number = d00 * d11 - d01 * d01;
    if (den > 1e-18) {
      // Barycentric weights of the projection: inside when all three are non-negative.
      const v: number = (d11 * d20 - d01 * d21) / den;
      const w: number = (d00 * d21 - d01 * d20) / den;
      if (v >= 0 && w >= 0 && v + w <= 1) return [a[0] + v * ab[0] + w * ac[0], a[1] + v * ab[1] + w * ac[1], a[2] + v * ab[2] + w * ac[2]];
    }
    const onEdge = (x: V3, y: V3): V3 => {
      const e: V3 = sub(y, x);
      const ee: number = dot(e, e);
      const t: number = ee > 0 ? Math.min(1, Math.max(0, dot(sub(p, x), e) / ee)) : 0;
      return [x[0] + t * e[0], x[1] + t * e[1], x[2] + t * e[2]];
    };
    const length = (q: V3): number => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
    return [onEdge(a, b), onEdge(b, c), onEdge(c, a)].reduce((x: V3, y: V3): V3 => (length(y) < length(x) ? y : x));
  }

  /** Edge of the cells a surface's triangles are filed in, mm. */
  const CELL_MM: number = 4;

  /** How far a surface is looked for, mm: a point farther from it than this has none. */
  const REACH_MM: number = 12;

  /** A family realized alone, capped, and the distance from a point to it with the station of the nearest triangle. */
  export interface ISurface {
    /** The realized skin, metres. */
    positions: number[];

    /** Its triangles. */
    indices: number[];

    /** The realizer's diagnostics. */
    diagnostics: string[];

    /** A point's distance to the skin within `REACH_MM`, mm, and the mean station of the nearest triangle; null when none is that near. */
    measure: (p: V3) => { mm: number; station: number } | null;
  }

  /** Realize a stored family alone with its caps, every half millimetre between its first and last knot. */
  export function surface(family: H.IFamily): ISurface {
    const first: number = family.knots[0]!, last: number = family.knots.at(-1)!;
    const stations: number[] = Array.from({ length: Math.round((last - first) / 0.5) + 1 }, (_: unknown, k: number): number => first + k * 0.5);
    const real = realizeAutoMovieConstruction({ name: "chin.alone", root: { type: "source", name: family.name, source: family.name } }, { chord: 0.001, sources: new Map([[family.name, H.part(family, stations)]]) });
    const diagnostics: string[] = real.diagnostics.map((d): string => d.node + " (" + d.contract + "): " + d.detail.slice(0, 200));
    if (real.mesh === null) return { positions: [], indices: [], diagnostics: [...diagnostics, "no mesh"], measure: (): null => null };
    const mesh = real.mesh;
    const corner = (v: number): V3 => [mesh.positions[v * 3]! * 1000, mesh.positions[v * 3 + 1]! * 1000, mesh.positions[v * 3 + 2]! * 1000];
    const triangles: { corners: [V3, V3, V3]; station: number }[] = [];
    for (let t: number = 0; t + 2 < mesh.indices.length; t += 3) {
      const ids: number[] = [mesh.indices[t]!, mesh.indices[t + 1]!, mesh.indices[t + 2]!];
      triangles.push({ corners: ids.map(corner) as [V3, V3, V3], station: ids.reduce((sum: number, v: number): number => sum + mesh.coordinates[v * 3 + 1]!, 0) / 3 });
    }
    const key = (i: number, j: number, k: number): string => i + "," + j + "," + k;
    const cells: Map<string, number[]> = new Map();
    triangles.forEach((triangle, index: number): void => {
      const low: number[] = [0, 1, 2].map((c: number): number => Math.floor(Math.min(...triangle.corners.map((p: V3): number => p[c]!)) / CELL_MM));
      const high: number[] = [0, 1, 2].map((c: number): number => Math.floor(Math.max(...triangle.corners.map((p: V3): number => p[c]!)) / CELL_MM));
      for (let i: number = low[0]!; i <= high[0]!; ++i)
        for (let j: number = low[1]!; j <= high[1]!; ++j)
          for (let k: number = low[2]!; k <= high[2]!; ++k) {
            const list: number[] | undefined = cells.get(key(i, j, k));
            if (list === undefined) cells.set(key(i, j, k), [index]);
            else list.push(index);
          }
    });
    const reach: number = Math.ceil(REACH_MM / CELL_MM);
    const measure = (p: V3): { mm: number; station: number } | null => {
      const home: number[] = p.map((x: number): number => Math.floor(x / CELL_MM));
      let best: { mm: number; station: number } | null = null;
      for (let i: number = -reach; i <= reach; ++i)
        for (let j: number = -reach; j <= reach; ++j)
          for (let k: number = -reach; k <= reach; ++k)
            for (const index of cells.get(key(home[0]! + i, home[1]! + j, home[2]! + k)) ?? []) {
              const triangle = triangles[index]!;
              const q: V3 = nearest(p, ...triangle.corners);
              const mm: number = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
              if (mm <= REACH_MM && (best === null || mm < best.mm)) best = { mm, station: triangle.station };
            }
      return best;
    };
    return { positions: Array.from(mesh.positions), indices: Array.from(mesh.indices), diagnostics, measure };
  }

  /** The coverage thresholds the report counts over, mm: the layout tolerance, and one millimetre. */
  const OVER_MM: number[] = [T.LAYOUT_TOLERANCE_MM, 1];

  /** The proof's bound: every removed skin vertex within this of the family, mm. */
  export const COVER_MM: number = 1;

  /**
   * The coverage proof: every reference skin vertex the trunk's cut removes measured to the stored family's nearest point, filed by what
   * owns that point: the sections (between the first and last knot), the back cap or the front cap. Returns the report's lines and the
   * greatest distance, Infinity when a vertex has no skin near.
   */
  export function coverage(skin: R.ISource["all"], family: H.IFamily, alone: ISurface, at: (s: number) => V3): { lines: string[]; worst: number } {
    const first: number = family.knots[0]!, last: number = family.knots.at(-1)!;
    const used: Set<number> = new Set(Array.from(skin.indices));
    const points: V3[] = [...used].map((v: number): V3 => [skin.positions[v * 3]!, skin.positions[v * 3 + 1]!, skin.positions[v * 3 + 2]!]).filter(removed);
    const owner = (station: number): string => (station < first - 1e-6 ? "back cap" : station > last + 1e-6 ? "front cap" : "sections");
    const read = points.map((p: V3) => ({ p, got: alone.measure(p) }));
    const span = (c: number): string => `${Math.min(...points.map((p: V3): number => p[c]!)).toFixed(1)}..${Math.max(...points.map((p: V3): number => p[c]!)).toFixed(1)}`;
    const lines: string[] = [
      `## Coverage: the stored family realized alone, both ends capped; diagnostics ${alone.diagnostics.length}${alone.diagnostics.length > 0 ? ": " + alone.diagnostics.slice(0, 3).join("; ") : ""}`,
      `removed skin vertices (trunk's chin(p) > 0): ${points.length}; x ${span(0)}, y ${span(1)}, z ${span(2)} mm; the family's sections run from [${at(first).map((x: number): string => x.toFixed(1)).join(", ")}] to [${at(last).map((x: number): string => x.toFixed(1)).join(", ")}], its caps to stations ${family.tips![0]!.tip} and ${family.tips![1]!.tip}`,
    ];
    const table = (title: string, rows: typeof read): void => {
      const missing: number = rows.filter((r): boolean => r.got === null).length;
      const groups: Map<string, number[]> = new Map();
      for (const r of rows) if (r.got !== null) groups.set(owner(r.got.station), [...(groups.get(owner(r.got.station)) ?? []), r.got.mm]);
      lines.push(`${title}: ${rows.length} vertices; no chin skin within ${REACH_MM} mm: ${missing}`);
      for (const [name, mm] of groups) {
        const sorted: number[] = [...mm].sort((a: number, b: number): number => a - b);
        lines.push(`  ${name.padEnd(9)} ${String(mm.length).padStart(5)}  max ${sorted.at(-1)!.toFixed(3)}  p99 ${sorted[Math.floor(0.99 * (sorted.length - 1))]!.toFixed(3)}  mean ${(mm.reduce((a: number, b: number): number => a + b, 0) / mm.length).toFixed(3)} mm  ${OVER_MM.map((t: number): string => `over ${t}: ${mm.filter((x: number): boolean => x > t).length}`).join(", ")}`);
      }
    };
    table("all removed skin", read);
    table("x 103 to 107", read.filter((r): boolean => r.p[0] >= 103 && r.p[0] <= 107));
    table("x past 107", read.filter((r): boolean => r.p[0] > 107));
    const worstRows = read.filter((r): boolean => r.got === null || r.got.mm > T.LAYOUT_TOLERANCE_MM).sort((a, b): number => (b.got?.mm ?? Infinity) - (a.got?.mm ?? Infinity));
    lines.push(`worst (of ${worstRows.length} over ${T.LAYOUT_TOLERANCE_MM} mm or with none):`, ...worstRows.slice(0, 12).map((r): string => `  [${r.p.map((x: number): string => x.toFixed(1)).join(", ")}] cone ${cone(r.p).toFixed(2)} mm: ${r.got === null ? "none" : `${r.got.mm.toFixed(3)} mm, ${owner(r.got.station)} at station ${r.got.station.toFixed(2)}`}`));
    const worst: number = read.reduce((m: number, r): number => Math.max(m, r.got?.mm ?? Infinity), 0);
    return { lines, worst };
  }

  /** A section in the reference frame: its skin run's points, and the frame's map from chart to world. */
  interface IPlaced {
    /** Station, mm. */
    s: number;

    /** The skin run, chart mm. */
    run: C.P[];

    /** A chart point in the reference frame, mm. */
    world: (p: C.P) => V3;
  }

  /**
   * Each section's farthest skin point from a family: its distance, how far inside the cone it stands (the region's band inside the trunk
   * runs to `-INSIDE_MM`), and its distance along the run from the run's nearer end, where the chord closes it, mm.
   */
  export function corners(placed: readonly IPlaced[], alone: ISurface, fairMm: number): { lines: string[]; atCorner: number; total: number } {
    const rows: string[] = [];
    let atCorner: number = 0;
    for (const section of placed) {
      const lengths: number[] = [0];
      for (let k: number = 1; k < section.run.length; ++k) lengths.push(lengths[k - 1]! + Math.hypot(section.run[k]![0] - section.run[k - 1]![0], section.run[k]![1] - section.run[k - 1]![1]));
      const total: number = lengths.at(-1)!;
      let worst: { mm: number; k: number } = { mm: -1, k: 0 };
      section.run.forEach((p: C.P, k: number): void => {
        const got = alone.measure(section.world(p));
        const mm: number = got?.mm ?? Infinity;
        if (mm > worst.mm) worst = { mm, k };
      });
      const w: V3 = section.world(section.run[worst.k]!);
      const fromEnd: number = Math.min(lengths[worst.k]!, total - lengths[worst.k]!);
      if (fromEnd <= fairMm && cone(w) < 0) ++atCorner;
      rows.push(`${section.s}:${worst.mm.toFixed(2)}/cone ${cone(w).toFixed(1)}/end ${fromEnd.toFixed(1)}`);
    }
    return { lines: rows, atCorner, total: placed.length };
  }

  /** The chord's points between a run's last point and its first, every `CHORD_STEP_MM`, ends excluded. */
  const CHORD_STEP_MM: number = 1;

  /** Convert, fit with the barrier, prove, draw, and with `--emit` write the module. */
  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const source: R.ISource = await R.load(root);
    const skin: R.ISource["all"] = S.components(source.all, SKIN_LEAST).mesh;
    const report: string[] = [];

    // The course, from pogonion.
    const landmarks: IProfile = profile(skin);
    const course: IDesign = design(landmarks.pogonion);
    const chinTrial: S.ITrial = trial(course);
    const axis = AutoMovieViewAxis.jointed(course.centres, course.halves, [0, 1, 0]);
    if (typeof axis === "string") throw new Error("the course is refused: " + axis);
    const at = (s: number): V3 => [...axis.at(s).origin] as V3;
    report.push(
      `# chin course: pogonion [${landmarks.pogonion.map((x: number): string => x.toFixed(2)).join(", ")}], sulcus ${landmarks.sulcus === null ? "none" : "[" + landmarks.sulcus.map((x: number): string => x.toFixed(2)).join(", ") + "]"}`,
      `centres ${JSON.stringify(course.centres)}, halves ${JSON.stringify(course.halves)}: turn ${((course.turn * 180) / Math.PI).toFixed(1)} deg, least radius ${BEND_RADIUS_MM} mm, from x ${course.bendX.toFixed(2)}, ending ${course.clear.toFixed(2)} mm before pogonion; ${course.length.toFixed(2)} mm long`,
    );

    // The sections, their reach toward the turn's centre against its radius, and the star share.
    const regionSections: S.IRegionSection[] = S.regionSections(source, chinTrial, 0, Math.floor(course.length), skin);
    const all: number = Math.floor(course.length) + 1;
    const crossing: string[] = [];
    let crossed: number = 0;
    const placed: IPlaced[] = regionSections.map((section: S.IRegionSection): IPlaced => {
      const frame = axis.at(section.s);
      const reach = S.reach(chinTrial, { at: (s: number) => axis.at(s) }, section.s);
      const run: C.P[] = section.points;
      if (Number.isFinite(reach.bend)) {
        const inner: number = Math.max(...run.map((p: C.P): number => p[0] * reach.toward[0] + p[1] * reach.toward[1]));
        const half: number = (Math.max(...run.map((p: C.P): number => p[1])) - Math.min(...run.map((p: C.P): number => p[1]))) / 2;
        if (inner >= reach.bend) ++crossed;
        crossing.push(`${section.s}:${reach.bend.toFixed(1)}/${inner.toFixed(1)}/${half.toFixed(1)}`);
      }
      return { s: section.s, run, world: (p: C.P): V3 => [0, 1, 2].map((c: number): number => frame.origin[c]! + p[0] * frame.u[c]! + p[1] * frame.v[c]!) as V3 };
    });
    const stars: number[] = regionSections.map((x: S.IRegionSection): number => x.s);
    const firstStar: number = stars[0] ?? NaN;
    report.push(
      `star-shaped sections: ${stars.length} of ${all} stations (${stars.join(",")}); the first at station ${firstStar}, x ${at(firstStar)[0].toFixed(1)}; of the first ten stations from the start, ${stars.filter((s: number): boolean => s < 10).length} star-shaped`,
      `turn stations, bend radius / reach toward its centre / half-width, mm: ${crossing.join(" ") || "none"}; reach past the radius at ${crossed}`,
    );

    // The conversion, on the turned course.
    const sections: T.ISection[] = regionSections.map((section: S.IRegionSection): T.ISection => ({ s: section.s, points: section.points, closure: section.closure }));
    const out: string = await T.report("chin", sections, { ladder: T.LADDER, note: `the chin's sections on a course that turns up through pogonion (${sections.length} stations): the skin the trunk's chin cone removes and ${INSIDE_MM} mm inside it, each closed by its chord`, loft: loftCourse(course) });
    const converted: IConverted = JSON.parse(await fs.readFile(path.join(out, "chin.0.family.json"), "utf8")) as IConverted;

    // One featured family over the bridge's domain (`FamilyConicConvert.IBridge`, as `FamilyConicBody.ts --bridge` reads it): the bridge's
    // layout, one groove run per converted line with each feature's window, so the lines that appear at 36 and 39 and run to the tip are
    // one family's; seeded at the region's own fairing cutoff (`FamilyConicFit.IRow.fairMm`), on knots the bridge's spacing apart, and
    // fitted with the barrier. The chord's points are held on the trunk's side of the cone, the skin's observed.
    const bridge: { domain: [number, number]; fairMm: number; knotMm: number; layout: C.ILayout } = JSON.parse(await fs.readFile(path.join(out, "chin.bridge.json"), "utf8"));
    const rows: F.IRow[] = placed
      .map((section: IPlaced, i: number): F.IRow => {
        const run: C.P[] = section.run;
        const a: C.P = run.at(-1)!, b: C.P = run[0]!;
        const count: number = Math.max(0, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / CHORD_STEP_MM) - 1);
        const chord: C.P[] = Array.from({ length: count }, (_: unknown, k: number): C.P => [a[0] + ((b[0] - a[0]) * (k + 1)) / (count + 1), a[1] + ((b[1] - a[1]) * (k + 1)) / (count + 1)]);
        const invented: Set<C.P> = new Set(chord);
        return { s: section.s, points: [...run, ...chord], heldout: false, fairMm: bridge.fairMm, opening: [regionSections[i]!.closure], free: (p: C.P): boolean => invented.has(p), side: (p: C.P): number => -cone(section.world(p)) };
      })
      .filter((row: F.IRow): boolean => row.s >= bridge.domain[0] - 1e-9 && row.s <= bridge.domain[1] + 1e-9);
    const count: number = Math.max(2, Math.round((bridge.domain[1] - bridge.domain[0]) / bridge.knotMm) + 1);
    const knots: number[] = Array.from({ length: count }, (_: unknown, k: number): number => bridge.domain[0] + ((bridge.domain[1] - bridge.domain[0]) * k) / (count - 1));
    const fitted: F.IResult = F.fit(rows, knots, bridge.layout, 2, undefined, F.ADMISSIBLE_MARGIN);
    report.push(
      "",
      `# featured fit from chin.bridge.json (barrier ${process.argv.includes("--barrier") ? "on" : "off"}): domain ${bridge.domain.join("..")}, ${rows.length} sections, ${bridge.layout.anchors.length} anchors, cutoff ${bridge.fairMm} mm, ${knots.length} knots ${bridge.knotMm} mm apart; ${fitted.fault ?? "fitted"}; ${fitted.iterations} steps, ${(fitted.milliseconds / 1000).toFixed(0)} s; skin misfit max ${fitted.training.maximumMm.toFixed(3)}, mean ${fitted.training.meanMm.toFixed(3)} mm`,
      "per section max mm: " + fitted.rows.map((r): string => `${r.s}:${r.maximumMm.toFixed(2)}`).join(" "),
    );
    if (fitted.fault !== null) {
      await fs.writeFile(path.join(out, "chin.proof.txt"), report.join("\n") + "\n");
      process.stdout.write(report.join("\n") + "\n");
      return;
    }
    const family: H.IFamily = stored({ ...converted, layout: bridge.layout, knots: fitted.knots, values: fitted.values });
    // The proof.
    const admitted = L.admit(H.reader(family), family.layout, family.knots[0]!, family.knots.at(-1)!, T.ADMIT_STEP_MM, T.MARGIN.fitted);
    const bounds: string[] = outOfBounds(family);
    const alone: ISurface = surface(family);
    const covered = coverage(skin, family, alone, at);
    const fairMm: number = bridge.fairMm;
    const placedCorners = corners(placed, alone, fairMm);
    const pass: boolean = bounds.length === 0 && admitted.refused.length === 0 && covered.worst < COVER_MM && alone.diagnostics.length === 0;
    report.push(
      `# chin as stored: knots ${family.knots[0]}..${family.knots.at(-1)} (${family.knots.length}), ${family.values.length} fields; ${shareRange(family)}`,
      `stored values past the model's bounds (shares in [${BOUNDS.edge}, ${1 - BOUNDS.edge}], shoulders at most ${BOUNDS.fair}): ${bounds.length}${bounds.length > 0 ? ": " + bounds.join(", ") : ""}`,
      `admission of the stored family every ${T.ADMIT_STEP_MM} mm (${admitted.checked} stations): least meeting share ${admitted.least.toFixed(3)}, ${admitted.refused.length} under ${T.MARGIN.fitted}`,
      ...admitted.refused.slice(0, 12).map((r: string): string => "  refused " + r),
      "",
      ...covered.lines,
      "",
      `## Each section's farthest skin point (station:mm/cone mm/from the run's nearer end mm); at a corner (within the fairing cutoff ${fairMm} mm of an end and inside the cone): ${placedCorners.atCorner} of ${placedCorners.total}`,
      placedCorners.lines.join(" "),
      "",
      `# proof: ${pass ? "PASS" : "FAIL"} (bounds ${bounds.length}, under the margin ${admitted.refused.length}, coverage max ${covered.worst.toFixed(3)} mm against ${COVER_MM}, diagnostics ${alone.diagnostics.length})`,
    );

    // The frames, under the conversion's cameras: the reference's chin zone fixes each view.
    const reference: N.Mesh[] = [source.body, source.head].map((mesh, i: number): N.Mesh => ({ id: "reference." + i, positions: Array.from(mesh.positions, (x: number): number => x / 1000), indices: Array.from(mesh.indices), colour: [0.64, 0.65, 0.67] }));
    const near: N.Point[] = [];
    for (const mesh of reference)
      for (let i: number = 0; i < mesh.positions.length; i += 3) {
        const p: N.Point = [mesh.positions[i]!, mesh.positions[i + 1]!, mesh.positions[i + 2]!];
        if (ZONE(p)) near.push(p);
      }
    const clay: N.Mesh = { id: "chin.stored", positions: alone.positions, indices: alone.indices, colour: [0.86, 0.62, 0.45] };
    NodeCanvasRaster.initialize();
    const frames: string[] = [];
    for (const view of ["front", "left", "high-oblique", "low-oblique"]) {
      const camera: N.Camera = NodeCanvasCamera.fit(view, near, 900, 900);
      for (const [stage, shown] of [["stored-clay", [clay]], ["stored-over-reference", [...reference, clay]]] as [string, N.Mesh[]][]) {
        const file: string = "chin." + view + "." + stage + ".png";
        await fs.writeFile(path.join(out, file), NodeCanvasRaster.render(camera, shown, [], "depth", "f1 | " + stage + " | chin " + view).png);
        frames.push(file);
      }
    }
    report.push(`frames (${frames.length}) in ${out}: ${frames.join(", ")}`);
    await fs.writeFile(path.join(out, "chin.proof.txt"), report.join("\n") + "\n");
    process.stdout.write(report.join("\n") + "\n");
    if (!process.argv.includes("--emit") || !pass) return;
    await fs.writeFile(path.join(root, "packages/human/src/generation/f1/AutoMovieHumanF1Chin.ts"), module(family, path.relative(root, out).replaceAll("\\", "/")));
  }
}

if (/FamilyConicConvertChin\.c?[jt]s$/.test(process.argv[1] ?? "")) T.run(FamilyConicConvertChin.main);
