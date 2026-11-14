import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import { AutoMovieHumanF1 } from "@automovie/human";
import { realizeAutoMovieConstruction } from "@automovie/engine";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import { FamilyConicSource as R } from "./FamilyConicSource";

/**
 * The whole generated f1 beside its reference: the figure comes from
 * `AutoMovieHumanF1.create()` alone, the reference mesh is loaded only to be
 * drawn in the neighbouring frame under the same camera, light and material.
 */
namespace FamilyConicFigure {
  /** Render the comparison frames and write their receipt. */
  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const out: string = path.join(root, "test/.shots/family-conic-figure", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });

    // `--bare=<name,...>` drops the named reliefs from the body's families, to see what the wall alone draws under them.
    const bare: string[] = (process.argv.find((arg: string): boolean => arg.startsWith("--bare="))?.slice("--bare=".length) ?? "").split(",").filter((name: string): boolean => name.length > 0);
    if (bare.length > 0)
      for (const family of Object.values(AutoMovieHumanF1.BODY)) family.reliefs = family.reliefs?.filter((relief): boolean => !bare.includes(relief.name));

    // Generation first, timed, before any reference byte is read.
    const started: number = performance.now();
    const pieces: AutoMovieHumanF1.IPiece[] = AutoMovieHumanF1.create();
    const generationMs: number = performance.now() - started;

    // `--owners`: the sewn skin realized once more, each triangle coloured by the face that owns it (two of its corners agree; else the
    // middle one's), so a close frame shows which part, band or blend draws what it sees. The colours are listed in the receipt.
    const owned: { meshes: N.Mesh[]; legend: { name: string; rgb: number[] }[] } | null = !process.argv.includes("--owners")
      ? null
      : ((): { meshes: N.Mesh[]; legend: { name: string; rgb: number[] }[] } => {
          const declared = AutoMovieHumanF1.construction();
          const mesh = realizeAutoMovieConstruction({ name: "f1.body", root: declared.root, fills: declared.fills }, { chord: 0.001, sources: declared.sources }).mesh;
          const owner = (v: number): string => mesh.owners[mesh.coordinates[v * 3]!]!;
          const palette: [number, number, number][] = [[0.85, 0.25, 0.25], [0.25, 0.7, 0.3], [0.25, 0.4, 0.9], [0.95, 0.8, 0.2], [0.7, 0.3, 0.8], [0.2, 0.75, 0.8], [0.95, 0.5, 0.15], [0.6, 0.85, 0.3], [0.9, 0.4, 0.65], [0.5, 0.3, 0.15], [0.1, 0.45, 0.35], [0.55, 0.6, 0.95]];
          const groups: Map<string, { positions: number[]; indices: number[] }> = new Map();
          for (let t: number = 0; t < mesh.indices.length / 3; ++t) {
            const names: string[] = [0, 1, 2].map((k: number): string => owner(mesh.indices[t * 3 + k]!));
            const name: string = names[0] === names[1] || names[0] === names[2] ? names[0]! : names[1]!;
            const group = groups.get(name) ?? { positions: [], indices: [] };
            for (let k: number = 0; k < 3; ++k) {
              const v: number = mesh.indices[t * 3 + k]!;
              group.positions.push(mesh.positions[v * 3]!, mesh.positions[v * 3 + 1]!, mesh.positions[v * 3 + 2]!);
            }
            const n: number = group.positions.length / 3;
            group.indices.push(n - 3, n - 2, n - 1);
            groups.set(name, group);
          }
          const names: string[] = [...groups.keys()].sort((a: string, b: string): number => a.localeCompare(b));
          const colour = (name: string): [number, number, number] => (name === "trunk" ? [0.64, 0.65, 0.67] : palette[names.filter((n: string): boolean => n !== "trunk").indexOf(name) % palette.length]!);
          return { meshes: names.map((name: string): N.Mesh => ({ id: name, ...groups.get(name)!, colour: colour(name) })), legend: names.map((name: string) => ({ name, rgb: colour(name).map((x: number): number => Math.round(x * 255)) })) };
        })();
    const faults: { name: string; diagnostics: unknown }[] = pieces.filter((piece: AutoMovieHumanF1.IPiece): boolean => piece.diagnostics.length > 0).map((piece: AutoMovieHumanF1.IPiece): { name: string; diagnostics: unknown } => ({ name: piece.name, diagnostics: piece.diagnostics }));
    const generated: N.Mesh[] = pieces.filter((piece: AutoMovieHumanF1.IPiece): boolean => piece.positions.length > 0).map((piece: AutoMovieHumanF1.IPiece): N.Mesh => ({ id: piece.name, positions: piece.positions, indices: piece.indices, colour: [0.64, 0.65, 0.67] }));
    const source: R.ISource = await R.load(root);
    const reference: N.Mesh[] = [source.body, source.head].map((mesh, i: number): N.Mesh => ({ id: "reference." + i, positions: Array.from(mesh.positions, (x: number): number => x / 1000), indices: Array.from(mesh.indices), colour: [0.64, 0.65, 0.67] }));
    const bounds: N.Point[] = [];
    for (const mesh of reference) for (let i: number = 0; i < mesh.positions.length; i += 3) bounds.push([mesh.positions[i]!, mesh.positions[i + 1]!, mesh.positions[i + 2]!]);
    NodeCanvasRaster.initialize();
    const frames: { file: string; sha256: string }[] = [];
    for (const view of ["front", "back", "left", "right", "high-oblique", "low-oblique"]) {
      const camera: N.Camera = NodeCanvasCamera.fit(view, bounds, 900, 1500);
      for (const [stage, shown] of [["reference", reference], ["generated", generated]] as [string, N.Mesh[]][]) {
        const file: string = "figure." + view + "." + stage + ".png";
        const png: Buffer = NodeCanvasRaster.render(camera, shown, [], "depth", "f1 | " + stage + " | " + view).png;
        await fs.writeFile(path.join(out, file), png);
        frames.push({ file, sha256: createHash("sha256").update(png).digest("hex") });
      }
    }

    // Within `radius` metres of a reference joint, taken on the +Z side.
    const near = (joint: string, radius: number): ((p: N.Point) => boolean) => {
      const at: number[] | undefined = source.joints.get(joint);
      if (at === undefined) throw new Error("no joint " + joint);
      const c: number[] = [at[0]! / 1000, at[1]! / 1000, Math.abs(at[2]!) / 1000];
      return (p: N.Point): boolean => Math.hypot(p[0] - c[0]!, p[1] - c[1]!, p[2] - c[2]!) < radius;
    };
    // Close frames: the same pair framed on the reference's points inside one zone of the figure, metres.
    const zones: [string, (p: N.Point) => boolean][] = [
      ["head", (p: N.Point): boolean => p[1] > 1.45],
      ["hand", (p: N.Point): boolean => p[2] > 0.38 && p[1] > 0.84 && p[1] < 1.04],
      ["foot", (p: N.Point): boolean => p[2] > 0 && p[1] < 0.13],
      ["shoulder", (p: N.Point): boolean => p[2] > 0.06 && p[1] > 1.2 && p[1] < 1.45],
      ["shoulder.twin", (p: N.Point): boolean => p[2] < -0.06 && p[1] > 1.2 && p[1] < 1.45],
      ["ear", (p: N.Point): boolean => p[2] > 0.07 && p[1] > 1.535 && p[1] < 1.61 && p[0] > -0.02 && p[0] < 0.035],
      ["neck", (p: N.Point): boolean => p[1] > 1.42 && p[1] < 1.53 && Math.abs(p[2]) < 0.09],
      ["hip", (p: N.Point): boolean => p[1] > 0.72 && p[1] < 0.98 && Math.abs(p[2]) < 0.22],
      ["chest", (p: N.Point): boolean => p[1] > 1.14 && p[1] < 1.42 && Math.abs(p[2]) < 0.2],
      ["knee", (p: N.Point): boolean => p[2] > 0 && p[1] > 0.38 && p[1] < 0.6],
      ["eyes", (p: N.Point): boolean => p[0] > 0.08 && p[1] > 1.565 && p[1] < 1.62 && Math.abs(p[2]) < 0.06],
      ["mouth", (p: N.Point): boolean => p[0] > 0.09 && p[1] > 1.5 && p[1] < 1.55 && Math.abs(p[2]) < 0.035],
      // The nose's base: its wings, the alar grooves and the nostrils, with a view from below, which the face's zones lack.
      ["nose", (p: N.Point): boolean => p[0] > 0.105 && p[1] > 1.538 && p[1] < 1.568 && Math.abs(p[2]) < 0.024],
      ["fold",(p: N.Point): boolean => p[1] > 1.19 && p[1] < 1.27 && p[2] > 0 && p[2] < 0.13 && p[0] > 0],
      ["toes", (p: N.Point): boolean => p[2] > 0 && p[1] < 0.05 && p[0] > 0.16],
      // The armpit, within 110 mm of the +Z shoulder joint, and the elbow, within 70 mm of the +Z elbow joint, with views from behind and
      // below, which the armscye's folds and the cubital fossa need.
      ["armpit", near("upperarm_l", 0.11)],
      ["elbow", near("lowerarm_l", 0.07)],
    ];
    const views = (zone: string): string[] =>
      zone.startsWith("shoulder") ? ["front", "back", zone === "shoulder" ? "left" : "right", "high-oblique"] : zone === "nose" ? ["front", "left", "high-oblique", "low-oblique"] : zone === "armpit" ? ["front", "back", "left", "high-oblique", "low-oblique"] : zone === "elbow" ? ["front", "back", "left", "high-oblique"] : ["front", "left", "high-oblique"];
    // `--zones=<zone,...>`: only those close frames.
    const only: string[] = (process.argv.find((arg: string): boolean => arg.startsWith("--zones="))?.slice("--zones=".length) ?? "").split(",").filter((name: string): boolean => name.length > 0);
    for (const [zone, inside] of zones) {
      if (only.length > 0 && !only.includes(zone)) continue;
      const near: N.Point[] = bounds.filter(inside);
      for (const view of views(zone)) {
        const camera: N.Camera = NodeCanvasCamera.fit(view, near, 900, 900);
        for (const [stage, shown] of [["reference", reference], ["generated", generated], ...(owned === null ? [] : [["owners", owned.meshes]])] as [string, N.Mesh[]][]) {
          const file: string = zone + "." + view + "." + stage + ".png";
          const png: Buffer = NodeCanvasRaster.render(camera, shown, [], "depth", "f1 | " + stage + " | " + zone + " " + view).png;
          await fs.writeFile(path.join(out, file), png);
          frames.push({ file, sha256: createHash("sha256").update(png).digest("hex") });
        }
      }
    }
    const receipt = { schema: "f1-family-conic-figure-v1", generationMs: Math.round(generationMs), pieces: pieces.map((piece: AutoMovieHumanF1.IPiece): { name: string; vertices: number; triangles: number } => ({ name: piece.name, vertices: piece.positions.length / 3, triangles: piece.indices.length / 3 })), faults, frames, ...(owned === null ? {} : { owners: owned.legend }) };
    await fs.writeFile(path.join(out, "receipt.json"), JSON.stringify(receipt, null, 2));
    process.stdout.write(JSON.stringify({ out, generationMs: receipt.generationMs, pieces: pieces.length, faults }) + "\n");
  }
}
void FamilyConicFigure.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
