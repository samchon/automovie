import fs from "node:fs/promises";
import path from "node:path";
import { type AutoMovieConstructionRealization, AutoMovieLoftChain, type AutoMovieLoftFrame, AutoMovieViewLoft, type IAutoMovieViewPart, realizeAutoMovieConstruction } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanF1 } from "@automovie/human";
import type { AutoMovieConstructionNode } from "@automovie/interface";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/**
 * Whether the engine's merge sews a digit to the capped end of its limb: the digit, carried back to its first joint, passes through the limb's
 * cap across the cap's surface, so their meeting is a traced curve with a blend on either side.
 *
 * Usage: `FamilyConicMerge.ts <limb> <chordMm> <digit> [digit...]`, the names those of `AutoMovieHumanF1.FAMILIES`; the limb is shown from
 * 80 mm before its cap.
 */
namespace FamilyConicMerge {
  /** Realize the merges and report them. */
  export async function main(): Promise<void> {
    const [limbName, chord, depth, ...digits]: string[] = process.argv.slice(2);
    const member = (name: string | undefined): AutoMovieHumanF1.IMember => {
      const found: AutoMovieHumanF1.IMember | undefined = AutoMovieHumanF1.FAMILIES.find((m: AutoMovieHumanF1.IMember): boolean => m.family.name === name);
      if (found === undefined) throw new Error("no family named " + name);
      return found;
    };
    const sources: Map<string, IAutoMovieViewPart> = new Map();
    const leaf = (m: AutoMovieHumanF1.IMember, from: number): AutoMovieConstructionNode => {
      const to: number = m.family.knots.at(-1)!;
      const count: number = Math.ceil(to - from) + 1;
      sources.set(m.family.name, AutoMovieHumanConicLoft.part(m.family, Array.from({ length: count }, (_: unknown, i: number): number => from + ((to - from) * i) / (count - 1))));
      return { type: "source", name: m.family.name, source: m.family.name };
    };

    // A digit as a capsule: besides its tip it closes in a point `depth` mm behind its first joint, inside the limb. A closed body with one end
    // inside the limb and the other outside meets the limb's skin in a closed curve wherever it comes out, which is what a merge needs.
    const capsule = (m: AutoMovieHumanF1.IMember, depth: number): AutoMovieConstructionNode => {
      const from: number = m.family.knots[0]!;
      const to: number = m.family.knots.at(-1)!;
      const family: AutoMovieHumanConicLoft.IFamily = { ...m.family, tips: [{ from, tip: -depth }, m.family.tips?.[1] ?? null] };
      const count: number = Math.ceil(to - from) + 1;
      sources.set(family.name, AutoMovieHumanConicLoft.part(family, Array.from({ length: count }, (_: unknown, i: number): number => from + ((to - from) * i) / (count - 1))));
      return { type: "source", name: family.name, source: family.name };
    };
    const limb: AutoMovieHumanF1.IMember = member(limbName);
    let root: AutoMovieConstructionNode = leaf(limb, limb.family.tips![1]!.from - 80);

    // `--gap`: where the first digit's capsule lies against the limb, before any merge. For each of its stations and eight of its phases, how
    // far its point stands outside (+) or inside (-) the limb's skin along the limb's own radius, mm; a dot where the limb has no station.
    if (process.argv.includes("--gap")) {
      const digit: AutoMovieHumanF1.IMember = member(digits[0]);
      capsule(digit, Number(depth));
      const host: IAutoMovieViewPart = sources.get(limb.family.name)!;
      const hostLoft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(host);
      const partLoft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(sources.get(digit.family.name)!);
      if (hostLoft.chain === null || partLoft.chain === null) throw new Error("a leaf does not loft");
      const last: number = limb.family.tips![1]!.tip;
      const rows: string[] = [];
      for (let s: number = -Number(depth) + 2; s <= digit.family.knots.at(-1)!; s += 5) {
        const cells: string[] = [];
        for (let k: number = 0; k < 8; ++k) {
          const p: number[] = AutoMovieLoftChain.point(partLoft.chain, s, (k * Math.PI) / 4);
          let at: number = limb.family.tips![1]!.from;
          let frame: AutoMovieLoftFrame.IFrame = host.axis.at(at);
          for (let i: number = 0; i < 20; ++i) {
            const t: number[] = [frame.v[1] * frame.u[2] - frame.v[2] * frame.u[1], frame.v[2] * frame.u[0] - frame.v[0] * frame.u[2], frame.v[0] * frame.u[1] - frame.v[1] * frame.u[0]];
            at += (p[0]! - frame.origin[0]) * t[0]! + (p[1]! - frame.origin[1]) * t[1]! + (p[2]! - frame.origin[2]) * t[2]!;
            frame = host.axis.at(at);
          }
          if (at < host.stations[0]! || at >= last - 0.2) {
            cells.push("     .");
            continue;
          }
          const d: number[] = [p[0]! - frame.origin[0], p[1]! - frame.origin[1], p[2]! - frame.origin[2]];
          const u: number = d[0]! * frame.u[0] + d[1]! * frame.u[1] + d[2]! * frame.u[2];
          const v: number = d[0]! * frame.v[0] + d[1]! * frame.v[1] + d[2]! * frame.v[2];
          const q: number[] = AutoMovieLoftChain.point(hostLoft.chain, at, Math.atan2(v, u));
          cells.push((Math.hypot(u, v) - Math.hypot(q[0]! - frame.origin[0], q[1]! - frame.origin[1], q[2]! - frame.origin[2])).toFixed(1).padStart(6));
        }
        rows.push(String(s).padStart(5) + " " + cells.join(""));
      }
      process.stdout.write("station  phase 0 45 90 135 180 225 270 315\n" + rows.join("\n") + "\n");
      return;
    }

    // Each digit is carried `depth` mm behind its first joint, and its seed is searched along four of its own phase lines in turn: the first
    // line whose merge the engine admits is kept, and a digit none admits is left out with the last refusal.
    const refusals: unknown[] = [];
    const chosen: Record<string, number> = {};
    for (const entry of digits) {
      // `name@chord` gives one digit a blend chord of its own, mm.
      const [name, own]: string[] = entry.split("@");
      const digit: AutoMovieHumanF1.IMember = member(name);
      const width: number = (own === undefined ? Number(chord) : Number(own)) / 1000;
      let kept: boolean = false;
      for (const quarter of [0, 1, 2, 3]) {
        const candidate: AutoMovieConstructionNode = {
          type: "join",
          kind: "merge",
          name: "web." + name,
          host: root,
          part: capsule(digit, Number(depth)),
          seed: { type: "search", partFace: name, hostFace: limb.family.name, phase: (quarter * Math.PI) / 2, from: 0, to: 0.7 },
          parameter: { type: "phase" },
          partWidth: { type: "chord", value: width },
          hostWidth: { type: "chord", value: width },
          continuity: "G2",
          count: 48,
          rows: 4,
          tolerance: 1e-12,
          grazing: 0.05,
        } as AutoMovieConstructionNode;
        const trial: Pick<AutoMovieConstructionRealization.IRealization, "diagnostics"> = realizeAutoMovieConstruction({ name: "f1.merge", root: candidate }, { chord: 0.002, sources, skin: false });
        const refused = trial.diagnostics.filter((d: { node: string }): boolean => d.node === "web." + name);
        if (refused.length === 0) {
          root = candidate;
          chosen[name!] = quarter;
          kept = true;
          break;
        }
        refusals.push(...refused.map((d: { node: string; contract: string; detail: string }): object => ({ quarter, contract: d.contract, detail: d.node + ": " + d.detail.slice(0, 110) })));
      }
      if (!kept) sources.delete(name!);
    }
    process.stdout.write(JSON.stringify({ chosen, refusals }).slice(0, 2500) + "\n");
    const started: number = performance.now();
    const real: AutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction({ name: "f1.merge", root }, { chord: 0.0005, sources });
    process.stdout.write(JSON.stringify({ limb: limbName, digits, chordMm: Number(chord), milliseconds: Math.round(performance.now() - started), diagnostics: real.diagnostics, joins: real.joins.length, chains: real.chains.map((c: { name: string }): string => c.name), triangles: real.mesh.indices.length / 3 }).slice(0, 3000) + "\n");
    if (real.mesh.positions.length === 0) return;
    const out: string = path.join(path.resolve(process.cwd(), ".."), "test/.shots/family-conic-merge", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const mesh: N.Mesh = { id: "merged", positions: Array.from(real.mesh.positions), indices: Array.from(real.mesh.indices), colour: [0.64, 0.65, 0.67] };
    const bounds: N.Point[] = [];
    for (let i: number = 0; i < mesh.positions.length; i += 3) bounds.push([mesh.positions[i]!, mesh.positions[i + 1]!, mesh.positions[i + 2]!]);
    NodeCanvasRaster.initialize();
    for (const view of ["front", "left", "high-oblique", "low-oblique"]) await fs.writeFile(path.join(out, "merge." + view + ".png"), NodeCanvasRaster.render(NodeCanvasCamera.fit(view, bounds, 900, 900), [mesh], [], "depth", "f1 | " + limbName + " + " + digits.join(" + ") + " | " + view).png);
    process.stdout.write(JSON.stringify({ out }) + "\n");
  }
}
void FamilyConicMerge.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
