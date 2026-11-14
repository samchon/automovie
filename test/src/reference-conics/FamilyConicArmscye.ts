import fs from "node:fs/promises";
import path from "node:path";
import { AutoMovieLoftChain, AutoMovieMeshExtract, AutoMovieNaturalSpline, realizeAutoMovieConstruction } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanF1, AutoMovieHumanF1Joints } from "@automovie/human";
import { FamilyConicLoop } from "./FamilyConicLoop";
import { FamilyConicSource as R } from "./FamilyConicSource";

/**
 * The armscye band's columns read from the two lofts alone, with no realization: for the port loop `AutoMovieHumanF1.armscye` declares and a
 * rail on the arm, how each column of the band leaves the trunk and arrives at the arm.
 *
 * A column runs from a loop point on the trunk to the arm's rail point at the same angle about the rail's centroid. It folds when the trunk's
 * chart direction into the loop, or the arm's direction along its course, points back against the column's chord. The table gives both cosines
 * per clock, and the count of columns that point back, for each side.
 *
 * Usage: `FamilyConicArmscye.ts [railMm] [--table]`; the rail is the one the body declares unless given, and several may be given as `a,b,c`
 * to see how far the declared loop holds. `FamilyConicArmscye.ts port` reads the port's loop and rails off the reference instead (`port`),
 * and `FamilyConicArmscye.ts folds` the axillary folds' lowest points (`folds`).
 */
namespace FamilyConicArmscye {
  type V3 = [number, number, number];
  const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a: V3): number => Math.hypot(a[0], a[1], a[2]);
  const cosine = (a: V3, b: V3): number => dot(a, b) / (norm(a) * norm(b));

  /** Read the columns and print them. */
  export function main(): void {
    const numbers = (text: string | undefined, fallback: number): number[] => (text === undefined || text.startsWith("--") ? [fallback] : text.split(",").map(Number));
    // NaN stands for the rail curve the body declares (`AutoMovieHumanF1.armRails`).
    const rails: number[] = numbers(process.argv[2], NaN);
    const table: boolean = process.argv.includes("--table");
    const n: number = AutoMovieHumanF1.armscye(1).shape?.length ?? 96;
    const turn: number = 2 * Math.PI;
    const chainOf = (family: AutoMovieHumanConicLoft.IFamily, from: number, to: number): NonNullable<ReturnType<typeof AutoMovieHumanConicLoft.create>["chain"]> => {
      const count: number = Math.ceil((to - from) / 4) + 1;
      const loft = AutoMovieHumanConicLoft.create(family, Array.from({ length: count }, (_: unknown, i: number): number => from + ((to - from) * i) / (count - 1)));
      if (loft.chain === null) throw new Error(family.name + " does not loft: " + JSON.stringify(loft.diagnostics).slice(0, 400));
      return loft.chain;
    };
    const trunk = chainOf(AutoMovieHumanF1.BODY.trunk, 380, 720);
    for (const side of [1, -1] as const) {
      const family: AutoMovieHumanConicLoft.IFamily = side > 0 ? AutoMovieHumanF1.BODY.arm : AutoMovieHumanConicLoft.mirror(AutoMovieHumanF1.BODY.arm, "arm.mirror");
      const first: number = family.knots[0]!;
      const arm = chainOf(family, first, first + 160);
      const host = (s: number, p: number): V3 => AutoMovieLoftChain.point(trunk, s, p) as V3;
      const part = (s: number, p: number): V3 => AutoMovieLoftChain.point(arm, s, p) as V3;
      for (const rail of rails) {
          // The declared loop, as the engine reads it: the ellipse's point at each clock scaled from the centre by the column's share.
          const declared = AutoMovieHumanF1.armscye(side);
          const at = (k: number, shrink: number): V3 => {
            const share: number = (1 - shrink) * (declared.shape?.[k] ?? 1);
            return host(1000 * (declared.centre[0] + share * declared.semi[0] * Math.cos((turn * k) / n)), declared.centre[1] + share * declared.sense * declared.semi[1] * Math.sin((turn * k) / n));
          };
          const loop: V3[] = Array.from({ length: n }, (_: unknown, k: number): V3 => at(k, 0));
          const inward: V3[] = loop.map((p: V3, k: number): V3 => sub(at(k, 0.01), p));

          // The rail ring, its centroid and Newell plane, as the engine's correspondence reads them.
          const curve: (psi: number) => number = Number.isNaN(rail) ? AutoMovieNaturalSpline.periodic(AutoMovieHumanF1.armRails(side)) : (): number => rail;
          const station = (psi: number): number => first + curve(psi);
          const samples: number = 8 * n;
          const ring: V3[] = Array.from({ length: samples }, (_: unknown, j: number): V3 => part(station((turn * j) / samples), (turn * j) / samples));
          let c: V3 = [0, 0, 0];
          for (const q of ring) c = [c[0] + q[0] / samples, c[1] + q[1] / samples, c[2] + q[2] / samples];
          let area: V3 = [0, 0, 0];
          ring.forEach((q: V3, j: number): void => {
            const x: V3 = cross(sub(q, c), sub(ring[(j + 1) % samples]!, c));
            area = [area[0] + x[0], area[1] + x[1], area[2] + x[2]];
          });
          const normal: V3 = area.map((x: number): number => x / norm(area)) as V3;
          const d0: V3 = sub(ring[0]!, c);
          const along: number = dot(d0, normal);
          const e1raw: V3 = [d0[0] - normal[0] * along, d0[1] - normal[1] * along, d0[2] - normal[2] * along];
          const e1: V3 = e1raw.map((x: number): number => x / norm(e1raw)) as V3;
          const e2: V3 = cross(normal, e1);
          const angle = (p: V3): number => Math.atan2(dot(sub(p, c), e2), dot(sub(p, c), e1));
          const ringAngles: number[] = ring.map(angle);
          const wrap = (x: number): number => x - turn * Math.round(x / turn);
          let reversals: number = 0;
          const loopAngles: number[] = loop.map(angle);
          const total: number = loopAngles.reduce((sum: number, a: number, k: number): number => sum + wrap(loopAngles[(k + 1) % n]! - a), 0);
          for (let k: number = 0; k < n; ++k) if (Math.sign(wrap(loopAngles[(k + 1) % n]! - loopAngles[k]!)) !== Math.sign(total)) ++reversals;

          const rows: string[] = [];
          let hostBack: number = 0;
          let partBack: number = 0;
          let worstHost: number = 1;
          let worstPart: number = 1;
          let longest: number = 0;
          let shortest: number = Infinity;
          for (let k: number = 0; k < n; ++k) {
            let best: number = 0;
            for (let j: number = 1; j < samples; ++j) if (Math.abs(wrap(ringAngles[j]! - loopAngles[k]!)) < Math.abs(wrap(ringAngles[best]! - loopAngles[k]!))) best = j;
            const psi: number = (turn * best) / samples;
            const q: V3 = ring[best]!;
            const chord: V3 = sub(q, loop[k]!);
            const into: V3 = sub(part(station(psi) + 0.5, psi), q);
            const h: number = cosine(inward[k]!, chord);
            const p: number = cosine(into, chord);
            if (!(h > 0)) ++hostBack;
            if (!(p > 0)) ++partBack;
            worstHost = Math.min(worstHost, h);
            worstPart = Math.min(worstPart, p);
            longest = Math.max(longest, norm(chord));
            shortest = Math.min(shortest, norm(chord));
            if (table && k % 4 === 0) rows.push("  k " + String(k).padStart(2) + " loop " + loop[k]!.map((x: number): string => x.toFixed(0).padStart(5)).join("") + " rail " + q.map((x: number): string => x.toFixed(0).padStart(5)).join("") + " at " + ((psi * 180) / Math.PI).toFixed(0).padStart(4) + " deg chord " + norm(chord).toFixed(1).padStart(5) + " host " + h.toFixed(2).padStart(5) + " part " + p.toFixed(2).padStart(5));
          }
          process.stdout.write(JSON.stringify({ side, rail, reversals, hostBack, partBack, worstHost: Number(worstHost.toFixed(2)), worstPart: Number(worstPart.toFixed(2)), chord: [Number(shortest.toFixed(1)), Number(longest.toFixed(1))], ringNormal: normal.map((x: number): number => Number(x.toFixed(2))), ringCentre: c.map(Math.round) }) + "\n");
          for (const row of rows) process.stdout.write(row + "\n");
        }
    }
  }

  /**
   * The armscye port's numbers, read off the reference and the arm as emitted: the landmark loop (`FamilyConicLoop`) as the trunk's chart
   * sees it, `count` points at equal phase steps round it, each `[height above the trunk's axis foot, phase about the axis]` in mm and
   * radians, for `AutoMovieHumanF1`'s `ARMSCYE_LOOP`; and at the +Z arm's phases `2 pi j / 24` the station where its wall (no reliefs, no
   * caps) crosses onto the arm's side of the loop for good (it stays there over the next 20 mm), and that station plus `into` mm, less
   * the arm's first station, for `ARM_RAILS_MM`.
   *
   * Usage: `FamilyConicArmscye.ts port [intoMm] [count] [--wall=<directory>]`, 10 mm and 48 by default, the emitted arm unless a run's
   * directory is given.
   */
  export async function port(): Promise<void> {
    const plain: string[] = process.argv.slice(3).filter((argument: string): boolean => !argument.startsWith("--"));
    const into: number = Number(plain[0] ?? 10);
    const count: number = Number(plain[1] ?? 48);
    const source: R.ISource = await R.load(path.resolve(process.cwd(), ".."));
    const loop: FamilyConicLoop.ILoop = FamilyConicLoop.build(source);
    const foot: number = AutoMovieHumanF1Joints.axisFloor[1];
    const outline: [number, number][] = Array.from({ length: count }, (_: unknown, k: number): [number, number] => {
      const p: V3 = loop.points[Math.round((k * FamilyConicLoop.SAMPLES) / count) % FamilyConicLoop.SAMPLES]!;
      return [Math.round((p[1] - foot) * 10) / 10, Math.round(Math.atan2(p[2], p[0]) * 1e4) / 1e4];
    });
    process.stdout.write("loop " + JSON.stringify(outline) + "\n");
    // `--wall=<directory>`: the arm of a run not yet emitted (`<directory>/arm.family.json`), so the rails are read before the emit that
    // must land together with them.
    const wall: string | undefined = process.argv.find((argument: string): boolean => argument.startsWith("--wall="))?.slice("--wall=".length);
    const family: AutoMovieHumanConicLoft.IFamily = wall === undefined ? AutoMovieHumanF1.BODY.arm : (JSON.parse(await fs.readFile(path.join(wall, "arm.family.json"), "utf8")) as AutoMovieHumanConicLoft.IFamily);
    const first: number = family.knots[0]!;
    const loft = AutoMovieHumanConicLoft.create({ ...family, tips: undefined, reliefs: undefined }, Array.from({ length: 61 }, (_: unknown, i: number): number => first + 4 * i));
    if (loft.chain === null) throw new Error("the arm's first stations do not loft");
    const chain: NonNullable<typeof loft.chain> = loft.chain;
    const rails: number[] = [];
    for (let j: number = 0; j < 24; ++j) {
      const psi: number = (2 * Math.PI * j) / 24;
      const armSide = (s: number): boolean => loop.side(AutoMovieLoftChain.point(chain, s, psi) as V3) > 0;
      let cross: number = NaN;
      for (let s: number = first; s <= first + 200 && Number.isNaN(cross); s += 0.25) {
        let stays: boolean = armSide(s);
        for (let t: number = s + 1; stays && t <= s + 20; t += 1) stays = armSide(t);
        if (stays) cross = s;
      }
      const p: V3 = AutoMovieLoftChain.point(chain, cross, psi) as V3;
      process.stdout.write(`phase ${j}: crosses at ${cross.toFixed(2)} mm, [${p.map((x: number): string => x.toFixed(1)).join(", ")}]\n`);
      rails.push(Math.round((cross + into - first) * 10) / 10);
    }
    process.stdout.write("rails " + JSON.stringify(rails) + "\n");
  }
}
namespace FamilyConicArmscye {
  /**
   * The axillary folds' lowest points, on the generated skin and on the reference, read in level sections every half millimetre up
   * through the +Z armpit. Below the folds the arm and the trunk are two loops; the first level at which they are one loop is the lower
   * fold's lowest point, on the side where the two stood closest a level below (in front of the shoulder joint: the anterior fold); the
   * first level above it at which a closed hole, the axilla's slit, stands between them is the other fold's lowest point; the last level
   * with that hole is the slit's apex.
   *
   * Usage: `FamilyConicArmscye.ts folds [fromMm] [toMm]`, 1,230 to 1,330 mm by default.
   */
  export async function folds(): Promise<void> {
    const from: number = Number(process.argv[3] ?? 1230);
    const to: number = Number(process.argv[4] ?? 1330);
    const source: R.ISource = await R.load(path.resolve(process.cwd(), ".."));
    const declared = AutoMovieHumanF1.construction();
    const real = realizeAutoMovieConstruction({ name: "f1.body", root: declared.root, fills: declared.fills }, { chord: 0.001, sources: declared.sources });
    const generated: AutoMovieMeshExtract.IMesh = { positions: Array.from(real.mesh.positions, (x: number): number => x * 1000), indices: Array.from(real.mesh.indices) };
    const joint: number[] = source.joints.get("upperarm_l")!;
    const shoulder: [number, number, number] = [joint[0]!, joint[1]!, Math.abs(joint[2]!)];
    for (const [label, mesh] of [["reference", source.body], ["generated", generated]] as [string, AutoMovieMeshExtract.IMesh][]) {
      // The level's closed loops on the +Z side, in (x, z), mm.
      const level = (y: number): [number, number][][] =>
        AutoMovieMeshExtract.outline(mesh, { origin: [0, y, 0], axes: [[0, 1, 0], [1, 0, 0], [0, 0, 1]] }, [0], 0, 0.5, 0)[0]!
          .loops.filter((loop): boolean => loop.closed)
          .map((loop): [number, number][] => loop.points.map((p): [number, number] => [p[0], p[1]]));
      // The loop holding the arm (its point farthest along +Z) and whether it reaches the median plane, so holds the trunk as well.
      const read = (y: number): { joined: boolean; hole: boolean; gap: { x: number; mm: number } | null } => {
        const loops = level(y).filter((loop) => loop.some((p) => p[1] > 0));
        if (loops.length === 0) return { joined: false, hole: false, gap: null };
        const arm = loops.reduce((a, b) => (Math.max(...b.map((p) => p[1])) > Math.max(...a.map((p) => p[1])) ? b : a));
        const joined: boolean = arm.some((p) => Math.abs(p[1]) < 20);
        const trunk = loops.find((loop) => loop !== arm && loop.some((p) => Math.abs(p[1]) < 20));
        // A hole: a loop wholly between the trunk's side and the arm, inside the joined loop's box.
        const hole: boolean = joined && loops.some((loop) => loop !== arm && loop.every((p) => p[1] > 60) && Math.max(...loop.map((p) => p[1])) < Math.max(...arm.map((p) => p[1])));
        let gap: { x: number; mm: number } | null = null;
        if (!joined && trunk !== undefined)
          for (const p of arm)
            for (const q of trunk) {
              const d: number = Math.hypot(p[0] - q[0], p[1] - q[1]);
              if (gap === null || d < gap.mm) gap = { x: (p[0] + q[0]) / 2, mm: d };
            }
        return { joined, hole, gap };
      };
      let lower: number | null = null, side: string = "-", upper: number | null = null, apex: number | null = null, last: { x: number; mm: number } | null = null;
      for (let y: number = from; y <= to; y += 0.5) {
        const at = read(y);
        if (lower === null) {
          if (at.joined) {
            lower = y;
            side = last === null ? "-" : last.x > shoulder[0] ? "anterior" : "posterior";
          } else last = at.gap;
        } else if (at.hole) {
          upper ??= y;
          apex = y;
        }
      }
      process.stdout.write(JSON.stringify({ skin: label, lowerFoldMm: lower, lowerFold: side, closestBelow: last === null ? null : { xMm: Math.round(last.x * 10) / 10, gapMm: Math.round(last.mm * 10) / 10 }, otherFoldMm: upper, slitApexMm: apex, shoulderJointXMm: Math.round(shoulder[0] * 10) / 10 }) + "\n");
    }
  }
}
if (process.argv[2] === "folds")
  void FamilyConicArmscye.folds().catch((error: unknown): void => {
    process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
    process.exitCode = 1;
  });
else if (process.argv[2] === "port")
  void FamilyConicArmscye.port().catch((error: unknown): void => {
    process.stderr.write((error instanceof Error ? (error.stack ?? error.message) : String(error)) + "\n");
    process.exitCode = 1;
  });
else FamilyConicArmscye.main();
