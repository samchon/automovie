import fs from "node:fs/promises";
import path from "node:path";
import { AutoMovieLoftChain, AutoMovieViewLoft } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanConicSection, AutoMovieHumanF1 } from "@automovie/human";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/**
 * Whether the engine closes a conic family's end in a pole: the named family is given a tip a stated distance past its last knot (and, with a
 * second distance, before its first), lofted, and its layers, diagnostics and skin are reported.
 *
 * Usage: `FamilyConicTip.ts <family> <topMm|-|=> [bottomMm] [--bare] [--from=<station>]`; `=` keeps the family's own tips.
 */
namespace FamilyConicTip {
  /** Loft one family with tips and report it. */
  export async function main(): Promise<void> {
    const [name, top, bottom]: string[] = process.argv.slice(2);
    const member: AutoMovieHumanF1.IMember | undefined = AutoMovieHumanF1.FAMILIES.find((m: AutoMovieHumanF1.IMember): boolean => m.family.name === name);
    if (member === undefined) throw new Error("no family named " + name);
    const from: number = member.family.knots[0]!;
    const to: number = member.family.knots.at(-1)!;
    // `--bare` drops the reliefs, to see the wall alone; `--from=<station>` shows only the layers past a station.
    const bare: boolean = process.argv.includes("--bare");
    const least: number = Number(process.argv.find((argument: string): boolean => argument.startsWith("--from="))?.slice(7) ?? "-Infinity");
    const family: AutoMovieHumanConicLoft.IFamily = top === "=" ? { ...member.family, ...(bare ? { reliefs: [] } : {}) } : { ...member.family, tips: [bottom === undefined ? null : { from, tip: from - Number(bottom) }, top === undefined || top === "-" ? null : { from: to, tip: to + Number(top) }] };

    // `--family=<file>` reads a stored family instead; `--probe` lists where the section model itself or the engine's reading between the
    // part's stations loses a chain, a tenth of a millimetre at a time.
    const stored: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--family="))?.slice(9);
    if (stored !== undefined) Object.assign(family, JSON.parse(await fs.readFile(stored, "utf8")) as AutoMovieHumanConicLoft.IFamily, bare ? { reliefs: [] } : {});
    if (process.argv.includes("--probe")) {
      const read: (s: number) => number[] = AutoMovieHumanConicLoft.reader(family);
      const a: number = family.knots[0]!;
      const b: number = family.knots.at(-1)!;
      const model: string[] = [];
      for (let s: number = a; s <= b; s += 0.1) {
        const fault: string | null = AutoMovieHumanConicSection.chain(read(s), family.layout).fault;
        if (fault !== null) model.push(s.toFixed(1) + ": " + fault.slice(0, 60));
      }
      const fine: number[] = Array.from({ length: Math.round((b - a) * 4) + 1 }, (_: unknown, i: number): number => a + i / 4);
      const coarse: number[] = Array.from({ length: Math.ceil((b - a) / 2) + 1 }, (_: unknown, i: number): number => a + ((b - a) * i) / Math.ceil((b - a) / 2));
      const part = AutoMovieHumanConicLoft.part({ ...family, tips: undefined }, coarse);
      const engine: string[] = AutoMovieViewLoft.create({ ...part, stations: [...new Set([...fine, ...part.stations])].sort((p: number, q: number): number => p - q) }).diagnostics.map((d: { detail: string }): string => d.detail.slice(0, 110));
      process.stdout.write(JSON.stringify({ requested: coarse.length, handed: part.stations.length, modelFaults: model.slice(0, 12), modelFaultCount: model.length, engineFaults: engine.slice(0, 12), engineFaultCount: engine.length }, null, 1) + "\n");
      return;
    }
    const count: number = Math.ceil((to - from) / 2) + 1;
    const loft: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(family, Array.from({ length: count }, (_: unknown, i: number): number => from + ((to - from) * i) / (count - 1)));
    process.stdout.write(JSON.stringify({ family: name, tips: family.tips, diagnostics: loft.diagnostics, lofted: loft.chain !== null }).slice(0, 3000) + "\n");
    if (loft.chain === null) return;
    const chain: NonNullable<AutoMovieViewLoft.IResult["chain"]> = loft.chain;
    const layers: number[] = chain.layers.map((layer: { y: number }): number => layer.y).filter((y: number): boolean => y >= least);
    process.stdout.write(JSON.stringify({ layers: layers.length, first: layers.slice(0, 6), last: layers.slice(-8), pole: (chain as { pole?: unknown }).pole ?? null }) + "\n");
    const phases: number = 96;
    const positions: number[] = [];
    const indices: number[] = [];
    for (const s of layers) for (let j: number = 0; j < phases; ++j) positions.push(...AutoMovieLoftChain.point(chain, s, (2 * Math.PI * j) / phases).map((x: number): number => x / 1000));
    for (let i: number = 0; i + 1 < layers.length; ++i)
      for (let j: number = 0; j < phases; ++j) {
        const a: number = i * phases + j;
        const b: number = i * phases + ((j + 1) % phases);
        indices.push(a, a + phases, b, b, a + phases, b + phases);
      }
    const out: string = path.join(path.resolve(process.cwd(), ".."), "test/.shots/family-conic-tip", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const mesh: N.Mesh = { id: name!, positions, indices, colour: [0.64, 0.65, 0.67] };
    const bounds: N.Point[] = [];
    for (let i: number = 0; i < positions.length; i += 3) bounds.push([positions[i]!, positions[i + 1]!, positions[i + 2]!]);
    NodeCanvasRaster.initialize();
    for (const view of ["front", "left", "high-oblique", "low-oblique"]) await fs.writeFile(path.join(out, "tip." + view + ".png"), NodeCanvasRaster.render(NodeCanvasCamera.fit(view, bounds, 700, 700), [mesh], [], "depth", "f1 | " + name + " tip | " + view).png);
    process.stdout.write(JSON.stringify({ out }) + "\n");
  }
}
void FamilyConicTip.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
