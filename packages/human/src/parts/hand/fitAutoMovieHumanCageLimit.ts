import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Weight of keeping each control point at its own skin point against moving it so the limit surface reaches that point.
 *
 * Without it the solve interpolates: the limit passes through every skin point, and any step between neighbouring points, such as a joint section a little broader than the shaft beside it, comes out as a sharp ring. With it a component of the cage's shape is reached in proportion to how smooth it is: the limit operator keeps a smooth component nearly unchanged (eigenvalue near 1, fully restored) and damps a component that alternates from vertex to vertex (eigenvalue down to 1/9, left close to its skin points). A tenth restores the overall shrinkage of subdivision while leaving vertex-scale detail as drawn; the remaining shortfall at measured extremes is closed by moving the skin points themselves. Conventional, chosen by inspection of renders.
 */
const SMOOTHING: number = 0.1;

/**
 * Solve a quad cage's control points so that its Catmull-Clark limit surface follows given skin points, one per vertex.
 *
 * The limit position of an interior vertex of valence `n` is `(n²·P + 4·ΣE + ΣF) / (n·(n + 5))`, its edge neighbours `E` and the vertices across its faces `F` (Halstead, Kass and DeRose 1993, SIGGRAPH '93, pp. 35-44): a fixed linear map `M` of the control points. The cage minimises `|M·P − T|² + SMOOTHING·|P − T|²`, a damped least-squares fit of the limit to the skin points `T`, by gradient steps from `P = T`. Vertices on the cage's boundary are held: they belong to a ring whose limit also depends on the neighbouring part.
 *
 * @param props.targets Skin point of each vertex, or for a held vertex its control point
 * @param props.faces Quads as vertex indices
 * @param props.sweeps Number of gradient steps
 * @returns Control points, by vertex index
 */
export function fitAutoMovieHumanCageLimit(props: {
  targets: readonly IAutoMovieVector3[];
  faces: ReadonlyArray<readonly [number, number, number, number]>;
  sweeps: number;
}): IAutoMovieVector3[] {
  const n: number = props.targets.length;
  const edges: Array<Set<number>> = Array.from({ length: n }, (): Set<number> => new Set());
  const across: number[][] = Array.from({ length: n }, (): number[] => []);
  const valence: number[] = new Array<number>(n).fill(0);
  const count: Map<string, number> = new Map();
  for (const face of props.faces)
    face.forEach((v: number, k: number): void => {
      const next: number = face[(k + 1) % 4]!;
      edges[v]!.add(next);
      edges[next]!.add(v);
      across[v]!.push(face[(k + 2) % 4]!);
      valence[v]! += 1;
      const key: string = v < next ? `${v},${next}` : `${next},${v}`;
      count.set(key, (count.get(key) ?? 0) + 1);
    });
  const free: boolean[] = valence.map((k: number): boolean => k !== 0);
  for (const [key, c] of count)
    if (c === 1) for (const v of key.split(",")) free[Number(v)] = false;

  const target: number[] = props.targets.flatMap((t: IAutoMovieVector3): number[] => [t.x, t.y, t.z]);
  const step: number = 0.9 / (1 + SMOOTHING);
  let x: number[] = [...target];
  for (let sweep: number = 0; sweep < props.sweeps; ++sweep) {
    // residual of the limit, then the gradient through the transposed mask
    const residual: number[] = [...target];
    for (let v: number = 0; v < n; ++v)
      for (let c: number = 0; c < 3; ++c) residual[3 * v + c]! -= free[v] ? mask(v, c, x) : x[3 * v + c]!;
    const gradient: number[] = new Array<number>(3 * n).fill(0);
    for (let v: number = 0; v < n; ++v) {
      if (!free[v]) continue;
      const k: number = valence[v]!;
      const w: number = 1 / (k * (k + 5));
      for (let c: number = 0; c < 3; ++c) {
        const r: number = residual[3 * v + c]! * w;
        gradient[3 * v + c]! += k * k * r;
        for (const e of edges[v]!) gradient[3 * e + c]! += 4 * r;
        for (const f of across[v]!) gradient[3 * f + c]! += r;
      }
    }
    x = x.map((value: number, i: number): number =>
      free[Math.floor(i / 3)] ? value + step * (gradient[i]! + SMOOTHING * (target[i]! - value)) : value,
    );
  }
  return Array.from({ length: n }, (_: unknown, v: number): IAutoMovieVector3 => ({
    x: x[3 * v]!,
    y: x[3 * v + 1]!,
    z: x[3 * v + 2]!,
  }));

  /** Limit position of vertex `v`, coordinate `c`, under control points `p`. */
  function mask(v: number, c: number, p: number[]): number {
    const k: number = valence[v]!;
    let sum: number = k * k * p[3 * v + c]!;
    for (const e of edges[v]!) sum += 4 * p[3 * e + c]!;
    for (const f of across[v]!) sum += p[3 * f + c]!;
    return sum / (k * (k + 5));
  }
}
