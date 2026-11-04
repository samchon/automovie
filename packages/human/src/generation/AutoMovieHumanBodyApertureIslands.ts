/**
 * The clipped skin's small islands: the connected pieces an opening's cut
 * leaves inside it, found by union-find over the triangles' vertices and
 * removed in place, keeping the groups' order and starts.
 */
export namespace AutoMovieHumanBodyApertureIslands {
  /** Fewest triangles a connected piece of clipped skin keeps. */
  export const ISLAND: number = 64;

  /**
   * Remove, in place, the triangles of connected pieces smaller than
   * {@link ISLAND} triangles, keeping the groups' order and their starts.
   */
  export function islands(
    indices: number[],
    faces: string[],
    groups: { name: string; start: number }[],
    count: number,
  ): void {
    const parent: Int32Array = new Int32Array(count);
    for (let v: number = 0; v < count; v++) parent[v] = v;
    const find = (v: number): number => {
      while (parent[v] !== v) {
        parent[v] = parent[parent[v]!]!;
        v = parent[v]!;
      }
      return v;
    };
    for (let t: number = 0; t < indices.length; t += 3)
      for (let i: number = 1; i < 3; i++) {
        const a: number = find(indices[t]!);
        const b: number = find(indices[t + i]!);
        if (a !== b) parent[a] = b;
      }
    const size: Map<number, number> = new Map();
    for (let t: number = 0; t < indices.length; t += 3) {
      const root: number = find(indices[t]!);
      size.set(root, (size.get(root) ?? 0) + 1);
    }
    if ([...size.values()].every((n: number): boolean => n >= ISLAND)) return;

    // Compact the kept triangles forward, group by group.
    let write: number = 0;
    const ends: number[] = groups.map(
      (_: unknown, k: number): number => groups[k + 1]?.start ?? indices.length,
    );
    groups.forEach((g: { name: string; start: number }, k: number): void => {
      const from: number = g.start;
      g.start = write;
      for (let t: number = from; t < ends[k]!; t += 3) {
        if (size.get(find(indices[t]!))! < ISLAND) continue;
        indices[write] = indices[t]!;
        indices[write + 1] = indices[t + 1]!;
        indices[write + 2] = indices[t + 2]!;
        faces[write / 3] = faces[t / 3]!;
        write += 3;
      }
    });
    indices.length = write;
    faces.length = write / 3;
  }
}
