import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { AutoMovieLoftChain, type AutoMovieMeshExtract as M, type AutoMovieViewLoft } from "@automovie/engine";
import { AutoMovieHumanConicLoft as H, AutoMovieHumanF1, AutoMovieHumanF1Placement as P, AutoMovieHumanSegmentFrame as SF } from "@automovie/human";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import { NodeCanvasRaster } from "./render/NodeCanvasRaster";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

/**
 * The armscye's loop by a rule from the skeleton (issue #3151, R1 as the owner set it): the trunk's skin cut by one surface fixed in the
 * humerus's frame at the shoulder joint centre GH, so the loop follows the arm's pose and the person's size by construction. The landmarks
 * read before (the acromion and both axillary fold points, `FamilyConicArmscyeLoop`) are checks of the rule, not its targets. It measures
 * only; nothing is stored.
 *
 * Candidates:
 * - a plane square to the humerus's long axis at a distance `d` from GH toward the trunk, `d = k r`, with `r` the arm's own radius, its
 *   relaxed mid upper arm girth (ISO 8559-1, read on f1's wall by `FamilyConicLimbLaw`: 266.4 mm) over 2 pi, and `k` 0, 0.5 and 1;
 * - a cone about the same axis with its apex at GH and half-angle `a` from the distal axis, 105, 120 and 135 degrees, opening toward the
 *   trunk: a cone with its apex at a joint centre scales with the person by construction, so its law is the angle alone.
 * The values bracket the joint; none is fitted to f1.
 *
 * Each is cut on f1's trunk wall as stored (wall and nets, lofted) and on the reference skin, at the reference pose, at the neutral pose
 * (every articulated rotation the identity) and at the arm's population ends (the upper arm's depth ±20 %, which moves `r`; the segment
 * lengths do not move GH). Checks: the distance from the loop to the acromion and the two fold points; whether the loop winds once round
 * the humerus's axis with its angle advancing (the port's correspondence); whether it is a simple loop star-shaped about its centre in the
 * trunk's chart (the port's ellipse-and-share form, `AutoMovieHumanF1` `around`); its reach past the trunk's clip at |v| = 151 mm; its
 * distance from the breast's port loop.
 *
 * Usage, from `test/`: `pnpm conic:build`, then `node .shots/esbuild/FamilyConicArmscyeRule.cjs`. It writes `rule.txt` and the frames under
 * `test/.shots/family-conic-armscye-rule/<time>/`.
 */
namespace FamilyConicArmscyeRule {
  type V = R.V;

  const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const scale = (a: V, k: number): V => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a: V): number => Math.hypot(a[0], a[1], a[2]);
  const unit = (a: V): V => scale(a, 1 / norm(a));
  const perpendicular = (a: V, n: V): V => unit(sub(a, scale(n, dot(a, n))));
  const fixed = (p: readonly number[], digits: number = 1): string => "[" + p.map((x: number): string => x.toFixed(digits)).join(", ") + "]";

  /** f1's relaxed mid upper arm girth, mm: ISO 8559-1, read on the stored wall by `FamilyConicLimbLaw` (run 2026-11-14T17-26-42). */
  const UPPER_ARM_GIRTH_MM: number = 266.374;

  /** The landmarks the supervisor accepted on #3151 (`FamilyConicArmscyeLoop`, run 2026-11-14T18-15-24): checks, not targets. */
  const LANDMARKS: Record<string, V> = {
    acromion: [-16.33, 1382.48, 187.16],
    "fold-anterior": [36.55, 1317.35, 160.71],
    "fold-posterior": [-65.95, 1317.35, 157.84],
  };

  /** The trunk's clip: its sections are cut at the armscye's sagittal plane, |v| <= 151 mm (`FamilyConicBody`, `ARMPIT_MM`). */
  const CLIP_MM: number = 151;

  /** How far the loop must stay from the breast's port loop, mm: the arm's band's rail, 10 mm (`AutoMovieHumanF1.RAIL_MM.arm`). */
  const CLEAR_MM: number = 10;

  /** One candidate surface: its name, its law and its signed field at a point in the humerus's frame (zero on the surface). */
  interface ICandidate {
    name: string;
    law: string;
    field: (gh: V, distal: V, r: number) => (p: V) => number;
  }

  const CANDIDATES: ICandidate[] = [
    ...[0, 0.5, 1].map((k: number): ICandidate => ({ name: `plane k ${k}`, law: `square to the humerus at d = ${k} r toward the trunk (r = upper arm girth / 2 pi)`, field: (gh: V, distal: V, r: number) => (p: V): number => dot(sub(p, gh), distal) + k * r })),
    ...[105, 120, 135].map((deg: number): ICandidate => ({ name: `cone ${deg} deg`, law: `apex at GH, half-angle ${deg} degrees from the distal axis`, field: (gh: V, distal: V) => (p: V): number => {
      const q: V = sub(p, gh);
      return Math.acos(Math.max(-1, Math.min(1, dot(q, distal) / (norm(q) || 1)))) - (deg * Math.PI) / 180;
    } })),
  ];

  /** The closed curves where a field over a mesh's vertices is zero: each triangle's crossing segment, chained by the edges it crosses. */
  function contour(mesh: M.IMesh, field: (p: V) => number): V[][] {
    const n: number = mesh.positions.length / 3;
    const at = (i: number): V => [mesh.positions[3 * i]!, mesh.positions[3 * i + 1]!, mesh.positions[3 * i + 2]!];
    const f: number[] = Array.from({ length: n }, (_: unknown, i: number): number => {
      const x: number = field(at(i));
      return x === 0 ? 1e-12 : x;
    });
    const key = (a: number, b: number): string => (a < b ? a + "," + b : b + "," + a);
    const point = (a: number, b: number): V => add(at(a), scale(sub(at(b), at(a)), f[a]! / (f[a]! - f[b]!)));
    const next: Map<string, string[]> = new Map();
    const where: Map<string, V> = new Map();
    for (let t: number = 0; t + 2 < mesh.indices.length; t += 3) {
      const tri: number[] = [mesh.indices[t]!, mesh.indices[t + 1]!, mesh.indices[t + 2]!];
      const edges: string[] = [];
      for (let e: number = 0; e < 3; ++e) {
        const [a, b]: number[] = [tri[e]!, tri[(e + 1) % 3]!];
        if (f[a!]! * f[b!]! < 0) {
          const k: string = key(a!, b!);
          edges.push(k);
          if (!where.has(k)) where.set(k, point(a!, b!));
        }
      }
      if (edges.length !== 2) continue;
      next.set(edges[0]!, [...(next.get(edges[0]!) ?? []), edges[1]!]);
      next.set(edges[1]!, [...(next.get(edges[1]!) ?? []), edges[0]!]);
    }
    const seen: Set<string> = new Set();
    const loops: V[][] = [];
    for (const start of next.keys()) {
      if (seen.has(start)) continue;
      const loop: V[] = [];
      let [previous, current]: (string | null)[] = [null, start];
      while (current !== null && !seen.has(current)) {
        seen.add(current);
        loop.push(where.get(current)!);
        const options: string[] = (next.get(current) ?? []).filter((k: string): boolean => k !== previous);
        [previous, current] = [current, options.find((k: string): boolean => !seen.has(k)) ?? null];
      }
      if (loop.length > 8) loops.push(loop);
    }
    return loops;
  }

  /** How many turns a loop makes round an axis through a point, read in the plane square to it. */
  function turns(loop: readonly V[], origin: V, axis: V): number {
    const e1: V = perpendicular(Math.abs(axis[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], axis);
    const e2: V = cross(axis, e1);
    let total: number = 0;
    for (let i: number = 0; i < loop.length; ++i) {
      const [a, b]: V[] = [sub(loop[i]!, origin), sub(loop[(i + 1) % loop.length]!, origin)];
      const d: number = Math.atan2(dot(b!, e2), dot(b!, e1)) - Math.atan2(dot(a!, e2), dot(a!, e1));
      total += Math.atan2(Math.sin(d), Math.cos(d));
    }
    return total / (2 * Math.PI);
  }

  /** Whether a loop's angle about the axis advances at every step (the port's monotone correspondence), and its worst back-step, radians. */
  function monotone(loop: readonly V[], origin: V, axis: V): { advancing: boolean; worst: number } {
    const e1: V = perpendicular(Math.abs(axis[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], axis);
    const e2: V = cross(axis, e1);
    const steps: number[] = loop.map((p: V, i: number): number => {
      const [a, b]: V[] = [sub(p, origin), sub(loop[(i + 1) % loop.length]!, origin)];
      const d: number = Math.atan2(dot(b!, e2), dot(b!, e1)) - Math.atan2(dot(a!, e2), dot(a!, e1));
      return Math.atan2(Math.sin(d), Math.cos(d));
    });
    const sense: number = Math.sign(steps.reduce((s: number, x: number): number => s + x, 0)) || 1;
    const worst: number = Math.min(...steps.map((x: number): number => sense * x));
    return { advancing: worst > 0, worst };
  }

  /** The trunk's chart at the reference pose: station along its straight course and `(u, v)` across it (`AutoMovieHumanF1` `trunkChart`). */
  function trunkChart(): (p: V) => { station: number; u: number; v: number } {
    const trunk: H.IFamily = AutoMovieHumanF1.BODY.trunk;
    const pelvis: SF.IFrame = P.frame("pelvis");
    const floor: V = SF.toLocal(pelvis, trunk.centres[0]!) as V;
    const t: V = unit(sub(SF.toLocal(pelvis, trunk.centres[1]!) as V, floor));
    const u: V = perpendicular(SF.toLocalDirection(pelvis, trunk.up) as V, t);
    const v: V = cross(u, t);
    return (p: V) => {
      const q: V = sub(SF.toLocal(pelvis, p) as V, floor);
      return { station: dot(q, t), u: dot(q, u), v: dot(q, v) };
    };
  }

  /** Whether a loop is a simple curve star-shaped about its centroid in the trunk's chart, station against phase as millimetres at 151 mm. */
  function starInChart(loop: readonly V[]): { star: boolean; folds: number } {
    const chart = trunkChart();
    const q: [number, number][] = loop.map((p: V): [number, number] => {
      const c = chart(p);
      return [c.station, CLIP_MM * Math.atan2(c.v, c.u)];
    });
    const centre: [number, number] = [q.reduce((s, x): number => s + x[0], 0) / q.length, q.reduce((s, x): number => s + x[1], 0) / q.length];
    let folds: number = 0;
    let sense: number = 0;
    for (let i: number = 0; i < q.length; ++i) {
      const [a, b] = [q[i]!, q[(i + 1) % q.length]!];
      const c: number = (a[0] - centre[0]) * (b[1] - centre[1]) - (a[1] - centre[1]) * (b[0] - centre[0]);
      if (sense === 0) sense = Math.sign(c);
      else if (Math.sign(c) !== sense && Math.abs(c) > 1e-9) ++folds;
    }
    return { star: folds === 0, folds };
  }

  /** The skin of the stored trunk round the shoulder as a mesh, mm: its loft with its nets, a ring every millimetre at 720 phases. */
  function trunkMesh(): M.IMesh {
    const trunk: H.IFamily = AutoMovieHumanF1.BODY.trunk;
    const stations: number[] = [];
    for (let s: number = 430; s <= 760; s += 1) stations.push(s);
    const loft: AutoMovieViewLoft.IResult = H.create(trunk, stations);
    if (loft.chain === null) throw new Error("the trunk does not loft round the shoulder");
    const chain = loft.chain;
    const K: number = 720;
    const positions: number[] = [];
    const indices: number[] = [];
    for (const s of stations) {
      const read = AutoMovieLoftChain.sampler(chain, s);
      for (let j: number = 0; j < K; ++j) positions.push(...read((2 * Math.PI * j) / K));
    }
    for (let i: number = 0; i + 1 < stations.length; ++i)
      for (let j: number = 0; j < K; ++j) {
        const a: number = i * K + j, b: number = i * K + ((j + 1) % K);
        indices.push(a, a + K, b, b, a + K, b + K);
      }
    return { positions, indices };
  }

  /** The breast's port loop in the world, read on the trunk's skin as `armscye`'s is (`AutoMovieHumanF1.mammary`). */
  function breastPort(trunk: M.IMesh): V[] {
    const placed: AutoMovieHumanF1.IAssembly = AutoMovieHumanF1.assemble();
    const loop = AutoMovieHumanF1.mammary(1, placed);
    const chart = trunkChart();
    const shape: number[] = loop.shape === undefined ? Array.from({ length: 64 }, (): number => 1) : [...loop.shape];
    const targets: { station: number; phase: number }[] = shape.map((share: number, k: number) => ({ station: 1000 * (loop.centre[0] + share * loop.semi[0] * Math.cos((2 * Math.PI * k) / shape.length)), phase: loop.centre[1] + (share * loop.semi[1] * Math.sin((2 * Math.PI * k) / shape.length)) / loop.sense }));
    const points: { p: V; station: number; phase: number }[] = [];
    for (let i: number = 0; i < trunk.positions.length; i += 3 * 7) {
      const p: V = [trunk.positions[i]!, trunk.positions[i + 1]!, trunk.positions[i + 2]!];
      const c = chart(p);
      points.push({ p, station: c.station, phase: Math.atan2(c.v, c.u) });
    }
    return targets.map((t) => points.reduce((a, b) => (Math.hypot(b.station - t.station, CLIP_MM * (b.phase - t.phase)) < Math.hypot(a.station - t.station, CLIP_MM * (a.phase - t.phase)) ? b : a)).p);
  }

  const distanceTo = (p: V, loop: readonly V[]): number => Math.min(...loop.map((q: V): number => norm(sub(p, q))));

  export async function main(): Promise<void> {
    const root: string = path.resolve(process.cwd(), "..");
    const source: R.ISource = await R.load(root);
    const trunk: M.IMesh = trunkMesh();
    const breast: V[] = breastPort(trunk);
    const r: number = UPPER_ARM_GIRTH_MM / (2 * Math.PI);
    const poses: { name: string; frames: P.IFrames; r: number }[] = [
      { name: "reference", frames: P.frames(), r },
      { name: "neutral", frames: P.frames(P.NEUTRAL), r },
      { name: "upper arm depth -20%", frames: P.frames(), r: 0.8 * r },
      { name: "upper arm depth +20%", frames: P.frames(), r: 1.2 * r },
    ];
    const lines: string[] = [`f1 armscye loop by rule; r = upper arm girth ${UPPER_ARM_GIRTH_MM} / 2 pi = ${r.toFixed(2)} mm`, ""];
    const drawn: { name: string; loop: V[]; colour: string }[] = [];
    const palette: string[] = ["1f9d3a", "2f6fd0", "d08a1f", "9a3fb5", "c0392b", "16a085"];
    CANDIDATES.forEach((candidate: ICandidate, index: number): void => {
      lines.push(`${candidate.name}: ${candidate.law}`);
      for (const pose of poses) {
        const humerus: SF.IFrame = pose.frames.get("humerus")!;
        const gh: V = humerus.origin as V;
        const elbow: V = (pose.frames.get("forearm")!.origin as V);
        const distal: V = unit(sub(elbow, gh));
        const field = candidate.field(gh, distal, pose.r);
        for (const [skin, mesh] of [["trunk wall", trunk], ...(pose.name === "reference" ? [["reference", source.all]] : [])] as [string, M.IMesh][]) {
          const loops: V[][] = contour(mesh, field).filter((loop: V[]): boolean => Math.abs(turns(loop, gh, distal)) > 0.5);
          if (loops.length === 0) {
            lines.push(`  ${pose.name}, ${skin}: NO LOOP round the humerus's axis`);
            continue;
          }
          const loop: V[] = loops.reduce((a: V[], b: V[]): V[] => (b.length > a.length ? b : a));
          const chart = trunkChart();
          const v: number[] = loop.map((p: V): number => Math.abs(chart(p).v));
          const stations: number[] = loop.map((p: V): number => chart(p).station);
          const mono = monotone(loop, gh, distal);
          const star = starInChart(loop);
          const landmarks: string = pose.name === "reference" ? Object.entries(LANDMARKS).map(([name, p]): string => `${name} ${distanceTo(p, loop).toFixed(1)}`).join(", ") : "-";
          lines.push(`  ${pose.name}, ${skin}: ${loops.length} loop(s) round the axis; ${loop.length} points; trunk stations ${Math.min(...stations).toFixed(0)}..${Math.max(...stations).toFixed(0)}; |v| up to ${Math.max(...v).toFixed(1)} (${v.filter((x: number): boolean => x > CLIP_MM).length} points past the clip); angle round the axis ${mono.advancing ? "advancing" : "NOT ADVANCING (worst " + mono.worst.toFixed(3) + " rad)"}; in the trunk's chart ${star.star ? "star-shaped" : "NOT STAR-SHAPED (" + star.folds + " folds)"}; breast port ${Math.min(...loop.map((p: V): number => distanceTo(p, breast))).toFixed(1)} mm${Math.min(...loop.map((p: V): number => distanceTo(p, breast))) < CLEAR_MM ? " TOO NEAR" : ""}; distances to the landmarks (straight, a lower bound along the skin) ${landmarks}`);
          if (pose.name === "reference" && skin === "reference") drawn.push({ name: candidate.name, loop, colour: palette[index % palette.length]! });
        }
      }
      lines.push("");
    });

    // Frames: every candidate's loop on the reference, the landmarks, over the reference and the generated figure.
    const out: string = path.join(root, "test/.shots/family-conic-armscye-rule", new Date().toISOString().replaceAll(":", "-"));
    await fs.mkdir(out, { recursive: true });
    NodeCanvasRaster.initialize();
    const gh: V = P.frame("humerus").origin as V;
    const crop = (m: M.IMesh, radius: number, k: number): N.Mesh => {
      const positions: number[] = [];
      const indices: number[] = [];
      const remap: Map<number, number> = new Map();
      const near = (i: number): boolean => norm(sub([m.positions[3 * i]! * k, m.positions[3 * i + 1]! * k, m.positions[3 * i + 2]! * k], gh)) <= radius;
      for (let t: number = 0; t + 2 < m.indices.length; t += 3) {
        const tri: number[] = [m.indices[t]!, m.indices[t + 1]!, m.indices[t + 2]!];
        if (!tri.every(near)) continue;
        for (const i of tri) {
          let j: number | undefined = remap.get(i);
          if (j === undefined) {
            j = positions.length / 3;
            remap.set(i, j);
            positions.push(m.positions[3 * i]! * k, m.positions[3 * i + 1]! * k, m.positions[3 * i + 2]! * k);
          }
          indices.push(j);
        }
      }
      return { id: "skin", positions, indices, colour: [0.64, 0.65, 0.67] };
    };
    const pieces: AutoMovieHumanF1.IPiece[] = AutoMovieHumanF1.create();
    const generatedIndices: number[] = [];
    let offset: number = 0;
    for (const p of pieces) {
      for (const i of p.indices) generatedIndices.push(i + offset);
      offset += p.positions.length / 3;
    }
    const generated: M.IMesh = { positions: pieces.flatMap((p: AutoMovieHumanF1.IPiece): number[] => p.positions), indices: generatedIndices };
    const marks: N.Curve[] = Object.values(LANDMARKS).flatMap((p: V): N.Curve[] => [0, 1, 2].map((c: number): N.Curve => {
      const a: V = [...p];
      const b: V = [...p];
      a[c] -= 8;
      b[c] += 8;
      return { id: "mark" + c, points: [a, b], closed: false, xray: true, colour: "e0201c" };
    }));
    const curves: N.Curve[] = [...drawn.map((d): N.Curve => ({ id: d.name, points: d.loop, closed: true, xray: true, colour: d.colour })), ...marks];
    lines.push("Colours: " + drawn.map((d): string => `${d.name} #${d.colour}`).join(", ") + "; red crosses: acromion and the two fold points");
    const frames: { file: string; sha256: string }[] = [];
    for (const [stage, m] of [["reference", crop(source.all, 230, 1)], ["generated", crop(generated, 230, 1000)]] as [string, N.Mesh][]) {
      const bounds: N.Point[] = [];
      for (let i: number = 0; i < m.positions.length; i += 3) bounds.push([m.positions[i]!, m.positions[i + 1]!, m.positions[i + 2]!]);
      for (const view of ["front", "back", "left", "high-oblique", "low-oblique"]) {
        const camera: N.Camera = NodeCanvasCamera.fit(view, bounds, 900, 900);
        const file: string = `rule.${view}.${stage}.png`;
        const png: Buffer = NodeCanvasRaster.render(camera, [m], curves, "depth", `f1 armscye by rule | ${stage} | ${view}`).png;
        await fs.writeFile(path.join(out, file), png);
        frames.push({ file, sha256: createHash("sha256").update(png).digest("hex") });
      }
    }
    lines.push("GH " + fixed(gh, 2));
    await fs.writeFile(path.join(out, "rule.txt"), lines.join("\n") + "\n");
    await fs.writeFile(path.join(out, "rule.json"), JSON.stringify({ r, drawn, frames }, null, 2));
    process.stdout.write(lines.join("\n") + "\nout " + out + "\n");
  }
}

void FamilyConicArmscyeRule.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
  process.exitCode = 1;
});
