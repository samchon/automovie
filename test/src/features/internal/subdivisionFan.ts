import { type IAutoMovieSubdivisionCage } from "@automovie/engine";

/**
 * A synthetic open cage of `n` quads around vertex 0, which is interior with
 * valence `n`. Vertex 0 sits at `(0, 0, apex)`, vertex `1 + i` on the unit
 * circle at angle `2 pi i / n` lifted by `ring(i)`, and vertex `1 + n + i` at
 * radius 1.7 between spokes `i` and `i + 1` lifted by `rim(i)`; quad `i` is
 * `[0, 1 + i, 1 + n + i, 1 + (i + 1) % n]`, counter-clockwise about +Z.
 */
export function subdivisionFan(
  n: number,
  apex: number,
  ring: (i: number) => number,
  rim: (i: number) => number,
): IAutoMovieSubdivisionCage {
  const positions: number[] = [0, 0, apex];
  for (let i: number = 0; i < n; ++i) {
    const angle: number = (2 * Math.PI * i) / n;
    positions.push(Math.cos(angle), Math.sin(angle), ring(i));
  }
  for (let i: number = 0; i < n; ++i) {
    const angle: number = (2 * Math.PI * (i + 0.5)) / n;
    positions.push(1.7 * Math.cos(angle), 1.7 * Math.sin(angle), rim(i));
  }
  const faces: number[][] = [];
  for (let i: number = 0; i < n; ++i)
    faces.push([0, 1 + i, 1 + n + i, 1 + ((i + 1) % n)]);
  return { positions, faces };
}
