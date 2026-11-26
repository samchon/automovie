import { FamilyConicFit as F } from "./FamilyConicFit";
import { FamilyConicLoft as K } from "./FamilyConicLoft";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import {
  AutoMovieLoftChain,
  AutoMovieViewChain,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import {
  AutoMovieHumanConicLoft as H,
  AutoMovieHumanConicSection as S,
  AutoMovieHumanSegmentFrame as SF,
} from "@automovie/human";
import {
  AutoMovieHumanF1,
  AutoMovieHumanF1Placing as T,
} from "@automovie/human/capture";
import type {
  IAutoMovieConstructionNode,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanConicSection,
  IAutoMovieHumanF1,
  IAutoMovieHumanF1Placing,
  IAutoMovieHumanSegmentFrame,
  IAutoMovieHumanSegmentJoint,
  IAutoMovieViewAxis,
  IAutoMovieViewChain,
  IAutoMovieViewLoft,
  IAutoMovieViewPart,
} from "@automovie/interface";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

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
 * Step 2's last part, the hand, the foot and the digits (the supervisor's ruling on #3151, 2026-11-15). The law (`extremityAt`,
 * `extremityDeclaration`) moves the hand's and the foot's stored offsets along each by its length's ratio and across it by its breadth's,
 * each finger's bones by their own ratios, the palm's depths by the hand circumference's and the foot's past the ankle by its breadth's;
 * `ARM_TO_MM` is carried by its run's `tau`; each fan seam's profile knots scale with the seam's chord, `ROOT_MM` with the thumb's
 * metacarpal and `THUMB_FAIR_MM` with the hand circumference's ratio, while `THUMB_CHORD_MM` and the bands' rails stay absolute. Its
 * round trip at f1's fields is exact (2.8e-14), and every premise the engine admits the fans, the thumb's merge and the wrist's band on holds
 * on all 31 population cases (`extremity-premises`, extremity-premises-corrected). The acceptance is the frames of the realized hand and foot
 * beside f1's at the same camera (`extremity-acceptance`, extremity-acceptance-corrected: every field at its 5th and 95th, hand and foot
 * length, the thumb's, the index's and the little finger's bones, all realized with no diagnostic), each reading as a smaller, larger,
 * longer or shorter hand or foot with f1's form; their only visible faults are f1's own (the finger roots' wrinkles on the palm, the
 * thumb's merge line, the big toe's marks). The detector's 9 changes on the walls are its two residuals, not form: lobes at `LOBE_MM`
 * flipping (the leg's +v lobe 901..974 mm, 1.28 mm, in foot breadth alone - and every field at its 5th; the middle finger's +v lobes of
 * 0.86 to 0.96 mm in its bones + and every field at its 95th; the thumb's +v lobe of 1.21 mm in every field at its 95th) and a small gained
 * lobe splitting a large one and halving its reading (the palm's -u lobe 448..569 mm, 10.12 read as 4.70, beside a gained 1.38 mm lobe,
 * in every field at its 5th). Provisional assumptions, validation cases for #3205: the digits' depths follow their hand's or foot's ratio
 * and the toes' lengths their foot's, since no source in the repo gives a digit girth or a toe's size.
 *
 * Usage, from `test/`: `pnpm conic:build`, then `node .shots/esbuild/FamilyConicLimbLaw.cjs`. It writes `law.txt`, `law.json` and the
 * frames under `test/.shots/family-conic-limb-law/<time>/`.
 */
namespace FamilyConicLimbLaw {
  type V3 = [number, number, number];
  type Family = IAutoMovieHumanConicLoft.IFamily;
  type Chain = NonNullable<IAutoMovieViewLoft.IResult["chain"]>;

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
  function nearest(axis: IAutoMovieViewAxis.IAxis, length: number, p: readonly number[]): number {
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
    const axis: IAutoMovieViewAxis.IAxis = H.axis(family);
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
  function girth(values: readonly number[], layout: IAutoMovieHumanConicSection.ILayout): number {
    const section: IAutoMovieViewChain.ISection = S.chain(values, layout);
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
  function reaches(layout: IAutoMovieHumanConicSection.ILayout): { direction: string; field: number; offset: number; across: [string, string] }[] {
    const at: number[] = S.offsets(layout).at;
    const guides: number[] = layout.anchors.map((a: IAutoMovieHumanConicSection.IAnchor, k: number): number => (a.guide === true ? k : -1)).filter((k: number): boolean => k >= 0);
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

  function pointUnder(frames: Map<string, IAutoMovieHumanSegmentFrame>, name: string): V3 {
    const placed: IAutoMovieHumanF1Placing.IPlaced = T.POINTS[name]!;
    return SF.toWorld(frames.get(placed.frame)!, placed.local);
  }

  /** The chain with some segments' lengths scaled: the offset of the joint at each segment's far end. */
  function chainWith(scales: Record<string, number>, limb: ILimb): IAutoMovieHumanSegmentJoint[] {
    return T.CHAIN.map((joint: IAutoMovieHumanSegmentJoint): IAutoMovieHumanSegmentJoint => {
      const by: { segment: string; joint: string } | undefined = limb.lengths.find((l): boolean => l.joint === joint.name);
      const k: number = by === undefined ? 1 : (scales[by.segment] ?? 1);
      return { ...joint, offset: SF.scale(joint.offset, k) };
    });
  }

  /** The sites of a limb on f1, each by its standard's definition read on the stored wall. */
  function sites(limb: ILimb): ISite[] {
    const family: Family = limb.family;
    const J: number[] = joints(family);
    const axis: IAutoMovieViewAxis.IAxis = H.axis(family);
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
    const frames: Map<string, IAutoMovieHumanSegmentFrame> = SF.world(T.CHAIN, (): undefined => undefined);
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
    const frames: Map<string, IAutoMovieHumanSegmentFrame> = SF.world(chainWith(fields.lengths, limb), (): undefined => undefined);
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
      ...(family.tips === undefined ? {} : { tips: family.tips.map((t) => (t === null ? null : { ...t, from: map(t.from), tip: map(t.tip) })) as [IAutoMovieHumanConicLoft.ITip | null, IAutoMovieHumanConicLoft.ITip | null] }),
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
    const loft: IAutoMovieViewLoft.IResult = H.create({ ...family, reliefs: [] }, stations);
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
    const axis: IAutoMovieViewAxis.IAxis = H.axis(family);
    const lastKnot: number = family.knots[family.knots.length - 1]!;
    const end: number = family.tips?.[1]?.from ?? lastKnot;
    const curves: number[][][] = [[], [], [], []];
    for (let s: number = family.knots[0]!; s <= end; s += 2) {
      const chain: IAutoMovieHumanConicSection.IChain = S.resolve(read(s), family.layout);
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

  /** The source notes the hand's, the foot's and the digits' fields are read from, under `packages/human/docs/sources`. */
  const NOTES: string[] = ["ansur-ii.md", "greiner-1991-hand.md", "buryanov-2010-hand-segments.md", "iso-7250-1-2017.md", "iso-8559-1-2017.md", "ibv-foot-metrics.md", "ansur-ii-handbook-foot-neck.md", "ansur-1988-boundary-people.md"];

  /**
   * The survey of every element coupled at the hand, the foot and the digits before their law (the supervisor's order on #3151, step 2's
   * last part; supervision.md, Research), measurement and reading only: (1) each part's family, its course centres, the chain segments
   * whose lengths move each run, and where it overlaps another family; (2) each length and depth site by its published definition, where
   * it is read on f1 or why it cannot be, and its population statistics as the repo's source notes give them (each cited by note and
   * line), with the ANSUR 1988 correlations among them; (3) each split, merge and band joining these parts as `AutoMovieHumanF1.construction`
   * declares it, how its seam is defined today, and which fields would move it; (4) the premises the engine admits each on. Written to
   * `extremities.txt`.
   */
  async function extremities(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const out: string = path.join(root, "test/.shots/family-conic-limb-law", "extremities-" + new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const lines: string[] = ["The hand, the foot and the digits: every element coupled at their law (issue #3151, step 2's last part); measurement and reading only", ""];
    const frames: Map<string, IAutoMovieHumanSegmentFrame> = SF.world(T.CHAIN, (): undefined => undefined);
    const point = (name: string): V3 => pointUnder(frames, name);
    const dist = (a: readonly number[], b: readonly number[]): number => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!);
    const joint = (name: string): IAutoMovieHumanSegmentJoint | undefined => T.CHAIN.find((j: IAutoMovieHumanSegmentJoint): boolean => j.name === name);
    const pathTo = (frame: string): string[] => {
      const chain: string[] = [];
      for (let j: IAutoMovieHumanSegmentJoint | undefined = joint(frame); j !== undefined; j = joint(j.parent ?? "")) chain.unshift(j.name);
      return chain;
    };
    const source: string = await fs.readFile(path.join(root, "packages/human/src/generation/f1/AutoMovieHumanF1.ts"), "utf8");
    const constant = (name: string): string => source.match(new RegExp(`const ${name}: [^=]+= ([^;]+);`))?.[1] ?? "not found";
    const notes: Map<string, string[]> = new Map();
    for (const note of NOTES) notes.set(note, (await fs.readFile(path.join(root, "packages/human/docs/sources", note), "utf8")).split(/\r?\n/));
    const cite = (note: string, pattern: RegExp): string => {
      const text: string[] = notes.get(note) ?? [];
      const i: number = text.findIndex((l: string): boolean => pattern.test(l));
      return i < 0 ? `${note}: no line matches ${pattern.source}` : `${note}:${i + 1}: ${text[i]!.trim().slice(0, 200)}`;
    };
    const fingers: IAutoMovieHumanF1.IDigit[] = AutoMovieHumanF1.DIGITS.filter((d): boolean => d.limb === "arm");
    const toes: IAutoMovieHumanF1.IDigit[] = AutoMovieHumanF1.DIGITS.filter((d): boolean => d.limb === "leg");
    const hand: Family = AutoMovieHumanF1.BODY.hand;
    const leg: Family = AutoMovieHumanF1.BODY.leg;
    const arm: Family = AutoMovieHumanF1.BODY.arm;

    // (1) The families and their runs.
    lines.push("(1) THE FAMILIES AND THEIR RUNS (stations mm on each family's own course; a run's segments are the chain joints its end's frame hangs from and its start's does not):");
    const describe = (label: string, family: Family): void => {
      const J: number[] = joints(family);
      const names: string[] = T.COURSES[family.name] ?? [];
      const runs: string[] = names.slice(1).map((n: string, k: number): string => {
        const [fa, fb] = [T.POINTS[names[k]!]!.frame, T.POINTS[n]!.frame];
        const moving: string[] = pathTo(fb).filter((x: string): boolean => !pathTo(fa).includes(x));
        return `${names[k]} -> ${n} (${round3(J[k]!)}..${round3(J[k + 1]!)}, ${(J[k + 1]! - J[k]!).toFixed(1)} mm): ${moving.length === 0 ? `within the ${fb} frame (a stored local offset, no chain segment)` : moving.map((m: string): string => `the ${m} joint's offset from ${joint(m)!.parent ?? "the root"}, ${Math.hypot(...joint(m)!.offset).toFixed(2)} mm`).join(", ")}`;
      });
      lines.push(`  ${label}: family ${family.name}; course ${names.join(", ")}; knots ${family.knots[0]}..${family.knots.at(-1)} (${family.knots.length}); tips ${JSON.stringify(family.tips ?? null)}; halves ${JSON.stringify(family.halves)}`, ...runs.map((r: string): string => `    ${r}`));
    };
    describe("arm (for the overlap)", arm);
    describe("hand (palm)", hand);
    for (const d of fingers) describe(d.family.name + (d.knuckle ? "" : " (merged capsule)"), d.family);
    describe("leg, with the foot", leg);
    for (const d of toes) describe(d.family.name, d.family);
    lines.push(
      `  overlap at the wrist: the hand's course is the arm's (both ${(T.COURSES["hand"] ?? []).join(", ")}); the arm family's knots run on to ${arm.knots.at(-1)} mm, but the figure ends the arm's face at ARM_TO_MM = ${constant("ARM_TO_MM")} mm, a stored station on the arm's course, and the hand's family starts at its first knot ${hand.knots[0]} mm; the continuation band (WRIST = ${constant("WRIST")}) joins them. The arm law (FamilyConicLimbLaw) scales the arm's fields only: the hand's family is not part of it, so under the arm law the wrist band joins a scaled arm to an unscaled hand`,
      `  the foot inside the leg: the leg family runs on past the ankle (centre foot) through footBall to footEnd; under the leg law the depth profile is held at the last site's ratio (the ankle's) past the ankle, so the whole foot's reaches scale by the ankle's ratio, and its knots past the ankle are carried by the runs' tau; footBall and footEnd are stored offsets in the foot frame, which no length of the law moves, so the foot's own length is not a field of the leg law today`,
      `  the digits: each finger and toe is a family of its own on its own course; its joints are chain segments under the hand or the foot frame (above), carried rigidly by the hand's or the foot's frame, and no limb law touches their fields`,
      "",
    );

    // (2) The fields.
    const stationOn = (family: Family, p: readonly number[]): string => {
      const J: number[] = joints(family);
      const s: number = nearest(H.axis(family), courseLength(family), p);
      let run: number = 0;
      while (run < J.length - 2 && s > J[run + 1]!) ++run;
      return `station ${round3(s)} (run ${run}, tau ${round3((s - J[run]!) / (J[run + 1]! - J[run]!))})`;
    };
    const girthAt = (family: Family, s: number): number => girth(H.reader(family)(s), family.layout);
    const tipOf = (family: Family): V3 => H.axis(family).at(tipStation(family)).origin as V3;
    const stylion: V3 = point("styloidRadial");
    const middle: Family = fingers.find((d): boolean => d.family.name === "finger.middle")!.family;
    const mc: V3 = SF.mid(point("index1"), point("pinky1"));
    const handBallStation: number = nearest(H.axis(hand), courseLength(hand), mc);
    lines.push(
      "(2) THE FIELDS, each by its published definition, where it is read on f1 (stations on the named family's course) and its population statistics (ANSUR II and ANSUR 1988 women unless named):",
      "  HAND",
      `    hand length (ANSUR II, ISO 7250-1 6.3.1: stylion to dactylion III, hand straight): f1 ${dist(stylion, tipOf(middle)).toFixed(1)} mm, straight from the radial stylion datum to the middle finger's tip (its course at its tip station), the hand as posed; ${cite("ansur-ii.md", /\| Hand length \|/)}`,
      `    palm length (ANSUR II handbook p. 142: ventral stylion to the centre of digit III's base crease): not readable, the crease is not in f1's table; stand-in, stylion to the middle finger's first joint ${dist(stylion, point("middle1")).toFixed(1)} mm (a joint centre, not the crease); ${cite("ansur-ii.md", /\| Palm length \|/)}`,
      `    hand breadth (ANSUR II handbook pp. 119-120: metacarpale II to V): not readable, the metacarpal landmarks are not in f1's table; stand-in, index1 to pinky1 joint centres ${dist(point("index1"), point("pinky1")).toFixed(1)} mm; ${cite("ansur-ii.md", /\| Hand breadth \|/)}`,
      `    hand circumference at metacarpale (ANSUR 1988 HAND_CIRC_AT_METACARPALE): f1 ${girthAt(hand, handBallStation).toFixed(1)} mm, the hand family's girth at its ${stationOn(hand, mc)}, nearest the midpoint of index1 and pinky1 (a stand-in for the metacarpals' level); population in the survey constants (below); ${cite("ansur-1988-boundary-people.md", /hand circumference at metacarpale/)}`,
      `    wrist circumference (ANSUR II: over stylion): the arm law's wrist site; on the hand family at the stylion's ${stationOn(hand, SF.mid(point("styloidRadial"), point("styloidUlnar")))}: ${girthAt(hand, nearest(H.axis(hand), courseLength(hand), SF.mid(point("styloidRadial"), point("styloidUlnar")))).toFixed(1)} mm; ${cite("ansur-ii.md", /\| Wrist circumference \|/)}`,
      "  FINGERS (Greiner 1991: digit length, fingertip to the centre of the proximal flexion crease; Buryanov 2010: interarticular phalanx lengths)",
    );
    for (const d of fingers) {
      const f: Family = d.family;
      const J: number[] = joints(f);
      const tag: string = f.name.split(".")[1]!;
      // The digit's chain joints below the hand, each placed by its offset from the one before (the bone before it).
      const phalanges: string[] = T.CHAIN.filter((j: IAutoMovieHumanSegmentJoint): boolean => j.name.startsWith(`${tag}.`) && j.parent !== "hand").map((j: IAutoMovieHumanSegmentJoint): string => `${j.parent} ${Math.hypot(...j.offset).toFixed(1)}`);
      const end: number[] = T.POINTS[`${tag}End`]!.local;
      lines.push(
        `    ${f.name}: first joint to tip along the course ${tipStation(f).toFixed(1)} mm (the course's start is the first joint); joint spacings (chain offsets) ${phalanges.join(", ")}, last joint to the course's end ${Math.hypot(...end).toFixed(1)} mm; digit length by Greiner's definition not readable (the base crease is not in f1's table); girth at its first knot ${girthAt(f, f.knots[0]!).toFixed(1)} mm and at the middle of its first run ${girthAt(f, (J[0]! + J[1]!) / 2).toFixed(1)} mm`,
      );
    }
    lines.push(
      `      ${cite("greiner-1991-hand.md", /Digit 3 \(middle\) length/)} (means only, no SD)`,
      `      ${cite("buryanov-2010-hand-segments.md", /^\| III \|/)} (mean and SD, sexes pooled, radiographs)`,
      "      finger girths: no source in the repo",
      "  FOOT",
    );
    const footFrame: IAutoMovieHumanSegmentFrame = frames.get("foot")!;
    const Jl: number[] = joints(leg);
    const loft: IAutoMovieViewLoft.IResult = H.create({ ...leg, reliefs: [] }, Array.from({ length: Math.floor((leg.knots.at(-1)! - (Jl[2]! - 80)) / 2) + 1 }, (_: unknown, i: number): number => Jl[2]! - 80 + 2 * i));
    let heel: number = Infinity;
    const footBall: number = nearest(H.axis(leg), courseLength(leg), point("footBall"));
    let breadth: number = 0;
    if (loft.chain !== null) {
      const chain: Chain = loft.chain;
      for (const layer of chain.layers) {
        const ring: V3[] = Array.from({ length: 256 }, (_: unknown, j: number): V3 => SF.toLocal(footFrame, AutoMovieLoftChain.point(chain, layer.y, (2 * Math.PI * j) / 256) as V3));
        for (const p of ring) if (p[1] < 0) heel = Math.min(heel, p[0]);
        if (Math.abs(layer.y - footBall) <= 15) breadth = Math.max(breadth, Math.max(...ring.map((p: V3): number => p[2])) - Math.min(...ring.map((p: V3): number => p[2])));
      }
    }
    const toeTips: number[] = toes.map((d): number => SF.toLocal(footFrame, tipOf(d.family))[0]);
    lines.push(
      `    foot length (ISO 7250-1 6.3.7, ANSUR II p. 113: pternion to the longest toe's tip, projected on the foot's axis): f1 ${(Math.max(...toeTips) - heel).toFixed(1)} mm along the foot frame's x axis (a stand-in for the foot axis, IBV's: the rearmost point to the midpoint of the first and fifth metatarsal heads, which are not in f1's table), from the leg wall's rearmost point below the ankle to the toes' farthest tip; ${cite("ansur-ii.md", /\| Foot length \|/)}`,
      `    foot breadth (ANSUR II p. 112: maximum across the metatarsal heads): f1 ${breadth.toFixed(1)} mm, the leg wall's greatest extent across the foot frame's z within 15 mm of footBall (station ${round3(footBall)}); ${cite("ansur-ii.md", /\| Foot breadth \|/)}`,
      `    ankle circumference (ANSUR II: minimum): the leg law's ankle site; ${cite("ansur-ii.md", /\| Ankle circumference \|/)}`,
      `    lateral malleolus height, ball length, heel breadth, ball girth: not readable (the malleolus, the metatarsal heads and the heel's points are not in f1's table); ${cite("ansur-ii.md", /\| Lateral malleolus height \|/)}; ${cite("ibv-foot-metrics.md", /Ball girth/)}`,
      "  TOES",
    );
    for (const d of toes) {
      const f: Family = d.family;
      const tag: string = f.name.split(".")[1]!;
      const distal: IAutoMovieHumanSegmentJoint | undefined = joint(`${tag}toe.distal`);
      lines.push(`    ${f.name}: first joint to tip along the course ${tipStation(f).toFixed(1)} mm; proximal joint spacing ${distal === undefined ? "-" : Math.hypot(...distal.offset).toFixed(1)} mm; girth at its first knot ${girthAt(f, f.knots[0]!).toFixed(1)} mm`);
    }
    lines.push("      toe lengths and toe girths: no source in the repo");
    // The correlations among the extremities' measures (ANSUR 1988, the survey constants).
    const tables = await surveyTables(root);
    const measures: string[] = ["stature", "wrist", "handLength", "handBreadth", "handCircumference", "calf", "footLength", "footBreadth", "malleolusHeight"];
    const r = (a: string, b: string): number => {
      const [i, j]: number[] = [tables.names.indexOf(a), tables.names.indexOf(b)].sort((x: number, y: number): number => y - x);
      return i === j ? 1 : tables.r[0]![i! - 1]![j!]!;
    };
    lines.push(
      "  ANSUR 1988 women (the survey constants): mean (SD) and correlations",
      ...measures.map((m: string): string => `    ${m}: ${tables.mean[0]![tables.names.indexOf(m)]!.toFixed(1)} (${tables.sd[0]![tables.names.indexOf(m)]!.toFixed(1)}); r with ${measures.filter((x: string): boolean => x !== m).map((x: string): string => `${x} ${r(m, x).toFixed(3)}`).join(", ")}`),
      "",
    );

    // (3) The connections, as declared.
    const declared = AutoMovieHumanF1.construction();
    const found: IAutoMovieConstructionNode[] = [];
    const walk = (node: IAutoMovieConstructionNode): void => {
      if ((node.type === "split" && node.name.startsWith("fan.")) || (node.type === "join" && node.name.startsWith("web.")) || node.type === "continue") found.push(node);
      const n = node as { host?: IAutoMovieConstructionNode; part?: IAutoMovieConstructionNode; children?: { part: IAutoMovieConstructionNode }[] };
      for (const child of [n.host, n.part, ...(n.children ?? []).map((c): IAutoMovieConstructionNode => c.part)]) if (child !== undefined) walk(child);
    };
    walk(declared.root);
    lines.push("(3) THE CONNECTIONS, as `AutoMovieHumanF1.construction` declares them at the reference pose (the +Z side; the twin is its reflection):");
    const short = (x: unknown): string => JSON.stringify(x, (_k: string, v: unknown): unknown => (typeof v === "number" ? Math.round(v * 1e4) / 1e4 : v)).slice(0, 600);
    for (const node of found.filter((n): boolean => !n.name.endsWith(".mirror") && !n.name.includes(".mirror"))) {
      if (node.type === "split") {
        lines.push(
          `  split ${node.name} (host face ${node.hostFace}, its ${node.hostEnd} end): first seam ${short(node.seam)} with profile ${short({ corner: node.profile?.corner, reach: node.profile?.reach, square: node.profile?.square, fair: node.profile?.fair, heading: node.profile?.heading, knots: node.profile?.knots.length })}; ${node.outer?.length ?? 0} more seams; count ${node.count}, rows ${node.rows}; children ${node.children.map((c): string => `${c.partFace} rail ${(c.rail * 1000).toFixed(2)} mm ${c.correspondence ?? "angle"}`).join(", ")}`,
        );
      } else if (node.type === "join") lines.push(`  merge ${node.name}: seed ${short(node.seed)}; parameter ${short(node.parameter)}; widths ${short([node.partWidth, node.hostWidth])}; continuity ${node.continuity}; count ${node.count}, rows ${node.rows}; fair ${((node.fair ?? 0) * 1000).toFixed(1)} mm`);
      else if (node.type === "continue") lines.push(`  continuation ${node.name}: host face ${node.hostFace} (${node.hostEnd}) to part face ${node.partFace} (${node.partEnd}); band ${short(node.band)}`);
    }
    lines.push(
      "  how each is defined today (AutoMovieHumanF1.ts):",
      `    the hand's and the foot's splits: the end is the hand's or the leg's last knot (${hand.knots.at(-1)} and ${leg.knots.at(-1)} mm), each seam by rule from the frames (\`fanSeams\`: the plane through the two digits' first and second joints' midpoints that holds the palm's normal, from the wrist's lines to index1 and pinky1, or the foot's stored direction leg.fan.up; its two crossings of the end ring; its heading toward the middle of the gap between the two digits' first rings); each seam's web profile is stored coordinates read from the reference (\`FANS\` webs, metres along the chord and deep, \`FamilyConicScan.ts webs\`); corner, reach, square, fair, rail (3 mm), columns and rows stored constants (\`FANS\`)`,
      `    the thumb's merge: the thumb's family closed as a capsule ROOT_MM = ${constant("ROOT_MM")} mm behind its first joint, seeded by a search on its phase-0 line over shares 0 to 0.7 of its length; its blend width THUMB_CHORD_MM = ${constant("THUMB_CHORD_MM")} mm and fair THUMB_FAIR_MM = ${constant("THUMB_FAIR_MM")} mm stored`,
      `    the wrist's continuation: the arm's face ends at ARM_TO_MM = ${constant("ARM_TO_MM")} mm (stored station), the band lands WRIST's rail, 10 mm, past the hand's first knot (stored)`,
      `    the toes' ends: each toe's dome by \`rounded\` (TOE_DOME = ${constant("TOE_DOME")} of its section's mean reach, TOE_LEAST = ${constant("TOE_LEAST")}); the fingers' ends: their stored tips`,
      "    the ankle: no connection; the foot is the leg family's own continuation past the ankle",
      "  which fields would move each under the law:",
      "    the splits' seams: the digits' joint positions (their chain segments under the hand or foot frame, so the hand's breadth and the digits' spacing), the palm's normal (the wrist to index1 and pinky1), and the end ring's shape (the hand's or the foot's depths at its last knot); the stored webs, metres, do not scale with any field; the end's station (the last knot) moves with the course's length",
      "    the thumb's merge: the thumb's frame (thumb.metacarpal under the hand) and the hand's wall where the capsule comes out (its depths); ROOT_MM and the seed shares are fixed",
      "    the wrist band: the forearm's length moves the arm's knots by tau but not ARM_TO_MM, a stored station, so the arm's face end and the hand's first knot no longer face each other unless both follow the same rule; the arm law scales the arm's wrist depth while the hand's first section stays, so the band spans their difference",
      "    the foot: the ankle's ratio scales the whole foot (the leg law's last site), and no foot length enters the leg law",
      "",
      "(4) THE PREMISES each is admitted on (the interface's admission and the realization's strip, `AutoMovieConstructionSplitBand`):",
      "  split (the hand's and the foot's fans): the end open at its last section, single-loop and star-shaped about its course (construction.md Splits); each seam a < b < a + 2 pi with every outer seam enclosing the one before (the valleys nest); each web knot along the chord within the chord's length and apart from the one before; corner in (0, pi / 2); reach in (0, 1]; each child's band: its rail inside the child's domain, the length correspondence (the rail ring and the opening each with a Newell normal, the rail phase advancing at every column), every column's ribbons pointing along its chord (none backward) with a monotone scale, and the fill's fair disc inside the end",
      "  merge (the thumb): the seed's search meeting the hand's face within its shares; the trace closing round the capsule; the blend's chord inside both faces (grazing tolerance), count a multiple of 4",
      "  continuation (the wrist): the hand's rail inside its domain; the band's length correspondence; every column's ribbons along its chord with a monotone scale",
      "  each digit's and the limbs' walls: every section an admissible chain whose tangents meet by the fit's margin, the caps' tips and the toes' domes inside their families' domains",
    );
    await fs.writeFile(path.join(out, "extremities.txt"), lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
  }

  /** Where a family closes at its far end, mm on its course: its end cap's tip, or its last knot where it has none. */
  function tipStation(family: Family): number {
    const lastKnot: number = family.knots[family.knots.length - 1]!;
    return family.tips?.[1]?.tip ?? lastKnot;
  }

  /** The fields of the hand, the foot and the digits at a person, each as a ratio to f1's (1: f1's own). */
  interface IExtremityFields {
    /** The limbs' segment lengths (`LENGTH_ENDS`' segments). */
    lengths: Record<string, number>;
    hand: { length: number; breadth: number; circumference: number };
    foot: { length: number; breadth: number };
    /** Per finger, its three bones' lengths beyond its first joint: the two joints' offsets after it and its end's offset. */
    phalanges: Record<string, [number, number, number]>;
  }

  /** f1's own extremity fields. */
  const F1_EXTREMITIES = (): IExtremityFields => ({ lengths: {}, hand: { length: 1, breadth: 1, circumference: 1 }, foot: { length: 1, breadth: 1 }, phalanges: {} });

  /** A local vector scaled along a unit axis by one ratio and along a second, square to it, by another; the third direction kept. */
  const scaleIn = (a: V3, b: V3, along: number, across: number) => (p: readonly number[]): V3 => {
    const [pa, pb]: number[] = [p[0]! * a[0] + p[1]! * a[1] + p[2]! * a[2], p[0]! * b[0] + p[1]! * b[1] + p[2]! * b[2]];
    return [0, 1, 2].map((c: number): number => p[c]! + (along - 1) * pa! * a[c]! + (across - 1) * pb! * b[c]!) as V3;
  };

  /** A unit vector, and a vector made square to another and unit. */
  const unit3 = (p: readonly number[]): V3 => {
    const n: number = Math.hypot(p[0]!, p[1]!, p[2]!);
    return [p[0]! / n, p[1]! / n, p[2]! / n];
  };
  const square3 = (p: readonly number[], to: V3): V3 => {
    const k: number = p[0]! * to[0] + p[1]! * to[1] + p[2]! * to[2];
    return unit3([p[0]! - k * to[0], p[1]! - k * to[1], p[2]! - k * to[2]]);
  };

  /**
   * The hand's and the foot's axes in their own frames (the supervisor's plan on #3151, step 2's last part): the hand's along it, from the
   * wrist to the middle finger's first joint (`middle.proximal`'s offset), its breadth square to that, from the little finger's first joint
   * to the index's (metacarpale V to II, the breadth's landmarks); the foot's along it, the line to its end (`footEnd`) square to the sole's
   * normal (`leg.fan.up`), its breadth square to both, from the little toe's first joint to the big toe's. The third direction of each
   * (the hand's thickness, the foot's height) is kept.
   */
  function extremityAxes(): { hand: [V3, V3]; foot: [V3, V3] } {
    const offset = (name: string): V3 => T.CHAIN.find((j: IAutoMovieHumanSegmentJoint): boolean => j.name === name)!.offset;
    const handAlong: V3 = unit3(offset("middle.proximal"));
    const indexRoot: V3 = offset("index.proximal");
    const pinkyRoot: V3 = offset("pinky.proximal");
    const up: V3 = unit3(T.DIRECTIONS["leg.fan.up"]!.local);
    const footAlong: V3 = square3(T.POINTS["footEnd"]!.local, up);
    const [big, little]: V3[] = [offset("bigtoe.proximal"), offset("littletoe.proximal")];
    const across: V3 = [big![0] - little![0], big![1] - little![1], big![2] - little![2]];
    return {
      hand: [handAlong, square3([indexRoot[0] - pinkyRoot[0], indexRoot[1] - pinkyRoot[1], indexRoot[2] - pinkyRoot[2]], handAlong)],
      foot: [footAlong, square3(square3(across, up), footAlong)],
    };
  }

  /**
   * The chain and the datums at a person's extremity fields (the plan's lengths): the limbs' segments as `chainWith` scales them; every
   * offset in the hand's frame (the digits' first joints) and every datum stored there (`handEnd`) scaled along the hand by its length's
   * ratio and across it by its breadth's; in the foot's frame (the toes' first joints, `footBall`, `footEnd`) by the foot's length and
   * breadth; each finger's later joints and its end by its bones' ratios; each toe's later joint and its end by the foot's length ratio,
   * the toes following the foot. Returns the frames and a datum's world point and a direction's world vector.
   */
  function extremityFrames(f: IExtremityFields): { frames: Map<string, IAutoMovieHumanSegmentFrame>; point: (name: string) => V3; direction: (name: string) => V3 } {
    const axes = extremityAxes();
    const handScale = scaleIn(axes.hand[0], axes.hand[1], f.hand.length, f.hand.breadth);
    const footScale = scaleIn(axes.foot[0], axes.foot[1], f.foot.length, f.foot.breadth);
    const segments: Record<string, string> = { forearm: "humerus", hand: "forearm", tibia: "femur", foot: "tibia" };
    const toes: string[] = ["bigtoe", "indextoe", "middletoe", "ringtoe", "littletoe"];
    const bone = (name: string): number | null => {
      const [digit, part] = name.split(".");
      const ratios: [number, number, number] | undefined = f.phalanges[digit!];
      if (digit === undefined || part === undefined) return null;
      if (toes.includes(digit)) return part === "distal" ? f.foot.length : null;
      if (ratios === undefined) return null;
      return digit === "thumb" ? (part === "proximal" ? ratios[0] : part === "distal" ? ratios[1] : null) : part === "middle" ? ratios[0] : part === "distal" ? ratios[1] : null;
    };
    const chain: IAutoMovieHumanSegmentJoint[] = T.CHAIN.map((j: IAutoMovieHumanSegmentJoint): IAutoMovieHumanSegmentJoint => {
      if (segments[j.name] !== undefined) return { ...j, offset: SF.scale(j.offset, f.lengths[segments[j.name]!] ?? 1) };
      if (j.parent === "hand") return { ...j, offset: handScale(j.offset) };
      if (j.parent === "foot") return { ...j, offset: footScale(j.offset) };
      const k: number | null = bone(j.name);
      return k === null ? j : { ...j, offset: SF.scale(j.offset, k) };
    });
    const frames: Map<string, IAutoMovieHumanSegmentFrame> = SF.world(chain, (): undefined => undefined);
    const local = (name: string): V3 => {
      const placed: IAutoMovieHumanF1Placing.IPlaced = T.POINTS[name]!;
      if (placed.frame === "hand") return handScale(placed.local);
      if (placed.frame === "foot") return footScale(placed.local);
      const end: RegExpMatchArray | null = name.match(/^([a-z]+)End$/);
      if (end !== null && placed.frame.endsWith(".distal")) {
        const digit: string = end[1]!;
        const k: number = toes.includes(digit) ? f.foot.length : (f.phalanges[digit]?.[2] ?? 1);
        return SF.scale(placed.local, k);
      }
      return placed.local;
    };
    return {
      frames,
      point: (name: string): V3 => SF.toWorld(frames.get(T.POINTS[name]!.frame)!, local(name)),
      direction: (name: string): V3 => SF.toWorldDirection(frames.get(T.DIRECTIONS[name]!.frame)!, T.DIRECTIONS[name]!.local) as V3,
    };
  }

  /**
   * A family at a person: its course centres from the person's datums, its knots carried by each run's `tau`, every reach field at a knot
   * (from `held` on) times the depth ratio there and every offset field times the mean ratio of the two reaches across it, as `law` does.
   */
  function familyAt(family: Family, held: number, ratio: (direction: string, s: number) => number, point: (name: string) => V3): Family {
    const J: number[] = joints(family);
    const moved: Family = { ...family, centres: T.COURSES[family.name]!.map(point), reliefs: [] };
    const J2: number[] = joints(moved);
    const values: number[][] = family.values.map((field: number[]): number[] => [...field]);
    family.knots.forEach((s: number, m: number): void => {
      if (s < held) return;
      for (const r of reaches(family.layout)) {
        values[r.field]![m] = family.values[r.field]![m]! * ratio(r.direction, s);
        values[r.offset]![m] = family.values[r.offset]![m]! * ((ratio(r.across[0], s) + ratio(r.across[1], s)) / 2);
      }
    });
    const map = (s: number): number => (s < held ? s : carry(s, J, J2));
    return { ...moved, knots: family.knots.map(map), values, ...(family.tips === undefined ? {} : { tips: family.tips.map((t) => (t === null ? null : { ...t, from: map(t.from), tip: map(t.tip) })) as [IAutoMovieHumanConicLoft.ITip | null, IAutoMovieHumanConicLoft.ITip | null] }) };
  }

  /**
   * The figure's extremities at a person (the plan's depths): the arm and the leg by their own course and the person's lengths (no depth
   * site moved here); the palm by the hand circumference's ratio, from 1 at the wrist (the arm law's wrist, held) to the ratio at the
   * metacarpals' level by the quintic smoothstep and held past it; the foot past the ankle by the foot breadth's ratio, from 1 at the ankle
   * site to the ratio at the ball, the same way; each finger by its palm's ratio and each toe by its foot's, uniformly, a provisional
   * assumption (no digit girth has a source; a validation case for #3205). Also the station where the arm's face ends, `ARM_TO_MM`
   * carried by its run's `tau`.
   */
  function extremityAt(f: IExtremityFields, armToMm: number): { arm: Family; hand: Family; leg: Family; digits: { family: Family; limb: "arm" | "leg"; knuckle: boolean }[]; armTo: number; point: (name: string) => V3; direction: (name: string) => V3; ratio: (family: string, s: number) => number; fields: IExtremityFields } {
    const { point, direction } = extremityFrames(f);
    const [armLimb, legLimb] = limbs();
    const step = (from: [number, number], to: [number, number]) => (s: number): number => (s <= from[0] ? from[1] : s >= to[0] ? to[1] : from[1] + smooth((s - from[0]) / (to[0] - from[0])) * (to[1] - from[1]));
    const hand: Family = AutoMovieHumanF1.BODY.hand;
    const f1Point = (name: string): V3 => pointUnder(SF.world(T.CHAIN, (): undefined => undefined), name);
    const wrist: number = nearest(H.axis(hand), courseLength(hand), SF.mid(f1Point("styloidRadial"), f1Point("styloidUlnar")));
    const metacarpals: number = nearest(H.axis(hand), courseLength(hand), SF.mid(f1Point("index1"), f1Point("pinky1")));
    const palm = step([wrist, 1], [metacarpals, f.hand.circumference]);
    const leg: Family = AutoMovieHumanF1.BODY.leg;
    const ankle: number = sites(legLimb!).find((x: ISite): boolean => x.name === "ankle")!.station!;
    const ball: number = nearest(H.axis(leg), courseLength(leg), f1Point("footBall"));
    const foot = step([ankle, 1], [ball, f.foot.breadth]);
    const arm2: Family = familyAt(AutoMovieHumanF1.BODY.arm, armLimb!.held, (): number => 1, point);
    return {
      arm: arm2,
      hand: familyAt(hand, -Infinity, (_d: string, s: number): number => palm(s), point),
      leg: familyAt(leg, legLimb!.held, (_d: string, s: number): number => foot(s), point),
      digits: AutoMovieHumanF1.DIGITS.map((d) => ({ family: familyAt(d.family, -Infinity, (): number => (d.limb === "arm" ? f.hand.circumference : f.foot.breadth), point), limb: d.limb, knuckle: d.knuckle })),
      armTo: carry(armToMm, joints(AutoMovieHumanF1.BODY.arm), joints(arm2)),
      point,
      direction,
      // Each family's depth ratio at a station of f1's course: the palm's and the foot's profiles, a digit's its limb's ratio, else 1.
      ratio: (family: string, s: number): number => (family === "hand" ? palm(s) : family === "leg" ? foot(s) : family.startsWith("finger.") ? f.hand.circumference : family.startsWith("toe.") ? f.foot.breadth : 1),
      fields: f,
    };
  }

  /** The stations from a family's first knot to its last, every millimetre, whose section is no admissible chain or meets under the margin. */
  function inadmissible(family: Family): number[] {
    const read: (s: number) => number[] = H.reader(family);
    const out: number[] = [];
    for (let s: number = family.knots[0]!; s <= family.knots.at(-1)!; s += 1) {
      const t: number[] = read(s);
      const fault: string | null = S.chain(t, family.layout).fault;
      if (fault !== null || Math.min(...F.leastMeetings(t, family.layout)) < MARGIN) out.push(round3(s));
    }
    return out;
  }

  /**
   * The wrist band's ribbons (`IAutoMovieConstructionContinuation.band`), as `AutoMovieConstructionSplitBand.strip` builds them: the arm's
   * face's end ring at `armTo` and the hand's rail ring `rail` mm past its first knot, paired by length (`lengths`: the ring sampled at 8
   * points a column, the sense by the two Newell normals, the first column where the two curves at equal shares of their lengths stand
   * closest about their centroids); each column's ribbons the arm's own station derivatives at its end and the hand's at its rail, scaled
   * to the chord; the columns that point back against their chord, and the common scale at which every other advances monotonically.
   */
  function wristBand(arm: Family, hand: Family, armTo: number, rail: number, count: number): { backward: number; scale: number; least: number; chords: [number, number] } {
    const sampler = (family: Family, at: number): ((s: number, psi: number) => V3) => {
      const loft: IAutoMovieViewLoft.IResult = H.create({ ...family, tips: undefined, reliefs: [] }, [at - 2, at - 1, at - 0.5, at, at + 0.5, at + 1, at + 2]);
      if (loft.chain === null) throw new Error(`${family.name} does not loft at ${at}`);
      const chain: Chain = loft.chain;
      return (s: number, psi: number): V3 => AutoMovieLoftChain.point(chain, s, psi) as V3;
    };
    const host = sampler(arm, armTo);
    const part = sampler(hand, hand.knots[0]! + rail);
    const railAt: number = hand.knots[0]! + rail;
    const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const add3 = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    const mul3 = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
    const dot3 = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const len3 = (a: V3): number => Math.hypot(a[0], a[1], a[2]);
    const jet = (read: (s: number, psi: number) => V3, s: number, psi: number): [V3, V3, V3] => {
      const [a, p, b] = [read(s - 0.5, psi), read(s, psi), read(s + 0.5, psi)];
      return [p, mul3(sub3(b, a), 1), mul3(add3(sub3(b, p), sub3(a, p)), 4)];
    };
    const loop: V3[] = Array.from({ length: count }, (_: unknown, k: number): V3 => host(armTo, (2 * Math.PI * k) / count));
    const samples: number = 8 * count;
    const ring: V3[] = Array.from({ length: samples + 1 }, (_: unknown, j: number): V3 => part(railAt, (2 * Math.PI * j) / samples));
    const newell = (points: readonly V3[]): { centre: V3; normal: V3 } => {
      const centre: V3 = mul3(points.reduce((t: V3, q: V3): V3 => add3(t, q), [0, 0, 0]), 1 / points.length);
      let area: V3 = [0, 0, 0];
      points.forEach((q: V3, j: number): void => {
        const [a, b] = [sub3(q, centre), sub3(points[(j + 1) % points.length]!, centre)];
        area = add3(area, [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]);
      });
      return { centre, normal: mul3(area, 1 / len3(area)) };
    };
    const [rim, lap] = [newell(ring.slice(0, samples)), newell(loop)];
    const sense: number = dot3(rim.normal, lap.normal) > 0 ? 1 : -1;
    const along: number[] = [0];
    for (let j: number = 1; j <= samples; ++j) along.push(along[j - 1]! + len3(sub3(ring[j]!, ring[j - 1]!)));
    const total: number = along[samples]!;
    const lapAlong: number[] = [0];
    for (let k: number = 1; k <= count; ++k) lapAlong.push(lapAlong[k - 1]! + len3(sub3(loop[k % count]!, loop[k - 1]!)));
    const lapTotal: number = lapAlong[count]!;
    const readAt = (length: number): { psi: number; p: V3 } => {
      const x: number = ((length % total) + total) % total;
      let j: number = 0;
      let hi: number = samples - 1;
      while (j < hi) {
        const mid: number = (j + hi + 1) >> 1;
        if (along[mid]! <= x) j = mid;
        else hi = mid - 1;
      }
      const span: number = along[j + 1]! - along[j]!;
      const w: number = span > 0 ? (x - along[j]!) / span : 0;
      return { psi: (2 * Math.PI * (j + w)) / samples, p: add3(mul3(ring[j]!, 1 - w), mul3(ring[j + 1]!, w)) };
    };
    let [anchor, least]: number[] = [0, Infinity];
    for (let j: number = 0; j < samples; j += 2) {
      let cost: number = 0;
      for (let k: number = 0; k < count && cost < least!; k += 4) {
        const d: V3 = sub3(sub3(readAt(along[j]! + sense * (lapAlong[k]! / lapTotal) * total).p, rim.centre), sub3(loop[k]!, lap.centre));
        cost += dot3(d, d);
      }
      if (cost < least!) [least, anchor] = [cost, j];
    }
    const columns = loop.map((_p: V3, k: number) => {
      const psi: number = readAt(along[anchor!]! + sense * (lapAlong[k]! / lapTotal) * total).psi;
      const [hp, h1, h2] = jet(host, armTo, (2 * Math.PI * k) / count);
      const [pp, p1, p2] = jet(part, railAt, psi);
      const chord: V3 = sub3(pp, hp);
      const L: number = len3(chord);
      const [a, b] = [L / len3(h1), L / len3(p1)];
      return { chord, L, start: { point: hp, first: mul3(h1, a), second: mul3(h2, a * a) }, end: { point: pp, first: mul3(p1, b), second: mul3(p2, b * b) } };
    });
    const monotone = (c: (typeof columns)[number], f: number): boolean => {
      const [a, b] = [c.start.point, c.end.point];
      const controls: V3[] = [a, add3(a, mul3(c.start.first, f / 5)), add3(add3(a, mul3(c.start.first, (2 * f) / 5)), mul3(c.start.second, (f * f) / 20)), add3(add3(b, mul3(c.end.first, (-2 * f) / 5)), mul3(c.end.second, (f * f) / 20)), add3(b, mul3(c.end.first, -f / 5)), b];
      const projected: number[] = controls.map((q: V3): number => dot3(sub3(q, a), c.chord));
      return projected.every((x: number, i: number): boolean => i === 0 || x >= projected[i - 1]!);
    };
    const largest = (c: (typeof columns)[number]): number => {
      if (monotone(c, 1)) return 1;
      let [hi, lo]: number[] = [1, 0.5];
      while (!monotone(c, lo!)) {
        hi = lo;
        lo = lo! / 2;
        if (!(lo > 1e-9)) return 0;
      }
      for (let i: number = 0; i < 40; ++i) {
        const mid: number = (lo! + hi!) / 2;
        if (monotone(c, mid)) lo = mid;
        else hi = mid;
      }
      return lo!;
    };
    const backward = columns.filter((c): boolean => !(dot3(c.chord, c.start.first) > 0 && dot3(c.chord, c.end.first) > 0));
    const scales: number[] = columns.filter((c): boolean => !backward.includes(c)).map(largest);
    return { backward: backward.length, scale: scales.length === 0 ? NaN : Math.min(...scales), least: Math.min(...columns.map((c): number => c.L)), chords: [Math.min(...columns.map((c): number => c.L)), Math.max(...columns.map((c): number => c.L))] };
  }

  /**
   * Whether the thumb's capsule's seed line (its phase-0 line over shares `from` to `to` of its stations, from the capsule's root tip to
   * its end) meets the hand's wall: each point classed inside or outside the hand's section at the hand's course station nearest it.
   * Returns the share of the first change from inside to outside, or null where the line stays on one side.
   */
  function thumbSeed(thumb: Family, hand: Family, rootMm: number, from: number, to: number): number | null {
    const capsule: Family = { ...thumb, reliefs: [], tips: [{ from: thumb.knots[0]!, tip: -rootMm, covered: true }, thumb.tips?.[1] ?? null] };
    const [first, last] = [-rootMm, tipStation(capsule)];
    const stations: number[] = [];
    for (let s: number = first; s <= last; s += 0.5) stations.push(s);
    const loft: IAutoMovieViewLoft.IResult = H.create(capsule, stations);
    if (loft.chain === null) return null;
    const chain: Chain = loft.chain;
    const handAxis: IAutoMovieViewAxis.IAxis = H.axis(hand);
    const handLength: number = courseLength(hand);
    const handLoft: IAutoMovieViewLoft.IResult = H.create({ ...hand, tips: undefined, reliefs: [] }, Array.from({ length: Math.floor(hand.knots.at(-1)! - hand.knots[0]!) + 1 }, (_: unknown, i: number): number => hand.knots[0]! + i));
    if (handLoft.chain === null) return null;
    const handChain: Chain = handLoft.chain;
    const inside = (p: V3): boolean => {
      const s: number = Math.min(hand.knots.at(-1)!, Math.max(hand.knots[0]!, nearest(handAxis, handLength, p)));
      const frame = handAxis.at(s);
      const q: [number, number] = [0, 1].map((c: number): number => [0, 1, 2].reduce((t: number, i: number): number => t + (p[i]! - frame.origin[i]!) * (c === 0 ? frame.u : frame.v)[i]!, 0)) as [number, number];
      const ring: [number, number][] = Array.from({ length: 128 }, (_: unknown, j: number): [number, number] => {
        const r: number[] = AutoMovieLoftChain.point(handChain, s, (2 * Math.PI * j) / 128);
        return [0, 1].map((c: number): number => [0, 1, 2].reduce((t: number, i: number): number => t + (r[i]! - frame.origin[i]!) * (c === 0 ? frame.u : frame.v)[i]!, 0)) as [number, number];
      });
      let within: boolean = false;
      for (let i: number = 0, k: number = ring.length - 1; i < ring.length; k = i++) {
        const [a, b] = [ring[i]!, ring[k]!];
        if (a[1] > q[1] !== b[1] > q[1] && q[0] < ((b[0] - a[0]) * (q[1] - a[1])) / (b[1] - a[1]) + a[0]) within = !within;
      }
      return within;
    };
    let before: boolean | null = null;
    for (const s of stations) {
      const share: number = (s - first) / (last - first);
      if (share < from || share > to) continue;
      const now: boolean = inside(AutoMovieLoftChain.point(chain, s, 0) as V3);
      if (before === true && !now) return round3(share);
      before = now;
    }
    return null;
  }

  /**
   * The law of the hand, the foot and the digits (the supervisor's plan on #3151, step 2's last part), its round trip and the premises of
   * every connection pre-checked on every case before any is realized, measurement only: (1) the round trip, at f1's own fields every
   * family and datum returned (`extremityAt`); (2) the cases from the population, every field together at `±END_DEVIATE CV` and each alone at
   * `±END_DEVIATE CV sqrt(1 - rho^2)` (the hand's length, breadth and circumference and the foot's length and breadth: ANSUR II women and
   * ANSUR 1988's circumference and correlations, rho the largest with the other fields of the same extremity, the wrist with the hand's),
   * each finger's bones together by Buryanov 2010's SDs, and the limbs' lengths as before; (3) per case: every wall admissible (the
   * stations no f1 wall has refused), each fan's end section admissible and its seams found and nested (`AutoMovieHumanF1.fanSeams` on the
   * case's datums), the thumb's seed meeting the hand (`thumbSeed`), the wrist band's ribbons (`wristBand`, `ARM_TO_MM` carried). Written
   * to `premises.txt`.
   */
  async function extremityPremises(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    // A run may be split: `--dir=<name>` writes into one directory and `--cases=<first>,<count>` reads that stretch of the cases (f1 first),
    // each part into its own file; `--engine` also reads every connection alone through the engine.
    const argument = (name: string): string | undefined => process.argv.find((a: string): boolean => a.startsWith(`--${name}=`))?.slice(name.length + 3);
    const range: [number, number] = (argument("cases") ?? "0,1000").split(",").map(Number) as [number, number];
    const engine: boolean = process.argv.includes("--engine");
    const out: string = path.join(root, "test/.shots/family-conic-limb-law", argument("dir") ?? "extremity-premises-" + new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const lines: string[] = ["The hand, the foot and the digits by law: the round trip and every connection's premises on every case (issue #3151, step 2's last part); nothing realized beyond each connection alone", ""];
    const source: string = await fs.readFile(path.join(root, "packages/human/src/generation/f1/AutoMovieHumanF1.ts"), "utf8");
    const constant = (name: string): number => Number(source.match(new RegExp(`const ${name}: number = ([0-9.]+);`))?.[1] ?? NaN);
    const [armToMm, rootMm] = [constant("ARM_TO_MM"), constant("ROOT_MM")];
    const wrist: { rail: number; count: number } = { rail: Number(source.match(/const WRIST[^=]+= \{ rail: ([0-9.]+), count: ([0-9]+)/)?.[1]), count: Number(source.match(/const WRIST[^=]+= \{ rail: ([0-9.]+), count: ([0-9]+)/)?.[2]) };
    lines.push(`read from AutoMovieHumanF1.ts: ARM_TO_MM ${armToMm} mm, ROOT_MM ${rootMm} mm, WRIST rail ${wrist.rail} mm and ${wrist.count} columns`, "");

    // (1) The round trip.
    const f1 = extremityAt(F1_EXTREMITIES(), armToMm);
    const difference = (a: Family, b: Family): number =>
      Math.max(...a.values.map((field: number[], i: number): number => Math.max(...field.map((x: number, m: number): number => Math.abs(x - b.values[i]![m]!)))), ...a.knots.map((s: number, m: number): number => Math.abs(s - b.knots[m]!)), ...a.centres.map((c, k: number): number => Math.hypot(c[0] - b.centres[k]![0], c[1] - b.centres[k]![1], c[2] - b.centres[k]![2])));
    const stored: Family[] = [AutoMovieHumanF1.BODY.arm, AutoMovieHumanF1.BODY.hand, AutoMovieHumanF1.BODY.leg, ...AutoMovieHumanF1.DIGITS.map((d) => d.family)];
    const back: Family[] = [f1.arm, f1.hand, f1.leg, ...f1.digits.map((d) => d.family)];
    const f1Frames: Map<string, IAutoMovieHumanSegmentFrame> = SF.world(T.CHAIN, (): undefined => undefined);
    const datum: number = Math.max(...Object.keys(T.POINTS).map((n: string): number => {
      const [a, b] = [pointUnder(f1Frames, n), f1.point(n)];
      return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    }));
    lines.push(`(1) THE ROUND TRIP at f1's own fields: the largest difference of a family's values, knots or centres ${Math.max(...stored.map((s: Family, i: number): number => difference(s, back[i]!))).toExponential(3)} (${stored.map((s: Family, i: number): string => `${s.name} ${difference(s, back[i]!).toExponential(1)}`).join(", ")}); of a datum ${datum.toExponential(3)} mm; ARM_TO_MM carried to ${f1.armTo} mm`, "");

    // (2) The cases.
    const ansur = notesRow(await fs.readFile(path.join(root, "packages/human/docs/sources/ansur-ii.md"), "utf8"));
    const tables = await surveyTables(root);
    const women = (m: string, of: number[][]): number => of[0]![tables.names.indexOf(m)]!;
    const rho = (a: string, b: string): number => {
      const [i, j]: number[] = [tables.names.indexOf(a), tables.names.indexOf(b)].sort((x: number, y: number): number => y - x);
      return tables.r[0]![i! - 1]![j!]!;
    };
    const fields: { name: string; measure: string; cv: number; basis: string; neighbours: string[] }[] = [
      { name: "hand length", measure: "handLength", ...ansur("Hand length"), neighbours: ["handBreadth", "handCircumference", "wrist"] },
      { name: "hand breadth", measure: "handBreadth", ...ansur("Hand breadth"), neighbours: ["handLength", "handCircumference", "wrist"] },
      { name: "hand circumference", measure: "handCircumference", cv: women("handCircumference", tables.sd) / women("handCircumference", tables.mean), basis: `ANSUR 1988 women ${women("handCircumference", tables.mean).toFixed(1)} (${women("handCircumference", tables.sd).toFixed(1)})`, neighbours: ["handLength", "handBreadth", "wrist"] },
      { name: "foot length", measure: "footLength", ...ansur("Foot length"), neighbours: ["footBreadth"] },
      { name: "foot breadth", measure: "footBreadth", ...ansur("Foot breadth"), neighbours: ["footLength"] },
    ];
    const apply = (f: IExtremityFields, name: string, k: number): void => {
      if (name === "hand length") f.hand.length = k;
      else if (name === "hand breadth") f.hand.breadth = k;
      else if (name === "hand circumference") f.hand.circumference = k;
      else if (name === "foot length") f.foot.length = k;
      else f.foot.breadth = k;
    };
    const bones = buryanov(await fs.readFile(path.join(root, "packages/human/docs/sources/buryanov-2010-hand-segments.md"), "utf8"));
    const cases: { name: string; fields: IExtremityFields }[] = [];
    lines.push("(2) THE CASES' BASIS:");
    for (const x of fields) {
      const rhoMax: number = Math.max(...x.neighbours.map((n: string): number => rho(x.measure, n)));
      const alone: number = END_DEVIATE * x.cv * Math.sqrt(1 - rhoMax * rhoMax);
      lines.push(`  ${x.name}: ${x.basis}, CV ${x.cv.toFixed(4)}; rho max ${rhoMax.toFixed(4)} (${x.neighbours.map((n: string): string => `${n} ${rho(x.measure, n).toFixed(3)}`).join(", ")}); together ±${(100 * END_DEVIATE * x.cv).toFixed(2)} %, alone ±${(100 * alone).toFixed(2)} %`);
      for (const sign of [-1, 1]) {
        const f: IExtremityFields = F1_EXTREMITIES();
        apply(f, x.name, 1 + sign * alone);
        cases.push({ name: `${x.name} alone ${sign > 0 ? "+" : "-"}${(100 * alone).toFixed(1)}%`, fields: f });
      }
    }
    const fingerRows: Record<string, string> = { index: "II", middle: "III", ring: "IV", pinky: "V", thumb: "I" };
    for (const [finger, row] of Object.entries(fingerRows)) {
      const b = bones[row]!;
      // A finger's three bones beyond its first joint: the proximal and middle phalanges and the distal one with its tip's soft tissue; the
      // thumb's, its metacarpal, its proximal phalanx and its distal one with the tip.
      const cvs: [number, number, number] = finger === "thumb" ? [b.metacarpal[1] / b.metacarpal[0], b.proximal[1] / b.proximal[0], Math.hypot(b.distal[1], b.tip[1]) / (b.distal[0] + b.tip[0])] : [b.proximal[1] / b.proximal[0], b.middle![1] / b.middle![0], Math.hypot(b.distal[1], b.tip[1]) / (b.distal[0] + b.tip[0])];
      lines.push(`  ${finger}'s bones (Buryanov 2010, row ${row}): CVs ${cvs.map((c: number): string => c.toFixed(4)).join(", ")}; together ±${cvs.map((c: number): string => (100 * END_DEVIATE * c).toFixed(1)).join(", ")} %`);
      for (const sign of [-1, 1]) {
        const f: IExtremityFields = F1_EXTREMITIES();
        f.phalanges[finger] = cvs.map((c: number): number => 1 + sign * END_DEVIATE * c) as [number, number, number];
        cases.push({ name: `${finger}'s bones ${sign > 0 ? "+" : "-"}`, fields: f });
      }
    }
    for (const sign of [-1, 1]) {
      const f: IExtremityFields = F1_EXTREMITIES();
      for (const x of fields) apply(f, x.name, 1 + sign * END_DEVIATE * x.cv);
      for (const [finger, row] of Object.entries(fingerRows)) {
        const b = bones[row]!;
        const cvs: number[] = finger === "thumb" ? [b.metacarpal[1] / b.metacarpal[0], b.proximal[1] / b.proximal[0], Math.hypot(b.distal[1], b.tip[1]) / (b.distal[0] + b.tip[0])] : [b.proximal[1] / b.proximal[0], b.middle![1] / b.middle![0], Math.hypot(b.distal[1], b.tip[1]) / (b.distal[0] + b.tip[0])];
        f.phalanges[finger] = cvs.map((c: number): number => 1 + sign * END_DEVIATE * c) as [number, number, number];
      }
      cases.push({ name: `every field at its ${sign > 0 ? "95th" : "5th"}`, fields: f });
    }
    for (const segment of Object.keys(LENGTH_ENDS))
      for (const [label, end] of [["5th", 0], ["95th", 1]] as [string, 0 | 1][]) {
        const f: IExtremityFields = F1_EXTREMITIES();
        f.lengths[segment] = LENGTH_ENDS[segment]![end];
        cases.push({ name: `${segment} length ${label}`, fields: f });
      }
    lines.push("  the toes follow the foot's length (no toe source); the limbs' lengths as `LENGTH_ENDS`", "");

    // (3) The premises on every case.
    const f1Refused: Map<string, number[]> = new Map(stored.map((s: Family): [string, number[]] => [s.name, inadmissible(s)]));
    lines.push(`(3) THE PREMISES (FAIL marks a premise that does not hold); f1's own walls under the margin: ${[...f1Refused.entries()].map(([n, l]): string => `${n} ${l.length}`).join(", ")}`);
    const f1Wrist = wristBand(f1.arm, f1.hand, f1.armTo, wrist.rail, wrist.count);
    lines.push(`  f1: the wrist band's ${f1Wrist.backward} backward columns, common scale ${f1Wrist.scale.toFixed(4)}, chords ${f1Wrist.chords.map((c: number): string => c.toFixed(1)).join("..")} mm; the thumb's seed meets the hand at share ${thumbSeed(f1.digits.find((d) => d.family.name === "finger.thumb")!.family, f1.hand, rootMm, 0, 0.7) ?? "none"}`);
    let failures: number = 0;
    for (const c of [{ name: "f1", fields: F1_EXTREMITIES() }, ...cases].slice(range[0], range[0] + range[1])) {
      const x = extremityAt(c.fields, armToMm);
      const notes: string[] = [];
      const fail = (what: string): void => {
        ++failures;
        notes.push("FAIL " + what);
      };
      const families: Family[] = [x.arm, x.hand, x.leg, ...x.digits.map((d) => d.family)];
      for (const fam of families) {
        // The case's stations carried back to f1's course by each run's tau, so a station f1 already refuses is not read as new.
        const own: number[] = f1Refused.get(fam.name) ?? [];
        const [J2, J1] = [joints(fam), joints(stored.find((s: Family): boolean => s.name === fam.name)!)];
        const added: number[] = inadmissible(fam)
          .map((s: number): number => round3(carry(s, J2, J1)))
          .filter((s: number): boolean => !own.some((o: number): boolean => Math.abs(o - s) <= 1.5));
        if (added.length > 0) fail(`${fam.name}'s wall: ${added.length} stations newly under the margin (${added[0]} .. ${added.at(-1)} on f1's course)`);
      }
      const placed = { point: x.point, direction: x.direction, body: { ...AutoMovieHumanF1.BODY, arm: x.arm, hand: x.hand, leg: x.leg }, digits: x.digits } as unknown as IAutoMovieHumanF1.IAssembly;
      for (const [which, fam] of [["arm", x.hand], ["leg", x.leg]] as ["arm" | "leg", Family][]) {
        const t: number[] = H.reader(fam)(fam.knots.at(-1)!);
        const fault: string | null = S.chain(t, fam.layout).fault;
        const meet: number = fault === null ? Math.min(...F.leastMeetings(t, fam.layout)) : NaN;
        // f1's own end section is the baseline: a case fails only where it is refused and f1's is not, or falls further under the margin.
        const own: Family = which === "arm" ? AutoMovieHumanF1.BODY.hand : AutoMovieHumanF1.BODY.leg;
        const ownMeet: number = Math.min(...F.leastMeetings(H.reader(own)(own.knots.at(-1)!), own.layout));
        if (fault !== null || (meet < MARGIN && !(ownMeet < MARGIN && meet >= ownMeet - 1e-4))) fail(`the ${which === "arm" ? "hand" : "foot"}'s end section at ${round3(fam.knots.at(-1)!)} mm: ${fault ?? `least meeting ${meet.toFixed(4)} (f1's ${ownMeet.toFixed(4)})`}`);
        else if (meet < MARGIN) notes.push(`the ${which === "arm" ? "hand" : "foot"}'s end section meets at ${meet.toFixed(4)}, f1's own ${ownMeet.toFixed(4)} under the margin ${MARGIN}`);
        try {
          const fan = AutoMovieHumanF1.fanSeams(which, placed);
          notes.push(`${which === "arm" ? "hand" : "foot"} seams ${fan.seams.map(([a, b]): string => `${a.toFixed(3)}..${b.toFixed(3)}`).join(", ")}`);
        } catch (error: unknown) {
          fail(`the ${which === "arm" ? "hand" : "foot"}'s seams: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      const flags = extremityFlags(source);
      const declaration = extremityDeclaration(x, f1, c.fields, flags);
      const seed: number | null = thumbSeed(x.digits.find((d) => d.family.name === "finger.thumb")!.family, x.hand, declaration.rootMm, 0, 0.7);
      if (seed === null) fail("the thumb's seed line meets the hand nowhere within shares 0 to 0.7");
      else notes.push(`thumb seed at share ${seed} (ROOT_MM ${declaration.rootMm.toFixed(2)} mm)`);
      const band = wristBand(x.arm, x.hand, x.armTo, wrist.rail, wrist.count);
      if (band.backward > 0 || !(band.scale > 0)) fail(`the wrist band: ${band.backward} backward columns, common scale ${band.scale}`);
      notes.push(`wrist band at ${x.armTo.toFixed(2)} mm: chords ${band.chords.map((v: number): string => v.toFixed(1)).join("..")} mm, common scale ${band.scale.toFixed(4)}`);
      // The fans' seams as the engine admits them (`AutoMovieConstructionAdmission`, `AutoMovieConstructionSplitSeam.create`): every
      // seam a < b < a + 2 pi and each enclosing the one before within one turn; its ends apart; its heading not along its chord; every
      // knot finite, along its chord within [0, chord], apart from the one before (the first from the seam's start, the last from its end);
      // the host's tangent plane at each fork holding a direction of the seam plane that leaves the end.
      for (const which of ["arm", "leg"] as const) {
        const s = declaration.seams[which];
        const part: string = which === "arm" ? "hand" : "foot";
        s.seams.forEach(([a, b]: [number, number], j: number): void => {
          if (!(a < b && b < a + 2 * Math.PI)) fail(`the ${part}'s seam ${j} [${a}, ${b}] is not a < b < a + 2 pi`);
          if (j > 0 && !(a < s.seams[j - 1]![0] && b > s.seams[j - 1]![1] && b < a + 2 * Math.PI)) fail(`the ${part}'s seam ${j} does not enclose seam ${j - 1} within one turn`);
          const chord: number = s.chords[j]!;
          if (!(chord > 0)) fail(`the ${part}'s seam ${j}: its ends coincide`);
          const points: [number, number][] = [[0, 0], ...s.knots[j]!.map(([along, depth]: [number, number]): [number, number] => [along * 1000, depth * 1000]), [chord, 0]];
          for (const [along, depth] of points.slice(1, -1)) if (!(Number.isFinite(along) && Number.isFinite(depth) && along >= 0 && along <= chord)) fail(`the ${part}'s seam ${j}: knot (${along.toFixed(2)}, ${depth.toFixed(2)}) mm beyond the chord's span [0, ${chord.toFixed(2)}] mm`);
          for (let k: number = 1; k < points.length; ++k) if (!(Math.hypot(points[k]![0] - points[k - 1]![0], points[k]![1] - points[k - 1]![1]) > 0)) fail(`the ${part}'s seam ${j}: knots ${k - 1} and ${k} coincide`);
          if (!(s.headingSquare[j]! > 0)) fail(`the ${part}'s seam ${j}: its heading runs along its chord`);
          if (!(s.forkLeaves[j]! > 0)) fail(`the ${part}'s seam ${j}: the host's tangent plane at a fork holds no direction of the seam plane leaving the end (${s.forkLeaves[j]!.toExponential(2)})`);
        });
        notes.push(`${part} seam chords ${s.chords.map((v: number): string => v.toFixed(2)).join(", ")} mm (f1 ${s.f1Chords.map((v: number): string => v.toFixed(2)).join(", ")}), knots scaled by ${s.chords.map((v: number, j: number): string => (v / s.f1Chords[j]!).toFixed(4)).join(", ")}`);
      }
      // Every condition the engine reads beyond these, each connection alone through the engine: the fans with their children (rails in
      // their domains, the bands' correspondence, columns and ribbons), the thumb's merge on the hand (seed, trace, blend) and the wrist's
      // continuation onto the hand (its band).
      if (engine)
        for (const [label, node] of [["the hand's fan", declaration.fan("arm", true)], ["the foot's fan", declaration.fan("leg", true)], ["the thumb's merge", declaration.merge()], ["the wrist's band", declaration.wrist(true)]] as [string, IAutoMovieConstructionNode][]) {
          const real = realizeAutoMovieConstruction({ name: `f1.${label}`, root: node, fills: [] }, { chord: 0.001, sources: declaration.sources });
          if (real.diagnostics.length > 0) fail(`${label} through the engine: ${real.diagnostics.map((d): string => `${d.node} (${d.contract}): ${d.detail.slice(0, 200)}`).join("; ")}`);
        }
      lines.push(`  ${c.name}: ${notes.join("; ")}`);
    }
    lines.push("", `premises failing: ${failures}`);
    await fs.writeFile(path.join(out, argument("cases") === undefined ? "premises.txt" : `premises.${range[0] + 1}-${range[0] + range[1]}.txt`), lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
  }

  /** The flags `AutoMovieHumanF1.construction` gives the extremities' leaves and connections, read from its tracked text. */
  function extremityFlags(source: string): { arm: number; leg: number; finger: number; rootMm: number } {
    const number = (pattern: RegExp): number => Number(source.match(pattern)?.[1] ?? NaN);
    return { arm: number(/const PHASE_TURN[^=]+= \{ arm: ([0-9.]+)/), leg: number(/const PHASE_TURN[^=]+= \{ arm: [0-9.]+, leg: ([0-9.]+)/), finger: number(/const FINGER_TURN: number = ([0-9.]+);/), rootMm: number(/const ROOT_MM: number = ([0-9.]+);/) };
  }

  /** f1's declared construction, once. */
  let declaredOnce: ReturnType<typeof AutoMovieHumanF1.construction> | null = null;
  function declaredF1(): ReturnType<typeof AutoMovieHumanF1.construction> {
    declaredOnce ??= AutoMovieHumanF1.construction();
    return declaredOnce;
  }

  /** A node of a construction tree by its name. */
  function findNode(node: IAutoMovieConstructionNode, name: string): IAutoMovieConstructionNode | null {
    if (node.name === name) return node;
    const n = node as { host?: IAutoMovieConstructionNode; part?: IAutoMovieConstructionNode; children?: { part: IAutoMovieConstructionNode }[] };
    for (const child of [n.host, n.part, ...(n.children ?? []).map((k): IAutoMovieConstructionNode => k.part)]) {
      if (child === undefined) continue;
      const hit: IAutoMovieConstructionNode | null = findNode(child, name);
      if (hit !== null) return hit;
    }
    return null;
  }

  /**
   * The extremities' declarations at a person, f1's own with the law's families and datums (the supervisor's plan on #3151, step 2's last
   * part): each leaf's source the law's family on the declared leaf's stations carried by its run's `tau`, with the declared tips and phase
   * turns (`flags`); the fans' seams and headings found again on the person's datums (`AutoMovieHumanF1.fanSeams`), and each seam's profile
   * knots scaled with its chord, as shares of it (f1's millimetres over f1's chord): the seam's shape is the web between two digits, whose
   * width the law scales. Of the stored millimetres the fans and the merge hold: the thumb's root, `ROOT_MM`, is a length along the thumb's
   * course from its first joint into the palm, so it scales with the thumb's metacarpal; the thumb's fair, `THUMB_FAIR_MM`, is the width of
   * the thumb's whole root, so it scales with the thumb's girth, its hand's circumference ratio; the thumb's blend, `THUMB_CHORD_MM`, stays
   * absolute, a tolerance of the blend (at 1 mm it folded in the web), not a size of the part; the digits' rails, `FANS.rail`, and the wrist
   * band's, `WRIST.rail`, stay absolute, the bands' margins along the skin, as the arm's port rail is. Also each seam's chord and f1's, the
   * heading's part square to the chord, and how far the host's tangent plane at each fork holds a direction of the seam plane leaving
   * the end (the larger of its two forks' least).
   */
  function extremityDeclaration(x: ReturnType<typeof extremityAt>, f1x: ReturnType<typeof extremityAt>, f: IExtremityFields, flags: { arm: number; leg: number; finger: number; rootMm: number }) {
    const declared = declaredF1();
    const rootMm: number = flags.rootMm * (f.phalanges["thumb"]?.[0] ?? 1);
    const leafOf = (name: string): Family => {
      const digit = x.digits.find((d) => d.family.name === name);
      if (name === "arm") return { ...x.arm, tips: [x.arm.tips?.[0] ?? null, null], turn: flags.arm };
      if (name === "hand") return { ...x.hand, tips: [null, null], turn: flags.arm };
      if (name === "leg") return { ...x.leg, tips: [x.leg.tips?.[0] ?? null, null], turn: flags.leg };
      if (name === "finger.thumb") return { ...digit!.family, tips: [{ from: digit!.family.knots[0]!, tip: -rootMm, covered: true }, digit!.family.tips?.[1] ?? null], turn: flags.finger };
      return digit!.limb === "arm" ? { ...digit!.family, turn: flags.finger } : digit!.family;
    };
    const sources: Map<string, IAutoMovieViewPart> = new Map(declared.sources);
    for (const name of ["arm", "hand", "leg", ...x.digits.map((d) => d.family.name)]) {
      const fam: Family = leafOf(name);
      const own: Family = name === "arm" ? f1x.arm : name === "hand" ? f1x.hand : name === "leg" ? f1x.leg : f1x.digits.find((d) => d.family.name === name)!.family;
      const [J1, J2] = [joints(own), joints(fam)];
      const stations: number[] = declared.sources.get(name)!.stations.filter((s: number): boolean => s >= own.knots[0]! - 1e-9).map((s: number): number => carry(s, J1, J2));
      sources.set(name, H.part(fam, stations));
    }
    const placedOf = (y: ReturnType<typeof extremityAt>): IAutoMovieHumanF1.IAssembly => ({ point: y.point, direction: y.direction, body: { ...AutoMovieHumanF1.BODY, arm: y.arm, hand: y.hand, leg: y.leg }, digits: y.digits }) as unknown as IAutoMovieHumanF1.IAssembly;
    const fanNodes: Record<"arm" | "leg", IAutoMovieConstructionNode> = { arm: findNode(declared.root, "fan.hand")!, leg: findNode(declared.root, "fan.leg")! };
    const measure = (y: ReturnType<typeof extremityAt>, which: "arm" | "leg") => {
      const fam: Family = which === "arm" ? y.hand : y.leg;
      const fan = AutoMovieHumanF1.fanSeams(which, placedOf(y));
      const loft: IAutoMovieViewLoft.IResult = H.create({ ...fam, tips: undefined }, fam.knots);
      const chain: Chain = loft.chain!;
      const station: number = fam.knots.at(-1)!;
      const at = (s: number, psi: number): V3 => AutoMovieLoftChain.point(chain, s, psi) as V3;
      const minus = (p: V3, q: V3): V3 => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
      const crossOf = (p: V3, q: V3): V3 => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
      const chords: number[] = [];
      const headingSquare: number[] = [];
      const forkLeaves: number[] = [];
      fan.seams.forEach(([a, b]: [number, number], j: number): void => {
        const [A, B] = [at(station, a), at(station, b)];
        const e: V3 = minus(B, A);
        const chord: number = Math.hypot(...e);
        chords.push(chord);
        const e1: V3 = [e[0] / chord, e[1] / chord, e[2] / chord];
        const h: V3 = fan.headings[j]!;
        const k: number = h[0] * e1[0] + h[1] * e1[1] + h[2] * e1[2];
        const square: V3 = [h[0] - k * e1[0], h[1] - k * e1[1], h[2] - k * e1[2]];
        headingSquare.push(Math.hypot(...square));
        const e2: V3 = unit3(square);
        const seamNormal: V3 = crossOf(e1, e2);
        const leaving = (psi: number): number => {
          const u: V3 = unit3(minus(at(station - 0.5, psi), at(station - 1, psi)));
          const v: V3 = unit3(minus(at(station, psi + 0.001), at(station, psi - 0.001)));
          const along: V3 = crossOf(crossOf(u, v), seamNormal);
          const size: number = Math.hypot(...along);
          return size === 0 ? 0 : Math.abs(along[0] * u[0] + along[1] * u[1] + along[2] * u[2]) / size;
        };
        forkLeaves.push(Math.min(leaving(a), leaving(b)));
      });
      return { seams: fan.seams, headings: fan.headings, chords, headingSquare, forkLeaves };
    };
    const seams = Object.fromEntries((["arm", "leg"] as const).map((which) => {
      const [own, here] = [measure(f1x, which), measure(x, which)];
      const node = fanNodes[which] as Extract<IAutoMovieConstructionNode, { type: "split" }>;
      const stored: [number, number][][] = [node.profile?.knots ?? [], ...(node.outer ?? []).map((o): [number, number][] => o.profile?.knots ?? [])];
      return [which, { ...here, f1Chords: own.chords, knots: stored.map((knots: [number, number][], j: number): [number, number][] => knots.map(([along, depth]: [number, number]): [number, number] => [(along * here.chords[j]!) / own.chords[j]!, (depth * here.chords[j]!) / own.chords[j]!])) }];
    })) as Record<"arm" | "leg", ReturnType<typeof measure> & { f1Chords: number[]; knots: [number, number][][] }>;
    const merge = (): IAutoMovieConstructionNode => {
      const node = findNode(declared.root, "web.finger.thumb") as Extract<IAutoMovieConstructionNode, { type: "join" }>;
      return { ...node, ...(node.fair === undefined ? {} : { fair: node.fair * f.hand.circumference }) };
    };
    const fan = (which: "arm" | "leg", alone: boolean): IAutoMovieConstructionNode => {
      const node = fanNodes[which] as Extract<IAutoMovieConstructionNode, { type: "split" }>;
      const s = seams[which];
      const host: IAutoMovieConstructionNode = alone ? { type: "source", name: node.hostFace, source: node.hostFace } : which === "arm" ? merge() : node.host;
      return {
        ...node,
        host,
        seam: s.seams[0]!,
        ...(node.profile === undefined ? {} : { profile: { ...node.profile, heading: s.headings[0]!, knots: s.knots[0]! } }),
        outer: (node.outer ?? []).map((o, i: number) => ({ ...o, seam: s.seams[i + 1]!, ...(o.profile === undefined ? {} : { profile: { ...o.profile, heading: s.headings[i + 1]!, knots: s.knots[i + 1]! } }) })),
      };
    };
    const wrist = (alone: boolean): IAutoMovieConstructionNode => {
      const node = findNode(declared.root, "wrist.arm") as Extract<IAutoMovieConstructionNode, { type: "continue" }>;
      return { ...node, part: alone ? { type: "source", name: "hand", source: "hand" } : fan("arm", false) };
    };
    return { sources, seams, fan, merge, wrist, rootMm };
  }

  /** A women's mean and SD row of `ansur-ii.md`'s table by its measure's name, as a CV with its cited line. */
  function notesRow(text: string): (name: string) => { cv: number; basis: string } {
    const rows: string[] = text.split(/\r?\n/);
    return (name: string): { cv: number; basis: string } => {
      const i: number = rows.findIndex((l: string): boolean => l.startsWith(`| ${name} |`));
      const cells: string[] = rows[i]!.split("|").map((c: string): string => c.trim());
      return { cv: Number(cells[3]) / Number(cells[2]), basis: `ANSUR II women ${cells[2]} (${cells[3]}), ansur-ii.md:${i + 1}` };
    };
  }

  /** Buryanov 2010's Table I by finger row: each bone's mean and SD, mm (`buryanov-2010-hand-segments.md`). */
  function buryanov(text: string): Record<string, { tip: [number, number]; distal: [number, number]; middle: [number, number] | null; proximal: [number, number]; metacarpal: [number, number] }> {
    const out: Record<string, { tip: [number, number]; distal: [number, number]; middle: [number, number] | null; proximal: [number, number]; metacarpal: [number, number] }> = {};
    for (const line of text.split(/\r?\n/)) {
      const m: RegExpMatchArray | null = line.match(/^\| (I|II|III|IV|V) \|(.*)\|$/);
      if (m === null) continue;
      const cells: ([number, number] | null)[] = m[2]!.split("|").map((c: string): [number, number] | null => {
        const v: RegExpMatchArray | null = c.trim().match(/^([0-9.]+) \(([0-9.]+)\)$/);
        return v === null ? null : [Number(v[1]), Number(v[2])];
      });
      if (cells.length < 5 || cells[0] === null) continue;
      out[m[1]!] = { tip: cells[0]!, distal: cells[1]!, middle: cells[2] ?? null, proximal: cells[3]!, metacarpal: cells[4]! };
    }
    return out;
  }

  /**
   * A wall's reach lines read for the form rule alone, as `form` reads a limb's (every `STEP_MM` from `from` to `to`, each line's inflection
   * history and its profile), stations carried to f1's course by `back`; refusals, bellies and order relations left empty, so `lobeRule`
   * reads only the lobe runs.
   */
  function lineForm(family: Family, from: number, to: number, back: (s: number) => number): IForm {
    const read: (s: number) => number[] = H.reader(family);
    const traces: Record<string, ReturnType<typeof inflectionTrace>> = {};
    const profiles: Record<string, { at: number[]; profile: number[] }> = {};
    for (const r of reaches(family.layout)) {
      const at: number[] = [];
      const profile: number[] = [];
      for (let s: number = from; s <= to; s += STEP_MM) {
        at.push(round3(back(s)));
        profile.push(Math.abs(read(s)[r.field]!));
      }
      traces[r.direction] = inflectionTrace(profile, at);
      profiles[r.direction] = { at, profile };
    }
    return { refused: [], native: [], inflections: [], bellies: {}, girths: {}, order: {}, traces, maxima: {}, profiles };
  }

  /** An orthographic camera looking along `-back`, screen-up nearest `upHint`, fitted to the points as `NodeCanvasCamera.fit` fits. */
  function facingCamera(name: string, back: V3, upHint: V3, points: readonly N.Point[], width: number, height: number): N.Camera {
    const b: V3 = unit3(back);
    const right: V3 = unit3([upHint[1] * b[2] - upHint[2] * b[1], upHint[2] * b[0] - upHint[0] * b[2], upHint[0] * b[1] - upHint[1] * b[0]]);
    const up: V3 = [b[1] * right[2] - b[2] * right[1], b[2] * right[0] - b[0] * right[2], b[0] * right[1] - b[1] * right[0]];
    const low: V3 = [Infinity, Infinity, Infinity];
    const high: V3 = [-Infinity, -Infinity, -Infinity];
    for (const p of points)
      for (let c: number = 0; c < 3; ++c) {
        low[c] = Math.min(low[c]!, p[c]!);
        high[c] = Math.max(high[c]!, p[c]!);
      }
    const target: V3 = [(low[0] + high[0]) / 2, (low[1] + high[1]) / 2, (low[2] + high[2]) / 2];
    const extent = (axis: V3): number => {
      let most: number = 0;
      for (const p of points) most = Math.max(most, Math.abs((p[0] - target[0]) * axis[0] + (p[1] - target[1]) * axis[1] + (p[2] - target[2]) * axis[2]));
      return most;
    };
    return { name, target, back: b, right, up, scale: 0.88 * Math.min((width - 40) / Math.max(2 * extent(right), 1e-6), (height - 110) / Math.max(2 * extent(up), 1e-6)), width, height };
  }

  /**
   * Step 5 of the plan for the hand, the foot and the digits (the supervisor's order on #3151): (1) the proven form detector (`lobeRule`,
   * the lobe runs only) on every extremity family's wall, the hand's, each finger's, the leg's foot stretch from the ankle on and each toe's,
   * for every case, each change classed (C) where a single field's case changes its own region and other else; (2) the cases that move the
   * connections most realized: the arm with its hand, fingers, thumb and wrist band (the construction's `wrist.arm` subtree) and the leg with
   * its foot and toes (`fan.leg`), the only subtrees the cases change, with the case's families and the fans' seams and headings found
   * again on the case's datums (`fanSeams`), every other declaration as f1's; f1 realized the same way beside them. The families are the
   * law's, without their reliefs, as the limbs' are, for f1 and every case alike. Per case the realization's diagnostics, and frames of the
   * hand (dorsal, palmar, the radial side with the thumb) and the foot (top, medial side, sole), in clay and by owner, f1's at the same
   * camera beside each. Written to `acceptance.txt`.
   */
  async function extremityAcceptance(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    // A run may be split so that each part stays short: `--dir=<name>` writes into one directory, `--detector` runs (1), and
    // `--realize=<first>,<count>` realizes that stretch of the realized cases, each part into its own text file.
    const argument = (name: string): string | undefined => process.argv.find((a: string): boolean => a.startsWith(`--${name}=`))?.slice(name.length + 3);
    const part: [number, number] = (argument("realize") ?? "0,0").split(",").map(Number) as [number, number];
    const detector: boolean = process.argv.includes("--detector");
    const out: string = path.join(root, "test/.shots/family-conic-limb-law", argument("dir") ?? "extremity-acceptance-" + new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const started: number = Date.now();
    const progress = (what: string): void => {
      process.stdout.write(`${((Date.now() - started) / 1000).toFixed(0)} s: ${what}\n`);
    };
    const lines: string[] = ["The hand, the foot and the digits by law: the form detector on every wall and the realized connections (issue #3151, step 2's last part)", ""];
    const source: string = await fs.readFile(path.join(root, "packages/human/src/generation/f1/AutoMovieHumanF1.ts"), "utf8");
    const number = (pattern: RegExp): number => Number(source.match(pattern)?.[1] ?? NaN);
    const [armToMm, rootMm, fingerTurn] = [number(/const ARM_TO_MM: number = ([0-9.]+);/), number(/const ROOT_MM: number = ([0-9.]+);/), number(/const FINGER_TURN: number = ([0-9.]+);/)];
    const phaseTurn: { arm: number; leg: number } = { arm: number(/const PHASE_TURN[^=]+= \{ arm: ([0-9.]+)/), leg: number(/const PHASE_TURN[^=]+= \{ arm: [0-9.]+, leg: ([0-9.]+)/) };
    lines.push(`read from AutoMovieHumanF1.ts: ARM_TO_MM ${armToMm}, ROOT_MM ${rootMm}, FINGER_TURN ${fingerTurn}, PHASE_TURN ${JSON.stringify(phaseTurn)}`, "");

    // The cases, as `extremityPremises` makes them.
    const tables = await surveyTables(root);
    const ansur = notesRow(await fs.readFile(path.join(root, "packages/human/docs/sources/ansur-ii.md"), "utf8"));
    const women = (m: string, of: number[][]): number => of[0]![tables.names.indexOf(m)]!;
    const rho = (a: string, b: string): number => {
      const [i, j]: number[] = [tables.names.indexOf(a), tables.names.indexOf(b)].sort((x: number, y: number): number => y - x);
      return tables.r[0]![i! - 1]![j!]!;
    };
    const fields: { name: string; measure: string; cv: number; neighbours: string[]; region: string[] }[] = [
      { name: "hand length", measure: "handLength", cv: ansur("Hand length").cv, neighbours: ["handBreadth", "handCircumference", "wrist"], region: ["hand", "finger"] },
      { name: "hand breadth", measure: "handBreadth", cv: ansur("Hand breadth").cv, neighbours: ["handLength", "handCircumference", "wrist"], region: ["hand", "finger"] },
      { name: "hand circumference", measure: "handCircumference", cv: women("handCircumference", tables.sd) / women("handCircumference", tables.mean), neighbours: ["handLength", "handBreadth", "wrist"], region: ["hand", "finger"] },
      { name: "foot length", measure: "footLength", cv: ansur("Foot length").cv, neighbours: ["footBreadth"], region: ["leg", "toe"] },
      { name: "foot breadth", measure: "footBreadth", cv: ansur("Foot breadth").cv, neighbours: ["footLength"], region: ["leg", "toe"] },
    ];
    const set = (f: IExtremityFields, name: string, k: number): void => {
      if (name === "hand length") f.hand.length = k;
      else if (name === "hand breadth") f.hand.breadth = k;
      else if (name === "hand circumference") f.hand.circumference = k;
      else if (name === "foot length") f.foot.length = k;
      else f.foot.breadth = k;
    };
    const bones = buryanov(await fs.readFile(path.join(root, "packages/human/docs/sources/buryanov-2010-hand-segments.md"), "utf8"));
    const rows: Record<string, string> = { index: "II", middle: "III", ring: "IV", pinky: "V", thumb: "I" };
    const cvsOf = (finger: string): number[] => {
      const b = bones[rows[finger]!]!;
      return finger === "thumb" ? [b.metacarpal[1] / b.metacarpal[0], b.proximal[1] / b.proximal[0], Math.hypot(b.distal[1], b.tip[1]) / (b.distal[0] + b.tip[0])] : [b.proximal[1] / b.proximal[0], b.middle![1] / b.middle![0], Math.hypot(b.distal[1], b.tip[1]) / (b.distal[0] + b.tip[0])];
    };
    const cases: { name: string; fields: IExtremityFields; region: string[] | null }[] = [];
    for (const x of fields) {
      const alone: number = END_DEVIATE * x.cv * Math.sqrt(1 - Math.max(...x.neighbours.map((n: string): number => rho(x.measure, n))) ** 2);
      for (const sign of [-1, 1]) {
        const f: IExtremityFields = F1_EXTREMITIES();
        set(f, x.name, 1 + sign * alone);
        cases.push({ name: `${x.name} alone ${sign > 0 ? "+" : "-"}`, fields: f, region: x.region });
      }
    }
    for (const finger of Object.keys(rows))
      for (const sign of [-1, 1]) {
        const f: IExtremityFields = F1_EXTREMITIES();
        f.phalanges[finger] = cvsOf(finger).map((c: number): number => 1 + sign * END_DEVIATE * c) as [number, number, number];
        cases.push({ name: `${finger}'s bones ${sign > 0 ? "+" : "-"}`, fields: f, region: [`finger.${finger}`] });
      }
    for (const sign of [-1, 1]) {
      const f: IExtremityFields = F1_EXTREMITIES();
      for (const x of fields) set(f, x.name, 1 + sign * END_DEVIATE * x.cv);
      for (const finger of Object.keys(rows)) f.phalanges[finger] = cvsOf(finger).map((c: number): number => 1 + sign * END_DEVIATE * c) as [number, number, number];
      cases.push({ name: `every field at its ${sign > 0 ? "95th" : "5th"}`, fields: f, region: null });
    }

    // (1) The detector on every extremity wall.
    const f1x = extremityAt(F1_EXTREMITIES(), armToMm);
    const ankle: number = joints(AutoMovieHumanF1.BODY.leg)[2]!;
    const stretch = (fam: Family): [number, number] => (fam.name === "leg" ? [ankle, fam.tips?.[1]?.from ?? 975] : [fam.knots[0]!, (fam.tips?.[1]?.from ?? tipStation(fam)) - 1]);
    const walls = (x: ReturnType<typeof extremityAt>): Family[] => [x.hand, x.leg, ...x.digits.map((d) => d.family)];
    const f1Forms: Map<string, IForm> = new Map(walls(f1x).map((fam: Family): [string, IForm] => [fam.name, lineForm(fam, ...stretch(fam), (s: number): number => s)]));
    if (detector) lines.push("(1) THE FORM DETECTOR on every extremity wall (the lobe runs of `lobeRule`; the leg from the ankle on):");
    const tally: Record<string, number> = {};
    for (const c of detector ? cases : []) {
      const x = extremityAt(c.fields, armToMm);
      const found: string[] = [];
      for (const fam of walls(x)) {
        const own: Family = walls(f1x).find((g: Family): boolean => g.name === fam.name)!;
        const [J1, J2] = [joints(own), joints(fam)];
        const [from, to] = stretch(own);
        const caseForm: IForm = lineForm(fam, carry(from, J1, J2), carry(to, J1, J2), (s: number): number => carry(s, J2, J1));
        const changes = lobeRule(f1Forms.get(fam.name)!, caseForm, (_d: string, s: number): number => x.ratio(fam.name, carry(s, J1, J2)), (): string => "+u");
        for (const ch of changes) {
          const cause: string = c.region !== null && c.region.some((r: string): boolean => fam.name === r || fam.name.startsWith(r + ".")) ? "(C)" : "other";
          tally[cause] = (tally[cause] ?? 0) + 1;
          found.push(`${cause} ${fam.name} ${ch.kind} ${ch.line}@${ch.station}: ${ch.detail}`);
        }
      }
      lines.push(`  ${c.name}: ${found.length === 0 ? "form kept" : `${found.length} changes`}`, ...found.map((s: string): string => `    ${s}`));
    }
    if (detector) lines.push(`  by cause: ${Object.entries(tally).map(([k, n]): string => `${k} ${n}`).join("; ") || "none"}`, "");
    progress("(1) the detector");

    // (2) The realizations.
    const declared = AutoMovieHumanF1.construction();
    const findNode = (node: IAutoMovieConstructionNode, name: string): IAutoMovieConstructionNode | null => {
      if (node.name === name) return node;
      const n = node as { host?: IAutoMovieConstructionNode; part?: IAutoMovieConstructionNode; children?: { part: IAutoMovieConstructionNode }[] };
      for (const child of [n.host, n.part, ...(n.children ?? []).map((k): IAutoMovieConstructionNode => k.part)]) {
        if (child === undefined) continue;
        const hit: IAutoMovieConstructionNode | null = findNode(child, name);
        if (hit !== null) return hit;
      }
      return null;
    };
    const wristNode: IAutoMovieConstructionNode = findNode(declared.root, "wrist.arm")!;
    const footNode: IAutoMovieConstructionNode = findNode(declared.root, "fan.leg")!;
    // Each case's subtree as `extremityDeclaration` declares it at the person: the fans' knots scaled with their chords, the thumb's root
    // and fair with the thumb (the corrected law).
    const realize = (x: ReturnType<typeof extremityAt>, node: IAutoMovieConstructionNode, which: "arm" | "leg") => {
      const declaration = extremityDeclaration(x, f1x, x.fields, extremityFlags(source));
      const root: IAutoMovieConstructionNode = node.name === "wrist.arm" ? declaration.wrist(false) : declaration.fan(which, false);
      return realizeAutoMovieConstruction({ name: `f1.${which}`, root, fills: [] }, { chord: 0.001, sources: declaration.sources });
    };
    NodeCanvasRaster.initialize();
    const shown: string[] = ["every field at its 5th", "every field at its 95th", "hand length alone -", "hand length alone +", "foot length alone -", "foot length alone +", "thumb's bones -", "thumb's bones +", "index's bones -", "index's bones +", "pinky's bones -", "pinky's bones +"];
    const colourOf = (owner: string): [number, number, number] => {
      if (owner === "arm") return [0.55, 0.62, 0.72];
      if (owner === "hand" || owner === "leg") return [0.72, 0.72, 0.72];
      if (owner.startsWith("band.")) return [0.93, 0.56, 0.24];
      if (owner.startsWith("web.") || owner.startsWith("fill")) return [0.85, 0.3, 0.7];
      const h: number = [...owner].reduce((t: number, ch: string): number => (t * 31 + ch.charCodeAt(0)) % 997, 7);
      return [0.35 + ((h * 13) % 50) / 100, 0.35 + ((h * 29) % 50) / 100, 0.35 + ((h * 41) % 50) / 100];
    };
    const views = (x: ReturnType<typeof extremityAt>, which: "arm" | "leg"): { focus: V3; radius: number; up: V3; views: [string, V3][] } => {
      if (which === "arm") {
        const [hand, m1, index, pinky, tip] = [x.point("hand"), x.point("middle1"), x.point("index1"), x.point("pinky1"), x.point("middleEnd")];
        const along: V3 = unit3([m1[0] - hand[0], m1[1] - hand[1], m1[2] - hand[2]]);
        const palmar: V3 = square3([tip[0] - m1[0], tip[1] - m1[1], tip[2] - m1[2]], along);
        const radial: V3 = unit3([index[0] - pinky[0], index[1] - pinky[1], index[2] - pinky[2]]);
        return { focus: m1, radius: 140, up: along, views: [["dorsal", [-palmar[0], -palmar[1], -palmar[2]]], ["palmar", palmar], ["radial", radial]] };
      }
      const [foot, ball, big, little] = [x.point("foot"), x.point("footBall"), x.point("bigtoe1"), x.point("littletoe1")];
      const down: V3 = unit3(x.direction("leg.fan.up"));
      const along: V3 = square3([ball[0] - foot[0], ball[1] - foot[1], ball[2] - foot[2]], down);
      return { focus: ball, radius: 190, up: along, views: [["top", [-down[0], -down[1], -down[2]]], ["medial", square3([big[0] - little[0], big[1] - little[1], big[2] - little[2]], down)], ["sole", down]] };
    };
    const meshes = (real: ReturnType<typeof realizeAutoMovieConstruction>, focus: V3, radius: number): { clay: N.Mesh[]; owned: N.Mesh[] } => {
      const mesh = real.mesh;
      if (mesh === null) return { clay: [], owned: [] };
      const ownerOf = (v: number): string => mesh.owners[mesh.coordinates[v * 3]!]!;
      const groups: Map<string, { positions: number[]; indices: number[]; remap: Map<number, number> }> = new Map();
      const all: { positions: number[]; indices: number[]; remap: Map<number, number> } = { positions: [], indices: [], remap: new Map() };
      const near = (v: number): boolean => Math.hypot(mesh.positions[3 * v]! * 1000 - focus[0], mesh.positions[3 * v + 1]! * 1000 - focus[1], mesh.positions[3 * v + 2]! * 1000 - focus[2]) <= radius;
      const push = (g: { positions: number[]; indices: number[]; remap: Map<number, number> }, v: number): void => {
        let j: number | undefined = g.remap.get(v);
        if (j === undefined) {
          j = g.positions.length / 3;
          g.remap.set(v, j);
          g.positions.push(mesh.positions[3 * v]!, mesh.positions[3 * v + 1]!, mesh.positions[3 * v + 2]!);
        }
        g.indices.push(j);
      };
      for (let t: number = 0; t < mesh.indices.length / 3; ++t) {
        const tri: number[] = [mesh.indices[3 * t]!, mesh.indices[3 * t + 1]!, mesh.indices[3 * t + 2]!];
        if (!tri.every(near)) continue;
        const names: string[] = tri.map(ownerOf);
        const owner: string = names[0] === names[1] || names[0] === names[2] ? names[0]! : names[1]!;
        let g = groups.get(owner);
        if (g === undefined) groups.set(owner, (g = { positions: [], indices: [], remap: new Map() }));
        for (const v of tri) {
          push(g, v);
          push(all, v);
        }
      }
      return { clay: [{ id: "clay", positions: all.positions, indices: all.indices, colour: [0.64, 0.65, 0.67] }], owned: [...groups.entries()].map(([k, g]): N.Mesh => ({ id: k, positions: g.positions, indices: g.indices, colour: colourOf(k) })) };
    };
    const chosen: string[] = shown.slice(part[0], part[0] + part[1]);
    if (chosen.length > 0) lines.push(`(2) THE REALIZATIONS, cases ${part[0] + 1} to ${part[0] + chosen.length} of ${shown.length} (the arm's \`wrist.arm\` subtree and the leg's \`fan.leg\`; diagnostics must be none):`);
    const f1Real = chosen.length === 0 ? null : { arm: realize(f1x, wristNode, "arm"), leg: realize(f1x, footNode, "leg") };
    if (f1Real !== null) {
      progress("f1 realized");
      lines.push(`  f1: arm ${f1Real.arm.diagnostics.length} diagnostics${f1Real.arm.diagnostics.map((d): string => `; ${d.node} (${d.contract}): ${d.detail.slice(0, 160)}`).join("")}; leg ${f1Real.leg.diagnostics.length}${f1Real.leg.diagnostics.map((d): string => `; ${d.node} (${d.contract}): ${d.detail.slice(0, 160)}`).join("")}`);
    }
    for (const name of chosen) {
      const c = cases.find((k): boolean => k.name === name)!;
      const x = extremityAt(c.fields, armToMm);
      for (const which of ["arm", "leg"] as const) {
        const touches: boolean = c.region === null || c.region.some((r: string): boolean => (which === "arm" ? r === "hand" || r.startsWith("finger") : r === "leg" || r.startsWith("toe")));
        if (!touches) continue;
        const real = realize(x, which === "arm" ? wristNode : footNode, which);
        progress(`${name}: ${which} realized`);
        lines.push(`  ${name} | ${which === "arm" ? "hand" : "foot"}: ${real.diagnostics.length} diagnostics${real.diagnostics.map((d): string => `; ${d.node} (${d.contract}): ${d.detail.slice(0, 200)}`).join("")}`);
        const look = views(x, which);
        const lookF1 = views(f1x, which);
        const caseMeshes = meshes(real, look.focus, look.radius);
        const f1Meshes = meshes(f1Real![which], lookF1.focus, lookF1.radius);
        const points: N.Point[] = [...caseMeshes.clay, ...f1Meshes.clay].flatMap((m: N.Mesh): N.Point[] => Array.from({ length: m.positions.length / 3 }, (_: unknown, i: number): N.Point => [m.positions[3 * i]!, m.positions[3 * i + 1]!, m.positions[3 * i + 2]!]));
        if (points.length === 0) continue;
        for (const [view, back] of look.views) {
          const camera: N.Camera = facingCamera(view, back, look.up, points, 900, 900);
          for (const [shade, pick] of [["clay", "clay"], ["owners", "owned"]] as [string, "clay" | "owned"][])
            for (const [who, ms] of [["case", caseMeshes[pick]], ["f1", f1Meshes[pick]]] as [string, N.Mesh[]][]) {
              const file: string = path.join(out, `${which === "arm" ? "hand" : "foot"}.${fileName(name)}.${view}.${shade}.${who}.png`);
              await fs.writeFile(file, NodeCanvasRaster.render(camera, ms, [], "depth", `f1 ${which === "arm" ? "hand" : "foot"} by law | ${who === "f1" ? "f1 (the law at f1's fields)" : name} | ${view} | ${shade}`).png);
              lines.push(`    ${file}`);
            }
        }
      }
    }
    await fs.writeFile(path.join(out, detector ? "acceptance.detector.txt" : `acceptance.realize-${part[0] + 1}-${part[0] + chosen.length}.txt`), lines.join("\n") + "\n");
    process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
  }

  export async function main(): Promise<void> {
    if (process.argv[2] === "extremity-acceptance") return extremityAcceptance();
    if (process.argv[2] === "extremity-premises") return extremityPremises();
    if (process.argv[2] === "extremities") return extremities();
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
      const lengths: Record<string, number> = Object.fromEntries(limb.lengths.map((l): [string, number] => [l.segment, Math.hypot(...T.CHAIN.find((j: IAutoMovieHumanSegmentJoint): boolean => j.name === l.joint)!.offset)]));
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
