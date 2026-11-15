import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { AutoMovieLoftChain, type AutoMovieViewAxis, AutoMovieViewChain, type AutoMovieViewLoft } from "@automovie/engine";
import { AutoMovieHumanConicLoft as H, AutoMovieHumanConicSection as S, AutoMovieHumanF1, AutoMovieHumanF1Placing as T, AutoMovieHumanSegmentFrame as SF } from "@automovie/human";
import { FamilyConicFit as F } from "./FamilyConicFit";
import { FamilyConicLoft as K } from "./FamilyConicLoft";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/**
 * A provisional limb law on f1 (issue #3151, step 2): the arm's and the leg's walls as functions of their segments' lengths and of the
 * tissue depth at standard tape sites, proven on f1 before it becomes package code. Nothing is stored in the Human package.
 *
 * The law, per wall field and knot:
 * - Station: every knot of a course run (between two consecutive course centres, `AutoMovieHumanF1Placing.COURSES`) keeps its
 *   normalized station `tau = (s - start) / (end - start)` along that run, where a run's ends are the course's stations nearest its two
 *   centres. A segment's length moves the joint at its far end along the segment (`CHAIN` offset scaled), so the course, its runs and
 *   their knots follow by `tau`.
 * - Reach fields (an extreme's distance from the course along its own direction): f1's value divided by the site depth profile, a shape
 *   prior in `tau`, times the person's depth profile. The depth profile passes through every site's ratio and through 1 at the held seam
 *   (the shoulder) or at the hip, where the limb meets the trunk, by a quintic smoothstep between consecutive anchors, flat at each one,
 *   so it is C2 and a held stretch meets a scaled one with equal value, slope and bend (construction.md, Form: a hard clamp or a
 *   polyline corner in a target becomes a crease). It is held at the last site's ratio past the last site.
 * - Offsets (where an extreme stands across the perpendicular direction): scaled by the mean ratio of the two reaches across them, so
 *   each section is mapped by an axis-aligned scaling per side. Median shares and conic shoulders are invariant under an affine map (a
 *   conic's shoulder `|MS| / |MA|` and a median's share are ratios along one line), so they are carried unchanged: the shape prior.
 *
 * At f1's own fields every ratio is 1 and every run keeps its length, so the law returns f1's stored wall (the round trip).
 *
 * The form rule (#3151) is read by detectors proven on f1 first: green on f1's own wall and red on a made break of it (`BREAKS`).
 *
 * Step 2's verdict (the supervisor's ruling on #3151, 2026-11-15). The depth profile is the quintic smoothstep through flat anchors: on
 * every population case (`populationCases`) it left fewer changes than the natural cubic through the same anchors in both runs (40 against
 * 41 by `profiles`, 42 against 46 by `lobes`). The acceptance is the frames of `lobes`' cases, which read as a thinner, fuller, shorter
 * or longer limb with f1's run of convex and concave stretches (verification.md: a shape claim is accepted from the renders, the numbers
 * point where to look): lobes-2026-11-15T06-24-45.792Z arm.left every site at its 5th, arm.front upper arm alone -9.2 %, arm.left forearm
 * alone +4.9 %, leg.front calf alone -7.8 %; lobes-2026-11-15T06-31-49.800Z arm.left elbow +3.9 %, arm.left upper arm +9.2 %, leg.left
 * every site at its 95th, leg.left ankle -11.4 %, leg.left knee -6.1 %, leg.front femur length 5th. Their visible breaks are two, each with
 * its owner: (A) an S under the held shoulder, where the held seam meets the scaled upper arm (#3541), and (C) a single site's belly
 * flattening more than its ratio, which one person cannot identify (#3151 Method 3; a validation case for #3205). The detector's other
 * changes are residuals of its bookkeeping, not form: a lobe at `LOBE_MM` flips at any gate, and a small lobe gained splits a large one and
 * halves its reading; `lobes` lists each with its class (`lobes.txt`).
 *
 * Usage, from `test/`: `pnpm conic:build`, then `node .shots/esbuild/FamilyConicLimbLaw.cjs`. It writes `law.txt`, `law.json` and the
 * frames under `test/.shots/family-conic-limb-law/<time>/`.
 */
namespace FamilyConicLimbLaw {
  type V3 = [number, number, number];
  type Family = H.IFamily;
  type Chain = NonNullable<AutoMovieViewLoft.IResult["chain"]>;

  /** The least tangent meeting every section keeps, the fit tool's admission margin (`FamilyConicFit.ADMISSIBLE_MARGIN`). */
  const MARGIN: number = F.ADMISSIBLE_MARGIN;

  /** Spacing of the stations the admission is read at, mm: the fit tool's dense spacing (`DENSE_MM`). */
  const DENSE_MM: number = 0.25;

  /** Spacing of the stations the girth and the reach lines are read at, mm. */
  const STEP_MM: number = 1;

  /** Phases a section's girth is read at: its perimeter as a polygon of 360 sides, under 0.1 % short of the curve's for a 100 mm limb. */
  const GIRTH_PHASES: number = 360;

  /**
   * The form's scale, mm: a lobe of a reach line (a stretch between two inflections) counts only if it stands this far off its chord, and
   * a muscle's belly only if it rises this far above the lower of its two flanks. One pixel of the whole-figure frame (`FamilyConicFigure`:
   * 1,500 px over about 1.75 m), computed from those numbers, 1.17 mm, for f1 and every case alike; a smaller lobe is not read at the
   * figure's scale (the form rule's "a ripple finer than the form's scale dropped", #3151). A lobe of f1's near this gate flips under a
   * case's few per cent at any gate (the leg's +v lobe of 1.20 mm under a length change alone), so those flips are listed as the
   * detector's residuals, not read as breaks.
   */
  const LOBE_MM: number = 1750 / 1500;

  /** How far an inflection may move and still be the same one, mm: the least spacing of a wall's knots (`FamilyConicBody`, `GAP_MM`). */
  const MOVED_MM: number = 12;

  /**
   * The population ends of a segment's length, as a ratio to f1's: ANSUR II women's 5th and 95th percentile over their mean
   * (`packages/human/docs/sources/ansur-ii-course-measures.md`; mean ± 1.645 SD). Upper arm: acromion-radiale 311.2 (17.2) mm. Forearm:
   * radiale-stylion 241.3 (15.2) mm. Thigh and shank: ANSUR II has no femur or tibia length in the notes; (crotch height - lateral
   * malleolus height) over stature, 0.4417 (0.0156), the leg's length ratio, stands in for both.
   */
  const LENGTH_ENDS: Record<string, [number, number]> = {
    humerus: [1 - (1.645 * 17.2) / 311.2, 1 + (1.645 * 17.2) / 311.2],
    forearm: [1 - (1.645 * 15.2) / 241.3, 1 + (1.645 * 15.2) / 241.3],
    femur: [1 - (1.645 * 0.0156) / 0.4417, 1 + (1.645 * 0.0156) / 0.4417],
    tibia: [1 - (1.645 * 0.0156) / 0.4417, 1 + (1.645 * 0.0156) / 0.4417],
  };

  /** The depth perturbation at a site, a share: the supervisor's brief (±20 %). */
  const DEPTH_STEP: number = 0.2;

  /** One tape site on a limb's course. */
  interface ISite {
    name: string;
    definition: string;
    /** Its station on f1's course, mm, or null where the definition cannot be read on the course (reported, not guessed). */
    station: number | null;
    tau: number;
    run: number;
  }

  /** One named muscle belly, read as the single maximum of a reach line over a run. */
  interface IBelly {
    name: string;
    /** The reach direction whose line shows it: `+u` anterior, `-u` posterior (both limbs' charts take `u` forward). */
    direction: string;
    run: number;
  }

  /** One limb. */
  interface ILimb {
    name: "arm" | "leg";
    family: Family;
    lengths: { segment: string; joint: string }[];
    /** The station before which the wall is held as stored (the shoulder), or 0. */
    held: number;
    bellies: IBelly[];
  }

  const round3 = (x: number): number => Math.round(x * 1000) / 1000;

  /** Ken Perlin's quintic smoothstep: 0 to 1 with zero first and second derivatives at both ends, so a blend through it is C2. */
  const smooth = (x: number): number => {
    const t: number = Math.min(1, Math.max(0, x));
    return t * t * t * (10 - 15 * t + 6 * t * t);
  };

  /** The station of a course nearest a point: a scan every millimetre, refined by golden section within the best millimetre. */
  function nearest(axis: AutoMovieViewAxis.IAxis, length: number, p: readonly number[]): number {
    const d = (s: number): number => {
      const o: number[] = axis.at(s).origin as number[];
      return Math.hypot(o[0]! - p[0]!, o[1]! - p[1]!, o[2]! - p[2]!);
    };
    let best: number = 0;
    for (let s: number = 0; s <= length; s += 1) if (d(s) < d(best)) best = s;
    let [a, b]: number[] = [Math.max(0, best - 1), Math.min(length, best + 1)];
    for (let i: number = 0; i < 60; ++i) {
      const m1: number = a! + (b! - a!) * 0.382, m2: number = a! + (b! - a!) * 0.618;
      if (d(m1) < d(m2)) b = m2;
      else a = m1;
    }
    return (a! + b!) / 2;
  }

  /** The course's length: the sum of its straight runs. */
  function courseLength(family: Family): number {
    let total: number = 0;
    for (let k: number = 1; k < family.centres.length; ++k) total += Math.hypot(...([0, 1, 2].map((i: number): number => family.centres[k]![i]! - family.centres[k - 1]![i]!) as V3));
    return total;
  }

  /** The stations of a family's course centres: 0 at the first, the course's nearest approach at each turn, the course's length at the last. */
  function joints(family: Family): number[] {
    const axis: AutoMovieViewAxis.IAxis = H.axis(family);
    const length: number = courseLength(family);
    return family.centres.map((c, k: number): number => (k === 0 ? 0 : k === family.centres.length - 1 ? length : nearest(axis, length, c)));
  }

  /** A station of one course carried to another by its run and `tau`. */
  function carry(s: number, from: readonly number[], to: readonly number[]): number {
    let run: number = 0;
    while (run < from.length - 2 && s > from[run + 1]!) ++run;
    const tau: number = (s - from[run]!) / (from[run + 1]! - from[run]!);
    return to[run]! + tau * (to[run + 1]! - to[run]!);
  }

  /** A section's girth, mm, from its field vector: the perimeter of its chain read along `GIRTH_PHASES` rays. */
  function girth(values: readonly number[], layout: S.ILayout): number {
    const section: AutoMovieViewChain.ISection = S.chain(values, layout);
    if (section.fault !== null) return NaN;
    let total: number = 0;
    let previous: number[] | null = null;
    let first: number[] | null = null;
    for (let j: number = 0; j < GIRTH_PHASES; ++j) {
      const phi: number = (2 * Math.PI * j) / GIRTH_PHASES;
      const r: number = AutoMovieViewChain.radius(section, phi);
      const p: number[] = [r * Math.cos(phi), r * Math.sin(phi)];
      if (previous !== null) total += Math.hypot(p[0]! - previous[0]!, p[1]! - previous[1]!);
      first ??= p;
      previous = p;
    }
    return total + Math.hypot(first![0]! - previous![0]!, first![1]! - previous![1]!);
  }

  /** The reach fields of a limb layout, by guide: `+u`, `+v`, `-u`, `-v`, each with its offset field and the two reaches across it. */
  function reaches(layout: S.ILayout): { direction: string; field: number; offset: number; across: [string, string] }[] {
    const at: number[] = S.offsets(layout).at;
    const guides: number[] = layout.anchors.map((a: S.IAnchor, k: number): number => (a.guide === true ? k : -1)).filter((k: number): boolean => k >= 0);
    if (guides.length !== 4 || layout.mirror) throw new Error("reaches: a limb layout of four guides is expected");
    return [
      { direction: "+u", field: at[guides[0]!]!, offset: at[guides[0]!]! + 1, across: ["+v", "-v"] },
      { direction: "+v", field: at[guides[1]!]! + 1, offset: at[guides[1]!]!, across: ["+u", "-u"] },
      { direction: "-u", field: at[guides[2]!]!, offset: at[guides[2]!]! + 1, across: ["+v", "-v"] },
      { direction: "-v", field: at[guides[3]!]! + 1, offset: at[guides[3]!]!, across: ["+u", "-u"] },
    ];
  }

  /**
   * f1's limbs. The arm is held before its humerus run (the shoulder and the armpit, #3151); the leg starts at the hip. The bellies: the
   * biceps on the upper arm's anterior line, the forearm's flexors and extensors on its girth (read as the posterior line's maximum, the
   * extensor mass the frames show), the quadriceps on the thigh's anterior line, the gastrocnemius on the shank's posterior line.
   */
  function limbs(): ILimb[] {
    const arm: Family = AutoMovieHumanF1.BODY.arm;
    const leg: Family = AutoMovieHumanF1.BODY.leg;
    return [
      { name: "arm", family: arm, lengths: [{ segment: "humerus", joint: "forearm" }, { segment: "forearm", joint: "hand" }], held: joints(arm)[1]!, bellies: [{ name: "biceps", direction: "+u", run: 1 }, { name: "forearm mass", direction: "-u", run: 2 }] },
      { name: "leg", family: leg, lengths: [{ segment: "femur", joint: "tibia" }, { segment: "tibia", joint: "foot" }], held: 0, bellies: [{ name: "quadriceps", direction: "+u", run: 0 }, { name: "gastrocnemius", direction: "-u", run: 1 }] },
    ];
  }

  function pointUnder(frames: Map<string, SF.IFrame>, name: string): V3 {
    const placed: T.IPlaced = T.POINTS[name]!;
    return SF.toWorld(frames.get(placed.frame)!, placed.local);
  }

  /** The chain with some segments' lengths scaled: the offset of the joint at each segment's far end. */
  function chainWith(scales: Record<string, number>, limb: ILimb): SF.IJoint[] {
    return T.CHAIN.map((joint: SF.IJoint): SF.IJoint => {
      const by: { segment: string; joint: string } | undefined = limb.lengths.find((l): boolean => l.joint === joint.name);
      const k: number = by === undefined ? 1 : (scales[by.segment] ?? 1);
      return { ...joint, offset: SF.scale(joint.offset, k) };
    });
  }

  /** The sites of a limb on f1, each by its standard's definition read on the stored wall. */
  function sites(limb: ILimb): ISite[] {
    const family: Family = limb.family;
    const J: number[] = joints(family);
    const axis: AutoMovieViewAxis.IAxis = H.axis(family);
    const length: number = courseLength(family);
    const read: (s: number) => number[] = H.reader(family);
    const site = (name: string, definition: string, station: number): ISite => {
      let run: number = 0;
      while (run < J.length - 2 && station > J[run + 1]!) ++run;
      return { name, definition, station, run, tau: (station - J[run]!) / (J[run + 1]! - J[run]!) };
    };
    const extreme = (from: number, to: number, pick: 1 | -1): number => {
      let best: number = from;
      for (let s: number = from; s <= to; s += STEP_MM) if (pick * girth(read(s), family.layout) > pick * girth(read(best), family.layout)) best = s;
      return best;
    };
    const frames: Map<string, SF.IFrame> = SF.world(T.CHAIN, (): undefined => undefined);
    const mid = (a: string, b: string): V3 => SF.mid(pointUnder(frames, a), pointUnder(frames, b));
    if (limb.name === "arm")
      return [
        site("upper arm", "ISO 8559-1 upper arm girth, relaxed, at mid upper arm: midway between the acromion and the olecranon (ISAK mid-acromiale-radiale). f1's table has no acromion, so the shoulder's joint centre stands in for it and the elbow's for the olecranon", nearest(axis, length, mid("upperarm", "lowerarm"))),
        site("elbow", "elbow girth at the elbow's joint centre, the epicondyles' level (ISO 7250-1 elbow breadth's landmarks)", J[2]!),
        site("forearm", "ISO 8559-1 forearm girth: the forearm's maximum girth, relaxed; the largest wall girth in the forearm run's proximal half (ANSUR II's forearm girth is flexed, so not that one)", extreme(J[2]!, (J[2]! + J[3]!) / 2, 1)),
        site("wrist", "ANSUR II wrist circumference: over stylion; the station nearest the radial and ulnar styloids' midpoint", nearest(axis, length, mid("styloidRadial", "styloidUlnar"))),
      ];
    const trunk: Family = AutoMovieHumanF1.BODY.trunk;
    const crotchY: number = (H.axis(trunk).at(trunk.knots[0]!).origin as number[])[1]!;
    let thigh: number = 0;
    while (thigh < J[1]! && (axis.at(thigh).origin as number[])[1]! > crotchY) thigh += 0.25;
    return [
      site("thigh", "ANSUR II thigh circumference: at the gluteal furrow, perpendicular to the thigh's axis; the furrow is not in f1's table, so the crotch's height (the trunk's first knot) stands in for it", thigh),
      site("knee", "knee girth at the knee's joint centre, the femoral epicondyles' level", J[1]!),
      site("calf", "ANSUR II calf circumference: maximum; the largest wall girth in the shank run", extreme(J[1]!, J[2]!, 1)),
      site("ankle", "ANSUR II ankle circumference: minimum; the smallest wall girth in the shank run's distal half", extreme((J[1]! + J[2]!) / 2, J[2]!, -1)),
    ];
  }

  function depths(family: Family, site: ISite): Record<string, number> {
    const values: number[] = H.reader(family)(site.station!);
    const out: Record<string, number> = {};
    for (const r of reaches(family.layout)) out[r.direction] = Math.abs(values[r.field]!);
    return out;
  }

  /** The person's fields for a limb: its segments' lengths as scales of f1's, and each site's depths as ratios to f1's. */
  interface IFields {
    lengths: Record<string, number>;
    depths: Record<string, Record<string, number>>;
  }

  /**
   * The natural cubic spline through points, its value and its first and second derivatives, extended straight past both ends (its second
   * derivative is zero there, so the extension keeps it C2): the second derivatives at the points solved by the tridiagonal (Thomas) sweep.
   */
  function naturalCubic(x: readonly number[], y: readonly number[]): (t: number) => [number, number, number] {
    const m: number = x.length;
    const h: number[] = Array.from({ length: m - 1 }, (_: unknown, i: number): number => x[i + 1]! - x[i]!);
    const M: number[] = new Array<number>(m).fill(0);
    if (m > 2) {
      const [b, c, r]: number[][] = [[], [], []];
      for (let i: number = 1; i < m - 1; ++i) {
        b.push((h[i - 1]! + h[i]!) / 3);
        c.push(h[i]! / 6);
        r.push((y[i + 1]! - y[i]!) / h[i]! - (y[i]! - y[i - 1]!) / h[i - 1]!);
      }
      for (let i: number = 1; i < b.length; ++i) {
        const f: number = h[i]! / 6 / b[i - 1]!;
        b[i] = b[i]! - f * c[i - 1]!;
        r[i] = r[i]! - f * r[i - 1]!;
      }
      for (let i: number = b.length - 1; i >= 0; --i) M[i + 1] = (r[i]! - (i + 1 < b.length ? c[i]! * M[i + 2]! : 0)) / b[i]!;
    }
    return (t: number): [number, number, number] => {
      let i: number = 0;
      while (i < m - 2 && t > x[i + 1]!) ++i;
      const hi: number = h[i]!;
      const slope = (k: 0 | 1): number => (y[i + 1]! - y[i]!) / hi + (k === 0 ? -(2 * M[i]! + M[i + 1]!) : M[i]! + 2 * M[i + 1]!) * (hi / 6);
      if (t < x[0]!) return [y[0]! + slope(0) * (t - x[0]!), slope(0), 0];
      if (t > x[m - 1]!) return [y[m - 1]! + slope(1) * (t - x[m - 1]!), slope(1), 0];
      const A: number = (x[i + 1]! - t) / hi;
      const B: number = (t - x[i]!) / hi;
      return [A * y[i]! + B * y[i + 1]! + (((A * A * A - A) * M[i]! + (B * B * B - B) * M[i + 1]!) * hi * hi) / 6, (y[i + 1]! - y[i]!) / hi + ((-(3 * A * A - 1) * M[i]! + (3 * B * B - 1) * M[i + 1]!) * hi) / 6, A * M[i]! + B * M[i + 1]!];
    };
  }

  /**
   * The depth profile of one reach direction at a person's fields, with its first and second derivatives in station: through 1 at the held
   * seam (or the hip) and every site's ratio, by the quintic smoothstep between consecutive anchors (`linear`: straight), held at the last
   * site's ratio past it and at 1 before the first anchor.
   */
  function depthProfile(limb: ILimb, fields: IFields, f1Sites: ISite[], direction: string, linear: boolean = false, spline: boolean = false): (s: number) => [number, number, number] {
    const anchors: [number, number][] = [[limb.held, 1] as [number, number], ...f1Sites.filter((x: ISite): boolean => x.station !== null).map((x: ISite): [number, number] => [x.station!, fields.depths[x.name]?.[direction] ?? 1])].sort((a, b): number => a[0] - b[0]);
    if (spline) {
      const through: (s: number) => [number, number, number] = naturalCubic(anchors.map((a): number => a[0]), anchors.map((a): number => a[1]));
      return (s: number): [number, number, number] => (s <= anchors[0]![0] ? [1, 0, 0] : through(s));
    }
    return (s: number): [number, number, number] => {
      if (s <= anchors[0]![0]) return [1, 0, 0];
      for (let k: number = 1; k < anchors.length; ++k)
        if (s <= anchors[k]![0]) {
          const L: number = anchors[k]![0] - anchors[k - 1]![0];
          const x: number = (s - anchors[k - 1]![0]) / L;
          const d: number = anchors[k]![1] - anchors[k - 1]![1];
          if (linear) return [anchors[k - 1]![1] + x * d, d / L, 0];
          return [anchors[k - 1]![1] + smooth(x) * d, (30 * x * x * (1 - x) * (1 - x) * d) / L, (60 * x * (1 - x) * (1 - 2 * x) * d) / (L * L)];
        }
      return [anchors.at(-1)![1], 0, 0];
    };
  }

  /** The law: a limb's family at a person's fields. `linear` draws the depth profile straight between anchors (the first run's profile). */
  function law(limb: ILimb, fields: IFields, f1Sites: ISite[], linear: boolean = false, spline: boolean = false): Family {
    const family: Family = limb.family;
    const J: number[] = joints(family);
    const frames: Map<string, SF.IFrame> = SF.world(chainWith(fields.lengths, limb), (): undefined => undefined);
    const centres: V3[] = T.COURSES[family.name]!.map((n: string): V3 => pointUnder(frames, n));
    const moved: Family = { ...family, centres, reliefs: [] };
    const J2: number[] = joints(moved);
    const ratio = (direction: string, s: number): number => depthProfile(limb, fields, f1Sites, direction, linear, spline)(s)[0];
    const values: number[][] = family.values.map((field: number[]): number[] => [...field]);
    family.knots.forEach((s: number, m: number): void => {
      if (s < limb.held) return;
      for (const r of reaches(family.layout)) {
        values[r.field]![m] = family.values[r.field]![m]! * ratio(r.direction, s);
        values[r.offset]![m] = family.values[r.offset]![m]! * ((ratio(r.across[0], s) + ratio(r.across[1], s)) / 2);
      }
    });
    const map = (s: number): number => (s < limb.held ? s : carry(s, J, J2));
    return {
      ...moved,
      knots: family.knots.map(map),
      values,
      ...(family.tips === undefined ? {} : { tips: family.tips.map((t) => (t === null ? null : { ...t, from: map(t.from), tip: map(t.tip) })) as [H.ITip | null, H.ITip | null] }),
    };
  }

  /** An inflection of a reach line: its station carried to f1's course. */
  interface IInflection {
    line: string;
    station: number;
  }

  /** What the form rule reads on a family. */
  interface IForm {
    /** Stations, carried to f1's course, whose section is no admissible chain or meets under the margin. */
    refused: number[];
    /** The engine's own admission of the family realized alone as a construction source (`FamilyConicLoft.refusals`). */
    native: string[];
    /** The inflections of each reach line that bound a lobe of at least `LOBE_MM`, by line. */
    inflections: IInflection[];
    /** Each named belly's maxima of at least `LOBE_MM` prominence. */
    bellies: Record<string, number>;
    girths: Record<string, number>;
    order: Record<string, boolean>;
    /** Each reach line's inflection history (`inflectionTrace`), stations carried to f1's course, by line. */
    traces?: Record<string, ReturnType<typeof inflectionTrace>>;
    /** Each named belly's local maxima over its run, stations carried to f1's course, with their prominence above the higher of their two flanks' lows, mm. */
    maxima?: Record<string, { station: number; prominence: number }[]>;
    /** Each reach line as read, every `STEP_MM`, stations carried to f1's course, by line. */
    profiles?: Record<string, { at: number[]; profile: number[] }>;
  }

  /**
   * The inflections of a profile that bound a lobe of at least `LOBE_MM` off its chord: every sign change of its second difference, then
   * the lobe of least sagitta under the bound merged away (an end lobe by dropping its inner inflection, an inner lobe by dropping both of
   * its inflections, an S pair that a ripple drew) until every lobe left stands at least `LOBE_MM` off its chord.
   */
  function significant(profile: number[], at: number[]): number[] {
    return inflectionTrace(profile, at).kept.map((k: { station: number }): number => k.station);
  }

  /**
   * `significant` with its history: every sign change of the profile's second difference (`raw`), each inflection the merging dropped
   * with the sagitta of the lobe whose merge dropped it (`removed`), and each inflection kept with the smaller of its two lobes' sagittas
   * (`kept`), stations from `at`.
   */
  function inflectionTrace(profile: number[], at: number[]): { raw: number[]; removed: { station: number; sagitta: number }[]; kept: { station: number; lobe: number }[] } {
    const marks: number[] = [];
    let sign: number = 0;
    for (let i: number = 1; i + 1 < profile.length; ++i) {
      const bend: number = profile[i + 1]! - 2 * profile[i]! + profile[i - 1]!;
      if (bend === 0) continue;
      const now: number = Math.sign(bend);
      if (sign !== 0 && now !== sign) marks.push(i);
      sign = now;
    }
    const raw: number[] = marks.map((i: number): number => at[i]!);
    const removed: { station: number; sagitta: number }[] = [];
    const sagitta = (a: number, b: number): number => {
      let most: number = 0;
      for (let i: number = a; i <= b; ++i) most = Math.max(most, Math.abs(profile[i]! - (profile[a]! + ((profile[b]! - profile[a]!) * (i - a)) / Math.max(1, b - a))));
      return most;
    };
    for (;;) {
      const ends: number[] = [0, ...marks, profile.length - 1];
      let least: number = Infinity;
      let which: number = -1;
      for (let k: number = 0; k + 1 < ends.length; ++k) {
        const s: number = sagitta(ends[k]!, ends[k + 1]!);
        if (s < least) [least, which] = [s, k];
      }
      if (marks.length === 0 || least >= LOBE_MM) break;
      // Lobe `which` spans ends[which] .. ends[which + 1]; its inflections are marks[which - 1] and marks[which].
      const dropped: number[] = which === 0 ? marks.splice(0, 1) : which === ends.length - 2 ? marks.splice(marks.length - 1, 1) : marks.splice(which - 1, 2);
      for (const i of dropped) removed.push({ station: at[i]!, sagitta: least });
    }
    const ends: number[] = [0, ...marks, profile.length - 1];
    const kept: { station: number; lobe: number }[] = marks.map((i: number, k: number): { station: number; lobe: number } => ({ station: at[i]!, lobe: Math.min(sagitta(ends[k]!, ends[k + 1]!), sagitta(ends[k + 1]!, ends[k + 2]!)) }));
    return { raw, removed, kept };
  }

  function form(limb: ILimb, family: Family, f1Sites: ISite[], f1J: number[]): IForm {
    const J: number[] = joints(family);
    const read: (s: number) => number[] = H.reader(family);
    const first: number = family.knots[0]!, last: number = family.knots[family.knots.length - 1]!;
    const back = (s: number): number => round3(s < limb.held ? s : carry(s, J, f1J));
    const refused: number[] = [];
    for (let s: number = Math.max(first, limb.held); s <= last; s += DENSE_MM) {
      const t: number[] = read(s);
      const fault: string | null = S.chain(t, family.layout).fault;
      const least: number = fault === null ? Math.min(...F.leastMeetings(t, family.layout)) : -Infinity;
      if (fault !== null || least < MARGIN) refused.push(back(s));
    }
    const native: string[] = K.refusals({ ...family, reliefs: [] });
    // The reach lines from the held seam to the end's cap, every millimetre; the held seam itself lies inside them, so a step there shows.
    const end: number = family.tips?.[1]?.from ?? last;
    const start: number = Math.max(first, limb.held - 20);
    const inflections: IInflection[] = [];
    const lines: Record<string, { at: number[]; profile: number[] }> = {};
    const traces: Record<string, ReturnType<typeof inflectionTrace>> = {};
    const carried: Record<string, { at: number[]; profile: number[] }> = {};
    for (const r of reaches(family.layout)) {
      const at: number[] = [];
      const profile: number[] = [];
      for (let s: number = start; s <= end - 1; s += STEP_MM) {
        at.push(s);
        profile.push(Math.abs(read(s)[r.field]!));
      }
      lines[r.direction] = { at, profile };
      for (const s of significant(profile, at)) inflections.push({ line: r.direction, station: back(s) });
      traces[r.direction] = inflectionTrace(profile, at.map(back));
      carried[r.direction] = { at: at.map(back), profile };
    }
    // Each belly: maxima of its line over its run that rise `LOBE_MM` above the lower of the two flanks between them and the run's ends.
    const bellies: Record<string, number> = {};
    const maxima: Record<string, { station: number; prominence: number }[]> = {};
    for (const belly of limb.bellies) {
      const line = lines[belly.direction]!;
      const inRun: number[] = line.at.map((_: number, i: number): number => i).filter((i: number): boolean => line.at[i]! >= J[belly.run]! && line.at[i]! <= J[belly.run + 1]!);
      const values: number[] = inRun.map((i: number): number => line.profile[i]!);
      let count: number = 0;
      maxima[belly.name] = [];
      for (let i: number = 1; i + 1 < values.length; ++i) {
        if (!(values[i]! > values[i - 1]! && values[i]! >= values[i + 1]!)) continue;
        let left: number = values[i]!, right: number = values[i]!;
        for (let l: number = i - 1; l >= 0 && values[l]! <= values[i]!; --l) left = Math.min(left, values[l]!);
        for (let rr: number = i + 1; rr < values.length && values[rr]! <= values[i]!; ++rr) right = Math.min(right, values[rr]!);
        if (values[i]! - Math.max(left, right) >= LOBE_MM) ++count;
        maxima[belly.name]!.push({ station: back(line.at[inRun[i]!]!), prominence: values[i]! - Math.max(left, right) });
      }
      bellies[belly.name] = count;
    }
    const g = (s: number): number => girth(read(s), family.layout);
    const girths: Record<string, number> = {};
    for (const site of f1Sites) if (site.station !== null) girths[site.name] = round3(g(J[site.run]! + site.tau * (J[site.run + 1]! - J[site.run]!)));
    const maxOver = (a: number, b: number): number => {
      let best: number = 0;
      for (let s: number = a; s <= b; s += STEP_MM) best = Math.max(best, g(s));
      return round3(best);
    };
    const order: Record<string, boolean> = {};
    if (limb.name === "arm") {
      girths["forearm max"] = maxOver(J[2]!, J[3]!);
      girths["upper arm max"] = maxOver(J[1]!, J[2]!);
      order["wrist < forearm max"] = girths["wrist"]! < girths["forearm max"]!;
      order["elbow < forearm max"] = girths["elbow"]! < girths["forearm max"]!;
      order["elbow < upper arm max"] = girths["elbow"]! < girths["upper arm max"]!;
    } else {
      girths["calf max"] = maxOver(J[1]!, J[2]!);
      order["ankle < calf max"] = girths["ankle"]! < girths["calf max"]!;
      order["knee < thigh"] = girths["knee"]! < girths["thigh"]!;
      order["calf max < thigh"] = girths["calf max"]! < girths["thigh"]!;
    }
    return { refused, native, inflections, bellies, girths, order, traces, maxima, profiles: carried };
  }

  /** A case's reading against f1's: new refusals, the inflections that appear or vanish beyond `MOVED_MM`, belly and order changes. */
  function compare(f1: IForm, got: IForm): { newRefused: number[]; appeared: IInflection[]; vanished: IInflection[]; bellies: string[]; order: string[]; native: string[] } {
    const near = (list: readonly number[], s: number): boolean => list.some((x: number): boolean => Math.abs(x - s) <= 1);
    const match = (a: IInflection, list: readonly IInflection[]): boolean => list.some((b: IInflection): boolean => b.line === a.line && Math.abs(b.station - a.station) <= MOVED_MM);
    const newRefused: number[] = got.refused.filter((s: number): boolean => !near(f1.refused, s));
    return {
      newRefused,
      appeared: got.inflections.filter((x: IInflection): boolean => !match(x, f1.inflections)),
      vanished: f1.inflections.filter((x: IInflection): boolean => !match(x, got.inflections)),
      bellies: Object.entries(got.bellies).filter(([k, n]): boolean => n !== f1.bellies[k]).map(([k, n]): string => `${k} ${n} maxima (f1 ${f1.bellies[k]})`),
      order: Object.entries(got.order).filter(([k, ok]): boolean => ok !== f1.order[k]).map(([k, ok]): string => `${k} ${ok ? "now holds" : "broken"}`),
      native: got.native.filter((x: string): boolean => !f1.native.includes(x)),
    };
  }

  /**
   * Made breaks of f1's wall, each a defect the form rule names, so each detector is shown red on a break and green on f1:
   * - a dent: the anterior reach 4 mm less at the one knot nearest the run's middle (a lump or dent, rule 2);
   * - a flattened belly: the belly's line drawn straight between its run's two ends at every knot inside it (rule 3);
   * - an inadmissible section: the `+v` extreme's reach negated at the one knot nearest the run's middle (section admission);
   * - a held seam with a corner: the law with a depth profile straight between anchors at every site -20 % (the first run's step).
   */
  function breaks(limb: ILimb, f1Sites: ISite[]): { name: string; family: Family }[] {
    const family: Family = limb.family;
    const J: number[] = joints(family);
    const R = reaches(family.layout);
    const mid: number = (J[limb.bellies[0]!.run]! + J[limb.bellies[0]!.run + 1]!) / 2;
    const closest: number = family.knots.reduce((b: number, s: number, m: number): number => (Math.abs(s - mid) < Math.abs(family.knots[b]! - mid) ? m : b), 0);
    const edit = (change: (values: number[][]) => void): Family => {
      const values: number[][] = family.values.map((f: number[]): number[] => [...f]);
      change(values);
      return { ...family, reliefs: [], values };
    };
    const plusU = R.find((r): boolean => r.direction === "+u")!;
    const plusV = R.find((r): boolean => r.direction === "+v")!;
    const belly: IBelly = limb.bellies[1]!;
    const line = R.find((r): boolean => r.direction === belly.direction)!;
    const read: (s: number) => number[] = H.reader(family);
    const [a, b]: number[] = [J[belly.run]!, J[belly.run + 1]!];
    const [ya, yb]: number[] = [read(a!)[line.field]!, read(b!)[line.field]!];
    return [
      {
        name: "made dent",
        family: edit((v: number[][]): void => {
          v[plusU.field]![closest] = v[plusU.field]![closest]! - Math.sign(v[plusU.field]![closest]!) * 4;
        }),
      },
      {
        name: `made flat ${belly.name}`,
        family: edit((v: number[][]): void => {
          family.knots.forEach((s: number, m: number): void => {
            if (s > a! && s < b!) v[line.field]![m] = ya! + ((yb! - ya!) * (s - a!)) / (b! - a!);
          });
        }),
      },
      {
        name: "made inadmissible section",
        family: edit((v: number[][]): void => {
          v[plusV.field]![closest] = -v[plusV.field]![closest]!;
        }),
      },
      { name: "made straight profile, every site -20%", family: law(limb, { lengths: {}, depths: Object.fromEntries(f1Sites.map((x: ISite): [string, Record<string, number>] => [x.name, { "+u": 0.8, "+v": 0.8, "-u": 0.8, "-v": 0.8 }])) }, f1Sites, true) },
    ];
  }

  /** A family's display mesh, metres: a ring every millimetre at 256 phases, through the engine's loft. */
  function mesh(id: string, family: Family): N.Mesh | null {
    const stations: number[] = [];
    const last: number = family.knots[family.knots.length - 1]!;
    const end: number = family.tips?.[1]?.from ?? last;
    for (let s: number = family.knots[0]!; s <= end; s += 1) stations.push(s);
    const loft: AutoMovieViewLoft.IResult = H.create({ ...family, reliefs: [] }, stations);
    if (loft.chain === null) return null;
    const chain: Chain = loft.chain;
    const M: number = 256;
    const positions: number[] = [];
    const indices: number[] = [];
    for (const s of stations) {
      const sample: (t: number) => [number, number, number] = AutoMovieLoftChain.sampler(chain, s);
      for (let j: number = 0; j < M; ++j) {
        const p: number[] = sample((2 * Math.PI * j) / M);
        positions.push(p[0]! / 1000, p[1]! / 1000, p[2]! / 1000);
      }
    }
    for (let i: number = 0; i + 1 < stations.length; ++i)
      for (let j: number = 0; j < M; ++j) {
        const a: number = i * M + j, b: number = i * M + ((j + 1) % M);
        indices.push(a, a + M, b, b, a + M, b + M);
      }
    return { id, positions, indices, colour: [0.64, 0.65, 0.67] };
  }

  const fileName = (s: string): string => s.replace(/%/g, "pc").replace(/\+/g, "plus").replace(/[^A-Za-z0-9.-]+/g, "-");

  /** The run's cases for a limb: each segment's length at its two ends, each site's depth at ±`DEPTH_STEP`, every site at once, and every length at once. */
  function casesOf(limb: ILimb, f1Sites: ISite[]): { name: string; fields: IFields }[] {
    const cases: { name: string; fields: IFields }[] = [];
    for (const l of limb.lengths) for (const [label, k] of [["5th", LENGTH_ENDS[l.segment]![0]], ["95th", LENGTH_ENDS[l.segment]![1]]] as [string, number][]) cases.push({ name: `${l.segment} length ${label} (x${k.toFixed(3)})`, fields: { lengths: { [l.segment]: k }, depths: {} } });
    for (const site of f1Sites) for (const sign of [-1, 1]) cases.push({ name: `${site.name} depth ${sign > 0 ? "+" : "-"}${DEPTH_STEP * 100}%`, fields: { lengths: {}, depths: { [site.name]: { "+u": 1 + sign * DEPTH_STEP, "+v": 1 + sign * DEPTH_STEP, "-u": 1 + sign * DEPTH_STEP, "-v": 1 + sign * DEPTH_STEP } } } });
    for (const sign of [-1, 1]) cases.push({ name: `every site ${sign > 0 ? "+" : "-"}${DEPTH_STEP * 100}%`, fields: { lengths: {}, depths: Object.fromEntries(f1Sites.map((x: ISite): [string, Record<string, number>] => [x.name, { "+u": 1 + sign * DEPTH_STEP, "+v": 1 + sign * DEPTH_STEP, "-u": 1 + sign * DEPTH_STEP, "-v": 1 + sign * DEPTH_STEP }])) } });
    for (const [label, endIndex] of [["5th", 0], ["95th", 1]] as [string, 0 | 1][]) cases.push({ name: `every length ${label}`, fields: { lengths: Object.fromEntries(limb.lengths.map((l): [string, number] => [l.segment, LENGTH_ENDS[l.segment]![endIndex]])), depths: {} } });
    return cases;
  }

  /** A lobe this near `LOBE_MM` on f1 reads as crossing it under a ±20 % case: 1 / 1.25 = 0.8 to 1 / 0.8 = 1.25 mm (the supervisor's brief on #3151). */
  const NEAR_LOBE: [number, number] = [0.8, 1.25];

  /**
   * The girth correlations the population survey holds for neighbouring tape sites: ANSUR 1988's (Gordon et al. 1989), the full matrix
   * per sex of `packages/motions/src/executable/population/HumanPopulationSurvey.ts` (`SURVEY`, its `VARIABLES` order), read from that
   * tracked file's text, since the motions package does not export it. Its arm girths are the flexed biceps, the extended elbow, the
   * flexed forearm and the wrist at stylion; its leg girths the proximal thigh, the knee and the calf. It has no relaxed upper arm and no
   * ankle girth, and ANSUR II's notes (`packages/human/docs/sources/ansur-ii.md`) give each girth's regression on stature, BMI and age with
   * its residual SD, not the correlations between girths.
   */
  async function girthCorrelations(root: string): Promise<string[]> {
    const text: string = await fs.readFile(path.join(root, "packages/motions/src/executable/population/HumanPopulationSurvey.ts"), "utf8");
    const names: string[] = [...text.slice(text.indexOf("VARIABLES"), text.indexOf("];", text.indexOf("VARIABLES"))).matchAll(/"([A-Za-z]+)"/g)].map((m: RegExpMatchArray): string => m[1]!);
    const matrices: number[][][] = [];
    for (let from: number = text.indexOf("r: ["); from >= 0; from = text.indexOf("r: [", from + 1)) {
      let depth: number = 0;
      let end: number = from + 3;
      for (; end < text.length; ++end) {
        if (text[end] === "[") ++depth;
        else if (text[end] === "]" && --depth === 0) break;
      }
      matrices.push(JSON.parse(text.slice(from + 3, end + 1).replace(/\s+/g, "").replace(/,\]/g, "]")) as number[][]);
    }
    const r = (m: number[][], a: string, b: string): number => {
      const [i, j]: number[] = [names.indexOf(a), names.indexOf(b)].sort((x: number, y: number): number => y - x);
      return m[i! - 1]![j!]!;
    };
    const pairs: [string, string][] = [["bicepsFlexed", "elbow"], ["elbow", "forearmFlexed"], ["forearmFlexed", "wrist"], ["bicepsFlexed", "forearmFlexed"], ["bicepsFlexed", "wrist"], ["elbow", "wrist"], ["thigh", "knee"], ["knee", "calf"], ["thigh", "calf"]];
    return [
      `ANSUR 1988 (the survey constants, ${names.length} measures, ${matrices.length} matrices: women then men), the correlations of neighbouring limb girths:`,
      ...pairs.map(([a, b]: [string, string]): string => `  ${a} - ${b}: women ${r(matrices[0]!, a, b).toFixed(4)}, men ${r(matrices[1]!, a, b).toFixed(4)}`),
      "  relaxed upper arm, forearm at its relaxed maximum, ankle: not available (the survey has no such girth)",
      "ANSUR II: not available as correlations (its notes give each girth's regression on stature, BMI and age and its residual SD only)",
    ];
  }

  /**
   * What the run's form changes are (the supervisor's survey on #3151, step 2), measurement only: for every inflection that appears or
   * vanishes and every belly maximum lost in every case of the run, on both limbs, (1) its line and station, the lobe's height off its
   * chord on f1 and in the case (`inflectionTrace`: a kept inflection's smaller lobe, a merged one's lobe when merged), and whether the
   * bend's sign changes at all within `MOVED_MM` (a raw sign change of the line's second difference on both sides) or only the lobe crossed
   * `LOBE_MM`: by f1's lobe lying in `NEAR_LOBE`, or by f1's lobe times the case's ratio there crossing it; (2) at that station the depth
   * profile's ratio and its derivatives, f1's reach line's, and the terms of the product's bend, `ratio'' r` and `2 ratio' r'` against
   * `ratio r''`; (3) for the uniform cases, the profile's anchors and its bend between the held end and the first site; (4) the forearm
   * mass's line in elbow +20 %. Classed: threshold crossing (the sign kept on both sides and the lobe's change by the scaling); else by the
   * largest of the three parts of the case line's bend change there: profile bend (`ratio'' r + 2 ratio' r'`), knot sampling (the case
   * line, the spline through the knots' scaled values, against the product `ratio r`), other (the scaling `(ratio - 1) r''`). Also the population's girth correlations for the
   * perturbation design (`girthCorrelations`). Written to `survey.txt`.
   */
  async function survey(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const out: string = path.join(root, "test/.shots/family-conic-limb-law", "survey-" + new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const lines: string[] = ["f1 limb law: what each form change of the run is (issue #3151, step 2); measurement only", ""];
    const counts: Record<string, number> = { "threshold crossing": 0, "profile bend": 0, "knot sampling": 0, other: 0 };
    for (const limb of limbs()) {
      const family: Family = limb.family;
      const J: number[] = joints(family);
      const f1Sites: ISite[] = sites(limb);
      const f1Wall: Family = { ...family, reliefs: [] };
      const f1Form: IForm = form(limb, f1Wall, f1Sites, J);
      // A family's reach lines as `form` reads them, each with its inflection history, stations carried to f1's course.
      const traced = (made: Family): Record<string, ReturnType<typeof inflectionTrace> & { read: (s: number) => number; at: number[]; profile: number[] }> => {
        const MJ: number[] = joints(made);
        const read: (s: number) => number[] = H.reader(made);
        const lastKnot: number = made.knots[made.knots.length - 1]!;
        const end: number = made.tips?.[1]?.from ?? lastKnot;
        const start: number = Math.max(made.knots[0]!, limb.held - 20);
        const back = (s: number): number => round3(s < limb.held ? s : carry(s, MJ, J));
        const to = (s: number): number => (s < limb.held ? s : carry(s, J, MJ));
        const result: Record<string, ReturnType<typeof inflectionTrace> & { read: (s: number) => number; at: number[]; profile: number[] }> = {};
        for (const r of reaches(made.layout)) {
          const at: number[] = [];
          const profile: number[] = [];
          for (let s: number = start; s <= end - 1; s += STEP_MM) {
            at.push(back(s));
            profile.push(Math.abs(read(s)[r.field]!));
          }
          result[r.direction] = { ...inflectionTrace(profile, at), read: (s: number): number => Math.abs(read(to(s))[r.field]!), at, profile };
        }
        return result;
      };
      const f1Lines = traced(f1Wall);
      const bend = (read: (s: number) => number, s: number): [number, number, number] => {
        const h: number = 0.5;
        return [read(s), (read(s + h) - read(s - h)) / (2 * h), (read(s + h) - 2 * read(s) + read(s - h)) / (h * h)];
      };
      lines.push(`${limb.name.toUpperCase()}: f1's inflections per line with their smaller lobe (mm): ${Object.entries(f1Lines).map(([d, t]): string => `${d} ${t.kept.map((k): string => `${k.station}:${k.lobe.toFixed(2)}`).join(" ")}`).join("; ")}`);
      lines.push(`  f1's raw sign changes merged away (station:sagitta when merged): ${Object.entries(f1Lines).map(([d, t]): string => `${d} ${t.removed.map((k): string => `${k.station}:${k.sagitta.toFixed(2)}`).join(" ")}`).join("; ")}`);
      for (const c of casesOf(limb, f1Sites)) {
        const made: Family = law(limb, c.fields, f1Sites);
        const got: IForm = form(limb, made, f1Sites, J);
        const compared = compare(f1Form, got);
        if (compared.appeared.length + compared.vanished.length + compared.bellies.length === 0) continue;
        const caseLines = traced(made);
        lines.push(`  ${c.name}:`);
        const event = (x: IInflection, kind: "appeared" | "vanished"): void => {
          const f1T = f1Lines[x.line]!;
          const caseT = caseLines[x.line]!;
          const rawNear = (raw: number[]): number | null => raw.reduce((best: number | null, r: number): number | null => (Math.abs(r - x.station) <= MOVED_MM && (best === null || Math.abs(r - x.station) < Math.abs(best - x.station)) ? r : best), null);
          const lobeAt = (t: ReturnType<typeof inflectionTrace>): string => {
            const kept = t.kept.find((k): boolean => Math.abs(k.station - x.station) <= MOVED_MM);
            if (kept !== undefined) return `${kept.lobe.toFixed(2)} (kept at ${kept.station})`;
            const merged = t.removed.filter((k): boolean => Math.abs(k.station - x.station) <= MOVED_MM).sort((a, b): number => Math.abs(a.station - x.station) - Math.abs(b.station - x.station))[0];
            return merged === undefined ? "none (no sign change)" : `${merged.sagitta.toFixed(2)} (merged at ${merged.station})`;
          };
          const lobeValue = (t: ReturnType<typeof inflectionTrace>): number => {
            const kept = t.kept.find((k): boolean => Math.abs(k.station - x.station) <= MOVED_MM);
            if (kept !== undefined) return kept.lobe;
            const merged = t.removed.filter((k): boolean => Math.abs(k.station - x.station) <= MOVED_MM).sort((a, b): number => Math.abs(a.station - x.station) - Math.abs(b.station - x.station))[0];
            return merged === undefined ? NaN : merged.sagitta;
          };
          const [f1Raw, caseRaw] = [rawNear(f1T.raw), rawNear(caseT.raw)];
          const [p, p1, p2] = depthProfile(limb, c.fields, f1Sites, x.line)(x.station);
          const [r, r1, r2] = bend(f1T.read, x.station);
          const [, , c2] = bend(caseT.read, x.station);
          const profileTerm: number = p2 * r + 2 * p1 * r1;
          const lineTerm: number = p * r2;
          // The case line is the natural cubic through each knot's value times the profile at that knot, not the product `ratio r` itself:
          // its bend's change from f1's, `c'' - r''`, is the profile's own terms, the scaling of the line's bend, `(ratio - 1) r''`, and the
          // rest, the knot sampling of the profile through the spline, `c'' - (ratio r)''`.
          const scaleTerm: number = (p - 1) * r2;
          const samplingTerm: number = c2 - (profileTerm + lineTerm);
          const f1Lobe: number = lobeValue(f1T);
          let cls: string;
          if (f1Raw !== null && caseRaw !== null && Number.isFinite(f1Lobe) && ((f1Lobe >= NEAR_LOBE[0] && f1Lobe <= NEAR_LOBE[1]) || (f1Lobe >= LOBE_MM) !== (f1Lobe * p >= LOBE_MM))) cls = "threshold crossing";
          else {
            const largest: number = Math.max(Math.abs(profileTerm), Math.abs(scaleTerm), Math.abs(samplingTerm));
            cls = largest === Math.abs(profileTerm) ? "profile bend" : largest === Math.abs(samplingTerm) ? "knot sampling" : "other";
          }
          counts[cls] = (counts[cls] ?? 0) + 1;
          lines.push(
            `    ${kind} ${x.line}@${x.station}: ${cls}. Sign change of the bend within ${MOVED_MM} mm: f1 ${f1Raw === null ? "none" : `at ${f1Raw}`}, case ${caseRaw === null ? "none" : `at ${caseRaw}`}; lobe f1 ${lobeAt(f1T)}, case ${lobeAt(caseT)}; ` +
              `profile ${p.toFixed(4)}, ' ${p1.toExponential(3)} /mm, '' ${p2.toExponential(3)} /mm2; f1 line r ${r.toFixed(2)} mm, r' ${r1.toFixed(4)}, r'' ${r2.toExponential(3)} /mm; terms ratio''r ${(p2 * r).toExponential(3)}, 2ratio'r' ${(2 * p1 * r1).toExponential(3)}, ratio r'' ${lineTerm.toExponential(3)}; ` +
              `the case line's r'' ${c2.toExponential(3)}, its change from f1's ${(c2 - r2).toExponential(3)} = profile ${profileTerm.toExponential(3)} + scaling ${scaleTerm.toExponential(3)} + knot sampling ${samplingTerm.toExponential(3)}`,
          );
        };
        for (const x of compared.appeared) event(x, "appeared");
        for (const x of compared.vanished) event(x, "vanished");
        for (const b of compared.bellies) {
          counts["other"] = counts["other"]! + 1;
          lines.push(`    belly: ${b} (other)`);
        }
        // (3) The uniform cases: the profile's anchors and its bend between the held end and the first site.
        if (c.name.startsWith("every site")) {
          const P = depthProfile(limb, c.fields, f1Sites, "+u");
          const first: number = Math.min(...f1Sites.map((x: ISite): number => x.station!));
          let most: number = 0;
          for (let s: number = limb.held; s <= first; s += 0.5) most = Math.max(most, Math.abs(P(s)[2]));
          lines.push(`    the profile: 1 at the held end (${round3(limb.held)}), ${P(first)[0]} at the first site (${round3(first)}) and every site after; its bend between them up to ${most.toExponential(3)} /mm2, none past the first site; the offsets scale by the mean of the two across ratios, the same ${P(first)[0]} past the first site; a lobe scales by the ratio, so one under ${(LOBE_MM / P(first)[0]).toFixed(2)} mm on f1 crosses ${LOBE_MM} mm`);
        }
        // (4) The forearm mass in elbow +20 %.
        if (compared.bellies.length > 0)
          for (const belly of limb.bellies) {
            const f1Line = f1Lines[belly.direction]!;
            const caseLine = caseLines[belly.direction]!;
            const [a, b] = [J[belly.run]!, J[belly.run + 1]!];
            const maxima = (t: { at: number[]; profile: number[] }): string =>
              t.profile
                .map((v: number, i: number): number => (t.at[i]! >= a && t.at[i]! <= b && i > 0 && i + 1 < t.profile.length && v > t.profile[i - 1]! && v >= t.profile[i + 1]! ? i : -1))
                .filter((i: number): boolean => i >= 0)
                .map((i: number): string => `${t.at[i]}: ${t.profile[i]!.toFixed(2)}`)
                .join(", ") || "none";
            const every: string[] = [];
            for (let s: number = Math.ceil(a / 5) * 5; s <= b; s += 5) every.push(`${s} ${f1Line.read(s).toFixed(2)}|${caseLine.read(s).toFixed(2)}|${depthProfile(limb, c.fields, f1Sites, belly.direction)(s)[0].toFixed(3)}`);
            lines.push(`    ${belly.name} (${belly.direction} over ${round3(a)}..${round3(b)}): local maxima f1 ${maxima(f1Line)}; case ${maxima(caseLine)}`, `      station f1|case|profile every 5 mm: ${every.join("; ")}`);
          }
      }
      lines.push("");
    }
    lines.push(`counts by class: ${Object.entries(counts).map(([k, n]): string => `${k} ${n}`).join(", ")}`, "", ...(await girthCorrelations(root)));
    await fs.writeFile(path.join(out, "survey.txt"), lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
  }

  /** The population constants' tables, read from their tracked text as `girthCorrelations` reads them: measure names, and per sex (women first) means, SDs and correlation matrices. */
  async function surveyTables(root: string): Promise<{ names: string[]; mean: number[][]; sd: number[][]; r: number[][][] }> {
    const text: string = await fs.readFile(path.join(root, "packages/motions/src/executable/population/HumanPopulationSurvey.ts"), "utf8");
    const names: string[] = [...text.slice(text.indexOf("VARIABLES"), text.indexOf("];", text.indexOf("VARIABLES"))).matchAll(/"([A-Za-z]+)"/g)].map((m: RegExpMatchArray): string => m[1]!);
    const arrays = <X>(key: string): X[] => {
      const found: X[] = [];
      for (let from: number = text.indexOf(key + ": ["); from >= 0; from = text.indexOf(key + ": [", from + 1)) {
        const open: number = from + key.length + 2;
        let depth: number = 0;
        let end: number = open;
        for (; end < text.length; ++end) {
          if (text[end] === "[") ++depth;
          else if (text[end] === "]" && --depth === 0) break;
        }
        found.push(JSON.parse(text.slice(open, end + 1).replace(/\s+/g, "").replace(/,\]/g, "]")) as X);
      }
      return found;
    };
    return { names, mean: arrays<number[]>("mean"), sd: arrays<number[]>("sd"), r: arrays<number[][]>("r") };
  }

  /**
   * Each tape site's girth in the population, women (f1 is a woman's figure, and `LENGTH_ENDS` takes the women's ends): its mean and SD,
   * mm, the population survey's measure whose correlations stand for its own, and its neighbouring sites along the limb. ANSUR II women
   * (`packages/human/docs/sources/ansur-ii.md`): the flexed biceps 305.6 (30.8) stands for the upper arm, which ANSUR II measures only
   * flexed; the flexed forearm 264.1 (18.5) for the forearm, whose relaxed maximum it does not measure; the wrist 154.8 (7.8), the thigh
   * 616.1 (55.8), the calf 373.3 (28.5), the ankle 215.7 (14.9). The elbow and the knee are not in ANSUR II's notes: ANSUR 1988 women's,
   * from the survey constants (`surveyTables`). The ankle has no survey measure, so no correlation.
   */
  const SITE_GIRTHS: Record<string, { mean?: number; sd?: number; measure: string | null; neighbours: string[] }> = {
    "upper arm": { mean: 305.6, sd: 30.8, measure: "bicepsFlexed", neighbours: ["elbow"] },
    elbow: { measure: "elbow", neighbours: ["upper arm", "forearm"] },
    forearm: { mean: 264.1, sd: 18.5, measure: "forearmFlexed", neighbours: ["elbow", "wrist"] },
    wrist: { mean: 154.8, sd: 7.8, measure: "wrist", neighbours: ["forearm"] },
    thigh: { mean: 616.1, sd: 55.8, measure: "thigh", neighbours: ["knee"] },
    knee: { measure: "knee", neighbours: ["thigh", "calf"] },
    calf: { mean: 373.3, sd: 28.5, measure: "calf", neighbours: ["knee", "ankle"] },
    ankle: { mean: 215.7, sd: 14.9, measure: null, neighbours: ["calf"] },
  };

  /** The normal deviate of the 5th and 95th percentiles, the population ends the lengths take (`LENGTH_ENDS`). */
  const END_DEVIATE: number = 1.645;

  /**
   * The run's cases from the population (the supervisor's ruling on #3151, step 2): the lengths as `casesOf` takes them; every site at once
   * at the population's ends, its depths scaled by `1 ± END_DEVIATE CV`, CV its girth's coefficient of variation (a section scaled about
   * its course scales its girth by the same ratio); and each site alone by `1 ± END_DEVIATE CV sqrt(1 - rho^2)`, rho the largest
   * correlation of its girth with a neighbouring site's (ANSUR 1988 women): with the neighbours held, a site moves by its conditional SD,
   * which with one neighbour at rho is `sqrt(1 - rho^2)` of its own, and the largest rho gives the least such move of any one neighbour. A
   * site with no correlation available takes rho 0, its whole SD.
   */
  function populationCases(limb: ILimb, f1Sites: ISite[], tables: { names: string[]; mean: number[][]; sd: number[][]; r: number[][][] }): { cases: { name: string; fields: IFields }[]; basis: string[] } {
    const women = (measure: string, of: number[][]): number => of[0]![tables.names.indexOf(measure)]!;
    const rho = (a: string, b: string): number | null => {
      const [ma, mb] = [SITE_GIRTHS[a]?.measure ?? null, SITE_GIRTHS[b]?.measure ?? null];
      if (ma === null || mb === null) return null;
      const [i, j]: number[] = [tables.names.indexOf(ma), tables.names.indexOf(mb)].sort((x: number, y: number): number => y - x);
      return tables.r[0]![i! - 1]![j!]!;
    };
    const basis: string[] = [];
    const ends: Record<string, { together: number; alone: number }> = {};
    for (const site of f1Sites) {
      const g = SITE_GIRTHS[site.name]!;
      const mean: number = g.mean ?? women(g.measure!, tables.mean);
      const sd: number = g.sd ?? women(g.measure!, tables.sd);
      const cv: number = sd / mean;
      const known: number[] = g.neighbours.map((n: string): number | null => rho(site.name, n)).filter((x: number | null): x is number => x !== null);
      const rhoMax: number = known.length === 0 ? 0 : Math.max(...known);
      ends[site.name] = { together: END_DEVIATE * cv, alone: END_DEVIATE * cv * Math.sqrt(1 - rhoMax * rhoMax) };
      basis.push(`  ${site.name}: girth ${mean.toFixed(1)} (${sd.toFixed(1)}) mm, CV ${cv.toFixed(4)}; neighbour correlations ${g.neighbours.map((n: string): string => `${n} ${rho(site.name, n)?.toFixed(4) ?? "not available"}`).join(", ")}; rho max ${rhoMax.toFixed(4)}; together ±${(100 * ends[site.name]!.together).toFixed(2)} %, alone ±${(100 * ends[site.name]!.alone).toFixed(2)} %`);
    }
    const all = (k: number): Record<string, number> => ({ "+u": k, "+v": k, "-u": k, "-v": k });
    const cases: { name: string; fields: IFields }[] = casesOf(limb, f1Sites).filter((c): boolean => Object.keys(c.fields.depths).length === 0);
    for (const site of f1Sites) for (const sign of [-1, 1]) cases.push({ name: `${site.name} alone ${sign > 0 ? "+" : "-"}${(100 * ends[site.name]!.alone).toFixed(1)}%`, fields: { lengths: {}, depths: { [site.name]: all(1 + sign * ends[site.name]!.alone) } } });
    for (const sign of [-1, 1]) cases.push({ name: `every site at its ${sign > 0 ? "95th" : "5th"}`, fields: { lengths: {}, depths: Object.fromEntries(f1Sites.map((x: ISite): [string, Record<string, number>] => [x.name, all(1 + sign * ends[x.name]!.together)])) } });
    return { cases, basis };
  }

  /**
   * The form rule (#3151) on a case against f1: a lobe of f1's, an inflection with its smaller lobe, is lost when its bend's sign turns
   * (no sign change of the case line's second difference within `MOVED_MM`) or when its case height falls under half of f1's height
   * times the local depth ratio (a feature's depth under half the reference's); a lobe the case gains counts when it reaches `LOBE_MM`
   * (a form the reference lacks); a belly keeps its maximum while one maximum of its run stands at least half of f1's prominence times the
   * ratio, and a second maximum counts when it rises `LOBE_MM`; refusals and the order relations as `compare` reads them.
   */
  function formRule(f1: IForm, got: IForm, ratio: (direction: string, s: number) => number, bellyLine: (name: string) => string): { kind: string; line: string; station: number; detail: string }[] {
    const changes: { kind: string; line: string; station: number; detail: string }[] = [];
    const near = (list: readonly number[], s: number): boolean => list.some((x: number): boolean => Math.abs(x - s) <= 1);
    const newRefused: number[] = got.refused.filter((s: number): boolean => !near(f1.refused, s));
    if (newRefused.length > 0) changes.push({ kind: "refused", line: "-", station: newRefused[0]!, detail: `${newRefused.length} new stations under the margin (${newRefused[0]} .. ${newRefused.at(-1)})` });
    for (const x of got.native.filter((x: string): boolean => !f1.native.includes(x))) changes.push({ kind: "native refusal", line: "-", station: NaN, detail: x.slice(0, 160) });
    for (const [line, trace] of Object.entries(f1.traces!)) {
      const other = got.traces![line]!;
      const heightNear = (s: number): number | null => {
        const kept = other.kept.filter((k): boolean => Math.abs(k.station - s) <= MOVED_MM).sort((a, b): number => Math.abs(a.station - s) - Math.abs(b.station - s))[0];
        if (kept !== undefined) return kept.lobe;
        const merged = other.removed.filter((k): boolean => Math.abs(k.station - s) <= MOVED_MM).sort((a, b): number => Math.abs(a.station - s) - Math.abs(b.station - s))[0];
        return merged === undefined ? null : merged.sagitta;
      };
      for (const k of trace.kept) {
        if (!other.raw.some((r: number): boolean => Math.abs(r - k.station) <= MOVED_MM)) {
          changes.push({ kind: "sign turned", line, station: k.station, detail: `f1's lobe ${k.lobe.toFixed(2)} mm; no sign change of the case's bend within ${MOVED_MM} mm` });
          continue;
        }
        const h: number | null = heightNear(k.station);
        const floor: number = 0.5 * k.lobe * ratio(line, k.station);
        if (h !== null && h < floor) changes.push({ kind: "under half", line, station: k.station, detail: `f1's lobe ${k.lobe.toFixed(2)} mm, the case's ${h.toFixed(2)} mm, under half of f1's times the ratio, ${floor.toFixed(2)}` });
      }
      for (const k of other.kept)
        if (!trace.kept.some((f): boolean => Math.abs(f.station - k.station) <= MOVED_MM)) changes.push({ kind: "gained", line, station: k.station, detail: `a lobe of ${k.lobe.toFixed(2)} mm f1 does not have at this scale (f1 ${trace.raw.some((r: number): boolean => Math.abs(r - k.station) <= MOVED_MM) ? "has a sign change here under the lobe scale" : "has no sign change here"})` });
    }
    for (const [name, list] of Object.entries(f1.maxima!)) {
      const main = list.reduce((a, b): { station: number; prominence: number } => (b.prominence > a.prominence ? b : a), list[0]!);
      const other = got.maxima![name]!;
      const floor: number = 0.5 * main.prominence * ratio(bellyLine(name), main.station);
      const kept = other.filter((m): boolean => m.prominence >= floor);
      if (kept.length === 0) changes.push({ kind: "belly lost", line: name, station: main.station, detail: `f1's maximum at ${main.station} rises ${main.prominence.toFixed(2)} mm; the case's highest rises ${Math.max(0, ...other.map((m): number => m.prominence)).toFixed(2)} mm, under half of f1's times the ratio, ${floor.toFixed(2)}` });
      const extra = other.filter((m): boolean => m.prominence >= LOBE_MM).length - list.filter((m): boolean => m.prominence >= LOBE_MM).length;
      if (extra > 0) changes.push({ kind: "second maximum", line: name, station: NaN, detail: `${extra} more maxima rising ${LOBE_MM} mm than f1's` });
    }
    for (const [k, ok] of Object.entries(got.order)) if (ok !== f1.order[k]) changes.push({ kind: "order", line: "-", station: NaN, detail: `${k} ${ok ? "now holds" : "broken"}` });
    return changes;
  }

  /**
   * The limb law on the population's cases (the supervisor's rulings on #3151, step 2): (1) the detector by the form rule (`formRule`),
   * green on f1 and red on the made breaks; (2) the cases from the population (`populationCases`); (3) the depth profile pre-checked first
   * on every line, the present quintic smoothstep through flat anchors and the natural cubic through the same anchors: wherever f1's line
   * bends at the lobe scale (inside one of its lobes of `LOBE_MM`, where `|r''|` is at least `8 LOBE_MM / L^2`, the bend of a parabola
   * of that sagitta over the lobe's length `L`), `(ratio r)''` must keep `r''`'s sign, under every depth case; the realized line's (the
   * spline through the knots' scaled values) is read beside it. The profile that holds is taken, the present one if both do; if neither,
   * the stations are reported and the law is not run. (4) The held seam unchanged. Then the law on both limbs, every case: whether the form
   * holds, every change with its class (`survey`'s classes), and frames of each failing case. Written to `population.txt`.
   */
  async function population(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const out: string = path.join(root, "test/.shots/family-conic-limb-law", "population-" + new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const tables = await surveyTables(root);
    const lines: string[] = ["f1 limb law on the population's cases, the detector by the form rule (issue #3151, step 2)", ""];
    const prepared = limbs().map((limb: ILimb) => {
      const family: Family = limb.family;
      const J: number[] = joints(family);
      const f1Sites: ISite[] = sites(limb);
      const f1Form: IForm = form(limb, { ...family, reliefs: [] }, f1Sites, J);
      const { cases, basis } = populationCases(limb, f1Sites, tables);
      return { limb, family, J, f1Sites, f1Form, cases, basis };
    });

    // (3) The profiles' premise on every line, under every depth case.
    const bendOf = (read: (s: number) => number, s: number): [number, number, number] => [read(s), (read(s + 0.5) - read(s - 0.5)) / 1, (read(s + 0.5) - 2 * read(s) + read(s - 0.5)) / 0.25];
    const verdict: Record<string, number> = {};
    for (const { limb, basis } of prepared) lines.push(`${limb.name.toUpperCase()}: the sites in the population (women):`, ...basis);
    // (1) The detector by the form rule, green on f1 and red on the made breaks, before any case.
    lines.push("", "(1) THE DETECTOR BY THE FORM RULE:");
    for (const { limb, family, J, f1Sites, f1Form } of prepared) {
      const check = (made: Family): { kind: string; line: string; station: number; detail: string }[] => formRule(f1Form, form(limb, made, f1Sites, J), (): number => 1, (name: string): string => limb.bellies.find((b: IBelly): boolean => b.name === name)!.direction);
      lines.push(`  ${limb.name} f1 against itself (green): ${check({ ...family, reliefs: [] }).length} changes`);
      for (const made of breaks(limb, f1Sites)) {
        const changes = check(made.family);
        lines.push(`  ${limb.name} ${made.name} (red): ${changes.length === 0 ? "no change" : changes.map((x): string => `${x.kind} ${x.line}@${Number.isFinite(x.station) ? x.station : "-"}`).join("; ")}`);
      }
    }
    lines.push("", "(3) THE PROFILES' PREMISE: inside f1's lobes, where |r''| >= 8 LOBE_MM / L^2, (ratio r)'' keeps r'''s sign; per limb, case and line, the stations where it turns (mm on f1's course) and the largest turned (ratio r)''");
    for (const [label, spline] of [["smoothstep", false], ["natural cubic", true]] as [string, boolean][]) {
      let failures: number = 0;
      let realized: number = 0;
      const turned: Map<string, { stations: number[]; most: number }> = new Map();
      for (const { limb, family, J, f1Sites, f1Form, cases } of prepared) {
        const read = H.reader(family);
        for (const c of cases) {
          if (Object.keys(c.fields.depths).length === 0) continue;
          const made: Family = law(limb, c.fields, f1Sites, false, spline);
          const madeRead = H.reader(made);
          const MJ: number[] = joints(made);
          for (const r of reaches(family.layout)) {
            const kept: number[] = f1Form.traces![r.direction]!.kept.map((k): number => k.station);
            const lastKnot: number = family.knots[family.knots.length - 1]!;
            const end: number = family.tips?.[1]?.from ?? lastKnot;
            const start: number = Math.max(family.knots[0]!, limb.held);
            const bounds: number[] = [start, ...kept.filter((s: number): boolean => s > start && s < end), end];
            const f1Line = (s: number): number => Math.abs(read(s)[r.field]!);
            const caseLine = (s: number): number => Math.abs(madeRead(carry(s, J, MJ))[r.field]!);
            const P = depthProfile(limb, c.fields, f1Sites, r.direction, false, spline);
            for (let s: number = Math.ceil(start); s <= end - 1; s += 1) {
              const lobe: number = bounds.findIndex((b: number, i: number): boolean => i + 1 < bounds.length && s >= b && s < bounds[i + 1]!);
              if (lobe < 0) continue;
              const L: number = bounds[lobe + 1]! - bounds[lobe]!;
              const [v, v1, v2] = bendOf(f1Line, s);
              if (Math.abs(v2) < (8 * LOBE_MM) / (L * L)) continue;
              const [p, p1, p2] = P(s);
              const product: number = p2 * v + 2 * p1 * v1 + p * v2;
              if (Math.sign(product) !== Math.sign(v2)) {
                ++failures;
                const key: string = `${limb.name} | ${c.name} | ${r.direction}`;
                const entry = turned.get(key) ?? { stations: [], most: 0 };
                entry.stations.push(s);
                entry.most = Math.max(entry.most, Math.abs(product));
                turned.set(key, entry);
              }
              if (Math.sign(bendOf(caseLine, s)[2]) !== Math.sign(v2)) ++realized;
            }
          }
        }
      }
      verdict[label] = failures;
      const runs = (stations: number[]): string => {
        const out: string[] = [];
        let from: number = stations[0]!;
        for (let i: number = 1; i <= stations.length; ++i)
          if (i === stations.length || stations[i] !== stations[i - 1]! + 1) {
            out.push(from === stations[i - 1]! ? `${from}` : `${from}..${stations[i - 1]!}`);
            from = stations[i]!;
          }
        return out.join(", ");
      };
      lines.push(
        `  ${label}: ${failures} stations where (ratio r)'' turns r'''s sign, in ${turned.size} of the case lines${failures === 0 ? "" : ":"}`,
        ...[...turned.entries()].map(([key, x]): string => `    ${key}: ${runs(x.stations)} (${x.stations.length}; up to ${x.most.toExponential(2)} /mm)`),
        `    the realized line (the spline through the knots' scaled values) turns it at ${realized} stations`,
      );
    }
    const chosen: string | null = verdict["smoothstep"] === 0 ? "smoothstep" : verdict["natural cubic"] === 0 ? "natural cubic" : null;
    lines.push(`  taken: ${chosen ?? "neither holds; the law is not run"}`, "");
    if (chosen === null) {
      await fs.writeFile(path.join(out, "population.txt"), lines.join("\n") + "\n");
      process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
      return;
    }
    const spline: boolean = chosen === "natural cubic";

    // The law on every case with the detector by the form rule.
    NodeCanvasRaster.initialize();
    const counts: Record<string, number> = {};
    for (const { limb, family, J, f1Sites, f1Form, cases, basis } of prepared) {
      lines.push(`${limb.name.toUpperCase()} (the profile: ${chosen}):`, "  the sites in the population:", ...basis);
      const one = (made: Family, fields: IFields): { kind: string; line: string; station: number; detail: string }[] => formRule(f1Form, form(limb, made, f1Sites, J), (d: string, s: number): number => depthProfile(limb, fields, f1Sites, d, false, spline)(s)[0], (name: string): string => limb.bellies.find((b: IBelly): boolean => b.name === name)!.direction);
      lines.push(`  f1 against itself (green): ${one({ ...family, reliefs: [] }, { lengths: {}, depths: {} }).length} changes`);
      for (const made of breaks(limb, f1Sites)) {
        const changes = one(made.family, { lengths: {}, depths: {} });
        lines.push(`  ${made.name} (red): ${changes.length === 0 ? "no change" : changes.map((x): string => `${x.kind} ${x.line}@${Number.isFinite(x.station) ? x.station : "-"}`).join("; ")}`);
      }
      const f1Read = H.reader(family);
      for (const c of cases) {
        const made: Family = law(limb, c.fields, f1Sites, false, spline);
        const changes = one(made, c.fields);
        if (changes.length === 0) {
          lines.push(`  ${c.name}: form holds`);
          continue;
        }
        const madeRead = H.reader(made);
        const MJ: number[] = joints(made);
        lines.push(`  ${c.name}: ${changes.length} changes`);
        for (const x of changes) {
          let cls: string = "other";
          const r = reaches(family.layout).find((q): boolean => q.direction === x.line);
          if (r !== undefined && Number.isFinite(x.station)) {
            const [v, v1, v2] = bendOf((s: number): number => Math.abs(f1Read(s)[r.field]!), x.station);
            const c2: number = bendOf((s: number): number => Math.abs(madeRead(carry(s, J, MJ))[r.field]!), x.station)[2];
            const [p, p1, p2] = depthProfile(limb, c.fields, f1Sites, x.line, false, spline)(x.station);
            const parts: [string, number][] = [["profile bend", p2 * v + 2 * p1 * v1], ["knot sampling", c2 - (p2 * v + 2 * p1 * v1 + p * v2)], ["scaling", (p - 1) * v2]];
            cls = x.detail.includes("has a sign change here under the lobe scale") ? "threshold crossing" : parts.reduce((a, b): [string, number] => (Math.abs(b[1]) > Math.abs(a[1]) ? b : a))[0];
            x.detail += `; ratio ${p.toFixed(4)}; bend change ${(c2 - v2).toExponential(2)} = profile ${parts[0]![1].toExponential(2)} + knot sampling ${parts[1]![1].toExponential(2)} + scaling ${parts[2]![1].toExponential(2)}`;
          }
          counts[cls] = (counts[cls] ?? 0) + 1;
          lines.push(`    ${x.kind} ${x.line}@${Number.isFinite(x.station) ? x.station : "-"} (${cls}): ${x.detail}`);
        }
        const meshes: (N.Mesh | null)[] = [mesh(limb.name + ".f1", family), mesh(limb.name + "." + c.name, made)];
        const points: N.Point[] = [];
        for (let i: number = 0; i < meshes[0]!.positions.length; i += 3) points.push([meshes[0]!.positions[i]!, meshes[0]!.positions[i + 1]!, meshes[0]!.positions[i + 2]!]);
        for (const view of ["front", "left"]) {
          const camera: N.Camera = NodeCanvasCamera.fit(view, points, 700, 1100);
          for (const [stage, m] of [["f1", meshes[0]], [fileName(c.name), meshes[1]]] as [string, N.Mesh | null][]) {
            if (m === null) continue;
            const file: string = path.join(out, `${limb.name}.${view}.${stage}.png`);
            await fs.writeFile(file, NodeCanvasRaster.render(camera, [m], [], "depth", `f1 ${limb.name} wall, limb law (${chosen}) | ${stage} | ${view}`).png);
            lines.push(`      ${file}`);
          }
        }
      }
      lines.push("");
    }
    lines.push(`changes by class: ${Object.entries(counts).map(([k, n]): string => `${k} ${n}`).join(", ") || "none"}`);
    await fs.writeFile(path.join(out, "population.txt"), lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
  }

  /** The stations of one case's lines where `(ratio r)''` turns `r''`'s sign inside f1's lobes at the lobe scale (`population`'s premise). */
  function premiseCount(limb: ILimb, f1Form: IForm, f1Sites: ISite[], fields: IFields, spline: boolean): number {
    const family: Family = limb.family;
    const read = H.reader(family);
    let count: number = 0;
    for (const r of reaches(family.layout)) {
      const kept: number[] = f1Form.traces![r.direction]!.kept.map((k): number => k.station);
      const lastKnot: number = family.knots[family.knots.length - 1]!;
      const end: number = family.tips?.[1]?.from ?? lastKnot;
      const start: number = Math.max(family.knots[0]!, limb.held);
      const bounds: number[] = [start, ...kept.filter((s: number): boolean => s > start && s < end), end];
      const line = (s: number): number => Math.abs(read(s)[r.field]!);
      const P = depthProfile(limb, fields, f1Sites, r.direction, false, spline);
      for (let s: number = Math.ceil(start); s <= end - 1; s += 1) {
        const lobe: number = bounds.findIndex((b: number, i: number): boolean => i + 1 < bounds.length && s >= b && s < bounds[i + 1]!);
        if (lobe < 0) continue;
        const L: number = bounds[lobe + 1]! - bounds[lobe]!;
        const [v, v1, v2] = [line(s), line(s + 0.5) - line(s - 0.5), (line(s + 0.5) - 2 * line(s) + line(s - 0.5)) / 0.25];
        if (Math.abs(v2) < (8 * LOBE_MM) / (L * L)) continue;
        const [p, p1, p2] = P(s);
        if (Math.sign(p2 * v + 2 * p1 * v1 + p * v2) !== Math.sign(v2)) ++count;
      }
    }
    return count;
  }

  /** A family's four guide lines (its reach extremes, the view outlines), metres, every 2 mm from its first knot to its end's cap. */
  function guideCurves(family: Family, colour: string, id: string): N.Curve[] {
    const read: (s: number) => number[] = H.reader(family);
    const axis: AutoMovieViewAxis.IAxis = H.axis(family);
    const lastKnot: number = family.knots[family.knots.length - 1]!;
    const end: number = family.tips?.[1]?.from ?? lastKnot;
    const curves: number[][][] = [[], [], [], []];
    for (let s: number = family.knots[0]!; s <= end; s += 2) {
      const chain: S.IChain = S.resolve(read(s), family.layout);
      const frame = axis.at(s);
      chain.guides.forEach((g: number, q: number): void => {
        const p = chain.input.points[g]!;
        curves[q]!.push([0, 1, 2].map((c: number): number => (frame.origin[c]! + frame.u[c]! * p[0] + frame.v[c]! * p[1]) / 1000));
      });
    }
    return curves.map((points: number[][], q: number): N.Curve => ({ id: `${id}${q}`, points: points as N.Point[], closed: false, xray: true, colour }));
  }

  /**
   * The law on every population case with each of the two depth profiles, read by the form rule's detector (the supervisor's ruling on
   * #3151, step 2, after the premise of `population` proved sufficient but not necessary): per profile, limb and case, the form kept or
   * every change with its class, station, lobe heights and zone (the held end's transition between the held seam and the first site; on
   * the arm, the elbow and forearm sites 50 mm apart; others), and the premise's station count beside it. The made straight profile is
   * listed apart where the rule finds no break in it. Frames: the worst failing case of the profile with fewer changes, its guide lines
   * (the reach extremes) over f1's on its clay, from the front, the left and the right. Written to `profiles.txt`.
   */
  async function profiles(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const out: string = path.join(root, "test/.shots/family-conic-limb-law", "profiles-" + new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const tables = await surveyTables(root);
    const lines: string[] = ["f1 limb law: both depth profiles on every population case, read by the form rule (issue #3151, step 2); measurement only", ""];
    const prepared = limbs().map((limb: ILimb) => {
      const family: Family = limb.family;
      const J: number[] = joints(family);
      const f1Sites: ISite[] = sites(limb);
      const f1Form: IForm = form(limb, { ...family, reliefs: [] }, f1Sites, J);
      return { limb, family, J, f1Sites, f1Form, cases: populationCases(limb, f1Sites, tables).cases };
    });
    const bellyLine = (limb: ILimb) => (name: string): string => limb.bellies.find((b: IBelly): boolean => b.name === name)!.direction;
    lines.push("THE DETECTOR (proven in population-2026-11-15T06-00-33.841Z): the made breaks again, the straight profile listed apart where the rule finds none:");
    for (const { limb, family, J, f1Sites, f1Form } of prepared) {
      lines.push(`  ${limb.name} f1 against itself: ${formRule(f1Form, form(limb, { ...family, reliefs: [] }, f1Sites, J), (): number => 1, bellyLine(limb)).length} changes`);
      for (const made of breaks(limb, f1Sites)) {
        const changes = formRule(f1Form, form(limb, made.family, f1Sites, J), (): number => 1, bellyLine(limb));
        const straight: boolean = made.name.startsWith("made straight profile");
        lines.push(`  ${limb.name} ${made.name}: ${changes.length === 0 ? (straight ? "not a break under the rule: its earlier red came from lobes near 1 mm shrinking under the absolute 1 mm gate, which the rule reads against half of f1's lobe times the ratio" : "no change (the detector misses it)") : changes.map((x): string => `${x.kind} ${x.line}@${Number.isFinite(x.station) ? x.station : "-"}`).join("; ")}`);
      }
    }
    lines.push("");
    const totals: Record<string, number> = {};
    const worst: Record<string, { count: number; limb: string; name: string; family: Family; f1: Family } | null> = {};
    const zones: Record<string, Record<string, number>> = {};
    for (const [label, spline] of [["smoothstep", false], ["natural cubic", true]] as [string, boolean][]) {
      totals[label] = 0;
      worst[label] = null;
      zones[label] = {};
      lines.push(`PROFILE ${label.toUpperCase()}:`);
      for (const { limb, family, J, f1Sites, f1Form, cases } of prepared) {
        const f1Read = H.reader(family);
        const site = (name: string): number => f1Sites.find((x: ISite): boolean => x.name === name)!.station!;
        const first: number = Math.min(...f1Sites.map((x: ISite): number => x.station!));
        const zoneOf = (s: number): string => (!Number.isFinite(s) ? "others" : s >= limb.held && s <= first ? "held-end transition" : limb.name === "arm" && s >= site("elbow") && s <= site("forearm") ? "elbow and forearm sites" : "others");
        for (const c of cases) {
          const made: Family = law(limb, c.fields, f1Sites, false, spline);
          const ratio = (d: string, s: number): number => depthProfile(limb, c.fields, f1Sites, d, false, spline)(s)[0];
          const changes = formRule(f1Form, form(limb, made, f1Sites, J), ratio, bellyLine(limb));
          const premise: number = premiseCount(limb, f1Form, f1Sites, c.fields, spline);
          if (changes.length === 0) {
            lines.push(`  ${limb.name} | ${c.name}: form kept (premise stations ${premise})`);
            continue;
          }
          totals[label] = totals[label]! + changes.length;
          if (worst[label] === null || changes.length > worst[label]!.count) worst[label] = { count: changes.length, limb: limb.name, name: c.name, family: made, f1: family };
          const madeRead = H.reader(made);
          const MJ: number[] = joints(made);
          lines.push(`  ${limb.name} | ${c.name}: ${changes.length} changes (premise stations ${premise})`);
          for (const x of changes) {
            let cls: string = "other";
            const r = reaches(family.layout).find((q): boolean => q.direction === x.line);
            if (r !== undefined && Number.isFinite(x.station)) {
              const f1Line = (s: number): number => Math.abs(f1Read(s)[r.field]!);
              const caseLine = (s: number): number => Math.abs(madeRead(carry(s, J, MJ))[r.field]!);
              const [v, v1, v2] = [f1Line(x.station), f1Line(x.station + 0.5) - f1Line(x.station - 0.5), (f1Line(x.station + 0.5) - 2 * f1Line(x.station) + f1Line(x.station - 0.5)) / 0.25];
              const c2: number = (caseLine(x.station + 0.5) - 2 * caseLine(x.station) + caseLine(x.station - 0.5)) / 0.25;
              const [p, p1, p2] = depthProfile(limb, c.fields, f1Sites, x.line, false, spline)(x.station);
              const parts: [string, number][] = [["profile bend", p2 * v + 2 * p1 * v1], ["knot sampling", c2 - (p2 * v + 2 * p1 * v1 + p * v2)], ["scaling", (p - 1) * v2]];
              cls = x.detail.includes("has a sign change here under the lobe scale") ? "threshold crossing" : parts.reduce((a, b): [string, number] => (Math.abs(b[1]) > Math.abs(a[1]) ? b : a))[0];
              x.detail += `; ratio ${p.toFixed(4)}; bend change ${(c2 - v2).toExponential(2)} = profile ${parts[0]![1].toExponential(2)} + knot sampling ${parts[1]![1].toExponential(2)} + scaling ${parts[2]![1].toExponential(2)}`;
            }
            const zone: string = zoneOf(x.station);
            zones[label]![`${zone} | ${cls}`] = (zones[label]![`${zone} | ${cls}`] ?? 0) + 1;
            lines.push(`    ${x.kind} ${x.line}@${Number.isFinite(x.station) ? x.station : "-"} [${zone}] (${cls}): ${x.detail}`);
          }
        }
      }
      lines.push(`  ${label}: ${totals[label]} changes in all; by zone and class: ${Object.entries(zones[label]!).map(([k, n]): string => `${k} ${n}`).join("; ") || "none"}`, "");
    }
    const better: string = totals["smoothstep"]! <= totals["natural cubic"]! ? "smoothstep" : "natural cubic";
    const keeps: string[] = Object.entries(totals).filter(([, n]): boolean => n === 0).map(([k]): string => k);
    lines.push(keeps.length > 0 ? `the form is kept on every case by: ${keeps.join(", ")}` : `neither profile keeps the form on every case; the better, ${better}, with ${totals[better]} changes`);
    const w = worst[better];
    if (w !== null && w !== undefined) {
      NodeCanvasRaster.initialize();
      const clay: N.Mesh | null = mesh(`${w.limb}.${w.name}`, w.family);
      if (clay !== null) {
        const points: N.Point[] = [];
        for (let i: number = 0; i < clay.positions.length; i += 3) points.push([clay.positions[i]!, clay.positions[i + 1]!, clay.positions[i + 2]!]);
        const curves: N.Curve[] = [...guideCurves({ ...w.f1, reliefs: [] }, "2f6fd0", "f1"), ...guideCurves(w.family, "e01b1b", "case")];
        lines.push(`the worst failing case of ${better}: ${w.limb} | ${w.name} (${w.count} changes); frames, its guide lines (red) over f1's (blue) on its clay:`);
        for (const view of ["front", "left", "right"]) {
          const file: string = path.join(out, `${w.limb}.${view}.${fileName(w.name)}.png`);
          await fs.writeFile(file, NodeCanvasRaster.render(NodeCanvasCamera.fit(view, points, 700, 1100), [clay], curves, "depth", `f1 ${w.limb} wall, limb law (${better}) | ${w.name} | red: the case's guide lines, blue: f1's | ${view}`).png);
          lines.push(`  ${file}`);
        }
      }
    }
    await fs.writeFile(path.join(out, "profiles.txt"), lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
  }

  /** One significant lobe of a reach line: its sign off its chord, its bounding stations, its extreme and its depth, mm. */
  interface ILobe {
    sign: number;
    from: number;
    to: number;
    extreme: number;
    depth: number;
  }

  /**
   * A line's ordered run of significant lobes: the stretches between its kept inflections (`inflectionTrace`, each lobe at least
   * `LOBE_MM`) and its two ends, each with its depth, the line's greatest distance from the straight line through its two bounds, the
   * station of that distance (its extreme) and its sign.
   */
  function lobesOf(line: { at: number[]; profile: number[] }, kept: readonly number[]): ILobe[] {
    const marks: number[] = kept.map((s: number): number => line.at.indexOf(s)).filter((i: number): boolean => i >= 0);
    const ends: number[] = [0, ...marks, line.profile.length - 1];
    const out: ILobe[] = [];
    for (let k: number = 0; k + 1 < ends.length; ++k) {
      const [a, b] = [ends[k]!, ends[k + 1]!];
      let best: number = a;
      let most: number = 0;
      for (let i: number = a; i <= b; ++i) {
        const d: number = line.profile[i]! - (line.profile[a]! + ((line.profile[b]! - line.profile[a]!) * (i - a)) / Math.max(1, b - a));
        if (Math.abs(d) > Math.abs(most)) [most, best] = [d, i];
      }
      out.push({ sign: Math.sign(most), from: line.at[a]!, to: line.at[b]!, extreme: line.at[best]!, depth: Math.abs(most) });
    }
    return out;
  }

  /**
   * The form rule (#3151) read as its text puts it (the supervisor's ruling on #3151, step 2): per reach line, the ordered runs of f1's
   * and the case's significant lobes (`lobesOf`) are aligned in order, a lobe matched only to one of its own sign (the alignment of least
   * cost, a missing lobe costing 1 and a match half its extreme's move over f1's lobe's width, at most 1/2); a lobe of f1's left unmatched
   * is lost, a case lobe left unmatched is gained (a form f1 lacks); a matched lobe is lost when its depth falls under half of f1's times
   * the local ratio, and has moved beyond its width when its extreme stands farther from f1's than f1's lobe's own width (its span between
   * its bounds), a feature moved from its landmark. The refusals, the bellies and the order relations as `formRule` reads them.
   */
  function lobeRule(f1: IForm, got: IForm, ratio: (direction: string, s: number) => number, bellyLine: (name: string) => string): { kind: string; line: string; station: number; detail: string }[] {
    const changes = formRule(f1, got, ratio, bellyLine).filter((x): boolean => !["sign turned", "under half", "gained"].includes(x.kind));
    for (const line of Object.keys(f1.profiles!)) {
      const A: ILobe[] = lobesOf(f1.profiles![line]!, f1.traces![line]!.kept.map((k): number => k.station));
      const B: ILobe[] = lobesOf(got.profiles![line]!, got.traces![line]!.kept.map((k): number => k.station));
      // The alignment of least cost, by dynamic programming over the two runs.
      const cost: number[][] = Array.from({ length: A.length + 1 }, (_: unknown, i: number): number[] => Array.from({ length: B.length + 1 }, (_x: unknown, j: number): number => (i === 0 ? j : j === 0 ? i : Infinity)));
      const match = (a: ILobe, b: ILobe): number => (a.sign === b.sign ? 0.5 * Math.min(1, Math.abs(b.extreme - a.extreme) / Math.max(1, a.to - a.from)) : Infinity);
      for (let i: number = 1; i <= A.length; ++i)
        for (let j: number = 1; j <= B.length; ++j) cost[i]![j] = Math.min(cost[i - 1]![j]! + 1, cost[i]![j - 1]! + 1, cost[i - 1]![j - 1]! + match(A[i - 1]!, B[j - 1]!));
      const pairs: [ILobe | null, ILobe | null][] = [];
      for (let i: number = A.length, j: number = B.length; i > 0 || j > 0; ) {
        if (i > 0 && j > 0 && cost[i]![j] === cost[i - 1]![j - 1]! + match(A[i - 1]!, B[j - 1]!)) pairs.unshift([A[--i]!, B[--j]!]);
        else if (i > 0 && cost[i]![j] === cost[i - 1]![j]! + 1) pairs.unshift([A[--i]!, null]);
        else pairs.unshift([null, B[--j]!]);
      }
      for (const [a, b] of pairs) {
        if (a !== null && b === null) changes.push({ kind: "lost", line, station: a.extreme, detail: `f1's lobe ${a.from}..${a.to}, depth ${a.depth.toFixed(2)} mm, has no counterpart in the case's run` });
        else if (a === null && b !== null) changes.push({ kind: "gained", line, station: b.extreme, detail: `a lobe ${b.from}..${b.to}, depth ${b.depth.toFixed(2)} mm, f1's run lacks` });
        else if (a !== null && b !== null) {
          const floor: number = 0.5 * a.depth * ratio(line, a.extreme);
          if (b.depth < floor) changes.push({ kind: "under half", line, station: a.extreme, detail: `f1's lobe ${a.from}..${a.to} ${a.depth.toFixed(2)} mm deep, the case's ${b.depth.toFixed(2)} mm, under half of f1's times the ratio, ${floor.toFixed(2)}` });
          if (Math.abs(b.extreme - a.extreme) > a.to - a.from) changes.push({ kind: "moved beyond its width", line, station: a.extreme, detail: `its extreme from ${a.extreme} to ${b.extreme}, ${Math.abs(b.extreme - a.extreme).toFixed(1)} mm, beyond f1's lobe's width ${(a.to - a.from).toFixed(1)} mm` });
        }
      }
    }
    return changes;
  }

  /**
   * The monotone cubic through points (Fritsch and Carlson 1980): increasing data give an increasing interpolant, so a station map
   * through it never folds back.
   */
  function monotoneCubic(x: readonly number[], y: readonly number[]): (t: number) => number {
    const n: number = x.length;
    const d: number[] = Array.from({ length: n - 1 }, (_: unknown, i: number): number => (y[i + 1]! - y[i]!) / (x[i + 1]! - x[i]!));
    const m: number[] = Array.from({ length: n }, (_: unknown, i: number): number => (i === 0 ? d[0]! : i === n - 1 ? d[n - 2]! : d[i - 1]! * d[i]! <= 0 ? 0 : (d[i - 1]! + d[i]!) / 2));
    for (let i: number = 0; i < n - 1; ++i) {
      if (d[i] === 0) {
        m[i] = 0;
        m[i + 1] = 0;
        continue;
      }
      const [a, b]: number[] = [m[i]! / d[i]!, m[i + 1]! / d[i]!];
      const h: number = Math.hypot(a!, b!);
      if (h > 3) {
        m[i] = (3 * a! * d[i]!) / h;
        m[i + 1] = (3 * b! * d[i]!) / h;
      }
    }
    return (t: number): number => {
      let i: number = 0;
      while (i < n - 2 && t > x[i + 1]!) ++i;
      const h: number = x[i + 1]! - x[i]!;
      const s: number = Math.min(1, Math.max(0, (t - x[i]!) / h));
      return (2 * s ** 3 - 3 * s ** 2 + 1) * y[i]! + (s ** 3 - 2 * s ** 2 + s) * h * m[i]! + (-2 * s ** 3 + 3 * s ** 2) * y[i + 1]! + (s ** 3 - s ** 2) * h * m[i + 1]!;
    };
  }

  /**
   * A made break that only moves a feature: the first belly's line read through a monotone station map (`monotoneCubic` through the
   * line's ends, held, and its lobe's extreme carried 1.5 times the lobe's width along the line, distally where the line has the room,
   * else proximally), so its run of lobes keeps its signs and the belly's extreme stands beyond its own width; the other lines as stored.
   * Where neither direction has the room, the reason instead.
   */
  function movedBelly(limb: ILimb, f1Form: IForm): { name: string; family: Family } | string {
    const family: Family = limb.family;
    const belly: IBelly = limb.bellies[0]!;
    const line = f1Form.profiles![belly.direction]!;
    const lobes: ILobe[] = lobesOf(line, f1Form.traces![belly.direction]!.kept.map((k): number => k.station));
    const main = f1Form.maxima![belly.name]!.reduce((a, b) => (b.prominence > a.prominence ? b : a));
    const lobe: ILobe | undefined = lobes.find((l: ILobe): boolean => main.station >= l.from && main.station <= l.to);
    if (lobe === undefined) return `no lobe of the ${belly.direction} line holds the ${belly.name}'s maximum`;
    const shift: number = 1.5 * (lobe.to - lobe.from);
    const [start, end] = [line.at[0]!, line.at.at(-1)!];
    const target: number = lobe.extreme + shift < end - 10 ? lobe.extreme + shift : lobe.extreme - shift > start + 10 ? lobe.extreme - shift : NaN;
    if (!Number.isFinite(target)) return `the ${belly.name}'s lobe ${lobe.from}..${lobe.to} cannot move 1.5 times its width, ${shift.toFixed(1)} mm, within the line ${start}..${end}`;
    const source = monotoneCubic([start, target, end], [start, lobe.extreme, end]);
    const r = reaches(family.layout).find((q): boolean => q.direction === belly.direction)!;
    const read: (s: number) => number[] = H.reader(family);
    const values: number[][] = family.values.map((f: number[]): number[] => [...f]);
    family.knots.forEach((s: number, m: number): void => {
      if (s >= start && s <= end) values[r.field]![m] = read(source(s))[r.field]!;
    });
    return { name: `made moved ${belly.name} (its extreme ${lobe.extreme} to ${target.toFixed(1)}, 1.5 times its lobe's width ${(lobe.to - lobe.from).toFixed(1)} mm)`, family: { ...family, reliefs: [], values } };
  }

  /**
   * The law on every population case with each depth profile, read by the form rule as its text puts it (`lobeRule`; the supervisor's
   * ruling on #3151, step 2): the detector proven first, green on f1 and red on the made breaks and on a made move of a belly beyond its
   * width (`movedBelly`); then per profile, limb and case the form kept or every change with its class (`survey`'s split of the bend's
   * change), and frames of every case the better profile fails: its guide lines over f1's on its clay from the front and the left.
   * Written to `lobes.txt`.
   */
  async function lobeRun(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const out: string = path.join(root, "test/.shots/family-conic-limb-law", "lobes-" + new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const tables = await surveyTables(root);
    const lines: string[] = ["f1 limb law: both depth profiles on every population case, read by the form rule's lobe runs (issue #3151, step 2); measurement only", ""];
    const prepared = limbs().map((limb: ILimb) => {
      const family: Family = limb.family;
      const J: number[] = joints(family);
      const f1Sites: ISite[] = sites(limb);
      const f1Form: IForm = form(limb, { ...family, reliefs: [] }, f1Sites, J);
      return { limb, family, J, f1Sites, f1Form, cases: populationCases(limb, f1Sites, tables).cases };
    });
    const bellyLine = (limb: ILimb) => (name: string): string => limb.bellies.find((b: IBelly): boolean => b.name === name)!.direction;
    lines.push("THE DETECTOR:");
    for (const { limb, family, J, f1Sites, f1Form } of prepared) {
      lines.push(`  ${limb.name} f1's lobe runs: ${Object.entries(f1Form.profiles!).map(([d, p]): string => `${d} ${lobesOf(p, f1Form.traces![d]!.kept.map((k): number => k.station)).map((l: ILobe): string => `${l.sign > 0 ? "+" : "-"}${l.from}..${l.to}(${l.depth.toFixed(1)})`).join(" ")}`).join("; ")}`);
      lines.push(`  ${limb.name} f1 against itself (green): ${lobeRule(f1Form, form(limb, { ...family, reliefs: [] }, f1Sites, J), (): number => 1, bellyLine(limb)).length} changes`);
      const moved = movedBelly(limb, f1Form);
      const made: { name: string; family: Family }[] = [...breaks(limb, f1Sites), ...(typeof moved === "string" ? [] : [moved])];
      if (typeof moved === "string") lines.push(`  ${limb.name} made moved belly: not made, ${moved}`);
      for (const m of made) {
        const changes = lobeRule(f1Form, form(limb, m.family, f1Sites, J), (): number => 1, bellyLine(limb));
        const straight: boolean = m.name.startsWith("made straight profile");
        lines.push(`  ${limb.name} ${m.name} (red): ${changes.length === 0 ? (straight ? "not a break under the rule" : "NO CHANGE: the detector misses it") : changes.map((x): string => `${x.kind} ${x.line}@${Number.isFinite(x.station) ? x.station : "-"}`).slice(0, 12).join("; ") + (changes.length > 12 ? `; and ${changes.length - 12} more` : "")}`);
      }
    }
    lines.push("");
    const totals: Record<string, number> = {};
    const failing: Record<string, { limb: string; name: string; family: Family; f1: Family }[]> = {};
    for (const [label, spline] of [["smoothstep", false], ["natural cubic", true]] as [string, boolean][]) {
      totals[label] = 0;
      failing[label] = [];
      const byClass: Record<string, number> = {};
      const causes: Record<string, number> = {};
      lines.push(`PROFILE ${label.toUpperCase()}:`);
      for (const { limb, family, J, f1Sites, f1Form, cases } of prepared) {
        const f1Read = H.reader(family);
        for (const c of cases) {
          const made: Family = law(limb, c.fields, f1Sites, false, spline);
          const P = (d: string): ((s: number) => [number, number, number]) => depthProfile(limb, c.fields, f1Sites, d, false, spline);
          const changes = lobeRule(f1Form, form(limb, made, f1Sites, J), (d: string, s: number): number => P(d)(s)[0], bellyLine(limb));
          if (changes.length === 0) {
            lines.push(`  ${limb.name} | ${c.name}: form kept`);
            continue;
          }
          totals[label] = totals[label]! + changes.length;
          failing[label]!.push({ limb: limb.name, name: c.name, family: made, f1: family });
          const madeRead = H.reader(made);
          const MJ: number[] = joints(made);
          lines.push(`  ${limb.name} | ${c.name}: ${changes.length} changes`);
          for (const x of changes) {
            let cls: string = "other";
            const r = reaches(family.layout).find((q): boolean => q.direction === x.line);
            if (r !== undefined && Number.isFinite(x.station)) {
              const f1Line = (s: number): number => Math.abs(f1Read(s)[r.field]!);
              const caseLine = (s: number): number => Math.abs(madeRead(carry(s, J, MJ))[r.field]!);
              const [v, v1, v2] = [f1Line(x.station), f1Line(x.station + 0.5) - f1Line(x.station - 0.5), (f1Line(x.station + 0.5) - 2 * f1Line(x.station) + f1Line(x.station - 0.5)) / 0.25];
              const c2: number = (caseLine(x.station + 0.5) - 2 * caseLine(x.station) + caseLine(x.station - 0.5)) / 0.25;
              const [p, p1, p2] = P(x.line)(x.station);
              const parts: [string, number][] = [["profile bend", p2 * v + 2 * p1 * v1], ["knot sampling", c2 - (p2 * v + 2 * p1 * v1 + p * v2)], ["scaling", (p - 1) * v2]];
              cls = parts.reduce((a, b): [string, number] => (Math.abs(b[1]) > Math.abs(a[1]) ? b : a))[0];
              x.detail += `; ratio ${p.toFixed(4)}; bend change ${(c2 - v2).toExponential(2)} = profile ${parts[0]![1].toExponential(2)} + knot sampling ${parts[1]![1].toExponential(2)} + scaling ${parts[2]![1].toExponential(2)}`;
            }
            // The change's cause (the supervisor's ruling on #3151, step 2): (A) the held seam's transition, between the held end and the
            // first site, which the held shoulder or hip owns (#3541); (C) a single site's change concentrating on its own stretch, between
            // its neighbouring anchors, which one person cannot identify (#3151 Method 3; a validation case for #3205); else other.
            const anchors: number[] = [limb.held, ...f1Sites.map((y: ISite): number => y.station!)].sort((a: number, b: number): number => a - b);
            const alone: ISite | undefined = f1Sites.find((y: ISite): boolean => c.name.startsWith(`${y.name} alone`));
            const k: number = alone === undefined ? -1 : anchors.indexOf(alone.station!);
            const cause: string =
              Number.isFinite(x.station) && x.station >= limb.held && x.station <= anchors[1]! ? "(A)" : alone !== undefined && Number.isFinite(x.station) && x.station >= anchors[k - 1]! && x.station <= (anchors[k + 1] ?? Infinity) ? "(C)" : "other";
            causes[cause] = (causes[cause] ?? 0) + 1;
            byClass[`${x.kind} | ${cls}`] = (byClass[`${x.kind} | ${cls}`] ?? 0) + 1;
            lines.push(`    ${cause} ${x.kind} ${x.line}@${Number.isFinite(x.station) ? x.station : "-"} (${cls}): ${x.detail}`);
          }
        }
      }
      lines.push(`  ${label}: ${totals[label]} changes in ${failing[label]!.length} cases; by cause: ${Object.entries(causes).map(([k, n]): string => `${k} ${n}`).join("; ") || "none"}; by kind and class: ${Object.entries(byClass).map(([k, n]): string => `${k} ${n}`).join("; ") || "none"}`, "");
    }
    const keeps: string[] = Object.entries(totals).filter(([, n]): boolean => n === 0).map(([k]): string => k);
    const better: string = totals["smoothstep"]! <= totals["natural cubic"]! ? "smoothstep" : "natural cubic";
    lines.push(keeps.length > 0 ? `the form is kept on every case by: ${keeps.join(", ")}` : `neither profile keeps the form on every case; the better, ${better}, with ${totals[better]} changes in ${failing[better]!.length} cases`);
    if (failing[better]!.length > 0) {
      NodeCanvasRaster.initialize();
      lines.push(`frames of every case ${better} fails, its guide lines (red) over f1's (blue) on its clay:`);
      for (const w of failing[better]!) {
        const clay: N.Mesh | null = mesh(`${w.limb}.${w.name}`, w.family);
        if (clay === null) continue;
        const points: N.Point[] = [];
        for (let i: number = 0; i < clay.positions.length; i += 3) points.push([clay.positions[i]!, clay.positions[i + 1]!, clay.positions[i + 2]!]);
        const curves: N.Curve[] = [...guideCurves({ ...w.f1, reliefs: [] }, "2f6fd0", "f1"), ...guideCurves(w.family, "e01b1b", "case")];
        for (const view of ["front", "left"]) {
          const file: string = path.join(out, `${w.limb}.${view}.${fileName(w.name)}.png`);
          await fs.writeFile(file, NodeCanvasRaster.render(NodeCanvasCamera.fit(view, points, 700, 1100), [clay], curves, "depth", `f1 ${w.limb} wall, limb law (${better}) | ${w.name} | red: the case's guide lines, blue: f1's | ${view}`).png);
          lines.push(`  ${file}`);
        }
      }
    }
    await fs.writeFile(path.join(out, "lobes.txt"), lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
  }

  export async function main(): Promise<void> {
    if (process.argv[2] === "lobes") return lobeRun();
    if (process.argv[2] === "profiles") return profiles();
    if (process.argv[2] === "survey") return survey();
    if (process.argv[2] === "population") return population();
    const root: string = path.resolve(process.cwd(), "..");
    const out: string = path.join(root, "test/.shots/family-conic-limb-law", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const report: Record<string, unknown> = {};
    const lines: string[] = ["f1 limb law, provisional (issue #3151, step 2)", ""];
    NodeCanvasRaster.initialize();
    const frames: { file: string; sha256: string }[] = [];
    for (const limb of limbs()) {
      const family: Family = limb.family;
      const J: number[] = joints(family);
      const f1Sites: ISite[] = sites(limb);
      const lengths: Record<string, number> = Object.fromEntries(limb.lengths.map((l): [string, number] => [l.segment, Math.hypot(...T.CHAIN.find((j: SF.IJoint): boolean => j.name === l.joint)!.offset)]));
      lines.push(`${limb.name.toUpperCase()}: course centres at stations ${J.map(round3).join(", ")}; held before ${round3(limb.held)}; segment lengths ${Object.entries(lengths).map(([k, v]): string => k + " " + v.toFixed(2) + " mm").join(", ")}`);
      const fieldTable = f1Sites.map((site: ISite) => ({ site: site.name, station: round3(site.station!), run: site.run, tau: round3(site.tau), depths: Object.fromEntries(Object.entries(depths(family, site)).map(([d, v]): [string, number] => [d, round3(v)])), girth: round3(girth(H.reader(family)(site.station!), family.layout)), definition: site.definition }));
      for (const row of fieldTable) lines.push(`  site ${row.site}: station ${row.station} (run ${row.run}, tau ${row.tau}), girth ${row.girth} mm, depths ${JSON.stringify(row.depths)}`);

      // Round trip.
      const again: Family = law(limb, { lengths: {}, depths: {} }, f1Sites);
      const valueDifference: number = Math.max(...family.values.map((field: number[], f: number): number => Math.max(...field.map((y: number, m: number): number => Math.abs(y - again.values[f]![m]!)))));
      const knotShift: number = Math.max(...family.knots.map((s: number, m: number): number => Math.abs(s - again.knots[m]!)));
      lines.push(`  round trip: largest value difference ${valueDifference.toExponential(3)}, largest knot shift ${knotShift.toExponential(3)} mm`);

      // The detectors on f1 (green) and on made breaks (red).
      const f1Form: IForm = form(limb, { ...family, reliefs: [] }, f1Sites, J);
      lines.push(`  f1 (detectors green here): ${f1Form.refused.length} stations under the margin (f1's own, read as the baseline), native refusals ${f1Form.native.length}, inflections per line ${JSON.stringify(Object.fromEntries(["+u", "+v", "-u", "-v"].map((d: string): [string, number] => [d, f1Form.inflections.filter((x): boolean => x.line === d).length])))}, bellies ${JSON.stringify(f1Form.bellies)}, order ${JSON.stringify(f1Form.order)}, girths ${JSON.stringify(f1Form.girths)}`);
      const describe = (c: ReturnType<typeof compare>): string => {
        const parts: string[] = [
          ...(c.native.length > 0 ? [`native refusals ${c.native.length} (first ${c.native[0]!.slice(0, 160)})`] : []),
          ...(c.newRefused.length > 0 ? [`${c.newRefused.length} new stations under the margin (${c.newRefused[0]} .. ${c.newRefused.at(-1)})`] : []),
          ...(c.appeared.length > 0 ? ["inflections appeared " + c.appeared.map((x): string => `${x.line}@${x.station}`).join(" ")] : []),
          ...(c.vanished.length > 0 ? ["inflections vanished " + c.vanished.map((x): string => `${x.line}@${x.station}`).join(" ")] : []),
          ...c.bellies,
          ...c.order.map((x: string): string => "order " + x),
        ];
        return parts.length === 0 ? "form kept" : parts.join("; ");
      };
      const proofs: unknown[] = [];
      for (const made of breaks(limb, f1Sites)) {
        const c = compare(f1Form, form(limb, made.family, f1Sites, J));
        proofs.push({ case: made.name, ...c });
        lines.push(`  ${made.name} (detectors red here): ${describe(c)}`);
      }

      // The cases.
      const cases: { name: string; fields: IFields }[] = casesOf(limb, f1Sites);
      const results: unknown[] = [];
      const shown: { stage: string; mesh: N.Mesh }[] = [];
      const f1Mesh: N.Mesh | null = mesh(limb.name + ".f1", family);
      if (f1Mesh !== null) shown.push({ stage: "f1", mesh: f1Mesh });
      const pictured: string[] = ["every length 5th", "every length 95th", `every site -${DEPTH_STEP * 100}%`, `every site +${DEPTH_STEP * 100}%`];
      for (const c of cases) {
        const made: Family = law(limb, c.fields, f1Sites);
        const got: IForm = form(limb, made, f1Sites, J);
        const compared = compare(f1Form, got);
        results.push({ case: c.name, girths: got.girths, bellyCounts: got.bellies, ...compared });
        lines.push(`  ${c.name}: ${describe(compared)} | girths ${JSON.stringify(got.girths)}`);
        if (pictured.includes(c.name)) {
          const m: N.Mesh | null = mesh(limb.name + "." + c.name, made);
          if (m !== null) shown.push({ stage: fileName(c.name), mesh: m });
        }
      }
      const points: N.Point[] = [];
      if (f1Mesh !== null) for (let i: number = 0; i < f1Mesh.positions.length; i += 3) points.push([f1Mesh.positions[i]!, f1Mesh.positions[i + 1]!, f1Mesh.positions[i + 2]!]);
      for (const view of ["front", "left"]) {
        const camera: N.Camera = NodeCanvasCamera.fit(view, points, 700, 1100);
        for (const { stage, mesh: m } of shown) {
          const file: string = `${limb.name}.${view}.${stage}.png`;
          const png: Buffer = NodeCanvasRaster.render(camera, [m], [], "depth", `f1 ${limb.name} wall, limb law | ${stage} | ${view}`).png;
          await fs.writeFile(path.join(out, file), png);
          frames.push({ file, sha256: createHash("sha256").update(png).digest("hex") });
        }
      }
      report[limb.name] = { joints: J, lengths, sites: fieldTable, roundTrip: { valueDifference, knotShift }, f1: f1Form, proofs, cases: results };
      lines.push("");
    }
    await fs.writeFile(path.join(out, "law.txt"), lines.join("\n") + "\n");
    await fs.writeFile(path.join(out, "law.json"), JSON.stringify({ ...report, frames }, null, 2));
    process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
  }
}

void FamilyConicLimbLaw.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
