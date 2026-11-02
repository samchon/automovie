/** Synchronous local normal mixing without copying untouched vertices per pass. */
export namespace AutoMovieHumanSurfaceNormalBlend {
  /**
   * Keep one full result and one compact write buffer. Every pass reads the
   * unchanged previous result until all active vertices have been evaluated.
   * Inactive neighbours remain in that full result, including one-way edges.
   */
  export function apply(normals: readonly number[], weight: readonly number[], neighbours: ReadonlyMap<number, ReadonlySet<number>>, passes: number, cosine: number): number[] {
    const current: number[] = [...normals];
    const active: [number, ReadonlySet<number>][] = [...neighbours];
    const next: number[] = new Array<number>(3 * active.length);
    for (let pass: number = 0; pass < passes; pass++) {
      for (let at: number = 0; at < active.length; at++) {
        const [v, set]: [number, ReadonlySet<number>] = active[at]!;
        const n: [number, number, number] = [current[3 * v]!, current[3 * v + 1]!, current[3 * v + 2]!];
        for (let i: number = 0; i < 3; i++) next[3 * at + i] = n[i]!;
        const sum: [number, number, number] = [0, 0, 0];
        let k: number = 0;
        for (const u of set) {
          const m: [number, number, number] = [current[3 * u]!, current[3 * u + 1]!, current[3 * u + 2]!];
          if (n[0] * m[0] + n[1] * m[1] + n[2] * m[2] < cosine) continue;
          for (let i: number = 0; i < 3; i++) sum[i]! += m[i]!;
          k++;
        }
        if (k === 0) continue;
        const w: number = weight[v]!;
        const b: number[] = [0, 1, 2].map((i: number): number => n[i]! + w * (sum[i]! / k - n[i]!));
        const length: number = Math.hypot(b[0]!, b[1]!, b[2]!);
        if (!(length > 1e-12)) continue;
        for (let i: number = 0; i < 3; i++) next[3 * at + i] = b[i]! / length;
      }
      for (let at: number = 0; at < active.length; at++)
        for (let i: number = 0; i < 3; i++) current[3 * active[at]![0] + i] = next[3 * at + i]!;
    }
    return current;
  }
}
