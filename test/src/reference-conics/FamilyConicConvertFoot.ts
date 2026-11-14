import path from "node:path";
import { ConicPaperInput as I } from "./ConicPaperInput";
import { FamilyConicConvert as T } from "./FamilyConicConvert";
import type { FamilyConicSection as C } from "./FamilyConicSection";

/**
 * The foot's region entry of the conversion tool (#3401's proof): the reference pack's eight level loops of the left foot and ankle from
 * 43.8 to 113.8 mm high (sections 79 to 86, `foot_l` then `leg_l`), each loop's cubic spans sampled 24 to a span in the level plane's chart
 * (`x` forward, `z` to the left, so `z x x` is up), about its own area centroid, converted at the layout tolerance and the ladder.
 *
 * Run from `test` after bundling: `node <bundle>/FamilyConicConvertFoot.cjs`.
 */
export namespace FamilyConicConvertFoot {
  /** The pack's section indices of the eight loops. */
  const SECTIONS: readonly number[] = [79, 80, 81, 82, 83, 84, 85, 86];

  /** The pack's regions of the left foot and the ankle above it. */
  const REGIONS: readonly string[] = ["foot_l", "leg_l"];

  /** Samples per cubic span. */
  const PER_SPAN: number = 24;

  export async function main(): Promise<void> {
    const packet: I.Packet = await I.load(path.resolve(process.cwd(), ".."));
    const sections: T.ISection[] = SECTIONS.map((index: number): T.ISection => {
      const loop: I.Loop | undefined = packet.loops.find((l: I.Loop): boolean => l.section === index && REGIONS.includes(l.region));
      if (loop === undefined) throw new Error("No left-foot loop in the pack's section " + index);
      const points: C.P[] = loop.curve.spans.flatMap((span: I.Span): C.P[] => Array.from({ length: PER_SPAN }, (_: unknown, k: number): C.P => [...I.value(span, k / PER_SPAN, 0)] as C.P));
      // The area centroid, the course point the section is read about.
      let area: number = 0, cx: number = 0, cz: number = 0;
      points.forEach((p: C.P, k: number): void => {
        const q: C.P = points[(k + 1) % points.length]!;
        const cross: number = p[0] * q[1] - q[0] * p[1];
        area += cross;
        cx += (p[0] + q[0]) * cross;
        cz += (p[1] + q[1]) * cross;
      });
      const c: C.P = [cx / (3 * area), cz / (3 * area)];
      const shifted: C.P[] = points.map((p: C.P): C.P => [p[0] - c[0], p[1] - c[1]]);
      return { s: Math.round(loop.heightMm * 10) / 10, points: area > 0 ? shifted : shifted.reverse() };
    });
    await T.report("foot", sections, { ladder: T.LADDER, note: "the pack's left foot and ankle loops, sections " + SECTIONS.join(",") + ", about each loop's area centroid in (x forward, z left)" });
  }
}

if (/FamilyConicConvertFoot\.c?[jt]s$/.test(process.argv[1] ?? "")) T.run(FamilyConicConvertFoot.main);
