import fs from "node:fs/promises";
import path from "node:path";
import { AutoMovieHumanConicLoft, AutoMovieHumanF1 } from "@automovie/human";
import { FamilyConicConvert as T } from "./FamilyConicConvert";
import type { FamilyConicSection as C } from "./FamilyConicSection";
import { FamilyConicSource as R } from "./FamilyConicSource";

/**
 * The trunk's region entry of the conversion tool: the trunk's sections as its fit reads them (`FamilyConicBody.ts trunk
 * --dump-sections=<file>`, every station's loop in its course's chart, the course point at the origin), over a station range, converted at
 * the layout tolerance and the ladder. The question it answers is whether the grooves the hull bridges (the sternum's, the groin's, the
 * gluteal fold's, the natal cleft's and the deltopectoral) hold as lines along the stations.
 *
 * A dumped loop carries the closures of the cuts the trunk leaves to its neighbours (the arms, the breasts, the nose): invented arcs, not
 * skin, which a conversion that reads them as skin counts as grooves. Each loop edge whose middle or start stands farther than `INVENTED_MM`
 * from the reference's own cut at that station is invented. Every invented run is handed to the tool as one of the section's closures
 * (`FamilyConicConvert.ISection.closures`), so the conversion breaks there and does not count it: the arms' two cuts at the shoulder, the
 * breasts' two at the chest.
 *
 * Run from `test` after bundling: `node <bundle>/FamilyConicConvertTrunk.cjs <sections.json> <from> <to> [label]`.
 */
export namespace FamilyConicConvertTrunk {
  /** How far a loop point may stand from the reference's own cut and still be its skin, mm: the cut's own chaining tolerance is 0.5 mm. */
  export const INVENTED_MM: number = 0.5;

  /** A dumped section with its invented runs found. */
  export interface IMarked {
    /** The section as the tool takes it, with its closures. */
    section: T.ISection;

    /** How many separate invented runs the loop holds. */
    runs: number;
  }

  /** The distance from a point to a closed polyline, mm. */
  function distance(p: C.P, loop: readonly C.P[]): number {
    let best: number = Infinity;
    for (let k: number = 0; k < loop.length; ++k) {
      const a: C.P = loop[k]!;
      const b: C.P = loop[(k + 1) % loop.length]!;
      const e: C.P = [b[0] - a[0], b[1] - a[1]];
      const length2: number = e[0] * e[0] + e[1] * e[1];
      const t: number = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * e[0] + (p[1] - a[1]) * e[1]) / length2));
      best = Math.min(best, Math.hypot(p[0] - a[0] - t * e[0], p[1] - a[1] - t * e[1]));
    }
    return best;
  }

  /**
   * Mark a counter-clockwise loop's invented runs against the reference's own cut. An edge is invented when its middle stands off the cut:
   * a closure is often one straight chord, whose two ends lie on the skin, so its vertices alone do not show it.
   */
  export function mark(s: number, loop: C.P[], skin: readonly C.P[] | null): IMarked {
    if (skin === null) return { section: { s, points: loop }, runs: 0 };
    const n: number = loop.length;
    const invented: boolean[] = loop.map((p: C.P, k: number): boolean => {
      const q: C.P = loop[(k + 1) % n]!;
      return distance([(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], skin) > INVENTED_MM || distance(p, skin) > INVENTED_MM;
    });
    const starts: number[] = invented.map((flag: boolean, k: number): number => (flag && !invented[(k - 1 + n) % n] ? k : -1)).filter((k: number): boolean => k >= 0);
    if (starts.length === 0) return { section: { s, points: loop }, runs: 0 };
    const phase = (p: C.P): number => Math.atan2(p[1], p[0]);
    const closures: [number, number][] = starts.map((start: number): [number, number] => {
      let end: number = start;
      while (invented[(end + 1) % n]) end = (end + 1) % n;
      return [phase(loop[start]!), phase(loop[(end + 1) % n]!)];
    });
    return { section: { s, points: loop, closures }, runs: closures.length };
  }

  /** Convert the dumped sections over the station range given on the command line, closures marked, and write the tables. */
  export async function main(): Promise<void> {
    const file: string | undefined = process.argv[2];
    if (file === undefined) throw new Error("usage: FamilyConicConvertTrunk <sections.json> <from> <to> [label]");
    const from: number = Number(process.argv[3] ?? -Infinity), to: number = Number(process.argv[4] ?? Infinity);
    const label: string = process.argv[5] ?? `trunk-${from}-${to}`;
    const dumped = JSON.parse(await fs.readFile(file, "utf8")) as { s: number; loop: C.P[] | null }[];
    const source: R.ISource = await R.load(path.resolve(process.cwd(), ".."));
    const axis = AutoMovieHumanConicLoft.axis(AutoMovieHumanF1.BODY.trunk);
    const marked: IMarked[] = dumped
      .filter((row): boolean => row.loop !== null && row.s >= from - 1e-9 && row.s <= to + 1e-9)
      .map((row): IMarked => {
        const loop: C.P[] = row.loop!;
        const area: number = loop.reduce((sum: number, p: C.P, k: number): number => sum + p[0] * loop[(k + 1) % loop.length]![1] - loop[(k + 1) % loop.length]![0] * p[1], 0);
        return mark(row.s, area > 0 ? loop : [...loop].reverse(), R.cut(source.all, axis.at(row.s)).loop);
      });
    const counts: Map<number, number> = new Map();
    for (const m of marked) counts.set(m.runs, (counts.get(m.runs) ?? 0) + 1);
    const note: string = `the trunk's sections ${from}..${to} mm on its course as its fit reads them, from ${file}; invented closures per section: ${[...counts.entries()].sort((a, b) => a[0] - b[0]).map(([runs, count]) => `${runs}: ${count}`).join(", ")}`;
    process.stdout.write(note + "\n");
    await T.report(label, marked.map((m: IMarked): T.ISection => m.section), { ladder: T.LADDER, note });
  }
}

if (/FamilyConicConvertTrunk\.c?[jt]s$/.test(process.argv[1] ?? "")) T.run(FamilyConicConvertTrunk.main);
