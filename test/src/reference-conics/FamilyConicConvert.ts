import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { AutoMovieLoftChain, AutoMovieViewChain as Q, type AutoMovieViewLoft, type IAutoMovieViewPart, realizeAutoMovieConstruction } from "@automovie/engine";
import type { AutoMovieConstructionNode } from "@automovie/interface";
import { AutoMovieHumanConicLoft as H, AutoMovieHumanConicSection as S } from "@automovie/human";
import { FamilyConicFair as F } from "./FamilyConicFair";
import { FamilyConicLayout as L } from "./FamilyConicLayout";
import { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/**
 * The one-shot conversion of a part's sections to a conic family (#3401, #3412 stage 1): source section, fair, convert, layout from the
 * groove count, map arcs to anchors, smooth along stations, loft alone, clay frames beside the reference.
 *
 * - Fair: each section's radius about its course point by the periodic smoothing spline (`FamilyConicFair`) at the region's own cutoff,
 *   the narrowest feature its source keeps (`cutoff`).
 * - Convert: the recovery converter (`approximateAutoMovieRecoveryConicsAhn`, contract `AutoMovieRecoveryConicApproximation`), unchanged,
 *   broken at the faired inflections and at an invented closure's ends.
 * - Layout: the grooves (maximal runs of inward skin arcs) per station, each tracked along the stations as a line; the source's own hollows
 *   under its hull deeper than the tolerance are each matched to a groove or named as dropped with their depth (`account`).
 * - Map, smooth, loft, frames, admission (`loft`): the limb layout with one feature run per groove line (`FamilyConicLayout`), each field the
 *   linear least-squares natural cubic on shared knots, lofted alone through the engine, rendered in clay beside the reference in four
 *   views, and admitted every 0.25 mm between stations with its values rounded as stored.
 *
 * A region entry (`FamilyConicConvert<Region>.ts`) reads its sections in their course's chart and hands them over; this file holds no
 * region. Output goes to `test/.shots/family-conic-convert/<time>/`: `<part>.convert.txt` and `.json`, and the loft's frames and
 * `<part>.family.json`.
 */
export namespace FamilyConicConvert {
  /** One source section in its course's chart, mm, the course point at the origin. */
  export interface ISection {
    /** Its station along the course, mm. */
    s: number;

    /** Its points, counter-clockwise about the course. */
    points: C.P[];

    /** Where an invented closure leaves and rejoins the skin, phases about the course, radians, counter-clockwise from the first. */
    closure?: [number, number];

    /** Several invented closures, each as `closure`: a trunk loop closed across both arm cuts. */
    closures?: [number, number][];
  }

  /** One station converted at one tolerance. */
  export interface IStation {
    /** Its station along the course, mm, as the section gives it. */
    s: number;

    /** The converter's sampled tolerance it was converted at, mm. */
    toleranceMm: number;

    /** The converter's status: complete, partial or refused (`AutoMovieRecoveryConicApproximation.IResult`). */
    status: string;

    /** The converter's largest sampled error against the faired section, mm. */
    errorMm: number;

    /** Arcs on skin. */
    skin: number;

    /** Arcs on the invented closure. */
    closure: number;

    /** Skin arcs that bend inward, toward the course. */
    inward: number;

    /** The grooves of at least `FamilyConicSection.FEATURE_LEAST` turn: the layout's grooves. */
    grooves: F.IGroove[];

    /** The grooves of less turn, kept apart as the ripple the fairing left. */
    faint: F.IGroove[];

    /** The faired radius's largest departure from the source's over 720 rays, mm. */
    fairMaxMm: number;

    /** The faired radius's mean departure from the source's over 720 rays, mm. */
    fairMeanMm: number;

    /** Rays from the course, of 720, that meet the source more than once: zero for a star-shaped section. */
    folds: number;

    /** The source's girth, mm. */
    girthMm: number;

    /** The closure guard (`FamilyConicFair.IConversion.closureGuardMm`), mm: how far the closure pulls the skin beside it. */
    closureGuardMm: number;

    /** The converter's distinct diagnostics, numbers written as `#`. */
    diagnostics: string[];

    /** The converted arcs in phase order. */
    arcs: F.IArc[];

    /** The source's own hollows under its convex hull deeper than the tolerance, measured before fairing (`hollows`). */
    hollows: IHollow[];

    /** Crest candidates: where the faired section stands outside the section faired at twice the cutoff, deeper than the tolerance (umps). */
    bumps: IHollow[];
  }

  /** A hollow of the source section under its convex hull (the tape), read along the rays from the course. */
  export interface IHollow {
    /** Phase of its deepest point, radians. */
    middle: number;

    /** Its depth at its deepest point, mm along the ray from the course to the hull. */
    depthMm: number;

    /** Its width where it is deeper than the threshold, mm along the hull. */
    widthMm: number;

    /**
     * Its full width at half its own depth, mm along the hull: a measure of its form that does not shrink with its depth, as the width over a
     * fixed threshold does (a dip of 0.31 mm is over 0.25 mm for under a third of its width). A dip shaped as one cosine period is twice
     * this wide from rim to rim, its wavelength.
     */
    halfMm: number;

    /** The faired section's depth under the same hull at the same phase, mm: what the fairing keeps of it. */
    fairedMm: number;
  }

  /** A run of stations with one value. */
  export interface IRun {
    /** The value the run holds, as text. */
    value: string;

    /** Its first station, mm. */
    from: number;

    /** Its last station, mm. */
    to: number;

    /** How many stations it holds. */
    stations: number;
  }

  /** One feature followed along the stations. */
  export interface ILine {
    /** Its number, in the order lines were first seen. */
    id: number;

    /** The stations it is seen at, mm, in order. */
    stations: number[];

    /** Its middle's phase at each, radians. */
    phases: number[];

    /** Its first measure at each: a groove's turn in radians, a hollow's width in mm. */
    turns: number[];

    /** Its depth at each, mm. */
    depths: number[];

    /** At each of its stations, the index of its feature in that station's list. */
    items: number[];
  }

  /** The tolerance ladder of #3401, mm. */
  export const LADDER: number[] = [0.2, 0.5, 1.0, 2.0];

  /** The tolerance the layout is read at: `FamilyConicSection.converted`'s own, mm. */
  export const LAYOUT_TOLERANCE_MM: number = 0.25;

  /**
   * How far a feature's middle may move between neighbouring stations and still be the same line, radians of phase: 12 degrees, about a
   * third of the narrowest spacing between features seen from their courses (the nose's alar creases and hand's late valleys, 35 to 40
   * degrees apart).
   */
  export const TRACK: number = (12 * Math.PI) / 180;

  /** The least run of neighbouring stations over which a feature is the form's, not one cut's: #3401's acceptance run. */
  export const RUN: number = 3;

  /** Station spacing of a loft's knots, mm: four 1 mm stations or more an interval, so the least-squares cubic averages over each. */
  export const KNOT_MM: number = 4;

  /** Step between stations at which a loft is admitted, mm (#3412, Admission). */
  export const ADMIT_STEP_MM: number = 0.25;

  /** Meeting margins of #3412's admission: 0.1 of the chord for a fitted family, 0.02 for constructed values (`FamilyConicFit`). */
  export const MARGIN: { fitted: number; constructed: number } = { fitted: 0.1, constructed: 0.02 };

  const degrees = (x: number): number => (x * 180) / Math.PI;
  const wrap = (x: number): number => ((x % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const centre = (g: F.IGroove): number => wrap(g.from + wrap(g.to - g.from) / 2);
  const gap = (a: number, b: number): number => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  const f2 = (x: number): string => x.toFixed(2);
  const median = (xs: readonly number[]): number => {
    const s: number[] = [...xs].sort((a: number, b: number): number => a - b);
    return s.length % 2 === 1 ? s[(s.length - 1) / 2]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2;
  };

  /** Rays from the course that meet the section more than once, of 720. */
  export function folds(points: readonly C.P[]): number {
    const count: { count: number } = { count: 0 };
    for (let k: number = 0; k < 720; ++k) F.radius(points, (2 * Math.PI * k) / 720, count);
    return count.count;
  }

  /** The source's hollows under its hull over 720 rays, each a run of rays deeper than `least`; the faired depth where `faired` is given. */
  export function hollows(points: readonly C.P[], least: number, faired?: (phi: number) => number): IHollow[] {
    const M: number = 720;
    const hull: C.P[] = R.hull(points);
    const rows = Array.from({ length: M }, (_: unknown, k: number) => {
      const phi: number = (2 * Math.PI * k) / M;
      const top: number = F.radius(hull, phi);
      return { phi, top, depth: top - F.radius(points, phi), faired: faired === undefined ? NaN : top - faired(phi) };
    });
    const start: number = rows.findIndex((r): boolean => !(r.depth > least));
    if (start < 0) return [];
    const out: IHollow[] = [];
    for (let m: number = 1; m <= M; ++m) {
      const k: number = (start + m) % M;
      if (!(rows[k]!.depth > least) || rows[(k - 1 + M) % M]!.depth > least) continue;
      let deepest: number = k, width: number = 0;
      for (let j: number = k; rows[j % M]!.depth > least && width < 1e6; ++j) {
        const r = rows[j % M]!;
        width += (r.top * 2 * Math.PI) / M;
        if (r.depth > rows[deepest]!.depth) deepest = j % M;
      }
      const best = rows[deepest]!;
      // The width at half its own depth, both ways from its deepest ray.
      let half: number = (best.top * 2 * Math.PI) / M;
      for (const step of [1, -1])
        for (let j: number = deepest + step, n: number = 0; n < M && rows[((j % M) + M) % M]!.depth > best.depth / 2; j += step, ++n) half += (rows[((j % M) + M) % M]!.top * 2 * Math.PI) / M;
      out.push({ middle: best.phi, depthMm: best.depth, widthMm: width, halfMm: half, fairedMm: best.faired });
    }
    return out.sort((a: IHollow, b: IHollow): number => a.middle - b.middle);
  }

  /**
   * The faired section's crests at the form's scale: each run of phases where it stands outside the same section faired at twice the cutoff
   * (one octave coarser) by more than `least`, the convex counterpart of a hollow under the hull. Its middle is its highest phase, its depth
   * its height there, its widths along the coarse section, and `fairedMm` the same height.
   */
  export function bumps(fine: (phi: number) => number, coarse: (phi: number) => number, least: number): IHollow[] {
    const M: number = 720;
    const rows = Array.from({ length: M }, (_: unknown, k: number) => {
      const phi: number = (2 * Math.PI * k) / M;
      return { phi, top: coarse(phi), depth: fine(phi) - coarse(phi) };
    });
    const start: number = rows.findIndex((r): boolean => !(r.depth > least));
    if (start < 0) return [];
    const out: IHollow[] = [];
    for (let m: number = 1; m <= M; ++m) {
      const k: number = (start + m) % M;
      if (!(rows[k]!.depth > least) || rows[(k - 1 + M) % M]!.depth > least) continue;
      let deepest: number = k, width: number = 0;
      for (let j: number = k; rows[j % M]!.depth > least && width < 1e6; ++j) {
        width += (rows[j % M]!.top * 2 * Math.PI) / M;
        if (rows[j % M]!.depth > rows[deepest]!.depth) deepest = j % M;
      }
      const best = rows[deepest]!;
      let half: number = (best.top * 2 * Math.PI) / M;
      for (const step of [1, -1])
        for (let j: number = deepest + step, n: number = 0; n < M && rows[((j % M) + M) % M]!.depth > best.depth / 2; j += step, ++n) half += (rows[((j % M) + M) % M]!.top * 2 * Math.PI) / M;
      out.push({ middle: best.phi, depthMm: best.depth, widthMm: width, halfMm: half, fairedMm: best.depth });
    }
    return out.sort((a: IHollow, b: IHollow): number => a.middle - b.middle);
  }

  /**
   * The region's fairing cutoff, mm of girth, from its narrowest kept feature (lofting.md: "fair each section to the scale of the form, which
   * means removing the ripples smaller than the features the form keeps"). A kept feature is a source hollow deeper than the tolerance that
   * holds as a line over at least `RUN` neighbouring star-shaped stations (a hollow on one cut alone, or on a section the rays fold over, is
   * no feature of the wall). Its wavelength is twice the median of its widths at half depth along the line (`IHollow.halfMm`), the rim-to-rim
   * width of a dip one cosine period wide. The cutoff is the narrowest kept wavelength, on the trunk's basis (`FamilyConicFair.FAIR_MM`: "a
   * cutoff at the grooves' upper width"), so the narrowest kept hollow keeps half its amplitude and a ripple of half its wavelength a
   * seventeenth. A region with no kept feature takes `FamilyConicFair.FAIR_MM`.
   */
  export function cutoff(sections: readonly ISection[], toleranceMm: number): { fairMm: number; basis: string; kept: ILine[] } {
    const star: ISection[] = sections.filter((s: ISection): boolean => folds(s.points) === 0);
    const found: ILine[] = join(lines(star.map((s: ISection) => ({ s: s.s, items: hollows(s.points, toleranceMm).map((h: IHollow) => ({ phase: h.middle, turn: h.halfMm, depth: h.depthMm })) }))));
    const kept: ILine[] = found.filter((line: ILine): boolean => line.stations.length >= RUN);
    if (kept.length === 0) return { fairMm: F.FAIR_MM, basis: `no source hollow deeper than ${toleranceMm} mm holds over ${RUN} star-shaped stations; the trunk's ${F.FAIR_MM} mm`, kept };
    const narrowest: ILine = kept.reduce((a: ILine, b: ILine): ILine => (median(b.turns) < median(a.turns) ? b : a));
    const fairMm: number = Math.round(2 * median(narrowest.turns) * 10) / 10;
    const listed: string = kept.map((line: ILine): string => `${line.id}@${degrees(median(line.phases)).toFixed(0)}deg ${line.stations[0]}-${line.stations.at(-1)} half-width ${f2(median(line.turns))} depth ${f2(median(line.depths))}`).join("; ");
    return { fairMm, basis: `twice the half-depth width of the narrowest kept hollow, line ${narrowest.id} at ${degrees(median(narrowest.phases)).toFixed(0)} deg over ${narrowest.stations[0]}-${narrowest.stations.at(-1)} (${narrowest.stations.length} stations), median half-depth width ${f2(median(narrowest.turns))} mm, median depth ${f2(median(narrowest.depths))} mm; kept lines (${kept.length} of ${found.length}): ${listed}`, kept };
  }

  /** A section's invented closures: its list, or its one closure, or none. */
  export function closuresOf(section: ISection): [number, number][] {
    return section.closures ?? (section.closure === undefined ? [] : [section.closure]);
  }

  /** Convert one section at one tolerance and cutoff. */
  export function convert(section: ISection, toleranceMm: number, fairMm: number, measure: boolean = true): IStation {
    const got: F.IConversion = F.convert(section.points, { toleranceMm, fairMm, closures: closuresOf(section), guard: measure });
    const skin: F.IArc[] = got.arcs.filter((a: F.IArc): boolean => !a.closure);
    return {
      s: section.s,
      toleranceMm,
      status: got.status,
      errorMm: got.errorMm,
      skin: skin.length,
      closure: got.arcs.length - skin.length,
      inward: skin.filter((a: F.IArc): boolean => a.bend < 0).length,
      grooves: got.grooves.filter((g: F.IGroove): boolean => g.turn >= C.FEATURE_LEAST),
      faint: got.grooves.filter((g: F.IGroove): boolean => g.turn < C.FEATURE_LEAST),
      fairMaxMm: got.fairMaxMm,
      fairMeanMm: got.fairMeanMm,
      folds: got.folds,
      girthMm: got.girthMm,
      closureGuardMm: got.closureGuardMm,
      diagnostics: got.diagnostics,
      arcs: got.arcs,
      // The source's own measures, which no tolerance changes: read once, at the layout's.
      hollows: measure ? hollows(section.points, LAYOUT_TOLERANCE_MM, got.faired) : [],
      bumps: measure ? bumps(got.faired, F.curve(section.points, { fairMm: 2 * fairMm }).radius, LAYOUT_TOLERANCE_MM) : [],
    };
  }

  /** Runs of equal value along the stations. */
  export function runs(rows: readonly { s: number; value: string }[]): IRun[] {
    const out: IRun[] = [];
    for (const row of rows) {
      const last: IRun | undefined = out.at(-1);
      if (last !== undefined && last.value === row.value) {
        last.to = row.s;
        ++last.stations;
      } else out.push({ value: row.value, from: row.s, to: row.s, stations: 1 });
    }
    return out;
  }

  /**
   * Features followed along the stations: each matched to the nearest line seen at the station before, within `TRACK`, one to one.
   *
   * @param rows Per station, its features' phases and two measures each (a groove's turn and depth; a hollow's width and depth).
   */
  export function lines(rows: readonly { s: number; items: { phase: number; turn: number; depth: number }[] }[]): ILine[] {
    const all: ILine[] = [];
    let open: ILine[] = [];
    for (const row of rows) {
      const pairs: { line: ILine; k: number; d: number }[] = [];
      row.items.forEach((g, k: number): void => {
        for (const line of open) pairs.push({ line, k, d: gap(line.phases.at(-1)!, g.phase) });
      });
      pairs.sort((a, b): number => a.d - b.d);
      const used: Set<number> = new Set();
      const taken: Set<ILine> = new Set();
      for (const pair of pairs) {
        if (pair.d > TRACK || used.has(pair.k) || taken.has(pair.line)) continue;
        used.add(pair.k);
        taken.add(pair.line);
        const g = row.items[pair.k]!;
        pair.line.stations.push(row.s);
        pair.line.phases.push(g.phase);
        pair.line.turns.push(g.turn);
        pair.line.depths.push(g.depth);
        pair.line.items.push(pair.k);
      }
      row.items.forEach((g, k: number): void => {
        if (used.has(k)) return;
        const line: ILine = { id: all.length, stations: [row.s], phases: [g.phase], turns: [g.turn], depths: [g.depth], items: [k] };
        all.push(line);
        taken.add(line);
      });
      open = [...taken];
    }
    return all;
  }

  /**
   * Lines that are one feature fading and returning, joined: a line that starts after another has ended, within twice `TRACK` of its last
   * phase, continues it. f1's nose holds its right supra-alar hollow under the tolerance at 1,555.5 to 1,557.5 mm, and read as two lines the
   * short one stood on the long one's phases and their runs' features left their chord's order.
   */
  export function join(found: readonly ILine[]): ILine[] {
    const joined: ILine[] = [];
    for (const piece of [...found].sort((a: ILine, b: ILine): number => a.stations[0]! - b.stations[0]!)) {
      const before: ILine | undefined = joined.find((line: ILine): boolean => piece.stations[0]! > line.stations.at(-1)! && gap(line.phases.at(-1)!, piece.phases[0]!) <= 2 * TRACK);
      if (before === undefined) joined.push({ ...piece, stations: [...piece.stations], phases: [...piece.phases], turns: [...piece.turns], depths: [...piece.depths], items: [...piece.items] });
      else {
        before.stations.push(...piece.stations);
        before.phases.push(...piece.phases);
        before.turns.push(...piece.turns);
        before.depths.push(...piece.depths);
        before.items.push(...piece.items);
      }
    }
    return joined;
  }

  /**
   * Each source hollow deeper than the tolerance at a station, matched to the groove that holds it (its deepest phase inside the groove's
   * inflections, or its middle within `TRACK`), or named as dropped with its depth, width and what the fairing kept of it.
   */
  export function account(stations: readonly IStation[]): { kept: number; dropped: string[] } {
    let kept: number = 0;
    const dropped: string[] = [];
    for (const st of stations)
      for (const h of st.hollows) {
        const held: boolean = st.grooves.some((g: F.IGroove): boolean => wrap(h.middle - g.from) <= wrap(g.to - g.from) || gap(centre(g), h.middle) <= TRACK);
        if (held) ++kept;
        else dropped.push(`${st.s.toFixed(1)} ${degrees(h.middle).toFixed(0)}deg depth ${f2(h.depthMm)} width ${h.widthMm.toFixed(1)} faired ${f2(h.fairedMm)}${st.folds > 0 ? ` (rays fold ${st.folds}/720)` : ""}`);
      }
    return { kept, dropped };
  }

  /** The options of a region's run. */
  export interface IOptions {
    /** Tolerances besides the layout's to convert at. */
    ladder?: number[];

    /** A line for the table's head. */
    note?: string;

    /** The fairing cutoff, mm; absent, the region's own (`cutoff`). */
    fairMm?: number;

    /** The loft, when the region asks for one. */
    loft?: ICourse;
  }

  /** A region's course, as the Human package's family reads it (`AutoMovieHumanConicLoft.IFamily`), and its sections' stations on it. */
  export interface ICourse {
    /** The course's first end, joints and last end, mm (`AutoMovieViewAxis.jointed`). */
    centres: H.V3[];

    /** Each joint's half turn arclength, mm (`AutoMovieViewAxis.jointed`). */
    halves: number[];

    /** The chart's first axis at the first segment (`AutoMovieViewAxis.jointed`). */
    up: H.V3;

    /** A section's station on this course, from its own `s`. */
    station: (s: number) => number;

    /** The limb layout's median depth. */
    depth: number;

    /** The reference's vertices the frames are framed on, metres. */
    zone: (p: N.Point) => boolean;
  }

  /** Convert every section at the layout tolerance and the ladder, write the tables and the arcs, and loft when asked. */
  export async function report(name: string, sections: readonly ISection[], options: IOptions = {}): Promise<string> {
    const root: string = path.resolve(process.cwd(), "..");
    const out: string = path.join(root, "test/.shots/family-conic-convert", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const scale = options.fairMm === undefined ? cutoff(sections, LAYOUT_TOLERANCE_MM) : { fairMm: options.fairMm, basis: "given by the region", kept: [] as ILine[] };
    const fairMm: number = scale.fairMm;
    const tolerances: number[] = [LAYOUT_TOLERANCE_MM, ...(options.ladder ?? [])];
    const table: Map<number, IStation[]> = new Map(tolerances.map((t: number): [number, IStation[]] => [t, sections.map((s: ISection): IStation => convert(s, t, fairMm, t === LAYOUT_TOLERANCE_MM))]));
    // `FamilyConicSection.converted` at its own cutoff and tolerance, on a section with no closure: the same fairing and converter, so at
    // that cutoff its arc count must equal this file's at the layout tolerance.
    const check: string[] = sections.map((section: ISection, k: number): string => {
      if (closuresOf(section).length > 0 || fairMm !== F.FAIR_MM) return "-";
      try {
        const ends: number = C.converted(section.points).ends.length;
        return ends === table.get(LAYOUT_TOLERANCE_MM)![k]!.arcs.length ? "same" : "differs:" + ends;
      } catch (error: unknown) {
        return "threw:" + String(error instanceof Error ? error.message : error).slice(0, 40);
      }
    });
    const groovesOf = (st: IStation): string => st.grooves.map((g: F.IGroove): string => `${degrees(centre(g)).toFixed(0)}deg/${degrees(g.turn).toFixed(1)}deg/${f2(g.depthMm)}mm`).join(" ");
    const text: string[] = [`# ${name}: faired at ${fairMm} mm (periodic smoothing spline of the radius by phase), converted by approximateAutoMovieRecoveryConicsAhn`, `# fairing cutoff basis: ${scale.basis}`];
    if (options.note !== undefined) text.push("# " + options.note);
    text.push("", `## Stations at the layout tolerance ${LAYOUT_TOLERANCE_MM} mm`, "station  status    skin closure inward grooves faint  err-mm  fair-max fair-mean folds  converted  grooves(middle/turn/depth)");
    const layoutStations: IStation[] = table.get(LAYOUT_TOLERANCE_MM)!;
    layoutStations.forEach((st: IStation, k: number): void => {
      text.push([st.s.toFixed(1).padStart(7), st.status.padStart(9), String(st.skin).padStart(5), String(st.closure).padStart(7), String(st.inward).padStart(6), String(st.grooves.length).padStart(7), String(st.faint.length).padStart(5), st.errorMm.toFixed(3).padStart(7), f2(st.fairMaxMm).padStart(9), f2(st.fairMeanMm).padStart(9), String(st.folds).padStart(5), check[k]!.padStart(10), " " + groovesOf(st)].join(" "));
    });
    // The closure guard at the layout tolerance: the skin faired with its closures against the skin faired alone, within one cutoff of each
    // closure's edges on the skin's side.
    const guarded: IStation[] = layoutStations.filter((st: IStation): boolean => st.closureGuardMm > 0);
    if (guarded.length > 0) {
      const worst: IStation = guarded.reduce((x: IStation, y: IStation): IStation => (y.closureGuardMm > x.closureGuardMm ? y : x));
      text.push("", `## Closure guard: skin faired with its closures against the skin faired alone, within ${fairMm} mm of each closure edge: max ${worst.closureGuardMm.toFixed(3)} mm at ${worst.s}, median ${median(guarded.map((st: IStation): number => st.closureGuardMm)).toFixed(3)} mm over ${guarded.length} station(s); ${guarded.filter((st: IStation): boolean => st.closureGuardMm > LAYOUT_TOLERANCE_MM).length} over the layout tolerance ${LAYOUT_TOLERANCE_MM} mm`, guarded.map((st: IStation): string => `  ${st.s}:${st.closureGuardMm.toFixed(3)}`).join(""));
    }
    if ((options.ladder ?? []).length > 0) {
      text.push("", "## Tolerance ladder: skin arcs / inward arcs / grooves per station", "station  " + tolerances.map((t: number): string => (t + " mm").padStart(14)).join(""));
      sections.forEach((section: ISection, k: number): void => {
        text.push(section.s.toFixed(1).padStart(7) + "  " + tolerances.map((t: number): string => { const st: IStation = table.get(t)![k]!; return `${st.skin}/${st.inward}/${st.grooves.length}${st.status === "complete" ? "" : "p"}`.padStart(14); }).join(""));
      });
      text.push("(p: partial)");
    }
    for (const t of tolerances) {
      const st: IStation[] = table.get(t)!;
      text.push("", `## Runs at ${t} mm (value: from-to station, count)`);
      text.push("grooves:    " + runs(st.map((x: IStation) => ({ s: x.s, value: String(x.grooves.length) }))).map((r: IRun): string => `${r.value}:${r.from}-${r.to}(${r.stations})`).join("  "));
      text.push("skin arcs:  " + runs(st.map((x: IStation) => ({ s: x.s, value: String(x.skin) }))).map((r: IRun): string => `${r.value}:${r.from}-${r.to}(${r.stations})`).join("  "));
      text.push("inward:     " + runs(st.map((x: IStation) => ({ s: x.s, value: String(x.inward) }))).map((r: IRun): string => `${r.value}:${r.from}-${r.to}(${r.stations})`).join("  "));
    }
    const tracked: ILine[] = lines(layoutStations.map((st: IStation) => ({ s: st.s, items: st.grooves.map((g: F.IGroove) => ({ phase: centre(g), turn: g.turn, depth: g.depthMm })) })));
    const span = (xs: number[], f: (x: number) => number, d: number): string => `${f(Math.min(...xs)).toFixed(d)}..${f(Math.max(...xs)).toFixed(d)}`;
    const lineTable = (title: string, head: string, found: ILine[], first: (x: number) => number, d: number): void => {
      text.push("", title, head);
      for (const line of found)
        text.push([String(line.id).padStart(4), line.stations[0]!.toFixed(1).padStart(7), line.stations.at(-1)!.toFixed(1).padStart(7), String(line.stations.length).padStart(9), span(line.phases, degrees, 0).padStart(21), span(line.turns, first, d).padStart(19), span(line.depths, (x) => x, 2).padStart(19)].join("  "));
    };
    lineTable(`## Groove lines at ${LAYOUT_TOLERANCE_MM} mm, tracked within ${degrees(TRACK).toFixed(0)} deg between neighbouring stations`, "line  from     to       stations  middle-deg(min..max)  turn-deg(min..max)  depth-mm(min..max)", tracked, degrees, 1);
    text.push("", `## Source hollows under the convex hull, deeper than ${LAYOUT_TOLERANCE_MM} mm, per station (deepest-phase-deg/depth-mm/width-mm/half-depth-width-mm/faired-depth-mm)`);
    for (const st of layoutStations) text.push(st.s.toFixed(1).padStart(7) + "  " + st.hollows.map((h: IHollow): string => `${degrees(h.middle).toFixed(0)}/${f2(h.depthMm)}/${h.widthMm.toFixed(1)}/${h.halfMm.toFixed(1)}/${f2(h.fairedMm)}`).join("  "));
    text.push("", `## Crest candidates: the faired section above the section faired at ${2 * fairMm} mm by more than ${LAYOUT_TOLERANCE_MM} mm, per station (highest-phase-deg/height-mm/width-mm/half-height-width-mm)`);
    for (const st of layoutStations) if (st.bumps.length > 0) text.push(st.s.toFixed(1).padStart(7) + "  " + st.bumps.map((h: IHollow): string => `${degrees(h.middle).toFixed(0)}/${f2(h.depthMm)}/${h.widthMm.toFixed(1)}/${h.halfMm.toFixed(1)}`).join("  "));
    lineTable(`## Crest candidate lines, tracked within ${degrees(TRACK).toFixed(0)} deg`, "line  from     to       stations  middle-deg(min..max)  half-width-mm(min..max)  height-mm(min..max)", lines(layoutStations.map((st: IStation) => ({ s: st.s, items: st.bumps.map((h: IHollow) => ({ phase: h.middle, turn: h.halfMm, depth: h.depthMm })) }))), (x) => x, 1);
    const hollowLines: ILine[] = lines(layoutStations.map((st: IStation) => ({ s: st.s, items: st.hollows.map((h: IHollow) => ({ phase: h.middle, turn: h.widthMm, depth: h.depthMm })) })));
    lineTable(`## Source hollow lines, tracked within ${degrees(TRACK).toFixed(0)} deg`, "line  from     to       stations  middle-deg(min..max)  width-mm(min..max)  depth-mm(min..max)", hollowLines, (x) => x, 1);
    const ledger = account(layoutStations);
    text.push("", `## Source hollows deeper than ${LAYOUT_TOLERANCE_MM} mm: ${ledger.kept} held by a tracked groove, ${ledger.dropped.length} dropped`, ...ledger.dropped.map((d: string): string => "dropped " + d));
    const diagnostics: Set<string> = new Set(layoutStations.flatMap((x: IStation): string[] => x.diagnostics));
    if (diagnostics.size > 0) text.push("", "## Converter diagnostics at the layout tolerance (numbers as #)", ...[...diagnostics].slice(0, 12));
    const lofted: object = await loft(name, sections, layoutStations, options.loft, out, text, fairMm);
    await fs.writeFile(path.join(out, name + ".convert.txt"), text.join("\n") + "\n");
    await fs.writeFile(path.join(out, name + ".convert.json"), JSON.stringify({ name, fairMm, basis: scale.basis, tolerances, sections, stations: Object.fromEntries([...table].map(([t, st]) => [String(t), st])), lines: tracked, hollowLines, ledger, loft: lofted }));
    process.stdout.write(JSON.stringify({ event: "convert-complete", part: name, out, stations: sections.length }) + "\n");
    return out;
  }

  /**
   * Steps 4 to 7 on the region's longest run of star-shaped stations: the layout from its groove lines that hold over `RUN` stations
   * (shorter ones named as dropped), every station's fields read off its converted chain (`FamilyConicLayout.read`), the least-squares
   * natural cubic of each field on knots `KNOT_MM` apart, the family lofted alone through the engine (`AutoMovieHumanConicLoft.create`), its
   * sections measured against the source, rendered in clay beside the reference in four views, and admitted every `ADMIT_STEP_MM`.
   */
  async function loft(name: string, sections: readonly ISection[], stations: readonly IStation[], course: ICourse | undefined, out: string, text: string[], fairMm: number): Promise<object> {
    // The family's domain: the longest run of stations between the folds that end it (lofting.md, the method's limit: a section the rays fold
    // over is not a wall's). A run of folded sections ends the domain where it persists without a gap through to the source run's end, as
    // a parent opening into a split does (construction.md, Splits; f1's hand folds from 578 mm through 594 as its fingers part), or where its
    // widest overhang covers a quarter of the narrowest kept wavelength round the section (lofting.md: a form is resolved by samplings at
    // most a quarter of its roll), as a part folded over itself does (f1's nose's wing, up to 134 of 720 rays, 15 mm of its girth). A run
    // that does neither is a blip: f1's hand's single grazing rays at 560 and 562 mm, 0.3 mm of its 200 mm girth.
    const runsOfFolds: { from: number; to: number; ends: boolean; split: boolean }[] = [];
    for (let i: number = 0; i < stations.length; ) {
      if (stations[i]!.folds === 0) {
        ++i;
        continue;
      }
      let j: number = i;
      while (j + 1 < stations.length && stations[j + 1]!.folds > 0) ++j;
      const split: boolean = i === 0 || j === stations.length - 1;
      const overhang: boolean = stations.slice(i, j + 1).some((st: IStation): boolean => (st.folds / 720) * st.girthMm >= fairMm / 4);
      runsOfFolds.push({ from: i, to: j, ends: split || overhang, split });
      i = j + 1;
    }
    const ending = (i: number): boolean => runsOfFolds.some((r): boolean => r.ends && i >= r.from && i <= r.to);
    let best: [number, number] = [0, -1];
    for (let i: number = 0; i < stations.length; ) {
      if (ending(i)) {
        ++i;
        continue;
      }
      let j: number = i;
      while (j + 1 < stations.length && !ending(j + 1)) ++j;
      if (j - i > best[1] - best[0]) best = [i, j];
      i = j + 1;
    }
    // Whether each end of the domain opens into a split: the fold run beyond it persists to the source run's end.
    const splitBelow: boolean = runsOfFolds.some((r): boolean => r.split && r.ends && r.to === best[0] - 1);
    const splitAbove: boolean = runsOfFolds.some((r): boolean => r.split && r.ends && r.from === best[1] + 1);
    text.push(`fold runs (stations, ending the domain or a blip): ${runsOfFolds.map((r): string => `${stations[r.from]!.s}-${stations[r.to]!.s} ${r.split ? "to the source's end" : r.ends ? "overhang" : "blip"}`).join(", ") || "none"}`);
    const range: IStation[] = stations.slice(best[0], best[1] + 1);
    if (range.length === 0) {
      text.push("", `## Families: no star-shaped station among ${stations.length}; nothing to lay out`);
      return { families: [] };
    }
    text.push("", `## Families: stations ${range[0]!.s}-${range.at(-1)!.s} (${range.length}), the longest run of star-shaped stations; the family's domain ends at its last star-shaped station`);
    // The layout's lines are the source's own hollow lines over the range (deeper than the tolerance), not the faired grooves tracked
    // alone: a faired groove that doubles for a few stations split one source groove into two overlapping lines, and their runs' features
    // interleaved. A hollow line that resumes within RUN stations of where another ended, within twice `TRACK` of its phase, continues it.
    const pieces: ILine[] = lines(range.map((st: IStation) => ({ s: st.s, items: st.hollows.map((h: IHollow) => ({ phase: h.middle, turn: h.halfMm, depth: h.depthMm })) })));
    const joined: ILine[] = join(pieces);
    // Which hollow lines persist: a groove line is a longitudinal control curve that runs along the form (lofting.md, One section family),
    // so a hollow is kept as a line only where it runs along the course at least as far as its own wavelength, twice its median width at
    // half depth (`IHollow.halfMm`); a shorter one is a pit, named and left to the wall's fairing. The rule is the region's own scale, as
    // the fairing cutoff is (`cutoff`): on f1's hand short hollows split its runs fourteen times over 25 stations.
    const lineOf: L.ILine[] = [];
    const spans: [number, number][] = [];
    const named: string[] = [];
    const claimed: Set<string> = new Set();
    for (const line of [...joined].sort((a: ILine, b: ILine): number => b.stations.length - a.stations.length)) {
      const wavelength: number = 2 * median(line.turns);
      // Where the fairing keeps it: a hollow narrower than the cutoff is what the fairing removes by its own law (`cutoff`), so the line is
      // present only between its first and last stations whose wavelength reaches the cutoff. Below 1,559.5 mm f1's nose's side hollows are 5
      // to 9 mm across, the fairing left them 0.02 to 0.07 mm deep, and carried at that depth the engine refused their parallel tangents.
      // Carried over its whole source extent with its groove's floor held 0.25 mm deep instead, 11 of the nose's 31 reads were refused
      // (the arc from its first inflection to the held floor met behind its end): the groove cannot be deeper than the fairing drew it.
      const kept: number[] = line.stations.filter((_: number, k: number): boolean => 2 * line.turns[k]! >= fairMm);
      // A line that reaches the domain's end where the parent opens into a split is no short line: it runs on as a valley into the split's
      // seams (construction.md, Splits), so it is carried to the end and its run is not measured against its wavelength. On f1's hand two
      // dorsal valleys reaching 582 mm were dropped as running 10 and 8 mm against their wavelengths of 11.4 and 14.0 mm.
      const spacing: number = range.length > 1 ? Math.abs(range[1]!.s - range[0]!.s) : 0;
      const intoSplitAbove: boolean = splitAbove && line.stations.at(-1)! >= range.at(-1)!.s - spacing - 1e-9;
      const intoSplitBelow: boolean = splitBelow && line.stations[0]! <= range[0]!.s + spacing + 1e-9;
      const first: number = intoSplitBelow ? range[0]!.s : kept.length > 0 ? kept[0]! : line.stations[0]!;
      const last: number = intoSplitAbove ? range.at(-1)!.s : kept.length > 0 ? kept[kept.length - 1]! : line.stations.at(-1)!;
      const extent: number = intoSplitAbove || intoSplitBelow ? Infinity : kept.length === 0 ? 0 : Math.abs((course?.station ?? ((s: number): number => s))(last) - (course?.station ?? ((s: number): number => s))(first));
      // At each station, the groove that holds the line's hollow (its inflections round the hollow's phase, else its middle within TRACK),
      // each groove to one line, the longest lines first.
      const phases: ([number, number, number] | null)[] = range.map((st: IStation, i: number): [number, number, number] | null => {
        const k: number = line.stations.findIndex((s: number): boolean => Math.abs(s - st.s) < 1e-9);
        if (k < 0) return null;
        const phi: number = line.phases[k]!;
        const candidates: number[] = st.grooves.map((_: F.IGroove, g: number): number => g).filter((g: number): boolean => !claimed.has(i + ":" + g));
        const holding: number | undefined = candidates.find((g: number): boolean => wrap(phi - st.grooves[g]!.from) <= wrap(st.grooves[g]!.to - st.grooves[g]!.from)) ?? candidates.filter((g: number): boolean => gap(centre(st.grooves[g]!), phi) <= TRACK).sort((a: number, b: number): number => gap(centre(st.grooves[a]!), phi) - gap(centre(st.grooves[b]!), phi))[0];
        if (holding === undefined) return null;
        claimed.add(i + ":" + holding);
        const g: F.IGroove = st.grooves[holding]!;
        return [g.from, g.floor, g.to];
      });
      const seen: number = phases.filter((x): boolean => x !== null).length;
      if (extent >= wavelength && seen >= 2) {
        lineOf.push({ phases: phases.map((x, i: number): [number, number, number] | null => (range[i]!.s >= first - 1e-9 && range[i]!.s <= last + 1e-9 ? x : null)) });
        spans.push([range.findIndex((st: IStation): boolean => Math.abs(st.s - first) < 1e-9), range.findIndex((st: IStation): boolean => Math.abs(st.s - last) < 1e-9)]);
      } else {
        // A short line at a domain's end next to a part folded over itself (not a split) is the neighbouring family's (on f1's nose, the
        // wing's).
        const atEnd: string =
          line.stations[0]! <= range[0]!.s + wavelength && best[0] > 0 && !splitBelow ? "; at the domain's start, next to the folded sections below: the neighbouring family's"
          : line.stations.at(-1)! >= range.at(-1)!.s - wavelength && best[1] < stations.length - 1 && !splitAbove ? "; at the domain's end, next to the folded sections above: the neighbouring family's"
          : "";
        named.push(`dropped hollow line at ${degrees(median(line.phases)).toFixed(0)} deg over ${line.stations[0]}-${line.stations.at(-1)}: runs ${f2(extent)} mm along the course against its wavelength ${f2(wavelength)} mm, a groove at ${seen} station(s), depth ${span2(line.depths)} mm${atEnd}`);
      }
    }
    text.push(`groove lines from the source's hollow lines: ${lineOf.length} kept of ${joined.length} (${pieces.length} pieces)`, ...named);
    // Families: runs of stations with one set of present lines (#3401: "runs of equal count are families; a change of count is where a family
    // ends"). A kept line is present from its first station to its last, carried where its groove is not seen, so only a line's start or end
    // is a family boundary, never a dip of its depth.
    const keyAt = (i: number): string => spans.map(([a, b]): string => (i >= a && i <= b ? "1" : "0")).join("");
    const families: { from: number; to: number; key: string }[] = [];
    range.forEach((_: IStation, i: number): void => {
      const last = families.at(-1);
      if (last !== undefined && last.key === keyAt(i)) last.to = i;
      else families.push({ from: i, to: i, key: keyAt(i) });
    });
    text.push(`families by present groove lines (one digit a line), over the longest star-shaped run ${range[0]!.s}-${range.at(-1)!.s}: ${families.map((f): string => `${f.key || "-"}:${range[f.from]!.s}-${range[f.to]!.s}(${f.to - f.from + 1})`).join("  ")}`);
    if (course === undefined) return { families };
    // One family's steps 4 to 7: layout, read, smoothing, admission and the engine's loft.
    const build = async (tag: string, range: IStation[], lineOf: L.ILine[]): Promise<{ chain: AutoMovieViewLoft.IResult["chain"]; r0: number; r1: number; family: H.IFamily; summary: object }> => {
      text.push("", `### family ${tag}: stations ${range[0]!.s}-${range.at(-1)!.s} (${range.length}), ${lineOf.length} groove line(s)`);      // Where a kept line's groove is not seen, its phases between the nearest stations that see it, linearly in the station; past its ends, held.
      const held: [number, number, number][][] = lineOf.map((line: L.ILine): [number, number, number][] =>
        line.phases.map((x, i: number): [number, number, number] => {
          if (x !== null) return x;
          let p: number = i, n: number = i;
          while (p >= 0 && line.phases[p] === null) --p;
          while (n < line.phases.length && line.phases[n] === null) ++n;
          if (p < 0) return line.phases[n]!;
          if (n >= line.phases.length) return line.phases[p]!;
          const t: number = (range[i]!.s - range[p]!.s) / (range[n]!.s - range[p]!.s);
          const a: [number, number, number] = line.phases[p]!, b: [number, number, number] = line.phases[n]!;
          return [0, 1, 2].map((c: number): number => wrap(a[c]! + t * Math.atan2(Math.sin(b[c]! - a[c]!), Math.cos(b[c]! - a[c]!)))) as [number, number, number];
        }),
      );
      // Two runs whose phases overlap at a station would leave their features out of order on the chord: the shorter line (later in the
      // list, which runs longest first) is dropped and named.
      const overlap = (x: readonly number[], y: readonly number[]): boolean => wrap(y[0]! - x[0]!) <= wrap(x[2]! - x[0]!) || wrap(x[0]! - y[0]!) <= wrap(y[2]! - y[0]!);
      for (let b: number = held.length - 1; b >= 1; --b)
        for (let a: number = 0; a < b; ++a) {
          const at: number = held[b]!.findIndex((x, i: number): boolean => overlap(held[a]![i]!, x));
          if (at < 0) continue;
          text.push(`dropped groove line ${b}: its phases overlap line ${a}'s at ${range[at]!.s}`);
          held.splice(b, 1);
          lineOf.splice(b, 1);
          break;
        }
      text.push("kept lines' phases per station, deg (from/floor/to; * where not seen and carried):");
      range.forEach((st: IStation, i: number): void => {
        text.push(st.s.toFixed(1).padStart(7) + "  " + held.map((line, l: number): string => line[i]!.map((x: number): string => degrees(x).toFixed(0)).join("/") + (lineOf[l]!.phases[i] === null ? "*" : "")).join("  "));
      });
      const ends: [number, number, number, number][] = range.map((st: IStation): [number, number, number, number] => L.extremes(st.arcs));
      const plan = L.layout(course.depth, lineOf, ends);
      text.push(`extremes (u+, v+, u-, v-) deg, first and last station: ${ends[0]!.map((x: number): string => degrees(x).toFixed(0)).join(",")} / ${ends.at(-1)!.map((x: number): string => degrees(x).toFixed(0)).join(",")}`);
      text.push(`layout: limb(${course.depth}) with ${plan.runs.length} groove run(s) after base anchors ${plan.runs.map((r: S.IFeatureRun): number => r.after).join(",") || "-"}: ${plan.layout.anchors.length} anchors, ${S.units(plan.layout).length} fields; ${plan.outside.length} station(s) where a line leaves its quarter${plan.outside.length > 0 ? ": " + plan.outside.slice(0, 8).join(", ") : ""}`);
      // Every station's fields read off its own chain, and how far that layout chain lies from the converted chain.
      const rows: number[][] = [];
      let missed: number = 0;
      const readError: number[] = [];
      const faults: string[] = [];
      range.forEach((st: IStation, i: number): void => {
        const got: L.IReading = L.read(st.arcs, plan.layout, plan.order.map((line: number): [number, number, number] => held[line]![i]!));
        rows.push(got.values);
        missed += got.missed;
        const section = S.chain(got.values, plan.layout);
        if (section.fault !== null) faults.push(`${st.s}: ${section.fault.slice(0, 100)}; anchor phases deg ${S.resolve(got.values, plan.layout).input.points.map((p): string => degrees(wrap(Math.atan2(p[1]!, p[0]!))).toFixed(0)).join(",")}`);
        else readError.push(chainGap(section, st.arcs));
      });
      text.push(`read: ${readError.length} of ${range.length} stations' layout chains admitted, ${missed} median or shoulder crossings missed (read as the model's middle)${readError.length > 0 ? `; layout chain to converted chain max ${f2(Math.max(...readError))} mm, median ${f2(median(readError))} mm` : ""}`, ...faults.slice(0, 8).map((x: string): string => "read refused " + x));
      // Smoothing along the stations.
      const s0: number = course.station(range[0]!.s), s1: number = course.station(range.at(-1)!.s);
      const count: number = Math.max(2, Math.round((s1 - s0) / KNOT_MM) + 1);
      const knots: number[] = Array.from({ length: count }, (_: unknown, k: number): number => s0 + ((s1 - s0) * k) / (count - 1));
      const values: number[][] = L.smooth(range.map((st: IStation): number => course.station(st.s)), rows, knots);
      // Its phase pitch a quarter of the region's narrowest kept wavelength, the fairing cutoff (lofting.md: "An edge with a roll is resolved
      // only when every sampling across it ... is at most a quarter of the roll"), and no coarser than the bands' columns that join it: at a
      // quarter alone (2.6 mm) the nose's two long families were tessellated 2.4 mm round against their bands' 0.5 mm and read as fluting.
      const family: H.IFamily = { name: "convert." + tag, centres: course.centres, halves: course.halves, up: course.up, pitch: Math.min(fairMm / 4, girthOf(range) / JOIN.count), layout: plan.layout, knots, values: values.map((field: number[], f: number): number[] => field.map((y: number): number => (S.units(plan.layout)[f] === "mm" ? Math.round(y * 100) / 100 : Math.round(y * 1e4) / 1e4))) };
      await fs.writeFile(path.join(out, tag + ".family.json"), JSON.stringify(family));
      text.push(`smooth: ${knots.length} knots ${f2(knots[0]!)}..${f2(knots.at(-1)!)} mm, ${values.length} fields, ${knots.length * values.length} stored numbers`);
      // The smoothed family against the source at every station: each source point to the family's section.
      const reader: (s: number) => number[] = H.reader(family);
      // Read against smoothed at every station: each one's least tangent meeting and its arc, read and smoothed (rounded as stored), and the
      // three fields the smoothing moved most, so a refusal after smoothing names the fields that made it.
      const { at: fieldAt, shoulders: shoulderAt } = S.offsets(plan.layout);
      const fieldName = (f: number): string => {
        if (f >= shoulderAt) return `rho${f - shoulderAt}`;
        let k: number = 0;
        while (k + 1 < fieldAt.length && fieldAt[k + 1]! <= f) ++k;
        return `${plan.layout.anchors[k]!.kind}${k}.${f - fieldAt[k]!}`;
      };
      text.push("read against smoothed per station: least meeting read (arc) / smoothed (arc); fields moved most (read -> smoothed)");
      range.forEach((st: IStation, i: number): void => {
        const smoothed: number[] = L.stored(reader(course.station(st.s)), plan.layout);
        const a = L.meeting(rows[i]!, plan.layout), b = L.meeting(smoothed, plan.layout);
        const moved: string = rows[i]!.map((y: number, f: number): [number, number] => [f, Math.abs(smoothed[f]! - y)]).sort((x, y): number => y[1] - x[1]).slice(0, 3).map(([f]): string => `${fieldName(f)} ${rows[i]![f]!.toFixed(3)}->${smoothed[f]!.toFixed(3)}`).join(", ");
        text.push(`${st.s.toFixed(1).padStart(7)}  ${f2(a.least)} (${a.arc}) / ${f2(b.least)} (${b.arc});  ${moved}`);
      });
      // Each feature's tangent against the source's own at its point (the source's direction over 1 mm either side of its nearest
      // vertex), read and smoothed, degrees; and which extremes stand on the invented closure.
      const source = (s: number): ISection => sections.find((x: ISection): boolean => Math.abs(x.s - s) < 1e-9)!;
      text.push("feature tangents against the source, deg (anchor: read/smoothed); extremes on the closure");
      range.forEach((st: IStation, i: number): void => {
        const own: ISection = source(st.s);
        const smoothed: number[] = L.stored(reader(course.station(st.s)), plan.layout);
        const readChain = S.resolve(rows[i]!, plan.layout).input, smoothChain = S.resolve(smoothed, plan.layout).input;
        const cells: string[] = [];
        plan.layout.anchors.forEach((anchor: S.IAnchor, k: number): void => {
          if (anchor.kind !== "f") return;
          const off = (chain: typeof readChain): number => {
            const p = chain.points[k]!, t = chain.tangents[k]!;
            const d: C.P = sourceTangent(own.points, [p[0]!, p[1]!]);
            const angle: number = Math.atan2(t[1]!, t[0]!) - Math.atan2(d[1], d[0]);
            return Math.abs(degrees(Math.atan2(Math.sin(angle), Math.cos(angle))));
          };
          cells.push(`f${k}: ${off(readChain).toFixed(1)}/${off(smoothChain).toFixed(1)}`);
        });
        const onClosure: string[] = (["u+", "v+", "u-", "v-"] as const).filter((_, q: number): boolean => closuresOf(own).some(([a, b]): boolean => wrap(ends[i]![q]! - a) < wrap(b - a)));
        text.push(`${st.s.toFixed(1).padStart(7)}  ${cells.join("  ") || "-"};  on closure: ${onClosure.join(",") || "none"}`);
      });
      const sourceError: { s: number; max: number; mean: number }[] = range.map((st: IStation): { s: number; max: number; mean: number } => {
        const section = S.chain(reader(course.station(st.s)), plan.layout);
        const ring: C.P[] = section.fault !== null ? [] : Array.from({ length: 720 }, (_: unknown, k: number): C.P => ringPoint(section, (2 * Math.PI * k) / 720));
        const source: C.P[] = sections.find((x: ISection): boolean => Math.abs(x.s - st.s) < 1e-9)!.points;
        const d: number[] = ring.length === 0 ? [NaN] : source.map((p: C.P): number => nearest(p, ring));
        return { s: st.s, max: Math.max(...d), mean: d.reduce((a: number, b: number): number => a + b, 0) / d.length };
      });
      text.push(`family to source: max ${f2(Math.max(...sourceError.map((e) => e.max)))} mm, mean ${f2(sourceError.reduce((a, e) => a + e.mean, 0) / sourceError.length)} mm; per station max: ${sourceError.map((e) => `${e.s}:${f2(e.max)}`).join(" ")}`);
      // Admission every quarter millimetre, rounded as stored.
      const fitted = L.admit(reader, plan.layout, s0, s1, ADMIT_STEP_MM, MARGIN.fitted);
      const constructed = L.admit(reader, plan.layout, s0, s1, ADMIT_STEP_MM, MARGIN.constructed);
      text.push(`admission every ${ADMIT_STEP_MM} mm (${fitted.checked} stations), least meeting share ${f2(fitted.least)}: ${fitted.refused.length} under ${MARGIN.fitted}, ${constructed.refused.length} under ${MARGIN.constructed}`, ...constructed.refused.slice(0, 12).map((r: string): string => "refused " + r));
      // The loft alone, through the engine, over the family's whole span; where the engine refuses a station, the frames are drawn over the
      // longest stretch the admission passes, and the refusal stays in the admission line above.
      const every = (a: number, b: number): number[] => Array.from({ length: Math.round((b - a) / 0.5) + 1 }, (_: unknown, k: number): number => a + k * 0.5);
      let lofted: AutoMovieViewLoft.IResult = H.create(family, every(s0, s1));
      text.push(`engine loft over ${f2(s0)}..${f2(s1)}: ${lofted.chain === null ? "no chain" : "chain"}; diagnostics ${lofted.diagnostics.length}${lofted.diagnostics.length > 0 ? ": " + JSON.stringify(lofted.diagnostics.slice(0, 3)).slice(0, 400) : ""}`);
      let [r0, r1]: [number, number] = [s0, s1];
      if (lofted.chain === null && constructed.at.length > 0) {
        const grid: number[] = Array.from({ length: constructed.checked }, (_: unknown, k: number): number => s0 + k * ADMIT_STEP_MM);
        let best: [number, number] = [0, -1];
        for (let i: number = 0; i < grid.length; ) {
          if (constructed.at.some((x: number): boolean => Math.abs(x - grid[i]!) < 1e-9)) {
            ++i;
            continue;
          }
          let j: number = i;
          while (j + 1 < grid.length && !constructed.at.some((x: number): boolean => Math.abs(x - grid[j + 1]!) < 1e-9)) ++j;
          if (j - i > best[1] - best[0]) best = [i, j];
          i = j + 1;
        }
        [r0, r1] = [Math.ceil(grid[best[0]]! * 2) / 2, Math.floor(grid[best[1]]! * 2) / 2];
        lofted = H.create(family, every(r0, r1));
        text.push(`engine loft over the admitted ${f2(r0)}..${f2(r1)}: ${lofted.chain === null ? "no chain" : "chain"}; diagnostics ${lofted.diagnostics.length}${lofted.diagnostics.length > 0 ? ": " + JSON.stringify(lofted.diagnostics.slice(0, 3)).slice(0, 400) : ""}`);
      }
      return { chain: lofted.chain, r0, r1, family, summary: { tag, range: [range[0]!.s, range.at(-1)!.s], layout: plan.layout, knots, fields: values.length, readError, sourceError, admission: { fitted, constructed }, diagnostics: lofted.diagnostics } };
    };
    const built: Awaited<ReturnType<typeof build>>[] = [];
    for (const [k, fam] of families.entries()) {
      if (fam.to === fam.from) {
        text.push("", `family ${k} at ${range[fam.from]!.s} alone: one station, not lofted`);
        continue;
      }
      const lines: L.ILine[] = lineOf.filter((_: L.ILine, l: number): boolean => fam.key[l] === "1").map((line: L.ILine): L.ILine => ({ phases: line.phases.slice(fam.from, fam.to + 1) }));
      built.push(await build(name + "." + k, range.slice(fam.from, fam.to + 1), lines));
    }
    // The closure's phases at a course station: the nearest source section's.
    const closureAt = (s: number): [number, number][] => closuresOf(sections.reduce((a: ISection, b: ISection): ISection => (Math.abs(course.station(b.s) - s) < Math.abs(course.station(a.s) - s) ? b : a)));
    const shown = built.filter((b): boolean => b.chain !== null).map((b) => ({ chain: b.chain!, s0: b.r0, s1: b.r1, family: b.family }));
    // The families joined in station order (construction.md, Connections: "Two compatible open ends continue each other": a continuation).
    // Neighbouring families' sections carry other layouts, so each is continued across a band (`IAutoMovieConstructionContinuation.band`),
    // as the hand continues the arm: from the host's last ring to a rail inside the part, G2 to both, the part keeping its stations past it.
    const sources: Map<string, IAutoMovieViewPart> = new Map();
    let root: AutoMovieConstructionNode | null = null;
    shown.forEach((piece, k: number): void => {
      const stationsOf: number[] = Array.from({ length: Math.round((piece.s1 - piece.s0) / 0.5) + 1 }, (_: unknown, i: number): number => piece.s0 + i * 0.5);
      sources.set(piece.family.name, H.part(piece.family, stationsOf));
      const leaf: AutoMovieConstructionNode = { type: "source", name: piece.family.name, source: piece.family.name };
      if (root === null) root = leaf;
      else {
        const rail: number = Math.min(JOIN.rail, (piece.s1 - piece.s0) / 2);
        root = { type: "continue", name: `join.${name}.${k}`, host: root, hostFace: shown[k - 1]!.family.name, hostEnd: "top", part: leaf, partFace: piece.family.name, partEnd: "bottom", band: { rail: rail / 1000, count: JOIN.count, rows: JOIN.rows, correspondence: "length" } };
      }
    });
    // Each owner's span of stations: a family keeps its own past its rail, and a band spans from its host's last ring to that rail.
    const owners: IOwner[] = shown.flatMap((piece, k: number): IOwner[] => {
      const rail: number = k === 0 ? 0 : Math.min(JOIN.rail, (piece.s1 - piece.s0) / 2);
      return [...(k === 0 ? [] : [{ from: shown[k - 1]!.s1, to: piece.s0 + rail, owner: `band ${k - 1}-${k}` }]), { from: piece.s0 + rail, to: piece.s1, owner: piece.family.name }];
    });
    text.push("owners by station: " + owners.map((o: IOwner): string => `${o.owner} ${f2(o.from)}..${f2(o.to)}`).join(", "));
    let skin: { positions: readonly number[]; indices: readonly number[] } | undefined;
    if (root !== null && shown.length > 1) {
      try {
        const real = realizeAutoMovieConstruction({ name: "convert." + name, root }, { chord: 0.001, sources });
        text.push("", `joined: ${shown.length} families by ${shown.length - 1} continuation bands (rail up to ${JOIN.rail} mm, ${JOIN.count} columns, ${JOIN.rows} rows); ${real.mesh.positions.length / 3} vertices, ${real.mesh.indices.length / 3} triangles; diagnostics ${real.diagnostics.length}`, ...real.diagnostics.slice(0, 12).map((d): string => `  ${d.node} (${d.contract}): ${d.detail.slice(0, 220)}`));
        skin = { positions: Array.from(real.mesh.positions), indices: Array.from(real.mesh.indices) };
        // The skin's tessellation by owner: the median length of its edges that run round the course (columns) and along it (rows), mm.
        const stationOf = along(course);
        const spacing: Map<string, { round: number[]; along: number[] }> = new Map(owners.map((o: IOwner) => [o.owner, { round: [] as number[], along: [] as number[] }]));
        for (let t: number = 0; t + 2 < skin.indices.length; t += 3)
          for (let e: number = 0; e < 3; ++e) {
            const a: number = skin.indices[t + e]!, b: number = skin.indices[t + ((e + 1) % 3)]!;
            const pa: number[] = [0, 1, 2].map((k: number): number => skin!.positions[3 * a + k]! * 1000), pb: number[] = [0, 1, 2].map((k: number): number => skin!.positions[3 * b + k]! * 1000);
            const length: number = Math.hypot(pb[0]! - pa[0]!, pb[1]! - pa[1]!, pb[2]! - pa[2]!);
            const ds: number = Math.abs(stationOf(pb) - stationOf(pa));
            const owner: IOwner | undefined = owners.find((o: IOwner): boolean => (stationOf(pa) + stationOf(pb)) / 2 >= o.from && (stationOf(pa) + stationOf(pb)) / 2 <= o.to);
            if (owner === undefined || !(length > 0)) continue;
            (ds < 0.3 * length ? spacing.get(owner.owner)!.round : spacing.get(owner.owner)!.along).push(length);
          }
        text.push("skin edges by owner, median mm (round the course / along it): " + [...spacing].map(([o, v]): string => `${o} ${v.round.length > 0 ? f2(median(v.round)) : "-"}/${v.along.length > 0 ? f2(median(v.along)) : "-"}`).join(", "));
      } catch (error: unknown) {
        text.push("", `joined: refused, ${String(error instanceof Error ? error.message : error).slice(0, 300)}`);
      }
    }
    const frames: string[] = shown.length === 0 ? [] : await render(name, shown, course, out, closureAt, skin, owners);
    text.push("", `frames (${frames.length}) of ${shown.length} lofted families together, in ${out}`, ...frames.map((x: string): string => "  " + x));
    return { families: built.map((b) => b.summary), frames };
  }
  const span2 = (xs: readonly number[]): string => `${f2(Math.min(...xs))}..${f2(Math.max(...xs))}`;

  /** A point of an engine section at a phase from the course, by its ray (`AutoMovieViewChain.radius`'s reading through the chain's samples). */
  function ringPoint(section: ReturnType<typeof S.chain>, phi: number): C.P {
    const r: number = Q.radius(section, phi);
    return [r * Math.cos(phi), r * Math.sin(phi)];
  }

  /** A closed polygon's unit direction at its vertex nearest `p`: the chord from 1 mm of arclength behind it to 1 mm ahead. */
  function sourceTangent(points: readonly C.P[], p: C.P): C.P {
    const n: number = points.length;
    let j: number = 0;
    for (let k: number = 1; k < n; ++k) if (Math.hypot(points[k]![0] - p[0], points[k]![1] - p[1]) < Math.hypot(points[j]![0] - p[0], points[j]![1] - p[1])) j = k;
    const walk = (step: 1 | -1): C.P => {
      let length: number = 0, k: number = j;
      for (let m: number = 0; m < n && length < 1; ++m) {
        const next: number = (((k + step) % n) + n) % n;
        length += Math.hypot(points[next]![0] - points[k]![0], points[next]![1] - points[k]![1]);
        k = next;
      }
      return points[k]!;
    };
    const a: C.P = walk(-1), b: C.P = walk(1);
    const l: number = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  }

  /** Distance from a point to a closed polyline. */
  function nearest(p: C.P, ring: readonly C.P[]): number {
    let best: number = Infinity;
    for (let k: number = 0; k < ring.length; ++k) {
      const a: C.P = ring[k]!, b: C.P = ring[(k + 1) % ring.length]!;
      const d: C.P = [b[0] - a[0], b[1] - a[1]];
      const t: number = Math.max(0, Math.min(1, ((p[0] - a[0]) * d[0] + (p[1] - a[1]) * d[1]) / (d[0] * d[0] + d[1] * d[1] || 1)));
      best = Math.min(best, Math.hypot(p[0] - a[0] - t * d[0], p[1] - a[1] - t * d[1]));
    }
    return best;
  }

  /** The largest radial gap between an engine section and a converted chain over 720 rays, mm. */
  function chainGap(section: ReturnType<typeof S.chain>, chain: L.IChain): number {
    if (section.fault !== null) return NaN;
    let most: number = 0;
    for (let k: number = 0; k < 720; ++k) {
      const phi: number = (2 * Math.PI * k) / 720;
      const q: C.P = L.on(chain, phi).point;
      most = Math.max(most, Math.abs(Q.radius(section, phi) - Math.hypot(q[0], q[1])));
    }
    return most;
  }

  /** The colour an invented closure is drawn in, so no reader judges geometry the source does not back as skin. */
  const CLOSURE_COLOUR: [number, number, number] = [0.86, 0.55, 0.32];

  /**
   * The continuation band between neighbouring families (`IAutoMovieConstructionContinuation.IBand`): its rail into the part, mm, at most
   * half the part's span so the part keeps stations of its own past it; 256 columns, as f1's wrist band, space a nose section's 120 to 140 mm
   * girth (closure included) about 0.5 mm apart, finer than the families' phases; 8 rows space a band of 1 to 3 mm a quarter to 0.4 mm apart.
   */
  const JOIN: { rail: number; count: number; rows: number } = { rail: 2, count: 256, rows: 8 };

  /** The largest girth of the stations' converted chains, mm: each chain's arcs' chords summed, round the course. */
  function girthOf(stations: readonly IStation[]): number {
    return Math.max(...stations.map((st: IStation): number => st.arcs.reduce((sum: number, arc: F.IArc): number => sum + Math.hypot(arc.controls[2][0] - arc.controls[0][0], arc.controls[2][1] - arc.controls[0][1]), 0)));
  }

  /** Who draws a span of stations of a joined skin: a family past its rail, or the band before it. */
  export interface IOwner {
    /** First station, mm. */
    from: number;

    /** Last station, mm. */
    to: number;

    /** The family's name, or `band <host>-<part>`. */
    owner: string;
  }

  /** A point's station on a straight course, from its first centre toward its last, mm (the nose's course is straight). */
  function along(course: ICourse): (p: readonly number[]) => number {
    const c0: number[] = course.centres[0]!, c1: number[] = course.centres.at(-1)!;
    const length: number = Math.hypot(c1[0]! - c0[0]!, c1[1]! - c0[1]!, c1[2]! - c0[2]!);
    const dir: number[] = [0, 1, 2].map((k: number): number => (c1[k]! - c0[k]!) / length);
    return (p: readonly number[]): number => [0, 1, 2].reduce((sum: number, k: number): number => sum + (p[k]! - c0[k]!) * dir[k]!, 0);
  }

  /** The colour a continuation band is drawn in on the owner frames. */
  const BAND_COLOUR: [number, number, number] = [0.82, 0.32, 0.3];

  /** Colours of neighbouring lofted families, alternated so each family's ends show. */
  const FAMILY_COLOURS: [number, number, number][] = [
    [0.64, 0.65, 0.67],
    [0.52, 0.6, 0.72],
  ];

  /**
   * The lofted families beside the reference under one camera per view, framed on the reference's zone, in three stages: the reference, the
   * families' clay (each family in its own colour, the triangles on a section's invented closure, two of their three corners within the
   * closure's phases at their station in the course's chart, in `CLOSURE_COLOUR`), and the reference with every family's section ring every
   * 2 mm and at its ends drawn over it, so the clay is compared place for place.
   *
   * @param closureAt The closures' phases at a course station, none where the section has none.
   * @param joined The families realized joined by their continuations, metres: drawn as the clay in place of the separate families, its
   *   closure told apart by each vertex's station on the straight course and its phase in that station's chart.
   */
  async function render(name: string, lofted: readonly { chain: NonNullable<AutoMovieViewLoft.IResult["chain"]>; s0: number; s1: number; family: H.IFamily }[], course: ICourse, out: string, closureAt: (s: number) => readonly (readonly [number, number])[], joined?: { positions: readonly number[]; indices: readonly number[] }, owners: readonly IOwner[] = []): Promise<string[]> {
    const source: R.ISource = await R.load(path.resolve(process.cwd(), ".."));
    const reference: N.Mesh[] = [source.body, source.head].map((mesh, i: number): N.Mesh => ({ id: "reference." + i, positions: Array.from(mesh.positions, (x: number): number => x / 1000), indices: Array.from(mesh.indices), colour: [0.64, 0.65, 0.67] }));
    const near: N.Point[] = [];
    for (const mesh of reference)
      for (let i: number = 0; i < mesh.positions.length; i += 3) {
        const p: N.Point = [mesh.positions[i]!, mesh.positions[i + 1]!, mesh.positions[i + 2]!];
        if (course.zone(p)) near.push(p);
      }
    const clay: N.Mesh[] = [];
    const owned: N.Mesh[] = [];
    const rings: N.Curve[] = [];
    const about: number = 256;
    lofted.forEach(({ chain, s0, s1, family }, k: number): void => {
      const along: number = Math.round((s1 - s0) / 0.5) + 1;
      const positions: number[] = [];
      const invented: boolean[] = [];
      const axis = H.axis(family);
      for (let i: number = 0; i < along; ++i) {
        const s: number = s0 + ((s1 - s0) * i) / (along - 1);
        const frame = axis.at(s);
        const closures: readonly (readonly [number, number])[] = closureAt(s);
        const ring: N.Point[] = [];
        for (let j: number = 0; j < about; ++j) {
          const p = AutoMovieLoftChain.point(chain, s, (2 * Math.PI * j) / about);
          positions.push(p[0]! / 1000, p[1]! / 1000, p[2]! / 1000);
          ring.push([p[0]! / 1000, p[1]! / 1000, p[2]! / 1000]);
          const d: number[] = [0, 1, 2].map((c: number): number => p[c]! - frame.origin[c]!);
          const phi: number = Math.atan2(d[0]! * frame.v[0] + d[1]! * frame.v[1] + d[2]! * frame.v[2], d[0]! * frame.u[0] + d[1]! * frame.u[1] + d[2]! * frame.u[2]);
          invented.push(closures.some(([a, b]): boolean => wrap(phi - a) < wrap(b - a)));
        }
        if (i === 0 || i === along - 1 || i % 4 === 0) rings.push({ id: `${family.name}.ring.${s.toFixed(1)}`, points: ring, closed: true, colour: k % 2 === 0 ? "b84b29" : "2950b8" });
      }
      const skin: number[] = [], closed: number[] = [];
      const put = (a: number, b: number, c: number): void => {
        (Number(invented[a]) + Number(invented[b]) + Number(invented[c]) >= 2 ? closed : skin).push(a, b, c);
      };
      for (let i: number = 0; i + 1 < along; ++i)
        for (let j: number = 0; j < about; ++j) {
          const a: number = i * about + j, b: number = i * about + ((j + 1) % about);
          put(a, a + about, b);
          put(b, a + about, b + about);
        }
      clay.push({ id: family.name, positions, indices: skin, colour: FAMILY_COLOURS[k % FAMILY_COLOURS.length]! }, { id: family.name + ".closure", positions, indices: closed, colour: CLOSURE_COLOUR });
    });
    if (joined !== undefined && lofted.length > 0) {
      // The joined skin in place of the separate families: each vertex's station on the course's straight line from its first centre to its
      // last (the nose's course), and its phase in that station's chart.
      const axis = H.axis(lofted[0]!.family);
      const c0: number[] = course.centres[0]!, c1: number[] = course.centres.at(-1)!;
      const length: number = Math.hypot(c1[0]! - c0[0]!, c1[1]! - c0[1]!, c1[2]! - c0[2]!);
      const dir: number[] = [0, 1, 2].map((k: number): number => (c1[k]! - c0[k]!) / length);
      const invented: boolean[] = [];
      for (let i: number = 0; i < joined.positions.length; i += 3) {
        const p: number[] = [0, 1, 2].map((k: number): number => joined.positions[i + k]! * 1000);
        const s: number = [0, 1, 2].reduce((sum: number, k: number): number => sum + (p[k]! - c0[k]!) * dir[k]!, 0);
        const frame = axis.at(s);
        const d: number[] = [0, 1, 2].map((k: number): number => p[k]! - frame.origin[k]!);
        const phi: number = Math.atan2(d[0]! * frame.v[0] + d[1]! * frame.v[1] + d[2]! * frame.v[2], d[0]! * frame.u[0] + d[1]! * frame.u[1] + d[2]! * frame.u[2]);
        const closures: readonly (readonly [number, number])[] = closureAt(s);
        invented.push(closures.some(([a, b]): boolean => wrap(phi - a) < wrap(b - a)));
      }
      const skin: number[] = [], closed: number[] = [];
      for (let t: number = 0; t + 2 < joined.indices.length; t += 3) {
        const [a, b, c] = [joined.indices[t]!, joined.indices[t + 1]!, joined.indices[t + 2]!];
        (Number(invented[a]) + Number(invented[b]) + Number(invented[c]) >= 2 ? closed : skin).push(a, b, c);
      }
      // The owner frame: each triangle by its first corner's station, a family in its colour, a band in `BAND_COLOUR`, the closure apart.
      const stationOf = along(course);
      const groups: Map<string, number[]> = new Map();
      for (let t: number = 0; t + 2 < joined.indices.length; t += 3) {
        const [a, b, c] = [joined.indices[t]!, joined.indices[t + 1]!, joined.indices[t + 2]!];
        const s: number = stationOf([0, 1, 2].map((k: number): number => joined.positions[3 * a + k]! * 1000));
        const key: string = Number(invented[a]) + Number(invented[b]) + Number(invented[c]) >= 2 ? "closure" : (owners.find((o: IOwner): boolean => s >= o.from - 1e-6 && s <= o.to + 1e-6)?.owner ?? "none");
        groups.set(key, [...(groups.get(key) ?? []), a, b, c]);
      }
      let familyIndex: number = 0;
      for (const o of owners)
        if (groups.has(o.owner)) owned.push({ id: "owner." + o.owner, positions: joined.positions, indices: groups.get(o.owner)!, colour: o.owner.startsWith("band") ? BAND_COLOUR : FAMILY_COLOURS[familyIndex++ % FAMILY_COLOURS.length]! });
      if (groups.has("closure")) owned.push({ id: "owner.closure", positions: joined.positions, indices: groups.get("closure")!, colour: CLOSURE_COLOUR });
      clay.length = 0;
      clay.push({ id: "convert." + name + ".joined", positions: joined.positions, indices: skin, colour: [0.64, 0.65, 0.67] }, { id: "convert." + name + ".joined.closure", positions: joined.positions, indices: closed, colour: CLOSURE_COLOUR });
    }
    NodeCanvasRaster.initialize();
    const files: string[] = [];
    for (const view of ["front", "left", "high-oblique", "low-oblique"]) {
      // One camera for every stage of a view: the reference's zone fixes it.
      const camera: N.Camera = NodeCanvasCamera.fit(view, near, 900, 900);
      for (const [stage, shown, curves] of [["reference", reference, []], ["family-clay", clay, []], ["reference-rings", reference, rings], ...(owned.length > 0 ? [["owners", owned, []]] : [])] as [string, N.Mesh[], N.Curve[]][]) {
        const file: string = name + "." + view + "." + stage + ".png";
        const png: Buffer = NodeCanvasRaster.render(camera, shown, curves, "depth", "f1 | " + stage + " | " + name + " " + view).png;
        await fs.writeFile(path.join(out, file), png);
        files.push(file + " " + createHash("sha256").update(png).digest("hex").slice(0, 12));
      }
    }
    return files;
  }
  /** A command's entry: run `body` and report a failure as the process's exit code. */
  export function run(body: () => Promise<unknown>): void {
    body().catch((error: unknown): void => {
      process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
      process.exitCode = 1;
    });
  }
}
