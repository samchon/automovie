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
   * 1,500 px over about 1.75 m, 1.2 mm a pixel); a smaller lobe is not read at the figure's scale.
   */
  const LOBE_MM: number = 1;

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

  /** The law: a limb's family at a person's fields. `linear` draws the depth profile straight between anchors (the first run's profile). */
  function law(limb: ILimb, fields: IFields, f1Sites: ISite[], linear: boolean = false): Family {
    const family: Family = limb.family;
    const J: number[] = joints(family);
    const frames: Map<string, SF.IFrame> = SF.world(chainWith(fields.lengths, limb), (): undefined => undefined);
    const centres: V3[] = T.COURSES[family.name]!.map((n: string): V3 => pointUnder(frames, n));
    const moved: Family = { ...family, centres, reliefs: [] };
    const J2: number[] = joints(moved);
    const ratio = (direction: string, s: number): number => {
      const anchors: [number, number][] = [[limb.held, 1] as [number, number], ...f1Sites.filter((x: ISite): boolean => x.station !== null).map((x: ISite): [number, number] => [x.station!, fields.depths[x.name]?.[direction] ?? 1])].sort((a, b): number => a[0] - b[0]);
      if (s <= anchors[0]![0]) return 1;
      for (let k: number = 1; k < anchors.length; ++k)
        if (s <= anchors[k]![0]) {
          const x: number = (s - anchors[k - 1]![0]) / (anchors[k]![0] - anchors[k - 1]![0]);
          return anchors[k - 1]![1] + (linear ? x : smooth(x)) * (anchors[k]![1] - anchors[k - 1]![1]);
        }
      return anchors.at(-1)![1];
    };
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
  }

  /**
   * The inflections of a profile that bound a lobe of at least `LOBE_MM` off its chord: every sign change of its second difference, then
   * the lobe of least sagitta under the bound merged away (an end lobe by dropping its inner inflection, an inner lobe by dropping both of
   * its inflections, an S pair that a ripple drew) until every lobe left stands at least `LOBE_MM` off its chord.
   */
  function significant(profile: number[], at: number[]): number[] {
    const marks: number[] = [];
    let sign: number = 0;
    for (let i: number = 1; i + 1 < profile.length; ++i) {
      const bend: number = profile[i + 1]! - 2 * profile[i]! + profile[i - 1]!;
      if (bend === 0) continue;
      const now: number = Math.sign(bend);
      if (sign !== 0 && now !== sign) marks.push(i);
      sign = now;
    }
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
      if (which === 0) marks.splice(0, 1);
      else if (which === ends.length - 2) marks.splice(marks.length - 1, 1);
      else marks.splice(which - 1, 2);
    }
    return marks.map((i: number): number => at[i]!);
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
    for (const r of reaches(family.layout)) {
      const at: number[] = [];
      const profile: number[] = [];
      for (let s: number = start; s <= end - 1; s += STEP_MM) {
        at.push(s);
        profile.push(Math.abs(read(s)[r.field]!));
      }
      lines[r.direction] = { at, profile };
      for (const s of significant(profile, at)) inflections.push({ line: r.direction, station: back(s) });
    }
    // Each belly: maxima of its line over its run that rise `LOBE_MM` above the lower of the two flanks between them and the run's ends.
    const bellies: Record<string, number> = {};
    for (const belly of limb.bellies) {
      const line = lines[belly.direction]!;
      const values: number[] = line.profile.filter((_: number, i: number): boolean => line.at[i]! >= J[belly.run]! && line.at[i]! <= J[belly.run + 1]!);
      let count: number = 0;
      for (let i: number = 1; i + 1 < values.length; ++i) {
        if (!(values[i]! > values[i - 1]! && values[i]! >= values[i + 1]!)) continue;
        let left: number = values[i]!, right: number = values[i]!;
        for (let l: number = i - 1; l >= 0 && values[l]! <= values[i]!; --l) left = Math.min(left, values[l]!);
        for (let rr: number = i + 1; rr < values.length && values[rr]! <= values[i]!; ++rr) right = Math.min(right, values[rr]!);
        if (values[i]! - Math.max(left, right) >= LOBE_MM) ++count;
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
    return { refused, native, inflections, bellies, girths, order };
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

  export async function main(): Promise<void> {
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
      const cases: { name: string; fields: IFields }[] = [];
      for (const l of limb.lengths) for (const [label, k] of [["5th", LENGTH_ENDS[l.segment]![0]], ["95th", LENGTH_ENDS[l.segment]![1]]] as [string, number][]) cases.push({ name: `${l.segment} length ${label} (x${k.toFixed(3)})`, fields: { lengths: { [l.segment]: k }, depths: {} } });
      for (const site of f1Sites) for (const sign of [-1, 1]) cases.push({ name: `${site.name} depth ${sign > 0 ? "+" : "-"}${DEPTH_STEP * 100}%`, fields: { lengths: {}, depths: { [site.name]: { "+u": 1 + sign * DEPTH_STEP, "+v": 1 + sign * DEPTH_STEP, "-u": 1 + sign * DEPTH_STEP, "-v": 1 + sign * DEPTH_STEP } } } });
      for (const sign of [-1, 1]) cases.push({ name: `every site ${sign > 0 ? "+" : "-"}${DEPTH_STEP * 100}%`, fields: { lengths: {}, depths: Object.fromEntries(f1Sites.map((x: ISite): [string, Record<string, number>] => [x.name, { "+u": 1 + sign * DEPTH_STEP, "+v": 1 + sign * DEPTH_STEP, "-u": 1 + sign * DEPTH_STEP, "-v": 1 + sign * DEPTH_STEP }])) } });
      for (const [label, endIndex] of [["5th", 0], ["95th", 1]] as [string, 0 | 1][]) cases.push({ name: `every length ${label}`, fields: { lengths: Object.fromEntries(limb.lengths.map((l): [string, number] => [l.segment, LENGTH_ENDS[l.segment]![endIndex]])), depths: {} } });
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
