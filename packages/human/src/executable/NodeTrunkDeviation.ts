import fs from "node:fs";
import path from "node:path";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanTrunkComposedSection } from "../generation/trunk/AutoMovieHumanTrunkComposedSection";
import { AutoMovieHumanTrunkS00 } from "../generation/trunk/AutoMovieHumanTrunkS00";
import { AutoMovieHumanTrunkSpecLandmarks } from "../generation/trunk/AutoMovieHumanTrunkSpecLandmarks";
import { HumanNodeInput } from "./HumanNodeInput";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeArmDraw } from "./NodeArmDraw";
import { NodeTrunkReference } from "./NodeTrunkReference";

type V3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * S00's composed sections against f1's exact horizontal cuts, read in one
 * round (`node:trunk-deviation`, diagnostic only; nothing feeds generation):
 *
 * - a radial deviation table: every 10 mm from the crotch ring to the
 *   neck-base end and every 15 degrees of phase about S00's section axis
 *   (phase 0 anterior, 90 the subject's right), her skin's radius less ours
 *   along the ray, where hers is the crossing of her cut nearest ours along
 *   that ray (so a touching arm, a crossing farther out, does not stand in
 *   for her trunk) and blank when none lies within 60 mm;
 * - a sheet of top-view section pairs at 25 heights: ours (orange) over her
 *   cut (grey), each pair at its own grid cell, front up and the subject's
 *   right to the right.
 *
 * The reference is registered as the trunk renderer registers it
 * (`NodeTrunkReference.register`: X by her jugular notch on our IJ, Z by her
 * median plane, heights kept). Output under `.shots/f1_trunk2/deviation-<stamp>/`.
 */
export namespace NodeTrunkDeviation {
  /** The sheet's section heights, world mm: the girth sites, the groin, the breasts and the shoulder bar. */
  export const SHEET: number[] = [815, 845, 870, 886, 915, 940, 965, 993, 1020, 1050, 1100, 1150, 1205, 1230, 1255, 1280, 1310, 1340, 1370, 1395, 1405, 1415, 1425, 1435, 1445];

  /** Reads and writes the table and the sheet. */
  export async function run(): Promise<void> {
    const person: Awaited<ReturnType<typeof HumanNodeInput.of>> = await HumanNodeInput.of();
    const s00: AutoMovieHumanTrunkS00.IOutput = AutoMovieHumanTrunkS00.of(person.parameters);
    const at = (name: string): V3 => {
      const l: AutoMovieHumanTrunkSpecLandmarks.ILandmark = AutoMovieHumanTrunkSpecLandmarks.get(s00.datums.landmarks, name);
      return AutoMovieHumanArmCurveSpec.apply(s00.datums.frames.world(l.frame), l.point);
    };
    const reference: NodeTrunkReference.IRegistered = NodeTrunkReference.register(NodeTrunkReference.load(1), { ij: at("IJ"), c7: at("C7") });
    const source: AutoMovieHumanTrunkComposedSection.ISource = s00.curves.source;
    const bottom: number = s00.curves.bottom;
    const top: number = s00.curves.top;
    const axisX = (y: number): number => source.axis?.(y) ?? s00.curves.axis.xs;

    // Her cut and our ring at a height, both as [x, z] segments.
    const hers = (y: number): [[number, number], [number, number]][] =>
      NodeTrunkReference.cut(reference.mesh, [0, 1, 0], y)
        .filter(([a, b]: [V3, V3]): boolean => Math.abs(a[2]) < 280 && Math.abs(b[2]) < 280)
        .map(([a, b]: [V3, V3]): [[number, number], [number, number]] => [
          [a[0], a[2]],
          [b[0], b[2]],
        ]);
    const ours = (y: number): [number, number][] => AutoMovieHumanTrunkComposedSection.ring(source, y, 720);
    const loopSegments = (ring: [number, number][]): [[number, number], [number, number]][] => ring.map((p: [number, number], i: number): [[number, number], [number, number]] => [p, ring[(i + 1) % ring.length]!]);
    // Ray parameters of every crossing of the ray from o along d with the segments.
    const crossings = (segs: [[number, number], [number, number]][], o: [number, number], d: [number, number]): number[] => {
      const out: number[] = [];
      for (const [a, b] of segs) {
        const e: [number, number] = [b[0] - a[0], b[1] - a[1]];
        const den: number = d[0] * e[1] - d[1] * e[0];
        if (Math.abs(den) < 1e-12) continue;
        const w: [number, number] = [a[0] - o[0], a[1] - o[1]];
        const t: number = (w[0] * e[1] - w[1] * e[0]) / den;
        const u: number = (w[0] * d[1] - w[1] * d[0]) / den;
        if (t > 0 && u >= 0 && u <= 1) out.push(t);
      }
      return out;
    };

    // The deviation table.
    const phases: number[] = Array.from({ length: 24 }, (_: unknown, k: number): number => k * 15);
    const rows: (number | null)[][] = [];
    const heights: number[] = [];
    for (let y: number = Math.ceil(bottom / 10) * 10; y < top; y += 10) heights.push(y);
    for (const y of heights) {
      const mine: [[number, number], [number, number]][] = loopSegments(ours(y));
      const her: [[number, number], [number, number]][] = hers(y);
      const o: [number, number] = [axisX(y), 0];
      rows.push(
        phases.map((deg: number): number | null => {
          const d: [number, number] = [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)];
          const r: number = Math.max(...crossings(mine, o, d));
          const near: number[] = crossings(her, o, d).filter((t: number): boolean => Math.abs(t - r) <= 60);
          if (!Number.isFinite(r) || near.length === 0) return null;
          const t: number = near.reduce((a: number, b: number): number => (Math.abs(b - r) < Math.abs(a - r) ? b : a));
          return Math.round((t - r) * 10) / 10;
        }),
      );
    }
    const table: string[] = [
      "her radius less ours along the ray from S00's section axis, mm (+ she stands outside us); phase 0 anterior, 90 the subject's right, 180 posterior, 270 the left",
      ["y \\ deg", ...phases.map((p: number): string => String(p))].map((c: string): string => c.padStart(7)).join(""),
      ...heights.map((y: number, i: number): string => [String(y), ...rows[i]!.map((v: number | null): string => (v === null ? "." : v.toFixed(1)))].map((c: string): string => c.padStart(7)).join("")),
    ];

    // The section sheet.
    const columns: number = 5;
    const cell: { z: number; x: number } = { z: 460, x: 340 };
    const place = (k: number, p: [number, number], y: number): V3 => [p[0] - Math.floor(k / columns) * cell.x, y, p[1] + (k % columns) * cell.z];
    const bounds: V3[] = [];
    SHEET.forEach((y: number, k: number): void => {
      bounds.push(place(k, [180, -230], y), place(k, [-180, 230], y));
    });
    const v: NodeArmDraw.IView = NodeArmDraw.open([0, -1, 0], bounds);
    SHEET.forEach((y: number, k: number): void => {
      for (const [a, b] of hers(y)) NodeArmDraw.line(v, [place(k, a, y), place(k, b, y)], "#707070", 1.6);
      const ring: [number, number][] = ours(y);
      NodeArmDraw.line(v, [...ring, ring[0]!].map((p: [number, number]): V3 => place(k, p, y)), "#ff6a00", 1.6);
      NodeArmDraw.dots(v, [place(k, [axisX(y), 0], y)], "#000000", 3);
      NodeArmDraw.text(v, place(k, [175, -220], y), `${y}`, "#202020");
    });
    NodeArmDraw.caption(v, ["f1 trunk S00 sections (orange) over her exact cuts (grey), top view: front up, the subject's right to the right; black dot S00's section axis"]);

    const stamp: string = new Date().toISOString().replace(/[:.]/g, "-");
    const out: string = HumanNodePaths.resolve(`packages/human/.shots/f1_trunk2/deviation-${stamp}`);
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, "sections.png"), NodeArmDraw.png(v));
    fs.writeFileSync(path.join(out, "deviation.txt"), table.join("\n") + "\n");
    fs.writeFileSync(path.join(out, "deviation.json"), JSON.stringify({ phases, heights, rows, registration: reference.measures, diagnostics: s00.curves.diagnostics }));
    console.log(table.join("\n"));
    console.log(out);
  }
}

void NodeTrunkDeviation.run().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
