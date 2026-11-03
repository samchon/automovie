import type { IAutoMovieHumanGarmentCut } from "./IAutoMovieHumanGarmentCut";

type ICut = IAutoMovieHumanGarmentCut;

/** The garment cut's connectivity: each vertex's neighbours and the boundary loops the hems run along. */
export namespace AutoMovieHumanGarmentShellTopology {
  /** Neighbourhoods and boundary loops of the cut. */
  export interface ITopology {
    /** Offsets of each vertex's neighbours in `neighbours`, length V + 1. */
    offsets: Uint32Array;

    /** Concatenated neighbour lists. */
    neighbours: Uint32Array;

    /** Whether each vertex lies on the boundary. */
    boundary: Uint8Array;

    /** Boundary loops, each in the order of the triangles' winding. */
    loops: number[][];
  }

  /** Vertex neighbourhoods and the boundary loops of the cut triangles. */
  export function connect(cut: ICut): ITopology {
    const count: number = cut.base.length / 3;
    const edges: Map<number, number> = new Map();
    const key = (a: number, b: number): number =>
      Math.min(a, b) * count + Math.max(a, b);
    const T: number[] = cut.triangles;
    for (let t: number = 0; t < T.length; t += 3)
      for (let k: number = 0; k < 3; k++) {
        const e: number = key(T[t + k]!, T[t + ((k + 1) % 3)]!);
        edges.set(e, (edges.get(e) ?? 0) + 1);
      }

    // Undirected neighbour sets, then compressed rows.
    const sets: Set<number>[] = Array.from(
      { length: count },
      (): Set<number> => new Set(),
    );
    const next: Map<number, number[]> = new Map();
    const boundary: Uint8Array = new Uint8Array(count);
    for (let t: number = 0; t < T.length; t += 3)
      for (let k: number = 0; k < 3; k++) {
        const a: number = T[t + k]!;
        const b: number = T[t + ((k + 1) % 3)]!;
        if (a === b) continue;
        sets[a]!.add(b);
        sets[b]!.add(a);
        if (edges.get(key(a, b)) === 1) {
          boundary[a] = 1;
          boundary[b] = 1;
          const list: number[] = next.get(a) ?? [];
          list.push(b);
          next.set(a, list);
        }
      }
    const offsets: Uint32Array = new Uint32Array(count + 1);
    for (let v: number = 0; v < count; v++)
      offsets[v + 1] = offsets[v]! + sets[v]!.size;
    const neighbours: Uint32Array = new Uint32Array(offsets[count]!);
    sets.forEach((s: Set<number>, v: number): void => {
      let i: number = offsets[v]!;
      for (const n of s) neighbours[i++] = n;
    });

    // Boundary loops by following each vertex's outgoing boundary edge.
    const loops: number[][] = [];
    for (const start of [...next.keys()]) {
      while ((next.get(start)?.length ?? 0) > 0) {
        const loop: number[] = [start];
        let current: number = next.get(start)!.pop()!;
        while (current !== start) {
          loop.push(current);
          const outgoing: number[] | undefined = next.get(current);
          if (outgoing === undefined || outgoing.length === 0) break;
          current = outgoing.pop()!;
        }
        if (loop.length >= 3) loops.push(loop);
      }
    }
    return { offsets, neighbours, boundary, loops };
  }
}
