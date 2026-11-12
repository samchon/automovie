import fs from "node:fs/promises";
import path from "node:path";
import { type AutoMovieConstructionRealization, AutoMovieLoftChain, type AutoMovieLoftFrame, AutoMovieViewLoft, type IAutoMovieViewPart, realizeAutoMovieConstruction } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanF1 } from "@automovie/human";
import type { AutoMovieConstructionNode, IAutoMovieConstructionPort } from "@automovie/interface";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/**
 * Whether each digit can be sewn to its limb's closed end by a port, the construction the branching literature gives for one contour that
 * parts into many: the limb runs to the curve that surrounds all the digits and closes, and each digit joins through an opening of its own.
 *
 * A digit's opening is read from the digit itself: the ring of its tube near its first joint is carried onto the limb's chart, each point to
 * the station of its foot on the limb's course and its phase about it, and the port's ellipse is that ring's centre and half extents, widened.
 *
 * Usage: `FamilyConicPorts.ts <limb> <ringStationMm> <marginMm> <railMm> <digit> [digit...]`, the names those of `AutoMovieHumanF1.FAMILIES`.
 */
namespace FamilyConicPorts {
  /** Realize the ports and report them. */
  export async function main(): Promise<void> {
    const [limbName, ringAt, margin, rail, ...digits]: string[] = process.argv.slice(2);
    const member = (name: string | undefined): AutoMovieHumanF1.IMember => {
      const found: AutoMovieHumanF1.IMember | undefined = AutoMovieHumanF1.FAMILIES.find((m: AutoMovieHumanF1.IMember): boolean => m.family.name === name);
      if (found === undefined) throw new Error("no family named " + name);
      return found;
    };
    const sources: Map<string, IAutoMovieViewPart> = new Map();
    const partOf = (family: AutoMovieHumanConicLoft.IFamily, from: number): IAutoMovieViewPart => {
      const to: number = family.knots.at(-1)!;
      const count: number = Math.ceil((to - from) / 2) + 1;
      return AutoMovieHumanConicLoft.part(family, Array.from({ length: count }, (_: unknown, i: number): number => from + ((to - from) * i) / (count - 1)));
    };
    const limb: AutoMovieHumanConicLoft.IFamily = member(limbName).family;
    const host: IAutoMovieViewPart = partOf(limb, limb.tips![1]!.from - 90);
    sources.set(limb.name, host);
    let root: AutoMovieConstructionNode = { type: "source", name: limb.name, source: limb.name };

    // A world point on the limb's chart: the station of its foot on the course, found by stepping along the tangent, and its phase about it.
    const chart = (p: number[]): [number, number] => {
      let s: number = limb.tips![1]!.from;
      let frame: AutoMovieLoftFrame.IFrame = host.axis.at(s);
      for (let k: number = 0; k < 20; ++k) {
        const t: number[] = [frame.v[1] * frame.u[2] - frame.v[2] * frame.u[1], frame.v[2] * frame.u[0] - frame.v[0] * frame.u[2], frame.v[0] * frame.u[1] - frame.v[1] * frame.u[0]];
        s += (p[0]! - frame.origin[0]) * t[0]! + (p[1]! - frame.origin[1]) * t[1]! + (p[2]! - frame.origin[2]) * t[2]!;
        frame = host.axis.at(s);
      }
      const d: number[] = [p[0]! - frame.origin[0], p[1]! - frame.origin[1], p[2]! - frame.origin[2]];
      return [s, Math.atan2(d[0]! * frame.v[0] + d[1]! * frame.v[1] + d[2]! * frame.v[2], d[0]! * frame.u[0] + d[1]! * frame.u[1] + d[2]! * frame.u[2])];
    };
    const loops: Record<string, IAutoMovieConstructionPort.ILoop> = {};
    for (const name of digits) {
      const digit: AutoMovieHumanConicLoft.IFamily = member(name).family;
      const free: number = digit.knots[0]!;

      // The digit's ring near its joint, from its fields carried back there, on the limb's chart.
      const probe: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(partOf({ ...digit, tips: undefined }, Number(ringAt)));
      if (probe.chain === null) throw new Error(name + " does not loft back to station " + ringAt);
      const ring: [number, number][] = Array.from({ length: 48 }, (_: unknown, j: number): [number, number] => chart(AutoMovieLoftChain.point(probe.chain!, Number(ringAt), (2 * Math.PI * j) / 48)));
      const middle: number = Math.atan2(ring.reduce((sum: number, c: [number, number]): number => sum + Math.sin(c[1]), 0), ring.reduce((sum: number, c: [number, number]): number => sum + Math.cos(c[1]), 0));
      const turned: number[] = ring.map((c: [number, number]): number => c[1] - middle - 2 * Math.PI * Math.round((c[1] - middle) / (2 * Math.PI)));
      const stations: number[] = ring.map((c: [number, number]): number => c[0]);
      const radius: number = Math.hypot(...AutoMovieLoftChain.point(probe.chain, Number(ringAt), 0).map((x: number, c: number): number => x - AutoMovieLoftChain.point(probe.chain!, Number(ringAt), Math.PI)[c]!)) / 2;
      const loop: IAutoMovieConstructionPort.ILoop = {
        centre: [(Math.min(...stations) + Math.max(...stations)) / 2000, middle + (Math.min(...turned) + Math.max(...turned)) / 2],
        semi: [((Math.max(...stations) - Math.min(...stations)) / 2 + Number(margin)) / 1000, Math.min(3, ((Math.max(...turned) - Math.min(...turned)) / 2) * (1 + Number(margin) / radius))],
        sense: 1,
      };
      loops[name] = loop;
      sources.set(name, partOf(digit, free));
      root = { type: "port", name: "root." + name, host: root, hostFace: limb.name, loop, band: "band." + name, part: { type: "source", name, source: name }, partFace: name, partEnd: "bottom", rail: Number(rail) / 1000, count: 48, rows: 6 };
    }
    process.stdout.write(JSON.stringify({ tip: limb.tips![1], loops }) + "\n");
    const started: number = performance.now();
    const real: AutoMovieConstructionRealization.IRealization = realizeAutoMovieConstruction({ name: "f1.ports", root }, { chord: 0.0005, sources });
    process.stdout.write(JSON.stringify({ limb: limbName, digits, milliseconds: Math.round(performance.now() - started), diagnostics: real.diagnostics, chains: real.chains.map((c: { name: string }): string => c.name), triangles: real.mesh.indices.length / 3 }).slice(0, 3000) + "\n");
    if (real.mesh.positions.length === 0) return;
    const out: string = path.join(path.resolve(process.cwd(), ".."), "test/.shots/family-conic-ports", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    const mesh: N.Mesh = { id: "ported", positions: Array.from(real.mesh.positions), indices: Array.from(real.mesh.indices), colour: [0.64, 0.65, 0.67] };
    const bounds: N.Point[] = [];
    for (let i: number = 0; i < mesh.positions.length; i += 3) bounds.push([mesh.positions[i]!, mesh.positions[i + 1]!, mesh.positions[i + 2]!]);
    NodeCanvasRaster.initialize();
    for (const view of ["front", "left", "high-oblique", "low-oblique"]) await fs.writeFile(path.join(out, "ports." + view + ".png"), NodeCanvasRaster.render(NodeCanvasCamera.fit(view, bounds, 900, 900), [mesh], [], "depth", "f1 | " + limbName + " ports | " + view).png);
    process.stdout.write(JSON.stringify({ out }) + "\n");
  }
}
void FamilyConicPorts.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
