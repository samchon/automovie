/**
 * Blend admitted unit shading normals within BFS edge rings of seam seeds using rings Jacobi sweeps. Ring weight is (1-r)^4(4r+1), r=ring/(rings+1). Triangle-edge adjacency retains repeated neighbours, so their incidence multiplicity weights the mean. Beyond the selected rings, values remain unchanged; rings=0 returns a copy without a smoothing sweep.
 *
 * Nonnegative integer rings are enforced, while aligned compact indices, finite normal fields and valid seeds remain caller premises. Each candidate is normalized only when its length exceeds 1e-12; otherwise that normal keeps its previous value. Positions are neither read nor changed. This edits shading, not a geometric seam, silhouette, volume or clinical surface, and no current rendered improvement has been observed.
 *
 * @evidence contracts/common.md#principled-implementation Actual triangle incidence and BFS seed distance determine the localized normal field and exact compact-support ring weight.
 * @evidence contracts/common.md#clear-and-simple-design Connectivity preparation and ring selection precede independent Jacobi output buffers; position/collar geometry stays with its own owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Invalid ring counts refuse, nearly cancelling means keep previous normals, and normal smoothing is not promoted into geometric repair or unobserved GPU acceptance.
 * @evidence contracts/common.md#meaningful-documentation Prose states incidence-weighted means, sweep/ring distinction, zero rings, 1e-12 norm policy and unchanged positions/input premises.
 * @evidence contracts/performance.md#efficient-algorithms Adjacency/BFS follows actual vertices/triangle edges, and each of R sweeps copies N normals and scans selected incidence; cost is O(N+E+R*(N+selected E)).
 * @evidence contracts/performance.md#reuse-equivalent-work One adjacency/ring assignment serves every sweep, which reads the previous buffer without rebuilding mesh connectivity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Two normal buffers and source-sized adjacency/ring workspace are call-local; only the final owned array escapes, with no renderer or task acquired.
 */
export function fairHumanSeamNormals(props: {
  /** Triangles of the joined skin, over shared vertices. */
  indices: readonly number[];
  /** Unit normals of the joined skin, flat XYZ per vertex. */
  normals: readonly number[];
  /** The vertices of the seam itself. */
  seeds: readonly number[];
  /** How many edge rings on each side of the seam are blended. */
  rings: number;
}): number[] {
  const { indices, normals, seeds, rings }: typeof props = props;
  if (!Number.isInteger(rings) || rings < 0)
    throw new Error("The number of rings must be a nonnegative integer.");
  const count: number = normals.length / 3;
  const neighbours: number[][] = Array.from({ length: count }, (): number[] => []);
  for (let corner: number = 0; corner < indices.length; corner += 3)
    for (let side: number = 0; side < 3; side++) {
      const a: number = indices[corner + side];
      const b: number = indices[corner + ((side + 1) % 3)];
      neighbours[a].push(b);
      neighbours[b].push(a);
    }
  // ring number of every vertex, by breadth-first search from the seeds
  const ring: Int32Array = new Int32Array(count).fill(-1);
  let front: number[] = [];
  for (const seed of seeds)
    if (ring[seed] < 0) {
      ring[seed] = 0;
      front.push(seed);
    }
  for (let at: number = 1; at <= rings && front.length > 0; at++) {
    const next: number[] = [];
    for (const vertex of front)
      for (const other of neighbours[vertex])
        if (ring[other] < 0) {
          ring[other] = at;
          next.push(other);
        }
    front = next;
  }
  const weight: (at: number) => number = (at: number): number => {
    const r: number = at / (rings + 1);
    return (1 - r) ** 4 * (4 * r + 1);
  };
  let current: number[] = normals.slice();
  for (let sweep: number = 0; sweep < rings; sweep++) {
    const blended: number[] = current.slice();
    for (let vertex: number = 0; vertex < count; vertex++) {
      if (ring[vertex] < 0 || neighbours[vertex].length === 0) continue;
      const mean: number[] = [0, 0, 0];
      for (const other of neighbours[vertex])
        for (let axis: number = 0; axis < 3; axis++)
          mean[axis] += current[other * 3 + axis];
      const a: number = weight(ring[vertex]);
      const mixed: number[] = [0, 1, 2].map(
        (axis: number): number =>
          (1 - a) * current[vertex * 3 + axis] +
          (a * mean[axis]) / neighbours[vertex].length,
      );
      const length: number = Math.hypot(mixed[0], mixed[1], mixed[2]);
      if (length > 1e-12)
        for (let axis: number = 0; axis < 3; axis++)
          blended[vertex * 3 + axis] = mixed[axis] / length;
    }
    current = blended;
  }
  return current;
}
