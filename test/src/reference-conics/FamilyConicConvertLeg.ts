import fs from "node:fs/promises";
import { FamilyConicConvert as T } from "./FamilyConicConvert";
import type { FamilyConicSection as C } from "./FamilyConicSection";

/**
 * The leg's region entry of the conversion tool: the leg family's observed cuts on its own course (`FamilyConicBody.ts leg
 * --dump-sections=<file>`, every station's loop of the skin in its course's chart, the course point at the origin), over a station range,
 * converted at the layout tolerance and the ladder. The questions it answers are whether the shin's front (the tibial crest beside the flat
 * anteromedial face) and the foot's end before the toes part (the dorsal valleys between the metatarsal heads) hold grooves as lines along
 * the stations, how deep and over which stations, and how the groove counts split the stations into families.
 *
 * Run from `test` after bundling: `node <bundle>/FamilyConicConvertLeg.cjs <sections.json> [from] [to] [label]`.
 */
export namespace FamilyConicConvertLeg {
  /** Convert the dumped cuts over the station range given on the command line, at the leg's own fairing cutoff, and write the tables. */
  export async function main(): Promise<void> {
    const file: string | undefined = process.argv[2];
    if (file === undefined) throw new Error("usage: FamilyConicConvertLeg <sections.json> [from] [to] [label]");
    const from: number = Number(process.argv[3] ?? -Infinity), to: number = Number(process.argv[4] ?? Infinity);
    const label: string = process.argv[5] ?? "leg";
    const dumped = JSON.parse(await fs.readFile(file, "utf8")) as { s: number; loop: C.P[] | null }[];
    const sections: T.ISection[] = dumped
      .filter((row): boolean => row.loop !== null && row.s >= from - 1e-9 && row.s <= to + 1e-9)
      .map((row): T.ISection => {
        const loop: C.P[] = row.loop!;
        const area: number = loop.reduce((sum: number, p: C.P, k: number): number => sum + p[0] * loop[(k + 1) % loop.length]![1] - loop[(k + 1) % loop.length]![0] * p[1], 0);
        return { s: row.s, points: area > 0 ? loop : [...loop].reverse() };
      });
    await T.report(label, sections, { ladder: T.LADDER, note: `the leg family's observed cuts ${from}..${to} mm on its course, from ${file}` });
  }
}

if (/FamilyConicConvertLeg\.c?[jt]s$/.test(process.argv[1] ?? "")) T.run(FamilyConicConvertLeg.main);
