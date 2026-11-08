import fs from "node:fs";
import path from "node:path";
import { AutoMovieLoftChain, AutoMovieSolidChain, type IAutoMovieLoftChain, type IAutoMovieSolidSurface } from "@automovie/engine";

import { AutoMovieHumanBodyAnatomy } from "../generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanArmContact } from "../generation/arm/AutoMovieHumanArmContact";
import { AutoMovieHumanArmF1Lines } from "../generation/arm/AutoMovieHumanArmF1Lines";
import type { AutoMovieHumanArmF1Pose } from "../generation/arm/AutoMovieHumanArmF1Pose";
import { AutoMovieHumanArmInputs } from "../generation/arm/AutoMovieHumanArmInputs";
import { AutoMovieHumanArmLandmarks } from "../generation/arm/AutoMovieHumanArmLandmarks";
import { AutoMovieHumanArmSegmentFrames } from "../generation/arm/AutoMovieHumanArmSegmentFrames";
import { AutoMovieHumanArmViewCurves } from "../generation/arm/AutoMovieHumanArmViewCurves";
import { AutoMovieHumanArmViewLoft } from "../generation/arm/AutoMovieHumanArmViewLoft";
import { AutoMovieHumanHandDigits } from "../generation/hand/AutoMovieHumanHandDigits";
import { AutoMovieHumanTrunkS00 } from "../generation/trunk/AutoMovieHumanTrunkS00";
import { HumanNodeInput } from "./HumanNodeInput";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeArmDeviation } from "./NodeArmDeviation";
import { NodeArmDraw } from "./NodeArmDraw";
import { NodeArmReference } from "./NodeArmReference";

type V3 = [number, number, number];
type Tri = [V3, V3, V3];

/**
 * Same-camera clay pairs of f1's left arm in her own pose (`node:arm-pair`,
 * run by `ttsx`; step 1 of the owner's method): ours is the production arm
 * (`AutoMovieHumanArmInputs.posed`, lofted as the joined body lofts it, from
 * its rail on S00's armscye port to the palm pole) with its digits and the
 * S00 trunk beside it; hers is the reference mesh in the same region (above
 * 700 mm and more than 100 mm left, `NodeArmReference.mesh`). Both clays are
 * drawn by one camera per view, framed on the corners of the box around both
 * (front, back, left side, top, oblique), with the port loop (blue) and our
 * rail ring (red) on both. The host check prints the least signed gap of our
 * arm to S00 per 10 mm band of station past the rail
 * (`AutoMovieHumanArmContact.trunk`, positive outside).
 */
export namespace NodeArmPair {
  /** Render the pairs. */
  export async function run(): Promise<void> {
    const D: typeof NodeArmDraw = NodeArmDraw;
    const person: Awaited<ReturnType<typeof HumanNodeInput.of>> = await HumanNodeInput.of();
    const s00: AutoMovieHumanTrunkS00.IOutput = AutoMovieHumanTrunkS00.of(person.parameters, AutoMovieHumanBodyAnatomy.resolve(person.parameters));
    const inputs: AutoMovieHumanArmInputs.IOutput = AutoMovieHumanArmInputs.of(person.parameters, "left", s00);
    if (inputs.posed === null) throw new Error(inputs.placement);
    const s: number = inputs.arms.scale;
    const frames: AutoMovieHumanArmSegmentFrames.IOutput = AutoMovieHumanArmSegmentFrames.create({ side: "left", arms: inputs.arms, pose: { elbow: 0, wrist: 0 } });
    const landmarks: AutoMovieHumanArmLandmarks.IOutput = AutoMovieHumanArmLandmarks.create(frames, inputs.arms);
    const curves: AutoMovieHumanArmViewCurves.IOutput = AutoMovieHumanArmViewCurves.create(frames, landmarks, inputs.tapes, inputs.calipers, inputs.posed);
    const loft: AutoMovieHumanArmViewLoft.IOutput = AutoMovieHumanArmViewLoft.create({ curves, frames, landmarks, root: inputs.root, order: 32, samples: 64, gap: 6, posed: inputs.posed });
    const chain: IAutoMovieLoftChain | null = loft.loft?.chain ?? null;
    if (chain === null) throw new Error(`no arm chain: ${loft.diagnostics.join("; ")}`);
    const rail: number = loft.station(AutoMovieHumanArmLandmarks.get(landmarks, "axilla level").walk);
    const digits: AutoMovieHumanHandDigits.IDigit[] = AutoMovieHumanHandDigits.create(frames, inputs.posed.hand, { sex: inputs.arms.sex, breadth: inputs.tapes.breadth });

    // Ours: the arm from the rail, its digits, and S00 in her mesh's region.
    const region = (t: Tri): boolean => t.every((p: V3): boolean => p[2] < -100 * s && p[1] > 700 * s);
    const arm: Tri[] = clay(chain, rail, chain.layers[chain.layers.length - 1]!.y, 1.5);
    const fingers: Tri[] = digits.flatMap((d: AutoMovieHumanHandDigits.IDigit): Tri[] => (d.loft.chain === null ? [] : clay(d.loft.chain, d.loft.chain.layers[0]!.y, d.loft.chain.layers[d.loft.chain.layers.length - 1]!.y, 1.5)));
    const trunk: Tri[] =
      s00.chain === null
        ? []
        : clay(s00.chain, s00.chain.layers[0]!.y, s00.chain.layers[s00.chain.layers.length - 1]!.y, 3)
            .map((t: Tri): Tri => t.map((p: V3): V3 => [p[0] * s, p[1] * s, p[2] * s]) as Tri)
            .filter(region);
    const ours: Tri[] = [...trunk, ...arm, ...fingers];
    const mesh: NodeArmReference.IMesh = NodeArmReference.mesh(s);
    const hers: Tri[] = mesh.triangles.map(([a, b, c]: [number, number, number]): Tri => [mesh.points[a]!, mesh.points[b]!, mesh.points[c]!]);

    // The rail ring and the port loop.
    const surface: IAutoMovieSolidSurface | null = AutoMovieSolidChain.surface(chain);
    const ring: V3[] = Array.from({ length: 129 }, (_: unknown, j: number): V3 => {
      const p: readonly number[] = AutoMovieLoftChain.point(chain, rail, (2 * Math.PI * j) / 128);
      return [p[0]!, p[1]!, p[2]!];
    });
    const loop: V3[] = [...inputs.posed.loop, inputs.posed.loop[0]!];

    // Host check: our arm's least signed gap to S00 per 10 mm band past the rail.
    const field: IAutoMovieSolidSurface | null = s00.chain === null ? null : AutoMovieSolidChain.surface(s00.chain);
    const gap: ((p: V3) => number | null) | null = field === null ? null : AutoMovieHumanArmContact.trunk(field, s00.curves.axis.turn, s);
    const host: string[] = [];
    if (gap !== null && surface !== null)
      for (let band: number = 0; band < 20; ++band) {
        let least: number = Infinity;
        for (let u: number = rail + 10 * band; u < rail + 10 * (band + 1); u += 2)
          for (let k: number = 0; k < 48; ++k) {
            const p: readonly number[] = AutoMovieLoftChain.point(chain, u, (2 * Math.PI * k) / 48);
            const g: number | null = gap([p[0]!, p[1]!, p[2]!]);
            if (g !== null) least = Math.min(least, g);
          }
        host.push(`${10 * band}-${10 * band + 10} mm past the rail: ${least.toFixed(2)}`);
      }

    // Deviation table: at every authored station past the join, her mesh's section on her own plane (`AutoMovieHumanArmF1Pose.place`)
    // against our loft's ring at the same station, both read as the four outline values from the plane's centre (ours minus hers, mm).
    const H: number = frames.lengths.humerus;
    const W: number = frames.lengths.forearm;
    const A: number = landmarks.course.port;
    const sites: { site: string; s: number }[] = [
      ...AutoMovieHumanArmF1Lines.HUMERUS.flatMap((x: AutoMovieHumanArmF1Lines.IStation): { site: string; s: number }[] =>
        typeof x.along === "number" && x.along >= inputs.posed!.join ? [{ site: x.site, s: x.along }] : x.along === "elbow" ? [{ site: x.site, s: H }] : [],
      ),
      ...AutoMovieHumanArmF1Lines.FOREARM.map((x: AutoMovieHumanArmF1Lines.IStation): { site: string; s: number } => ({ site: x.site, s: x.along === "wrist" ? H + W : H + (x.along as number) })),
      ...AutoMovieHumanArmF1Lines.HAND.filter((x: AutoMovieHumanArmF1Lines.IStation): boolean => typeof x.along === "number" && !x.site.includes("drawn")).map(
        (x: AutoMovieHumanArmF1Lines.IStation): { site: string; s: number } => ({ site: x.site, s: H + W + (x.along as number) }),
      ),
    ];
    const deviation: string[] = sites.map(({ site, s: at }: { site: string; s: number }): string => {
      const q: AutoMovieHumanArmF1Pose.IPlace = inputs.posed!.place(at);
      const hers2: [number, number][] | null = NodeArmDeviation.section(mesh, q.centre, q.distal, q.lateral, q.anterior);
      const u: number = loft.station(A + at);
      const ours2: [number, number][] = Array.from({ length: 144 }, (_: unknown, k: number): [number, number] => {
        const p: readonly number[] = AutoMovieLoftChain.point(chain, u, (2 * Math.PI * k) / 144);
        const d: V3 = [p[0]! - q.centre[0], p[1]! - q.centre[1], p[2]! - q.centre[2]];
        return [D.dot(d, q.lateral), D.dot(d, q.anterior)];
      });
      const ext = (loop: [number, number][]): number[] => [Math.max(...loop.map((p: [number, number]): number => p[0])), -Math.min(...loop.map((p: [number, number]): number => p[0])), Math.max(...loop.map((p: [number, number]): number => p[1])), -Math.min(...loop.map((p: [number, number]): number => p[1]))];
      if (hers2 === null) return `${site} (s ${at.toFixed(1)}): her section unavailable`;
      const o: number[] = ext(ours2);
      const h: number[] = ext(hers2);
      return `${site} (s ${at.toFixed(1)}): lateral ${(o[0]! - h[0]!).toFixed(1)}, medial ${(o[1]! - h[1]!).toFixed(1)}, anterior ${(o[2]! - h[2]!).toFixed(1)}, posterior ${(o[3]! - h[3]!).toFixed(1)} (hers ${h.map((x: number): string => x.toFixed(1)).join("/")})`;
    });

    // One camera per view for both clays.
    const low: V3 = [Infinity, Infinity, Infinity];
    const high: V3 = [-Infinity, -Infinity, -Infinity];
    for (const t of [...arm, ...fingers, ...hers.filter((t: Tri): boolean => t[0][1] > 900 * s)])
      for (const p of t)
        for (let k: number = 0; k < 3; ++k) {
          low[k] = Math.min(low[k]!, p[k]!);
          high[k] = Math.max(high[k]!, p[k]!);
        }
    const corners: V3[] = Array.from({ length: 8 }, (_: unknown, k: number): V3 => [(k % 2 === 1 ? high : low)[0], (Math.floor(k / 2) % 2 === 1 ? high : low)[1], (k >= 4 ? high : low)[2]]);
    const inBox = (t: Tri): boolean => t.every((p: V3): boolean => p.every((x: number, k: number): boolean => x >= low[k]! - 20 && x <= high[k]! + 20));
    const out: string = HumanNodePaths.resolve(`packages/human/.shots/f1_arm2/pair-${new Date().toISOString().replace(/[:.]/g, "-")}`);
    fs.mkdirSync(out, { recursive: true });
    const files: string[] = [];
    for (const [name, forward] of [
      ["front", [-1, 0, 0]],
      ["back", [1, 0, 0]],
      ["left", [0, 0, 1]],
      ["top", [0, -1, 0]],
      ["oblique", [-0.62, -0.45, 0.64]],
    ] as [string, V3][])
      for (const [who, triangles] of [
        ["hers", hers.filter(inBox)],
        ["ours", ours.filter(inBox)],
      ] as [string, Tri[]][]) {
        const v: NodeArmDraw.IView = D.open(forward, corners);
        D.clay(v, triangles);
        D.line(v, loop, "#0050ff", 2);
        D.line(v, ring, "#e00000", 1.5, [6, 4]);
        D.caption(v, [
          `${who} clay, f1 left arm in her own pose (${name}); one camera for both`,
          who === "ours" ? "production arm (AutoMovieHumanArmF1Pose) from its rail, its digits, and S00 beside it" : "the reference mesh above 700 mm, more than 100 mm left",
          "blue: S00's armscye port loop; red dashed: our arm's rail ring",
        ]);
        fs.writeFileSync(path.join(out, `${name}.${who}.png`), D.png(v));
        files.push(`${name}.${who}.png`);
      }
    const report: Record<string, unknown> = {
      placement: inputs.placement,
      rail,
      join: inputs.posed.join,
      railSection: inputs.posed.section,
      loftDiagnostics: loft.diagnostics,
      digits: digits.length,
      host,
      deviation,
      triangles: { ours: ours.length, hers: hers.length },
      files,
    };
    fs.writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 1));
    console.log(`node:arm-pair ${out}`);
    console.log(JSON.stringify(report, null, 1));
  }

  /** Clay triangles of a chain's solid surface (its reliefs included) between two stations: rows every `step` mm of 72 phases. */
  function clay(chain: IAutoMovieLoftChain, from: number, to: number, step: number): Tri[] {
    const surface: IAutoMovieSolidSurface | null = AutoMovieSolidChain.surface(chain);
    const at = (u: number, phi: number): V3 => {
      const p: readonly number[] = surface === null ? AutoMovieLoftChain.point(chain, u, phi) : (surface.point?.(u, phi) ?? surface.jet(u, phi).p);
      return [p[0]!, p[1]!, p[2]!];
    };
    const n: number = Math.max(2, Math.ceil((to - from) / step));
    const phases: number[] = Array.from({ length: 72 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 72);
    const rows: V3[][] = Array.from({ length: n + 1 }, (_: unknown, i: number): V3[] => phases.map((phi: number): V3 => at(from + ((to - from) * i) / n, phi)));
    const out: Tri[] = [];
    for (let i: number = 0; i + 1 < rows.length; ++i)
      for (let k: number = 0; k < phases.length; ++k) {
        const k1: number = (k + 1) % phases.length;
        out.push([rows[i]![k]!, rows[i + 1]![k]!, rows[i + 1]![k1]!], [rows[i]![k]!, rows[i + 1]![k1]!, rows[i]![k1]!]);
      }
    return out;
  }
}

void NodeArmPair.run().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
