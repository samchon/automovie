import fs from "node:fs/promises";
import path from "node:path";
import { type AutoMovieConstructionRealization, AutoMovieLoftChain, type AutoMovieLoftFrame, AutoMovieViewLoft, type IAutoMovieViewPart, realizeAutoMovieConstruction } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanF1 } from "@automovie/human";
import type { AutoMovieConstructionNode } from "@automovie/interface";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/**
 * Whether the engine's own joining operators accept the authored conic
 * families: one merge of a part onto a host, realized through
 * `realizeAutoMovieConstruction` with both families as source leaves, its
 * diagnostics printed and its skin rendered.
 *
 * Usage: `FamilyConicJoin.ts <host> <part> [chordMm] [fromShare] [toShare]`,
 * the names those of `AutoMovieHumanF1.FAMILIES`.
 */
namespace FamilyConicJoin {
  /** Station spacing of the layers and derived outlines handed to the engine, mm: the spacing the families were fitted and measured at. */
  const STEP_MM: number = 2;

  /** Realize one merge and report it. */
  export async function main(): Promise<void> {
    const [hostName, partName, chord, from, to]: string[] = process.argv.slice(2);
    const member = (name: string | undefined): AutoMovieHumanF1.IMember => {
      const found: AutoMovieHumanF1.IMember | undefined = AutoMovieHumanF1.FAMILIES.find((m: AutoMovieHumanF1.IMember): boolean => m.family.name === name);
      if (found === undefined) throw new Error("no family named " + name);
      return found;
    };
    const leaf = (m: AutoMovieHumanF1.IMember): IAutoMovieViewPart => {
      const a: number = m.family.knots[0]! - (m.reach?.[0] ?? 0);
      const b: number = m.family.knots.at(-1)! + (m.reach?.[1] ?? 0);
      const count: number = Math.ceil((b - a) / STEP_MM) + 1;
      return AutoMovieHumanConicLoft.part(m.family, Array.from({ length: count }, (_: unknown, i: number): number => a + ((b - a) * i) / (count - 1)));
    };
    const host: IAutoMovieViewPart = leaf(member(hostName));
    const part: IAutoMovieViewPart = leaf(member(partName));

    // The part's signed gap to the host, before any trace: for each part phase, the gap in mm (positive outside the host) at
    // every fourth part station from its root. A closed seam needs one sign change along every phase.
    {
      const hostLoft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(host);
      const partLoft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
      if (hostLoft.chain === null || partLoft.chain === null) throw new Error("a leaf does not loft: " + JSON.stringify([hostLoft.diagnostics, partLoft.diagnostics]).slice(0, 600));
      const hostChain: NonNullable<AutoMovieViewLoft.IResult["chain"]> = hostLoft.chain;
      const partChain: NonNullable<AutoMovieViewLoft.IResult["chain"]> = partLoft.chain;
      const stations: number[] = part.stations.filter((_: number, i: number): boolean => i % 4 === 0).slice(0, 22);
      const rows: string[] = ["phase\\station " + stations.map((s: number): string => s.toFixed(0).padStart(5)).join("")];
      for (let degree: number = 0; degree < 360; degree += 30) {
        const cells: string[] = stations.map((s: number): string => {
          const p: number[] = AutoMovieLoftChain.point(partChain, s, (degree * Math.PI) / 180);
          const frame: AutoMovieLoftFrame.IFrame = host.axis.at(0);
          const n: number[] = [frame.v[1] * frame.u[2] - frame.v[2] * frame.u[1], frame.v[2] * frame.u[0] - frame.v[0] * frame.u[2], frame.v[0] * frame.u[1] - frame.v[1] * frame.u[0]];
          const d: number[] = [p[0]! - frame.origin[0], p[1]! - frame.origin[1], p[2]! - frame.origin[2]];
          const along: number = d[0]! * n[0]! + d[1]! * n[1]! + d[2]! * n[2]!;
          if (along < host.stations[0]! || along > host.stations.at(-1)!) return "    .";
          const a: number = d[0]! * frame.u[0] + d[1]! * frame.u[1] + d[2]! * frame.u[2];
          const b: number = d[0]! * frame.v[0] + d[1]! * frame.v[1] + d[2]! * frame.v[2];
          const q: number[] = AutoMovieLoftChain.point(hostChain, along, Math.atan2(b, a));
          const e: number[] = [q[0]! - frame.origin[0] - along * n[0]!, q[1]! - frame.origin[1] - along * n[1]!, q[2]! - frame.origin[2] - along * n[2]!];
          return (Math.hypot(a, b) - Math.hypot(e[0]! * frame.u[0] + e[1]! * frame.u[1] + e[2]! * frame.u[2], e[0]! * frame.v[0] + e[1]! * frame.v[1] + e[2]! * frame.v[2])).toFixed(0).padStart(5);
        });
        rows.push(String(degree).padStart(13) + " " + cells.join(""));
      }
      process.stdout.write(rows.join("\n") + "\n");
    }
    const width: number = Number(chord ?? "8") / 1000;
    const root: AutoMovieConstructionNode = {
      type: "join",
      kind: "merge",
      name: "blend." + part.name,
      host: { type: "source", name: host.name, source: host.name },
      part: { type: "source", name: part.name, source: part.name },
      seed: { type: "search", partFace: part.name, hostFace: host.name, phase: 0, from: Number(from ?? "0"), to: Number(to ?? "0.5") },
      parameter: { type: "phase" },
      partWidth: { type: "chord", value: width },
      hostWidth: { type: "chord", value: width },
      continuity: "G2",
      count: 48,
      rows: 4,
      tolerance: 1e-12,
      grazing: 0.05,
    } as AutoMovieConstructionNode;
    const started: number = performance.now();
    const real: AutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction({ name: "f1.join", root }, { chord: 0.001, sources: new Map([[host.name, host], [part.name, part]]) });
    const report = { host: host.name, part: part.name, chordMm: width * 1000, milliseconds: Math.round(performance.now() - started), diagnostics: real.diagnostics, joins: real.joins.length, chains: real.chains.map((c: { name: string }): string => c.name), vertices: real.mesh.positions.length / 3, triangles: real.mesh.indices.length / 3 };
    process.stdout.write(JSON.stringify(report).slice(0, 3000) + "\n");
    if (real.mesh.positions.length === 0) return;

    // The realized skin, in the engine's metres, under two cameras.
    const out: string = path.join(path.resolve(process.cwd(), ".."), "test/.shots/family-conic-join", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const mesh: N.Mesh = { id: "joined", positions: Array.from(real.mesh.positions), indices: Array.from(real.mesh.indices), colour: [0.64, 0.65, 0.67] };
    const bounds: N.Point[] = [];
    for (let i: number = 0; i < mesh.positions.length; i += 3) bounds.push([mesh.positions[i]!, mesh.positions[i + 1]!, mesh.positions[i + 2]!]);
    NodeCanvasRaster.initialize();
    for (const view of ["front", "back", "high-oblique"]) await fs.writeFile(path.join(out, "join." + view + ".png"), NodeCanvasRaster.render(NodeCanvasCamera.fit(view, bounds, 900, 1100), [mesh], [], "depth", "f1 | " + host.name + " + " + part.name + " | " + view).png);
    await fs.writeFile(path.join(out, "receipt.json"), JSON.stringify(report, null, 2));
    process.stdout.write(JSON.stringify({ out }) + "\n");
  }
}
void FamilyConicJoin.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
