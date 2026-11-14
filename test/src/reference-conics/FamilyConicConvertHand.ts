import fs from "node:fs/promises";
import { FamilyConicConvert as T } from "./FamilyConicConvert";
import type { FamilyConicSection as C } from "./FamilyConicSection";

/**
 * The hand's region entry of the conversion tool: the hand family's observed cuts on its own course (`FamilyConicBody.ts hand
 * --dump-sections=<file>`, every station's loop in its course's chart, the course point at the origin), over a station range, converted at
 * the layout tolerance. The question it answers is whether the dorsal valleys between the metacarpals hold as lines along the stations.
 *
 * Run from `test` after bundling: `node <bundle>/FamilyConicConvertHand.cjs <sections.json> [from] [to]`.
 */
export namespace FamilyConicConvertHand {
  /** Convert the dumped cuts over the station range given on the command line, at the hand's own fairing cutoff, and write the tables. */
  export async function main(): Promise<void> {
    const file: string | undefined = process.argv[2];
    if (file === undefined) throw new Error("usage: FamilyConicConvertHand <sections.json> [from] [to]");
    const from: number = Number(process.argv[3] ?? -Infinity), to: number = Number(process.argv[4] ?? Infinity);
    const dumped = JSON.parse(await fs.readFile(file, "utf8")) as { s: number; loop: C.P[] | null }[];
    const sections: T.ISection[] = dumped
      .filter((row): boolean => row.loop !== null && row.s >= from - 1e-9 && row.s <= to + 1e-9)
      .map((row): T.ISection => {
        const loop: C.P[] = row.loop!;
        const area: number = loop.reduce((sum: number, p: C.P, k: number): number => sum + p[0] * loop[(k + 1) % loop.length]![1] - loop[(k + 1) % loop.length]![0] * p[1], 0);
        return { s: row.s, points: area > 0 ? loop : [...loop].reverse() };
      });
    await T.report("hand", sections, { ladder: T.LADDER, note: `the hand family's observed cuts ${from}..${to} mm on its course, from ${file}` });
  }
}

if (/FamilyConicConvertHand\.c?[jt]s$/.test(process.argv[1] ?? "")) T.run(FamilyConicConvertHand.main);
