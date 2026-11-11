import path from "node:path";
import { AutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanConicLoft, AutoMovieHumanF1 } from "@automovie/human";
import { FamilyConicSource as R } from "./FamilyConicSource";

/**
 * How far the reference ear's outer face lies under the ear family's closed end: the depth a relief over that end would have to carry.
 *
 * The ear is lofted straight to the side and closes in a dome, so the helix, the antihelix and the concha, which face the side, are all under
 * that dome. From points of the dome, by station and phase, a ray is cast along the course toward the head, and the distance to the first
 * triangle of the reference head it meets is the depth there; a negative depth is skin outside the dome.
 *
 * Usage: `FamilyConicEar.ts [fromStationMm]`: prints the depths, one row per station from there to the tip and one column per 15 degrees.
 */
namespace FamilyConicEar {
  type V3 = [number, number, number];

  /** Print the depth map. */
  export async function main(): Promise<void> {
    const source: R.ISource = await R.load(path.resolve(process.cwd(), ".."));
    const family = AutoMovieHumanF1.BODY.ear;
    const tip: number = family.tips![1]!.tip;
    const from: number = Number(process.argv[2] ?? family.knots[0]);
    const stations: number[] = Array.from({ length: Math.ceil((family.knots.at(-1)! - family.knots[0]!) / 1) + 1 }, (_: unknown, i: number): number => family.knots[0]! + i);
    const loft = AutoMovieHumanConicLoft.create(family, stations);
    if (loft.chain === null) throw new Error("the ear does not loft");
    const chain = loft.chain;

    // The reference triangles inside the ear's box, widened.
    const positions = source.head.positions;
    const triangles: [V3, V3, V3][] = [];
    for (let t: number = 0; t + 2 < source.head.indices.length; t += 3) {
      const corners: V3[] = [0, 1, 2].map((k: number): V3 => {
        const i: number = source.head.indices[t + k]! * 3;
        return [positions[i]!, positions[i + 1]!, positions[i + 2]!];
      });
      if (corners.some((p: V3): boolean => p[2] > 60 && p[0] > -25 && p[0] < 40 && p[1] > 1525 && p[1] < 1615)) triangles.push(corners as [V3, V3, V3]);
    }

    // Distance along -Z from a point to the first triangle met, searched 6 mm to the side of the point as well; null when none is met.
    const depth = (p: V3): number | null => {
      let best: number | null = null;
      for (const [a, b, c] of triangles) {
        const d: number = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
        if (d === 0) continue;
        const u: number = ((p[0] - a[0]) * (c[1] - a[1]) - (p[1] - a[1]) * (c[0] - a[0])) / d;
        const v: number = ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])) / d;
        if (u < 0 || v < 0 || u + v > 1) continue;
        const z: number = a[2] + u * (b[2] - a[2]) + v * (c[2] - a[2]);
        const t: number = p[2] - z;
        if (t < -6) continue;
        if (best === null || t < best) best = t;
      }
      return best;
    };
    // `--map`: the outermost reference skin over the ear's box, its side distance by height (rows, top first) and by forward position (columns).
    if (process.argv.includes("--map")) {
      const outer = (x: number, y: number): number | null => {
        let best: number | null = null;
        for (const [a, b, c] of triangles) {
          const d: number = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
          if (d === 0) continue;
          const u: number = ((x - a[0]) * (c[1] - a[1]) - (y - a[1]) * (c[0] - a[0])) / d;
          const v: number = ((b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0])) / d;
          if (u < 0 || v < 0 || u + v > 1) continue;
          const z: number = a[2] + u * (b[2] - a[2]) + v * (c[2] - a[2]);
          if (best === null || z > best) best = z;
        }
        return best;
      };
      const xs: number[] = Array.from({ length: 19 }, (_: unknown, i: number): number => -8 + 2 * i);
      process.stdout.write("   y\\x " + xs.map((x: number): string => String(x).padStart(4)).join("") + "\n");
      for (let y: number = 1604; y >= 1536; y -= 3) process.stdout.write(String(y).padStart(6) + " " + xs.map((x: number): string => (outer(x, y) ?? 0).toFixed(0).padStart(4)).join("") + "\n");
      return;
    }
    process.stdout.write("triangles " + triangles.length + ", tip " + tip + "\nstation " + Array.from({ length: 24 }, (_: unknown, j: number): string => String(j * 15).padStart(5)).join("") + "\n");
    for (let s: number = from; s < tip - 0.05; s += s < family.tips![1]!.from ? 2 : 0.5) {
      const cells: string[] = [];
      for (let j: number = 0; j < 24; ++j) {
        const p: V3 = AutoMovieLoftChain.point(chain, s, (j * Math.PI) / 12) as V3;
        const d: number | null = depth(p);
        cells.push((d === null ? "." : d.toFixed(1)).padStart(5));
      }
      const q: V3 = AutoMovieLoftChain.point(chain, s, 0) as V3;
      process.stdout.write(s.toFixed(1).padStart(6) + "  " + cells.join("") + "   z " + q[2].toFixed(1) + "\n");
    }
  }
}
void FamilyConicEar.main().catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
