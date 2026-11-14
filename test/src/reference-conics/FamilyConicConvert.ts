import fs from "node:fs/promises";
import path from "node:path";
import { FamilyConicFair as F } from "./FamilyConicFair";
import { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicSource as R } from "./FamilyConicSource";

/**
 * The one-shot conversion of a part's sections to conics (#3401, #3412 stage 1): each source section faired to the form's scale
 * (`FamilyConicFair`, the periodic smoothing spline of `FamilyConicSection.FAIR_MM`), converted by the recovery converter
 * (`approximateAutoMovieRecoveryConicsAhn`, contract `AutoMovieRecoveryConicApproximation`) with breaks at the faired inflections and at an
 * invented closure's ends, and its arcs read as the layout: the skin-arc count and the grooves (maximal runs of inward arcs) per station,
 * runs of equal count along the stations as families, and each groove tracked along the stations as a line.
 *
 * A region entry (`FamilyConicConvert<Region>.ts`) reads its sections in their course's chart and hands them to `report`; this file holds no
 * region. Its output goes to `test/.shots/family-conic-convert/<time>/<part>.*`: `convert.txt` (the ladder, run and line tables) and
 * `convert.json` (every station's arcs at every tolerance).
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
    s: number;
    toleranceMm: number;
    status: string;
    errorMm: number;

    /** Arcs on skin, on the closure, and of the skin's arcs those that bend inward. */
    skin: number;
    closure: number;
    inward: number;

    /** The grooves of at least `FamilyConicSection.FEATURE_LEAST` turn, and the shallower ones apart. */
    grooves: F.IGroove[];
    faint: F.IGroove[];

    fairMaxMm: number;
    fairMeanMm: number;
    folds: number;
    diagnostics: string[];
    arcs: F.IArc[];

    /** The source's own hollows under its convex hull, measured before fairing (`hollows`). */
    hollows: IHollow[];
  }

  /** A hollow of the source section under its convex hull (the tape), read along the rays from the course. */
  export interface IHollow {
    /** Phase of its deepest point, radians. */
    middle: number;

    /** Its depth there, mm along the ray, and its width where it is deeper than `HOLLOW_MM`, mm along the hull. */
    depthMm: number;
    widthMm: number;

    /** The faired section's depth under the same hull at the same phase, mm: what the fairing keeps of it. */
    fairedMm: number;
  }

  /** The least depth under the hull that counts as a hollow, mm: the reference pack's own fit tolerance (policy `toleranceMm` 0.2). */
  export const HOLLOW_MM: number = 0.2;

  /** The source's hollows under its hull over 720 rays, each a run of rays deeper than `HOLLOW_MM`. */
  export function hollows(points: readonly C.P[], faired: (phi: number) => number): IHollow[] {
    const M: number = 720;
    const hull: C.P[] = R.hull(points);
    const rows = Array.from({ length: M }, (_: unknown, k: number) => {
      const phi: number = (2 * Math.PI * k) / M;
      const top: number = C.radius(hull, phi);
      return { phi, top, depth: top - C.radius(points, phi), faired: top - faired(phi) };
    });
    const start: number = rows.findIndex((r): boolean => !(r.depth > HOLLOW_MM));
    if (start < 0) return [];
    const out: IHollow[] = [];
    for (let m: number = 1; m <= M; ++m) {
      const k: number = (start + m) % M;
      if (!(rows[k]!.depth > HOLLOW_MM) || rows[(k - 1 + M) % M]!.depth > HOLLOW_MM) continue;
      let best = rows[k]!, width: number = 0;
      for (let j: number = k; rows[j % M]!.depth > HOLLOW_MM && width < 1e6; ++j) {
        const r = rows[j % M]!;
        width += (r.top * 2 * Math.PI) / M;
        if (r.depth > best.depth) best = r;
      }
      out.push({ middle: best.phi, depthMm: best.depth, widthMm: width, fairedMm: best.faired });
    }
    return out.sort((a: IHollow, b: IHollow): number => a.middle - b.middle);
  }

  /** A run of stations with one value. */
  export interface IRun {
    value: string;
    from: number;
    to: number;
    stations: number;
  }

  /** One groove followed along the stations. */
  export interface ILine {
    id: number;
    stations: number[];
    phases: number[];
    turns: number[];
    depths: number[];
  }

  /** The tolerance ladder of #3401, mm. */
  export const LADDER: number[] = [0.2, 0.5, 1.0, 2.0];

  /** The tolerance the layout is read at: `FamilyConicSection.converted`'s own, mm. */
  export const LAYOUT_TOLERANCE_MM: number = 0.25;

  /**
   * How far a groove's middle may move between neighbouring stations and still be the same line, radians of phase: 12 degrees, about a
   * third of the narrowest spacing between f1's dorsal hand valleys and the nose's two alar creases seen from their courses (35 to 40 degrees).
   */
  export const TRACK: number = (12 * Math.PI) / 180;

  const degrees = (x: number): number => (x * 180) / Math.PI;
  const wrap = (x: number): number => ((x % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const centre = (g: F.IGroove): number => wrap(g.from + wrap(g.to - g.from) / 2);
  const gap = (a: number, b: number): number => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

  /** Convert one section at one tolerance. */
  export function convert(section: ISection, toleranceMm: number): IStation {
    const got: F.IConversion = F.convert(section.points, { toleranceMm, ...(section.closure === undefined ? {} : { closure: section.closure }) });
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
      hollows: hollows(section.points, got.faired),
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
      }
      row.items.forEach((g, k: number): void => {
        if (used.has(k)) return;
        const line: ILine = { id: all.length, stations: [row.s], phases: [g.phase], turns: [g.turn], depths: [g.depth] };
        all.push(line);
        taken.add(line);
      });
      open = [...taken];
    }
    return all;
  }

  /** Convert every section at the layout tolerance and the ladder, and write the tables and the arcs. */
  export async function report(name: string, sections: readonly ISection[], options: { ladder?: number[]; note?: string } = {}): Promise<string> {
    // Run from `test`, as every reference-conics command is.
    const root: string = path.resolve(process.cwd(), "..");
    const out: string = path.join(root, "test/.shots/family-conic-convert", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const tolerances: number[] = [LAYOUT_TOLERANCE_MM, ...(options.ladder ?? [])];
    const table: Map<number, IStation[]> = new Map(tolerances.map((t: number): [number, IStation[]] => [t, sections.map((s: ISection): IStation => convert(s, t))]));
    // `FamilyConicSection.converted` at its own tolerance, on a section with no closure: the same fairing and converter, so its arc count
    // must equal this file's at the layout tolerance.
    const check: string[] = sections.map((section: ISection, k: number): string => {
      if (section.closure !== undefined) return "-";
      try {
        const ends: number = C.converted(section.points).ends.length;
        return ends === table.get(LAYOUT_TOLERANCE_MM)![k]!.arcs.length ? "same" : "differs:" + ends;
      } catch (error: unknown) {
        return "threw:" + String(error instanceof Error ? error.message : error).slice(0, 40);
      }
    });
    const f2 = (x: number): string => x.toFixed(2);
    const groovesOf = (st: IStation): string => st.grooves.map((g: F.IGroove): string => `${degrees(centre(g)).toFixed(0)}deg/${degrees(g.turn).toFixed(1)}deg/${f2(g.depthMm)}mm`).join(" ");
    const lines_: string[] = [`# ${name}: faired at ${C.FAIR_MM} mm (periodic smoothing spline of the radius by phase), converted by approximateAutoMovieRecoveryConicsAhn`];
    if (options.note !== undefined) lines_.push("# " + options.note);
    lines_.push("", `## Stations at the layout tolerance ${LAYOUT_TOLERANCE_MM} mm`, "station  status    skin closure inward grooves faint  err-mm  fair-max fair-mean folds  converted  grooves(middle/turn/depth)");
    table.get(LAYOUT_TOLERANCE_MM)!.forEach((st: IStation, k: number): void => {
      lines_.push([st.s.toFixed(1).padStart(7), st.status.padStart(9), String(st.skin).padStart(5), String(st.closure).padStart(7), String(st.inward).padStart(6), String(st.grooves.length).padStart(7), String(st.faint.length).padStart(5), st.errorMm.toFixed(3).padStart(7), f2(st.fairMaxMm).padStart(9), f2(st.fairMeanMm).padStart(9), String(st.folds).padStart(5), check[k]!.padStart(10), " " + groovesOf(st)].join(" "));
    });
    if ((options.ladder ?? []).length > 0) {
      lines_.push("", "## Tolerance ladder: skin arcs / inward arcs / grooves per station", "station  " + tolerances.map((t: number): string => (t + " mm").padStart(14)).join(""));
      sections.forEach((section: ISection, k: number): void => {
        lines_.push(section.s.toFixed(1).padStart(7) + "  " + tolerances.map((t: number): string => { const st: IStation = table.get(t)![k]!; return `${st.skin}/${st.inward}/${st.grooves.length}${st.status === "complete" ? "" : "p"}`.padStart(14); }).join(""));
      });
      lines_.push("(p: partial)");
    }
    for (const t of tolerances) {
      const st: IStation[] = table.get(t)!;
      lines_.push("", `## Runs at ${t} mm (value: from-to station, count)`);
      lines_.push("skin arcs:  " + runs(st.map((x: IStation) => ({ s: x.s, value: String(x.skin) }))).map((r: IRun): string => `${r.value}:${r.from}-${r.to}(${r.stations})`).join("  "));
      lines_.push("grooves:    " + runs(st.map((x: IStation) => ({ s: x.s, value: String(x.grooves.length) }))).map((r: IRun): string => `${r.value}:${r.from}-${r.to}(${r.stations})`).join("  "));
      lines_.push("inward:     " + runs(st.map((x: IStation) => ({ s: x.s, value: String(x.inward) }))).map((r: IRun): string => `${r.value}:${r.from}-${r.to}(${r.stations})`).join("  "));
    }
    const layout: IStation[] = table.get(LAYOUT_TOLERANCE_MM)!;
    const tracked: ILine[] = lines(layout.map((st: IStation) => ({ s: st.s, items: st.grooves.map((g: F.IGroove) => ({ phase: centre(g), turn: g.turn, depth: g.depthMm })) })));
    const span = (xs: number[], f: (x: number) => number, d: number): string => `${f(Math.min(...xs)).toFixed(d)}..${f(Math.max(...xs)).toFixed(d)}`;
    const table_ = (title: string, head: string, found: ILine[], first: (x: number) => number, d: number): void => {
      lines_.push("", title, head);
      for (const line of found)
        lines_.push([String(line.id).padStart(4), line.stations[0]!.toFixed(1).padStart(7), line.stations.at(-1)!.toFixed(1).padStart(7), String(line.stations.length).padStart(9), span(line.phases, degrees, 0).padStart(21), span(line.turns, first, d).padStart(19), span(line.depths, (x) => x, 2).padStart(19)].join("  "));
    };
    table_(`## Groove lines at ${LAYOUT_TOLERANCE_MM} mm, tracked within ${degrees(TRACK).toFixed(0)} deg between neighbouring stations`, "line  from     to       stations  middle-deg(min..max)  turn-deg(min..max)  depth-mm(min..max)", tracked, degrees, 1);
    // The source's own hollows, before fairing: what the fairing had to keep.
    lines_.push("", `## Source hollows under the convex hull, deeper than ${HOLLOW_MM} mm, per station (deepest-phase-deg/depth-mm/width-mm/faired-depth-mm)`);
    for (const st of layout) lines_.push(st.s.toFixed(1).padStart(7) + "  " + st.hollows.map((h: IHollow): string => `${degrees(h.middle).toFixed(0)}/${f2(h.depthMm)}/${h.widthMm.toFixed(1)}/${f2(h.fairedMm)}`).join("  "));
    const hollowLines: ILine[] = lines(layout.map((st: IStation) => ({ s: st.s, items: st.hollows.map((h: IHollow) => ({ phase: h.middle, turn: h.widthMm, depth: h.depthMm })) })));
    table_(`## Source hollow lines, tracked within ${degrees(TRACK).toFixed(0)} deg`, "line  from     to       stations  middle-deg(min..max)  width-mm(min..max)  depth-mm(min..max)", hollowLines, (x) => x, 1);
    const diagnostics: Set<string> = new Set(table.get(LAYOUT_TOLERANCE_MM)!.flatMap((x: IStation): string[] => x.diagnostics));
    if (diagnostics.size > 0) lines_.push("", "## Converter diagnostics at the layout tolerance (numbers as #)", ...[...diagnostics].slice(0, 12));
    await fs.writeFile(path.join(out, name + ".convert.txt"), lines_.join("\n") + "\n");
    await fs.writeFile(path.join(out, name + ".convert.json"), JSON.stringify({ name, fairMm: C.FAIR_MM, tolerances, sections, stations: Object.fromEntries([...table].map(([t, st]) => [String(t), st])), lines: tracked, hollowLines }));
    process.stdout.write(JSON.stringify({ event: "convert-complete", part: name, out, stations: sections.length }) + "\n");
    return out;
  }

  /** A command's entry: run `body` and report a failure as the process's exit code. */
  export function run(body: () => Promise<unknown>): void {
    body().catch((error: unknown): void => {
      process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
      process.exitCode = 1;
    });
  }
}
