import { AutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanF1, AutoMovieHumanF1Joints } from "@automovie/human";

/**
 * The armscye band's columns read from the two lofts alone, with no realization: for a margin round the shoulder's section and a rail on the arm,
 * how each column of the band leaves the trunk and arrives at the arm.
 *
 * A column runs from a loop point on the trunk to the arm's rail point at the same angle about the rail's centroid. It folds when the trunk's
 * chart direction into the loop, or the arm's direction along its course, points back against the column's chord. The table gives both cosines
 * per clock, and the count of columns that point back, for each side.
 *
 * Usage: `FamilyConicArmscye.ts <marginMm> <railMm> [bottomMm] [--table]`; several values of each may be given as `a,b,c`. `bottomMm` tries
 * another height for the section's lower edge than the datum's.
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
    const margins: number[] = numbers(process.argv[2], 4);
    const rails: number[] = numbers(process.argv[3], 25);
    const table: boolean = process.argv.includes("--table");
    const bottoms: number[] = numbers(process.argv[4], AutoMovieHumanF1Joints.armscye.bottom);
    const n: number = 96;
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
      for (const margin of margins)
        for (const rail of rails)
        for (const bottom of bottoms) {
          const J = { ...AutoMovieHumanF1Joints, armscye: { ...AutoMovieHumanF1Joints.armscye, bottom } };
          const fore: number = Math.atan2(J.armpit[2], J.armscye.fore);
          const aft: number = Math.atan2(J.armpit[2], J.armscye.aft);
          const centre: [number, number] = [(J.armscye.bottom + J.armscye.top) / 2 - J.axisFloor[1], (side * (fore + aft)) / 2];
          const semi: [number, number] = [(J.armscye.top - J.armscye.bottom) / 2 + margin, (aft - fore) / 2 + margin / J.armpit[2]];
          const at = (k: number, shrink: number): V3 => host(centre[0] + (1 - shrink) * semi[0] * Math.cos((turn * k) / n), centre[1] + side * (1 - shrink) * semi[1] * Math.sin((turn * k) / n));
          const loop: V3[] = Array.from({ length: n }, (_: unknown, k: number): V3 => at(k, 0));
          const inward: V3[] = loop.map((p: V3, k: number): V3 => sub(at(k, 0.01), p));

          // The rail ring, its centroid and Newell plane, as the engine's correspondence reads them.
          const station: number = first + rail;
          const samples: number = 8 * n;
          const ring: V3[] = Array.from({ length: samples }, (_: unknown, j: number): V3 => part(station, (turn * j) / samples));
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
            const into: V3 = sub(part(station + 0.5, psi), q);
            const h: number = cosine(inward[k]!, chord);
            const p: number = cosine(into, chord);
            if (!(h > 0)) ++hostBack;
            if (!(p > 0)) ++partBack;
            worstHost = Math.min(worstHost, h);
            worstPart = Math.min(worstPart, p);
            longest = Math.max(longest, norm(chord));
            shortest = Math.min(shortest, norm(chord));
            if (table && k % 4 === 0) rows.push("  k " + String(k).padStart(2) + " loop " + loop[k]!.map((x: number): string => x.toFixed(0).padStart(5)).join("") + " rail " + q.map((x: number): string => x.toFixed(0).padStart(5)).join("") + " chord " + norm(chord).toFixed(1).padStart(5) + " host " + h.toFixed(2).padStart(5) + " part " + p.toFixed(2).padStart(5));
          }
          process.stdout.write(JSON.stringify({ side, margin, rail, bottom, reversals, hostBack, partBack, worstHost: Number(worstHost.toFixed(2)), worstPart: Number(worstPart.toFixed(2)), chord: [Number(shortest.toFixed(1)), Number(longest.toFixed(1))], ringNormal: normal.map((x: number): number => Number(x.toFixed(2))), ringCentre: c.map(Math.round) }) + "\n");
          for (const row of rows) process.stdout.write(row + "\n");
        }
    }
  }
}
FamilyConicArmscye.main();
