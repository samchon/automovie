import fs from "node:fs";
import path from "node:path";
import { AutoMovieMeshExtract } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";
import { AutoMovieHumanHeadBuild } from "../generation/head/AutoMovieHumanHeadBuild";
import { AutoMovieHumanHeadF1Pose } from "../generation/head/AutoMovieHumanHeadF1Pose";
import { AutoMovieHumanHeadMassCurves } from "../generation/head/AutoMovieHumanHeadMassCurves";
import { HumanReferenceExtract } from "../inspection/HumanReferenceExtract";
import { HumanNodeInput } from "./HumanNodeInput";
import { HumanNodePaths } from "./HumanNodePaths";

type V2 = [number, number];

/**
 * f1's head sections read as the head stream's own quarter shoulders (owner's
 * order, 2026-11-08: trace her sections the same way as her outlines). Her
 * mesh is cut exactly (`AutoMovieMeshExtract.outline`) at level planes of her
 * upright frame about the tragia (`AutoMovieHumanHeadF1Pose`: her native
 * point less the receipt's origin), the frame the head's course runs in, at
 * the course's own stations. At each station the quarter box is the head
 * stream's own: from the course origin `x0` (the lateral extreme's place),
 * the anterior (posterior) outline's offset `a` and the lateral outline's
 * half breadth `b` as built (`AutoMovieHumanHeadBuild`). Her shoulder in that
 * box is `rho = |MS| / |MC|` (M the chord's midpoint between the two
 * extremes, C the box corner, S where her largest closed loop crosses the
 * ray from M to C), the conic's own fullness definition (0.414 for the exact
 * quarter ellipse), averaged over her two sides. Her loop is also reduced by
 * `AutoMovieMeshExtract.reduceLoop` within 0.5 mm for the record.
 *
 * Writes `quarters.json` and the table as TypeScript under
 * `.shots/f1_head3/quarters-<stamp>/`.
 */
export namespace NodeHeadQuarters {
  /** Runs the reading. */
  export async function run(): Promise<void> {
    const person: Awaited<ReturnType<typeof HumanNodeInput.of>> = await HumanNodeInput.of();
    const b: AutoMovieHumanHeadBuild.IOutput = AutoMovieHumanHeadBuild.create(person.parameters);
    const L: number = b.curves.length;
    // `--check`: the built laws' numbers alone, no mesh: both shoulder laws over 0.25 mm samples (their range, which the loft admits only inside (0, 1)) and at the table's stations, and the lateral outline under the jaw every 2.5 mm.
    if (process.argv.includes("--check")) {
      for (const [name, knots] of [["anterior", b.curves.fullness.anterior], ["posterior", b.curves.fullness.posterior]] as [string, AutoMovieHumanHeadMassCurves.IKnot[]][]) {
        let lo: [number, number] = [Infinity, 0];
        let hi: [number, number] = [-Infinity, 0];
        for (let s: number = b.course.start; s <= L; s += 0.25) {
          const v: number = AutoMovieHumanHeadMassCurves.fullness(knots, s);
          if (v < lo[0]) lo = [v, s];
          if (v > hi[0]) hi = [v, s];
        }
        console.log(`${name}: min ${lo[0].toFixed(4)} at ${lo[1].toFixed(2)}, max ${hi[0].toFixed(4)} at ${hi[1].toFixed(2)}; knots ${knots.map((k: AutoMovieHumanHeadMassCurves.IKnot): string => `${k.station.toFixed(1)}:${AutoMovieHumanHeadMassCurves.fullness(knots, k.station).toFixed(3)}`).join(" ")}`);
      }
      const lateral: string[] = [];
      for (let s: number = -110; s <= -55; s += 2.5) lateral.push(`${s}:${AutoMovieHumanHeadMassCurves.value(b.curves.outlines.lateral, s, L)[0].toFixed(2)}`);
      console.log(`lateral (start ${b.course.start.toFixed(2)}): ${lateral.join(" ")}`);
      // The submental-to-port band: the throat contour, the anterior outline's place (course origin plus offset) and the corner's construction points, upright frame.
      const band: string[] = [];
      for (let s: number = -110; s <= Math.min(-86, b.throat.gn[1] - 0.01); s += 1) band.push(`${s}:${b.throat.at(s)[0].toFixed(2)}|${(b.course.frame(s).origin[0] + AutoMovieHumanHeadMassCurves.value(b.curves.outlines.anterior, s, L)[0]).toFixed(2)}`);
      console.log(`throat|anterior x by upright height: ${band.join(" ")}`);
      console.log(`throat corner ${b.throat.corner.map((v: number): string => v.toFixed(2)).join(",")} from ${b.throat.from.map((v: number): string => v.toFixed(2)).join(",")} to ${b.throat.to.map((v: number): string => v.toFixed(2)).join(",")} gn ${b.throat.gn.map((v: number): string => v.toFixed(2)).join(",")}`);
      // The continuation: head.mass's first section against S00's end (the course's base extents and shoulder, value and height jets).
      const s0: number = b.course.start;
      const e: typeof b.course.base.extents = b.course.base.extents;
      const outline: (label: "anterior" | "lateral" | "posterior") => string = (label: "anterior" | "lateral" | "posterior"): string => AutoMovieHumanHeadMassCurves.value(b.curves.outlines[label], s0 + 1e-9, L).map((v: number): string => v.toFixed(5)).join("/");
      console.log(`port: S00 extents ${e.map((j: readonly number[]): string => j.map((v: number): string => v.toFixed(5)).join("/")).join(", ")}; shoulder ${b.course.base.shoulder.map((v: number): string => v.toFixed(5)).join("/")}`);
      console.log(`port: head.mass anterior ${outline("anterior")}, lateral ${outline("lateral")}, posterior ${outline("posterior")}; shoulders ${AutoMovieHumanHeadMassCurves.fullness(b.curves.fullness.anterior, s0).toFixed(5)} / ${AutoMovieHumanHeadMassCurves.fullness(b.curves.fullness.posterior, s0).toFixed(5)}`);
      return;
    }
    const O: AutoMovieMeshExtract.V3 = AutoMovieHumanHeadF1Pose.ORIGIN;
    const model: IAutoMovieModel = JSON.parse(fs.readFileSync(HumanNodePaths.resolve("test/.shots/f1/reference-model.json"), "utf8")) as IAutoMovieModel;
    const whole: HumanReferenceExtract.IMesh = HumanReferenceExtract.triangles(model);
    // Her upright frame: native axes about her tragia's midpoint; the station axis +Y, in-plane a = +Z (native), b = +X.
    const frame: AutoMovieMeshExtract.IFrame = { origin: O, axes: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] };
    // The head and neck alone: the arms stand beyond 140 mm of the midline at the neck's heights (the head capture provider's own crop, |Z| < 140).
    const mesh: HumanReferenceExtract.IMesh = HumanReferenceExtract.crop(whole, frame, { min: [-160, -150, -140], max: [180, 160, 140] });
    // The stations: every 10 mm from 5 mm above the port to 5 mm below the vertex, with the course's datum stations.
    const stations: number[] = [];
    for (let s: number = Math.ceil((b.course.start + 5) / 10) * 10; s < L - 5; s += 10) stations.push(s);
    const sections: AutoMovieMeshExtract.ISection[] = AutoMovieMeshExtract.outline(mesh, frame, stations, 1, 0.5);
    const rows: { station: number; flags: string[]; anterior: number | null; posterior: number | null; sides: (number | null)[]; a: number; p: number; b: number; x0: number; knots: number }[] = [];
    for (const section of sections) {
      const s: number = section.station;
      const x0: number = b.course.frame(s).origin[0];
      const a: number = AutoMovieHumanHeadMassCurves.value(b.curves.outlines.anterior, s, L)[0];
      const p: number = AutoMovieHumanHeadMassCurves.value(b.curves.outlines.posterior, s, L)[0];
      const half: number = AutoMovieHumanHeadMassCurves.value(b.curves.outlines.lateral, s, L)[0];
      // Every chain of her cut, closed or open: her mesh is open at the mouth, nostrils and orbits and its slices are broken by holes (the 17:22 reading of closed loops alone found none at any station), so the outermost crossing of the ray over all her chains' segments is read.
      const segments: [V2, V2][] = section.loops.flatMap((l: AutoMovieMeshExtract.ILoop): [V2, V2][] => {
        // In-plane `[a, b]` = `[z, x]` about the station's axis point; the quarter box in `[x, z]`.
        const xz: V2[] = l.points.map((q: [number, number]): V2 => [q[1], q[0]]);
        return xz.flatMap((P: V2, i: number): [V2, V2][] => (i + 1 < xz.length ? [[P, xz[i + 1]!]] : l.closed && xz.length > 2 ? [[P, xz[0]!]] : []));
      });
      const loop: [number, number][] | null = section.loops.filter((l: AutoMovieMeshExtract.ILoop): boolean => l.closed).reduce((m: [number, number][] | null, l: AutoMovieMeshExtract.ILoop): [number, number][] | null => (m === null || l.points.length > m.length ? l.points : m), null);
      const shoulder: (front: boolean, side: number) => number | null = (front: boolean, side: number): number | null => {
        if (segments.length === 0) return null;
        const A: V2 = [x0 + (front ? a : -p), 0];
        const Lp: V2 = [x0, side * half];
        const M: V2 = [(A[0] + Lp[0]) / 2, (A[1] + Lp[1]) / 2];
        const C: V2 = [A[0], Lp[1]];
        const d: V2 = [C[0] - M[0], C[1] - M[1]];
        let best: number | null = null;
        for (const [P, Q] of segments) {
          const e: V2 = [Q[0] - P[0], Q[1] - P[1]];
          const den: number = d[0] * e[1] - d[1] * e[0];
          if (Math.abs(den) < 1e-12) continue;
          const w: V2 = [P[0] - M[0], P[1] - M[1]];
          const t: number = (w[0] * e[1] - w[1] * e[0]) / den;
          const u: number = (w[0] * d[1] - w[1] * d[0]) / den;
          if (u < 0 || u > 1 || t <= 0) continue;
          if (best === null || t > best) best = t;
        }
        // The ray's parameter is in units of |MC|, so it is the shoulder itself.
        return best;
      };
      const sides: (number | null)[] = [shoulder(true, 1), shoulder(true, -1), shoulder(false, 1), shoulder(false, -1)];
      const mean: (u: number | null, v: number | null) => number | null = (u: number | null, v: number | null): number | null => (u === null || v === null ? (u ?? v) : (u + v) / 2);
      const reduced: number = loop === null || loop.length < 4 ? 0 : AutoMovieMeshExtract.reduceLoop(loop, 0.5).knots.length;
      rows.push({ station: s, flags: section.flags, anterior: mean(sides[0]!, sides[1]!), posterior: mean(sides[2]!, sides[3]!), sides, a, p, b: half, x0, knots: reduced });
    }
    const stamp: string = new Date().toISOString().replace(/[:.]/g, "-");
    const out: string = HumanNodePaths.resolve(`packages/human/.shots/f1_head3/quarters-${stamp}`);
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, "quarters.json"), JSON.stringify({ start: b.course.start, length: L, rows }, null, 1));
    const f: (n: number | null) => string = (n: number | null): string => (n === null ? "null" : (Math.round(n * 1000) / 1000).toString());
    const table: string[] = rows.map((r: (typeof rows)[number]): string => `[${r.station}, ${f(r.anterior)}, ${f(r.posterior)}], // sides ${r.sides.map(f).join(" ")}; a ${f(r.a)} p ${f(r.p)} b ${f(r.b)} x0 ${f(r.x0)}; loop knots ${r.knots}${r.flags.length === 0 ? "" : `; flags ${r.flags.join(", ")}`}`);
    fs.writeFileSync(path.join(out, "quarters.ts.txt"), [`// start ${f(b.course.start)} length ${f(L)}; [upright station, anterior rho, posterior rho]`, ...table].join("\n"));
    console.log(out);
  }
}

void NodeHeadQuarters.run();
