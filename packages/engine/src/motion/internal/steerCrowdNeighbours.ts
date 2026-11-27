/*
 * The uniform grid a crowd evaluation finds each agent's neighbours with: the
 * stacked state's positions bucketed into square cells of one side, so every
 * agent within that side of another lies in its own cell or one of the eight
 * around it (the uniform-grid neighbour search of particle and crowd
 * simulation; Teschner, Heidelberger, Muller, Pomeranets and Gross 2003,
 * "Optimized spatial hashing for collision detection of deformable objects").
 * Parameter x: The stacked state `[x, z, vx, vz]` per agent, metres and metres per
 * second.
 * Parameter n: The number of agents.
 * Parameter cell: The cell's side, metres: the largest distance any query must
 * reach; finite and positive.
 * Returns: The query: it writes the agents other than one that lie in its cell
 * or the eight around it into the caller's buffer of at least `n` entries, in
 * ascending index, and returns how many.
 */
export function steerCrowdNeighbours(
  x: readonly number[],
  n: number,
  cell: number,
): steerCrowdNeighbours.Query {
  const buckets: Map<number, number[]> = new Map();
  const cx: Int32Array = new Int32Array(n);
  const cz: Int32Array = new Int32Array(n);
  for (let j: number = 0; j < n; ++j) {
    cx[j] = Math.floor(x[4 * j]! / cell);
    cz[j] = Math.floor(x[4 * j + 1]! / cell);
    const key: number = steerCrowdNeighbours.key(cx[j]!, cz[j]!);
    const bucket: number[] | undefined = buckets.get(key);
    if (bucket === undefined) buckets.set(key, [j]);
    else bucket.push(j);
  }
  return (k: number, into: Int32Array): number => {
    let count: number = 0;
    for (let a: number = -1; a <= 1; ++a)
      for (let b: number = -1; b <= 1; ++b) {
        const bucket: number[] | undefined = buckets.get(
          steerCrowdNeighbours.key(cx[k]! + a, cz[k]! + b),
        );
        if (bucket !== undefined)
          for (const j of bucket) if (j !== k) into[count++] = j;
      }

    // A typed array sorts numerically in place, with no comparator call.
    into.subarray(0, count).sort();
    return count;
  };
}

/*
 * Companion types of steerCrowdNeighbours.
 */
export namespace steerCrowdNeighbours {
  /*
   * Write the agents other than agent `k` in its cell and the eight around it
   * into `into`, ascending, and return their count.
   */
  export type Query = (k: number, into: Int32Array) => number;

  /*
   * One cell's integer key, unique while both coordinates lie within `OFFSET`
   * of zero; the product stays below 2^42, inside the exact integers.
   * Parameter ix: The cell's x coordinate.
   * Parameter iz: The cell's z coordinate.
   * Returns: The key.
   */
  export function key(ix: number, iz: number): number {
    return (ix + OFFSET) * (2 * OFFSET) + (iz + OFFSET);
  }

  /*
   * Cell coordinates within this offset of zero key uniquely: a crowd spans far
   * fewer cells.
   */
  const OFFSET: number = 1 << 20;
}
