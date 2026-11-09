import fs from "node:fs";
import path from "node:path";
import type { AutoMovieLoftFrame } from "@automovie/engine";
import type { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanTrunkF1Traced } from "../generation/trunk/AutoMovieHumanTrunkF1Traced";
import { AutoMovieHumanTrunkNeckTurn } from "../generation/trunk/AutoMovieHumanTrunkNeckTurn";
import { AutoMovieHumanTrunkS00 } from "../generation/trunk/AutoMovieHumanTrunkS00";
import { HumanNodeInput } from "./HumanNodeInput";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeTrunkReference } from "./NodeTrunkReference";

type V3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * f1's trunk read on S00's tilted bottom band (`node:trunk-band`, diagnostic
 * reading; nothing here feeds generation, the values enter
 * `AutoMovieHumanTrunkF1Traced` with this receipt): S00's planes with the
 * bottom turn through her forks (`AutoMovieHumanTrunkNeckTurn.floor` over
 * the current course, the forks the ends of `CROTCH_LINE`), and at every
 * station from the open bottom to the turn's upper end, every 10 mm, her
 * exact cut by that station's plane (the reference registered as
 * `NodeTrunkMeasure` registers it: X - 26.8, Z about her median plane), read
 * in the plane's chart (u forward along the plane, v = +Z): the midline's
 * front and back crossings of v = 0, the half breadth (largest |v| within
 * 230 mm), and each right quarter's conic shoulder share about the plane's
 * origin (rho = |MS| / |MC|, M the chord's midpoint between the midline point
 * and the lateral point, C the corner; above 1 her section leaves the
 * quarter's box there). Written under `.shots/f1_trunk2/band-<stamp>/`.
 */
export namespace NodeTrunkBand {
  /** The largest posterior offset in the turn, mm (`AutoMovieHumanTrunkF1Traced.FLOOR_INNER`). */
  export const INNER: number = AutoMovieHumanTrunkF1Traced.FLOOR_INNER;

  /** Reads the band and writes the receipt. */
  export async function run(): Promise<void> {
    const person: Awaited<ReturnType<typeof HumanNodeInput.of>> = await HumanNodeInput.of();
    const s00: AutoMovieHumanTrunkS00.IOutput = AutoMovieHumanTrunkS00.of(person.parameters);
    const line: [number, number][] = AutoMovieHumanTrunkF1Traced.CROTCH_LINE;
    const front: V3 = [line[0]![0], line[0]![1], 0];
    const back: V3 = [line[line.length - 1]![0], line[line.length - 1]![1], 0];
    const turn: AutoMovieHumanTrunkNeckTurn.IOutput = AutoMovieHumanTrunkNeckTurn.floor(s00.curves.axis.turn, front, back, INNER);
    const floor: AutoMovieHumanTrunkNeckTurn.IFloor = turn.floor!;
    const raw: NodeTrunkReference.IMesh = NodeTrunkReference.load(1);
    const zs: number[] = raw.points.filter((p: V3): boolean => p[1] > 1000 && p[1] < 1400).map((p: V3): number => p[2]).sort((a: number, b: number): number => a - b);
    const midZ: number = zs[Math.floor(zs.length / 2)] ?? 0;
    const mesh: NodeTrunkReference.IMesh = { points: raw.points.map((p: V3): V3 => [p[0] - 26.8, p[1], p[2] - midZ]), triangles: raw.triangles };

    const rows: Record<string, number>[] = [];
    const stations: number[] = [];
    for (let s: number = floor.station; s < floor.level - 1e-6; s += 10) stations.push(s);
    stations.push(floor.level);
    for (const s of stations) {
      const f: AutoMovieLoftFrame.IFrame = turn.frame(s);
      const o: readonly number[] = f.origin;
      const u: readonly number[] = f.u;
      // The plane's normal (u x v with v = +Z, pointing up the course): (-u_y, u_x, 0) for u = (cos a, -sin a, 0).
      const n: V3 = [-u[1]!, u[0]!, 0];
      const segs: [[number, number], [number, number]][] = NodeTrunkReference.cut(mesh, n, n[0] * o[0]! + n[1] * o[1]!)
        .map(([a, b]: [V3, V3]): [[number, number], [number, number]] => [
          [(a[0] - o[0]!) * u[0]! + (a[1] - o[1]!) * u[1]!, a[2]],
          [(b[0] - o[0]!) * u[0]! + (b[1] - o[1]!) * u[1]!, b[2]],
        ])
        .filter(([a, b]: [[number, number], [number, number]]): boolean => Math.abs(a[1]) < 230 && Math.abs(b[1]) < 230);
      const mid: number[] = [];
      for (const [a, b] of segs) if ((a[1] < 0 && b[1] >= 0) || (a[1] >= 0 && b[1] < 0)) mid.push(a[0] + ((b[0] - a[0]) * a[1]) / (a[1] - b[1]));
      const half: number = Math.max(...segs.flatMap(([a, b]: [[number, number], [number, number]]): number[] => [Math.abs(a[1]), Math.abs(b[1])]));
      const fu: number = Math.max(...mid);
      const bu: number = Math.min(...mid);
      const share = (ax: number): number => {
        const m: [number, number] = [ax / 2, half / 2];
        const d: [number, number] = [ax - m[0], half - m[1]];
        let best: number = Infinity;
        for (const [p, q] of segs) {
          const e: [number, number] = [q[0] - p[0], q[1] - p[1]];
          const den: number = d[0] * e[1] - d[1] * e[0];
          if (Math.abs(den) < 1e-12) continue;
          const w: [number, number] = [p[0] - m[0], p[1] - m[1]];
          const t: number = (w[0] * e[1] - w[1] * e[0]) / den;
          const k: number = (w[0] * d[1] - w[1] * d[0]) / den;
          if (t > 0 && k >= 0 && k <= 1 && t < best) best = t;
        }
        return best;
      };
      const round = (x: number): number => Math.round(x * 100) / 100;
      rows.push({ station: round(s), originX: round(o[0]!), originY: round(o[1]!), alpha: Math.round(Math.atan2(-u[1]!, u[0]!) * 1e5) / 1e5, front: round(fu), back: round(bu), half: round(half), rhoFront: round(share(fu) * 1000) / 1000, rhoBack: round(share(bu) * 1000) / 1000, crossings: mid.length });
    }
    const receipt = { floor, inner: INNER, forks: { front, back }, rows };
    const stamp: string = new Date().toISOString().replace(/[:.]/g, "-");
    const out: string = HumanNodePaths.resolve(`packages/human/.shots/f1_trunk2/band-${stamp}`);
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(path.join(out, "band.json"), JSON.stringify(receipt, null, 1));
    console.log(JSON.stringify(receipt, null, 1));
    console.log(out);
  }
}

void NodeTrunkBand.run().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
