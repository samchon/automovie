import fs from "node:fs/promises";
import path from "node:path";

import { AutoMovieHumanConicLoft, AutoMovieHumanF1Girdle, AutoMovieHumanF1Placement, AutoMovieHumanSegmentFrame } from "@automovie/human";

import { FamilyConicBody } from "./FamilyConicBody";
import { FamilyConicFit as F } from "./FamilyConicFit";
import { FamilyConicSection as C } from "./FamilyConicSection";
import type { FamilyConicSource as R } from "./FamilyConicSource";

/**
 * The arm refitted on the girdle's course (#3151, R3b): `FamilyConicBody`'s pipeline with its arm part laid on the course by rule
 * (`AutoMovieHumanF1Girdle`: the girdle ring's centre, the corner at the k = 1.5 set-back, today's later centres) and reading the arm's own
 * skin the way today's arm was fitted: the skin lateral of a plane square to the course's first run, its first section 2 mm past that plane.
 * The plane is the rule's own, the girdle's plane 2 mm out (the supervisor's ruling), not the stored side distance z = 151 mm the earlier fit
 * clipped at, since a stored z is the coordinate the rule replaces.
 *
 * Two runs, from `test/` after `pnpm conic:build`:
 * - the head, `node .shots/esbuild/FamilyConicArmRule.cjs arm`: the arm fitted from its first section to `HEAD_TO_MM`, past the join;
 *   with `--admissible-from=<a depth-0 head's directory>` its first section is `admissibleFrom` that head's, and `--both-layouts` fits it
 *   at depth 0 and then at depth 1 from that fit, as `FamilyConicBody` fits a limb;
 * - the whole arm, `node .shots/esbuild/FamilyConicArmRule.cjs arm --wall=<the head's directory> --splice=stored@291.36+-8.64`: the head's
 *   knots before 291.36 mm and the stored arm's from there on, re-dated by `OFFSET_MM` and held at the join in value and second derivative
 *   (`FamilyConicBody`'s splice); the head's hollows that start before the join are kept and the stored nets past it carried.
 * - the package, `node .shots/esbuild/FamilyConicArmRule.cjs --rebase=<the whole arm's directory>` (`rebase`).
 * Every other flag is `FamilyConicBody`'s.
 */
namespace FamilyConicArmRule {
  /**
   * The first station of the head's domain, mm: from where the depth-1 start `FamilyConicBody` gives the fit (a depth-0 head's values cut at
   * every arc's median, `FamilyConicFit.refine`, on its knots) is admissible at every following station 0.25 mm apart, by the fit's own test
   * (`FamilyConicFit.fit`'s `admissible`: a conic chain, its least tangent meeting at or above the margin, every share inside (0, 1), each
   * raw and as stored). The sections the band replaces carry no form, only an admissible chain to hang the band on, and the slit's mouth
   * makes the first millimetres inadmissible (the depth-1 start refused 4.00 to 6.50 mm, arc 0, meetings 0.025 to 0.095 under 0.1); so the
   * head starts past them and is not seeded round them (the supervisor's ruling).
   */
  export async function admissibleFrom(directory: string): Promise<number> {
    const wall: { knots: number[]; values: number[][] } = JSON.parse(await fs.readFile(path.join(directory, "arm.family.json"), "utf8")) as { knots: number[]; values: number[][] };
    const layout: C.ILayout = C.limb(1);
    const units: C.Unit[] = C.units(layout);
    const start: number[][] = F.refine(wall.values, 0);
    const stored: number[][] = start.map((field: number[], f: number): number[] => field.map((y: number): number => (units[f] === "mm" ? Math.round(y * 100) / 100 : Math.round(y * 1e4) / 1e4)));
    const shares: number[] = units.map((unit: C.Unit, f: number): number => (unit === "share" ? f : -1)).filter((f: number): boolean => f >= 0);
    const admissible = (t: number[]): boolean => C.chain(t, layout).fault === null && Math.min(...F.leastMeetings(t, layout)) >= F.ADMISSIBLE_MARGIN && shares.every((f: number): boolean => t[f]! > 0 && t[f]! < 1);
    let first: number = wall.knots[0]!;
    for (let s: number = wall.knots[0]!; s <= wall.knots.at(-1)! + 1e-9; s += 0.25) if (!admissible(F.at(wall.knots, start, s)) || !admissible(F.at(wall.knots, stored, s))) first = s + 0.25;
    return first;
  }

  /**
   * How much later along the girdle's course the earlier course's stations stand past the elbow's turn, mm: from today's 289.0 mm (the
   * girdle's 280.36) on, the two courses' frames agree within 0.05 mm and 0.05 degrees on the tilted armscye plane (`FamilyConicArmscyeRule
   * chart`); they stand earlier, so the shift is negative.
   */
  const OFFSET_MM: number = -8.64;

  /**
   * Where the head's fit ends, mm on the girdle's course: 38.64 mm past the join at 291.36 (the stored arm's knot at 300 re-dated, the
   * first whose frames agree), so the head's last knots before the join are fitted on sections either side of it.
   */
  const HEAD_TO_MM: number = 330;

  /** How far lateral of the girdle's plane the arm's skin starts, mm: the earlier fit's margin past its own plane (the supervisor's ruling). */
  const CLIP_MM: number = 2;

  /** The first section past the clip, mm on the course: 2 mm past it, as the earlier fit's first section stood 2 mm past its plane. */
  const FIRST_MM: number = CLIP_MM + 2;

  /** The stored arm's station constants on the earlier course, mm (`FamilyConicBody`'s `KNUCKLE` and `PALM`, and the arm's rounds). */
  const KNUCKLE_END_MM: number = 595;
  const KNUCKLE_RELIEF_MM: number = 575;
  const CAP_MM: number = 570.45;
  const ROUNDS: Record<string, [number, number]> = { fore: [300, 440], hand: [400, 575], palm: [545, 610] };

  /** The segment each leg of the girdle's course lies on, as `FamilyConicRebase` assigns the arm's: the first leg through the shoulder in the thorax. */
  const LEGS: string[] = ["thorax", "humerus", "forearm", "hand", "hand"];

  /**
   * `--rebase=<directory>`: the arm a whole-arm run wrote (`AutoMovieHumanF1Arm.ts` beside its receipt) written into the Human package on the
   * girdle's course, as `FamilyConicRebase.ts` re-bases a fitted module: its centres the girdle's (`AutoMovieHumanF1Girdle.course`, read at
   * first use) and its first half the rule's (`HALF_MM`); and each relief's `axis` and `turn` (`AutoMovieHumanF1Arm.placing.json`) entered in
   * `AutoMovieHumanF1Placing.DIRECTIONS` in the frame of the course's leg its window's middle lies on, the arm's earlier entries replaced.
   */
  async function rebase(directory: string): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const f1: string = path.join(root, "packages/human/src/generation/f1");
    let text: string = await fs.readFile(path.join(directory, "AutoMovieHumanF1Arm.ts"), "utf8");
    const placing: { directions: Record<string, number[]> } = JSON.parse(await fs.readFile(path.join(directory, "AutoMovieHumanF1Arm.placing.json"), "utf8")) as { directions: Record<string, number[]> };
    const family: { reliefs?: { name: string; stations: [number, number] }[] } = JSON.parse(await fs.readFile(path.join(directory, "arm.family.json"), "utf8")) as { reliefs?: { name: string; stations: [number, number] }[] };
    const swap = (old: string | RegExp, next: string): void => {
      if (typeof old === "string" ? !text.includes(old) : !old.test(text)) throw new Error("rebase: the emitted module has no " + String(old));
      text = text.replace(old, next);
    };
    swap("  centres: AutoMovieHumanF1Girdle.course(),", "  // The girdle's course (`AutoMovieHumanF1Girdle`): computed from the trunk's own wall and the skeleton, once, at first use.\n  get centres(): [number, number, number][] {\n    return AutoMovieHumanF1Girdle.course().map((c: [number, number, number]): [number, number, number] => [c[0], c[1], c[2]]);\n  },");
    swap(/^ {2}halves: \[[^\]]*\],$/m, "  halves: [AutoMovieHumanF1Girdle.HALF_MM, 30, 10, 16],");
    swap('import { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";', 'import { AutoMovieHumanF1Girdle } from "./AutoMovieHumanF1Girdle";\nimport { AutoMovieHumanF1Placement } from "./AutoMovieHumanF1Placement";');

    // Each direction in the frame of the leg its relief's window's middle lies on: the leg whose straight run passes nearest that point.
    const course: [number, number, number][] = AutoMovieHumanF1Girdle.course();
    const axis = AutoMovieHumanConicLoft.axis({ centres: course, halves: [AutoMovieHumanF1Girdle.HALF_MM, 30, 10, 16], up: AutoMovieHumanF1Placement.direction("arm.up") });
    const legOf = (station: number): number => {
      const p: number[] = axis.at(station).origin;
      let best: { d: number; leg: number } = { d: Infinity, leg: 0 };
      for (let k: number = 0; k + 1 < course.length; ++k) {
        const [a, b] = [course[k]!, course[k + 1]!];
        const e: number[] = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
        const w: number = Math.max(0, Math.min(1, ((p[0]! - a[0]) * e[0]! + (p[1]! - a[1]) * e[1]! + (p[2]! - a[2]) * e[2]!) / (e[0]! ** 2 + e[1]! ** 2 + e[2]! ** 2)));
        const d: number = Math.hypot(p[0]! - a[0] - w * e[0]!, p[1]! - a[1] - w * e[1]!, p[2]! - a[2] - w * e[2]!);
        if (d < best.d) best = { d, leg: k };
      }
      return best.leg;
    };
    const entries: string[] = Object.entries(placing.directions)
      .filter(([name]: [string, number[]]): boolean => name !== "arm.up")
      .map(([name, world]: [string, number[]]): string => {
        const relief = (family.reliefs ?? []).find((r: { name: string }): boolean => name === r.name + ".axis" || name === r.name + ".turn");
        if (relief === undefined) throw new Error("rebase: no relief for the direction " + name);
        const [from, to]: [number, number] = relief.stations;
        const middle: number = (from + to) / 2;
        const leg: string = LEGS[legOf(middle)]!;
        const local: number[] = AutoMovieHumanSegmentFrame.toLocalDirection(AutoMovieHumanF1Placement.frame(leg), world as [number, number, number]);
        const [first, last]: string[] = [LEGS[legOf(from)]!, LEGS[legOf(to)]!];
        const note: string = first === last ? "" : `, "note": "window ${from} to ${to} mm runs from the ${first} to the ${last}; its middle at ${middle} mm lies on the ${leg}"`;
        return `    ${JSON.stringify(name)}: {"frame": ${JSON.stringify(leg)}, "local": [${local.join(", ")}]${note}},`;
      });
    const placingFile: string = path.join(f1, "AutoMovieHumanF1Placing.ts");
    const lines: string[] = (await fs.readFile(placingFile, "utf8")).split("\n");
    const kept: string[] = lines.filter((line: string): boolean => !(line.startsWith('    "arm.') && !line.startsWith('    "arm.up"')));
    const at: number = kept.findIndex((line: string): boolean => line.startsWith('    "arm.up"'));
    if (at < 0) throw new Error("rebase: the placing table has no arm.up");
    kept.splice(at + 1, 0, ...entries);
    // One write each, the module first: its directions are read by name at run time only, so either order compiles.
    await fs.writeFile(path.join(f1, "AutoMovieHumanF1Arm.ts"), text);
    await fs.writeFile(placingFile, kept.join("\n"));
    process.stdout.write(`rebased the arm from ${directory}: ${entries.length} directions\n`);
  }

  export async function main(): Promise<void> {
    const from: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--rebase="))?.slice("--rebase=".length);
    if (from !== undefined) return rebase(from);
    const whole: boolean = process.argv.some((argument: string): boolean => argument.startsWith("--wall="));
    const admissibleWall: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--admissible-from="))?.slice("--admissible-from=".length);
    const firstMm: number = admissibleWall === undefined ? FIRST_MM : Math.max(FIRST_MM, await admissibleFrom(admissibleWall));
    process.stdout.write(JSON.stringify({ event: "arm-rule-first", first: firstMm, from: admissibleWall ?? "the clip plus 2 mm" }) + "\n");
    FamilyConicBody.OVERRIDES.set("arm", (part: FamilyConicBody.IPart, joint: (name: string) => R.V): FamilyConicBody.IPart => {
      const { point, normal } = AutoMovieHumanF1Girdle.plane();
      // The thumb past where it stands free of the palm is not the arm's, as `FamilyConicBody` reads it.
      const thumbOut = (p: R.V): number => {
        const a: R.V = joint("thumb_01_r");
        const b: R.V = joint("thumb_03_r");
        const length: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
        const along: number = ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1]) + (p[2] - a[2]) * (b[2] - a[2])) / length;
        return Math.min(along - 40, 16 - Math.hypot(p[0] - a[0] - (along * (b[0] - a[0])) / length, p[1] - a[1] - (along * (b[1] - a[1])) / length, p[2] - a[2] - (along * (b[2] - a[2])) / length));
      };
      // Left out where positive: the skin medial of the girdle's plane moved `CLIP_MM` out.
      const girdle = (p: R.V): number => CLIP_MM - ((p[0] - point[0]) * normal[0] + (p[1] - point[1]) * normal[1] + (p[2] - point[2]) * normal[2]);
      const { opening: _opening, around: _around, ...rest } = part;
      void _opening;
      void _around;
      return {
        ...rest,
        centres: AutoMovieHumanF1Girdle.course().map((c: [number, number, number]): R.V => [c[0], c[1], c[2]]),
        course: "AutoMovieHumanF1Girdle.course()",
        halves: [AutoMovieHumanF1Girdle.HALF_MM, 30, 10, 16],
        up: AutoMovieHumanF1Placement.direction("arm.up") as R.V,
        domain: [firstMm, whole ? KNUCKLE_END_MM + OFFSET_MM : HEAD_TO_MM],
        // Round the shoulder's turn the cap's top sweeps faster than the station, so knots may stand 6 mm apart there, as before.
        gap: (s: number): number => (s < 2 * AutoMovieHumanF1Girdle.HALF_MM ? 6 : 12),
        tip: KNUCKLE_END_MM + 15 + OFFSET_MM,
        cap: CAP_MM + OFFSET_MM,
        reliefEnd: KNUCKLE_RELIEF_MM + OFFSET_MM,
        // The stored arm's nets round its runs, the forearm's and the hand's, re-dated; the palm's net is the hand family's (`hand.palm`) and
        // lies past the arm's open end (`ARM_TO_MM`), so the arm does not carry one.
        rounds: (part.rounds ?? []).filter((round): boolean => round.name !== "palm").map((round) => ({ ...round, stations: [ROUNDS[round.name]![0] + OFFSET_MM, ROUNDS[round.name]![1] + OFFSET_MM] as [number, number] })),
        clip: (p: R.V): number => Math.max(thumbOut(p), girdle(p)),
        // The stored arm's layout, the limb of depth 1: the head and the held tail are one wall, and a splice joins walls of one layout. Left
        // to choose, the head took the limb of depth 0 (12 fields against the stored 20) and the splice was refused.
        // With `--both-layouts` the head is fitted as `FamilyConicBody` fits a limb, depth 0 and then depth 1 from its projection (with
        // `--seeds`, the sections where that projected seed is no admissible chain are listed). From each section's own seed alone, depth 1
        // stalled at 1.0 mm mean and 11.7 mm at most against depth 0's 0.17 and 1.31.
        layouts: process.argv.includes("--both-layouts") ? part.layouts : part.layouts.filter((layout: { depth: number }): boolean => layout.depth === 1),
      };
    });
    await FamilyConicBody.main();
  }
}
void FamilyConicArmRule.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
