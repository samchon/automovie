import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { AutoMovieLoftChain, AutoMovieViewChain as Q, type AutoMovieViewLoft } from "@automovie/engine";
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

    /** The converter's distinct diagnostics, numbers written as `#`. */
    diagnostics: string[];

    /** The converted arcs in phase order. */
    arcs: F.IArc[];

    /** The source's own hollows under its convex hull deeper than the tolerance, measured before fairing (`hollows`). */
    hollows: IHollow[];
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

  /** Convert one section at one tolerance and cutoff. */
  export function convert(section: ISection, toleranceMm: number, fairMm: number): IStation {
    const got: F.IConversion = F.convert(section.points, { toleranceMm, fairMm, ...(section.closure === undefined ? {} : { closure: section.closure }) });
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
      diagnostics: got.diagnostics,
      arcs: got.arcs,
      hollows: hollows(section.points, LAYOUT_TOLERANCE_MM, got.faired),
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
    const table: Map<number, IStation[]> = new Map(tolerances.map((t: number): [number, IStation[]] => [t, sections.map((s: ISection): IStation => convert(s, t, fairMm))]));
    // `FamilyConicSection.converted` at its own cutoff and tolerance, on a section with no closure: the same fairing and converter, so at
    // that cutoff its arc count must equal this file's at the layout tolerance.
    const check: string[] = sections.map((section: ISection, k: number): string => {
      if (section.closure !== undefined || fairMm !== F.FAIR_MM) return "-";
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
    const hollowLines: ILine[] = lines(layoutStations.map((st: IStation) => ({ s: st.s, items: st.hollows.map((h: IHollow) => ({ phase: h.middle, turn: h.widthMm, depth: h.depthMm })) })));
    lineTable(`## Source hollow lines, tracked within ${degrees(TRACK).toFixed(0)} deg`, "line  from     to       stations  middle-deg(min..max)  width-mm(min..max)  depth-mm(min..max)", hollowLines, (x) => x, 1);
    const ledger = account(layoutStations);
    text.push("", `## Source hollows deeper than ${LAYOUT_TOLERANCE_MM} mm: ${ledger.kept} held by a tracked groove, ${ledger.dropped.length} dropped`, ...ledger.dropped.map((d: string): string => "dropped " + d));
    const diagnostics: Set<string> = new Set(layoutStations.flatMap((x: IStation): string[] => x.diagnostics));
    if (diagnostics.size > 0) text.push("", "## Converter diagnostics at the layout tolerance (numbers as #)", ...[...diagnostics].slice(0, 12));
    let lofted: object | null = null;
    if (options.loft !== undefined) lofted = await loft(name, sections, layoutStations, options.loft, out, text);
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
  async function loft(name: string, sections: readonly ISection[], stations: readonly IStation[], course: ICourse, out: string, text: string[]): Promise<object> {
    // The longest run of neighbouring star-shaped stations: a section the rays fold over is not a wall's (lofting.md, the method's limit).
    let best: [number, number] = [0, -1];
    for (let i: number = 0; i < stations.length; ) {
      if (stations[i]!.folds !== 0) {
        ++i;
        continue;
      }
      let j: number = i;
      while (j + 1 < stations.length && stations[j + 1]!.folds === 0) ++j;
      if (j - i > best[1] - best[0]) best = [i, j];
      i = j + 1;
    }
    let range: IStation[] = stations.slice(best[0], best[1] + 1);
    text.push("", `## Loft: stations ${range[0]!.s}-${range.at(-1)!.s} (${range.length}), the longest run of star-shaped stations`);
    // The layout's lines are the source's own hollow lines over the range (deeper than the tolerance), not the faired grooves tracked
    // alone: a faired groove that doubles for a few stations split one source groove into two overlapping lines, and their runs' features
    // interleaved. A hollow line that resumes within RUN stations of where another ended, within twice `TRACK` of its phase, continues it.
    const pieces: ILine[] = lines(range.map((st: IStation) => ({ s: st.s, items: st.hollows.map((h: IHollow) => ({ phase: h.middle, turn: h.halfMm, depth: h.depthMm })) })));
    const joined: ILine[] = join(pieces);
    // At each station, the groove that holds the line's hollow (its inflections round the hollow's phase, else its middle within TRACK), each
    // groove to one line, the longest lines first.
    const lineOf: L.ILine[] = [];
    const named: string[] = [];
    const claimed: Set<string> = new Set();
    for (const line of [...joined].sort((a: ILine, b: ILine): number => b.stations.length - a.stations.length)) {
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
      if (line.stations.length >= RUN && seen >= RUN) lineOf.push({ phases });
      else named.push(`dropped hollow line at ${degrees(median(line.phases)).toFixed(0)} deg over ${line.stations[0]}-${line.stations.at(-1)} (${line.stations.length} stations, a groove at ${seen}), depth ${span2(line.depths)} mm`);
    }
    text.push(`groove lines from the source's hollow lines: ${lineOf.length} kept of ${joined.length} (${pieces.length} pieces)`, ...named);
    // Families: runs of stations with one count of seen groove lines (#3401: "runs of equal count are families; a change of count is where a
    // family ends"). A line carried through stations where its groove is not seen stands at zero depth there, and the engine refuses its
    // parallel end tangents (#3412, Section model); the longest family is lofted, the others named for the survey.
    const counts: number[] = range.map((_: IStation, i: number): number => lineOf.filter((line: L.ILine): boolean => line.phases[i] !== null).length);
    const families: { from: number; to: number; count: number }[] = [];
    counts.forEach((c: number, i: number): void => {
      const last = families.at(-1);
      if (last !== undefined && last.count === c) last.to = i;
      else families.push({ from: i, to: i, count: c });
    });
    const chosen = families.reduce((a, b) => (b.to - b.from > a.to - a.from || (b.to - b.from === a.to - a.from && b.count > a.count) ? b : a));
    text.push(`families by seen groove lines: ${families.map((f): string => `${f.count}:${range[f.from]!.s}-${range[f.to]!.s}(${f.to - f.from + 1})`).join("  ")}; lofted ${range[chosen.from]!.s}-${range[chosen.to]!.s}`);
    range = range.slice(chosen.from, chosen.to + 1);
    for (let l: number = lineOf.length - 1; l >= 0; --l) {
      lineOf[l]!.phases = lineOf[l]!.phases.slice(chosen.from, chosen.to + 1);
      if (lineOf[l]!.phases.every((x): boolean => x === null)) lineOf.splice(l, 1);
    }
    // Where a kept line's groove is not seen, its phases between the nearest stations that see it, linearly in the station; past its ends, held.
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
    const family: H.IFamily = { name: "convert." + name, centres: course.centres, halves: course.halves, up: course.up, layout: plan.layout, knots, values: values.map((field: number[], f: number): number[] => field.map((y: number): number => (S.units(plan.layout)[f] === "mm" ? Math.round(y * 100) / 100 : Math.round(y * 1e4) / 1e4))) };
    await fs.writeFile(path.join(out, name + ".family.json"), JSON.stringify(family));
    text.push(`smooth: ${knots.length} knots ${f2(knots[0]!)}..${f2(knots.at(-1)!)} mm, ${values.length} fields, ${knots.length * values.length} stored numbers`);
    // The smoothed family against the source at every station: each source point to the family's section.
    const reader: (s: number) => number[] = H.reader(family);
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
    const frames: string[] = lofted.chain === null ? [] : await render(name, lofted.chain, r0, r1, course, out);
    text.push(`frames (${frames.length}) in ${out}`, ...frames.map((f: string): string => "  " + f));
    return { range: [range[0]!.s, range.at(-1)!.s], layout: plan.layout, knots, fields: values.length, readError, sourceError, admission: { fitted, constructed }, diagnostics: lofted.diagnostics, frames };
  }

  const span2 = (xs: readonly number[]): string => `${f2(Math.min(...xs))}..${f2(Math.max(...xs))}`;

  /** A point of an engine section at a phase from the course, by its ray (`AutoMovieViewChain.radius`'s reading through the chain's samples). */
  function ringPoint(section: ReturnType<typeof S.chain>, phi: number): C.P {
    const r: number = Q.radius(section, phi);
    return [r * Math.cos(phi), r * Math.sin(phi)];
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

  /** The loft's clay beside the reference under the same cameras, four views, framed on the reference's zone. */
  async function render(name: string, chain: NonNullable<AutoMovieViewLoft.IResult["chain"]>, s0: number, s1: number, course: ICourse, out: string): Promise<string[]> {
    const source: R.ISource = await R.load(path.resolve(process.cwd(), ".."));
    const reference: N.Mesh[] = [source.body, source.head].map((mesh, i: number): N.Mesh => ({ id: "reference." + i, positions: Array.from(mesh.positions, (x: number): number => x / 1000), indices: Array.from(mesh.indices), colour: [0.64, 0.65, 0.67] }));
    const near: N.Point[] = [];
    for (const mesh of reference)
      for (let i: number = 0; i < mesh.positions.length; i += 3) {
        const p: N.Point = [mesh.positions[i]!, mesh.positions[i + 1]!, mesh.positions[i + 2]!];
        if (course.zone(p)) near.push(p);
      }
    const along: number = Math.round((s1 - s0) / 0.5) + 1, about: number = 256;
    const positions: number[] = [];
    const indices: number[] = [];
    for (let i: number = 0; i < along; ++i)
      for (let j: number = 0; j < about; ++j) {
        const p = AutoMovieLoftChain.point(chain, s0 + ((s1 - s0) * i) / (along - 1), (2 * Math.PI * j) / about);
        positions.push(p[0]! / 1000, p[1]! / 1000, p[2]! / 1000);
      }
    for (let i: number = 0; i + 1 < along; ++i)
      for (let j: number = 0; j < about; ++j) {
        const a: number = i * about + j, b: number = i * about + ((j + 1) % about);
        indices.push(a, a + about, b, b, a + about, b + about);
      }
    const clay: N.Mesh = { id: "convert." + name, positions, indices, colour: [0.64, 0.65, 0.67] };
    NodeCanvasRaster.initialize();
    const files: string[] = [];
    for (const view of ["front", "left", "high-oblique", "low-oblique"]) {
      const camera: N.Camera = NodeCanvasCamera.fit(view, near, 900, 900);
      for (const [stage, shown] of [["reference", reference], ["family-clay", [clay]]] as [string, N.Mesh[]][]) {
        const file: string = name + "." + view + "." + stage + ".png";
        const png: Buffer = NodeCanvasRaster.render(camera, shown, [], "depth", "f1 | " + stage + " | " + name + " " + view).png;
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
