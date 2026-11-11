import fs from "node:fs/promises";
import path from "node:path";
import { type AutoMovieConstructionRealization, AutoMovieLoftChain, type AutoMovieViewLoft, realizeAutoMovieConstruction } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanF1 } from "@automovie/human";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/**
 * The sewn body of `AutoMovieHumanF1.construction()` on its own: the engine's
 * diagnostics for the crotch split and both armscye ports, the chains it
 * publishes, and the skin under four cameras framed on the skin itself.
 *
 * It first proves `AutoMovieHumanConicLoft.mirror` on the arm and the leg: the
 * twin's loft is compared point for point with the reflected original.
 */
namespace FamilyConicTree {
  /** Realize the body and report it. */
  export async function main(): Promise<void> {
    for (const family of [AutoMovieHumanF1.BODY.arm, AutoMovieHumanF1.BODY.leg]) {
      const count: number = Math.ceil((family.knots.at(-1)! - family.knots[0]!) / 10) + 1;
      const stations: number[] = Array.from({ length: count }, (_: unknown, i: number): number => family.knots[0]! + ((family.knots.at(-1)! - family.knots[0]!) * i) / (count - 1));
      const one: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(family, stations);
      const two: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(AutoMovieHumanConicLoft.mirror(family, family.name + ".mirror"), stations);
      if (one.chain === null || two.chain === null) throw new Error("mirror: " + family.name + " does not loft: " + JSON.stringify([one.diagnostics, two.diagnostics]).slice(0, 600));
      let worst: number = 0;
      for (const s of stations)
        for (let j: number = 0; j < 90; ++j) {
          const phi: number = (2 * Math.PI * j) / 90;
          const p: number[] = AutoMovieLoftChain.point(one.chain, s, phi);
          const q: number[] = AutoMovieLoftChain.point(two.chain, s, -phi);
          worst = Math.max(worst, Math.hypot(p[0]! - q[0]!, p[1]! - q[1]!, p[2]! + q[2]!));
        }
      process.stdout.write(JSON.stringify({ mirror: family.name, worstMm: worst }) + "\n");
    }
    // The authored numbers: per family its knots, section fields and conic numbers (a knot's station and one value per field), and the heights
    // its reliefs store; then the totals, a twin counted once since it is derived.
    const counted = AutoMovieHumanF1.FAMILIES.map((m: AutoMovieHumanF1.IMember): { name: string; knots: number; fields: number; conic: number; reliefs: number; heights: number } => ({
      name: m.family.name,
      knots: m.family.knots.length,
      fields: m.family.values.length,
      conic: m.family.knots.length * (1 + m.family.values.length),
      reliefs: m.family.reliefs?.length ?? 0,
      heights: (m.family.reliefs ?? []).reduce((sum: number, relief: { heights: number[] }): number => sum + relief.heights.length, 0),
    }));
    process.stdout.write(JSON.stringify({ families: counted.length, conicNumbers: counted.reduce((s, c) => s + c.conic, 0), sectionFieldCurves: counted.reduce((s, c) => s + c.fields, 0), reliefNets: counted.reduce((s, c) => s + c.reliefs, 0), reliefHeightsStored: counted.reduce((s, c) => s + c.heights, 0), each: counted.map((c) => c.name + ":" + c.knots + "k*" + c.fields + "f=" + c.conic + (c.heights > 0 ? "+" + c.heights + "h" : "")).join(" ") }) + "\n");
    if (process.argv.includes("--count")) return;

    // `FamilyConicTree.ts [layerMm] [chordMm]`: the families' layer spacing and the tessellation chord, to weigh time against the skin.
    const layer: number = Number(process.argv[2] ?? "2");
    const chord: number = Number(process.argv[3] ?? "1") / 1000;
    const declared: AutoMovieHumanF1.IConstruction = AutoMovieHumanF1.construction(layer);
    const started: number = performance.now();
    const real: AutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction({ name: "f1.body", root: declared.root }, { chord, sources: declared.sources });
    const report = { layerMm: layer, chordMm: chord * 1000, milliseconds: Math.round(performance.now() - started), diagnostics: real.diagnostics, chains: real.chains.map((c: { name: string }): string => c.name), vertices: real.mesh.positions.length / 3, triangles: real.mesh.indices.length / 3 };
    process.stdout.write(JSON.stringify(report).slice(0, 4000) + "\n");
    if (real.mesh.positions.length === 0) return;
    const out: string = path.join(path.resolve(process.cwd(), ".."), "test/.shots/family-conic-tree", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const mesh: N.Mesh = { id: "body", positions: Array.from(real.mesh.positions), indices: Array.from(real.mesh.indices), colour: [0.64, 0.65, 0.67] };
    const bounds: N.Point[] = [];
    for (let i: number = 0; i < mesh.positions.length; i += 3) bounds.push([mesh.positions[i]!, mesh.positions[i + 1]!, mesh.positions[i + 2]!]);
    NodeCanvasRaster.initialize();
    for (const view of ["front", "back", "left", "high-oblique", "low-oblique"]) await fs.writeFile(path.join(out, "tree." + view + ".png"), NodeCanvasRaster.render(NodeCanvasCamera.fit(view, bounds, 900, 1300), [mesh], [], "depth", "f1 | body | " + view).png);
    await fs.writeFile(path.join(out, "receipt.json"), JSON.stringify(report, null, 2));
    process.stdout.write(JSON.stringify({ out }) + "\n");
  }
}
void FamilyConicTree.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
