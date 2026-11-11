import fs from "node:fs/promises";
import path from "node:path";
import { type AutoMovieConstructionRealization, AutoMovieLoftChain, AutoMovieViewLoft, type IAutoMovieViewPart, realizeAutoMovieConstruction } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanF1 } from "@automovie/human";
import type { AutoMovieConstructionNode } from "@automovie/interface";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/**
 * Whether the engine's sewing operators, which trace no intersection, accept
 * the authored conic families: a `split` of the torso's open lower end into
 * both legs and a `port` of an arm on the torso's side, realized through
 * `realizeAutoMovieConstruction` with every family as a source leaf.
 *
 * It also proves `AutoMovieHumanConicLoft.mirror`: the twin's loft is compared
 * point for point with the reflected original before any tree is built.
 *
 * Usage: `FamilyConicTree.ts [split] [port]`.
 */
namespace FamilyConicTree {
  /** Station spacing of the layers and derived outlines handed to the engine, mm. */
  const STEP_MM: number = 2;

  /** Realize the named experiments in one tree and report it. */
  export async function main(): Promise<void> {
    const wanted: string[] = process.argv.slice(2);
    const member = (name: string): AutoMovieHumanF1.IMember => {
      const found: AutoMovieHumanF1.IMember | undefined = AutoMovieHumanF1.FAMILIES.find((m: AutoMovieHumanF1.IMember): boolean => m.family.name === name);
      if (found === undefined) throw new Error("no family named " + name);
      return found;
    };
    const stationsOf = (m: AutoMovieHumanF1.IMember): number[] => {
      const a: number = m.family.knots[0]! - (m.reach?.[0] ?? 0);
      const b: number = m.family.knots.at(-1)! + (m.reach?.[1] ?? 0);
      const count: number = Math.ceil((b - a) / STEP_MM) + 1;
      return Array.from({ length: count }, (_: unknown, i: number): number => a + ((b - a) * i) / (count - 1));
    };
    const sources: Map<string, IAutoMovieViewPart> = new Map();
    const leaf = (name: string, mirrored: boolean): AutoMovieConstructionNode => {
      const m: AutoMovieHumanF1.IMember = member(name);
      const family: AutoMovieHumanConicLoft.IFamily = mirrored ? AutoMovieHumanConicLoft.mirror(m.family, name + ".mirror") : m.family;
      sources.set(family.name, AutoMovieHumanConicLoft.part(family, stationsOf(m)));
      return { type: "source", name: family.name, source: family.name } as AutoMovieConstructionNode;
    };

    // The twin against the reflected original, mm.
    for (const name of ["arm", "leg"]) {
      const m: AutoMovieHumanF1.IMember = member(name);
      const stations: number[] = stationsOf(m);
      const one: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(m.family, stations);
      const two: AutoMovieViewLoft.IResult = AutoMovieHumanConicLoft.create(AutoMovieHumanConicLoft.mirror(m.family, name + ".mirror"), stations);
      if (one.chain === null || two.chain === null) throw new Error("mirror: " + name + " does not loft: " + JSON.stringify(two.diagnostics).slice(0, 400));
      let worst: number = 0;
      for (const s of stations.filter((_: number, i: number): boolean => i % 5 === 0))
        for (let j: number = 0; j < 90; ++j) {
          const phi: number = (2 * Math.PI * j) / 90;
          const p: number[] = AutoMovieLoftChain.point(one.chain, s, phi);
          const q: number[] = AutoMovieLoftChain.point(two.chain, s, -phi);
          worst = Math.max(worst, Math.hypot(p[0]! - q[0]!, p[1]! - q[1]!, p[2]! + q[2]!));
        }
      process.stdout.write(JSON.stringify({ mirror: name, worstMm: worst }) + "\n");
    }

    let root: AutoMovieConstructionNode = leaf("torso", false);
    const torso: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(sources.get("torso")!);
    const ring = (station: number): string => [0, 90, 180, 270].map((d: number): string => AutoMovieLoftChain.point(torso.chain!, station, (d * Math.PI) / 180).map((x: number): string => x.toFixed(0)).join(",")).join(" | ");
    process.stdout.write(JSON.stringify({ torsoBottom: ring(sources.get("torso")!.stations[0]!), torsoNearTop: ring(480) }) + "\n");
    if (wanted.length === 0 || wanted.includes("split"))
      root = {
        type: "split",
        name: "crotch",
        host: root,
        hostFace: "torso",
        hostEnd: "bottom",
        seam: [0, Math.PI],
        count: 48,
        rows: 6,
        children: [
          { band: "band.leg", part: leaf("leg", false), partFace: "leg", partEnd: "bottom", rail: 0.04 },
          { band: "band.leg.mirror", part: leaf("leg", true), partFace: "leg.mirror", partEnd: "bottom", rail: 0.04 },
        ],
      } as AutoMovieConstructionNode;
    if (wanted.length === 0 || wanted.includes("port"))
      for (const mirrored of [false, true])
        root = {
          type: "port",
          name: "armscye" + (mirrored ? ".mirror" : ""),
          host: root,
          hostFace: "torso",
          loop: { centre: [0.47, mirrored ? -Math.PI / 2 : Math.PI / 2], semi: [0.035, 0.45], sense: 1 },
          band: "band.arm" + (mirrored ? ".mirror" : ""),
          part: leaf("arm", mirrored),
          partFace: "arm" + (mirrored ? ".mirror" : ""),
          partEnd: "bottom",
          rail: 0.05,
          count: 48,
          rows: 6,
        } as AutoMovieConstructionNode;
    const started: number = performance.now();
    const real: AutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction({ name: "f1.tree", root }, { chord: 0.001, sources });
    const report = { wanted, milliseconds: Math.round(performance.now() - started), diagnostics: real.diagnostics, chains: real.chains.map((c: { name: string }): string => c.name), vertices: real.mesh.positions.length / 3, triangles: real.mesh.indices.length / 3 };
    process.stdout.write(JSON.stringify(report).slice(0, 4000) + "\n");
    if (real.mesh.positions.length === 0) return;
    const out: string = path.join(path.resolve(process.cwd(), ".."), "test/.shots/family-conic-tree", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const mesh: N.Mesh = { id: "tree", positions: Array.from(real.mesh.positions), indices: Array.from(real.mesh.indices), colour: [0.64, 0.65, 0.67] };
    const bounds: N.Point[] = [];
    for (let i: number = 0; i < mesh.positions.length; i += 3) bounds.push([mesh.positions[i]!, mesh.positions[i + 1]!, mesh.positions[i + 2]!]);
    NodeCanvasRaster.initialize();
    for (const view of ["front", "back", "high-oblique", "low-oblique"]) await fs.writeFile(path.join(out, "tree." + view + ".png"), NodeCanvasRaster.render(NodeCanvasCamera.fit(view, bounds, 900, 1300), [mesh], [], "depth", "f1 | tree | " + view).png);
    await fs.writeFile(path.join(out, "receipt.json"), JSON.stringify(report, null, 2));
    process.stdout.write(JSON.stringify({ out }) + "\n");
  }
}
void FamilyConicTree.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
