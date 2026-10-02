/**
 * Smooth the vertex normals of a skin across a seam, over a fixed number of
 * edge rings on each side, without moving a vertex.
 *
 * Two skins that meet at a neck do not continue each other's slope exactly:
 * the face's neck and the body's shoulder are built by different rules, and
 * where they meet the surface bends by a few degrees to a few tens. Shared
 * vertices give both sides one normal at the seam itself, but the rings next to
 * it still shade at their own slopes, and the step shows as a line. Fairing
 * the normals turns that step into a gradient: rings `0` (the seed vertices)
 * to `rings` are blended toward the mean of their neighbours, the blend
 * weight falling with the ring by the C2 kernel `(1 - r)^4 (4 r + 1)` of
 * `r = ring / (rings + 1)`, so the seed is fully averaged and the outermost
 * ring hardly. `rings` sweeps run, so the smoothing reaches `rings` rings from
 * the seed and no farther, and every vertex beyond that keeps exactly the
 * normal it came with.
 *
 * Only the shading normals change; positions do, and the silhouette a bend
 * makes stays what the geometry says, so this hides the shading step and not
 * the bend. Normals are renormalized after each sweep, and a vertex whose
 * blended normal collapses to zero (neighbours cancelling) keeps its own.
 * `positions` is not read (the mesh's connectivity is all that matters); the
 * inputs are not modified.
 *
 * @evidence contracts/common.md#principled-implementation Blending each normal toward its neighbours' mean is a diffusion of the normal field whose reach grows by one ring per sweep, so `rings` sweeps with weights that vanish beyond the last ring confine the change to the band and are exactly a no-op outside it; the kernel is C2, so the blend weight has no step at the band's edge.
 * @evidence contracts/common.md#clear-and-simple-design A breadth-first ring numbering from the seeds, then a fixed number of sweeps.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No vertex is special-cased, and a vertex outside the band is returned untouched by arithmetic and not by an exception for a named case.
 * @evidence contracts/common.md#meaningful-documentation The comment states why the step shows, what is blended, how far it reaches and that positions do not move.
 * @evidence contracts/modeling.md#shared-boundaries The faired normals continue across the shared seam vertices with a gradient over the rings on both sides, which is the normal continuity a shared boundary owes; the bend itself remains the geometry's.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function edits a normal field and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The function carries no unit; normals are unit vectors in the caller's frame.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; the fairing is observed on the assembled person's seam.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no input a caller shapes a human form with.
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
  const { indices, normals, seeds, rings } = props;
  if (!Number.isInteger(rings) || rings < 0)
    throw new Error("The number of rings must be a nonnegative integer.");
  const count = normals.length / 3;
  const neighbours: number[][] = Array.from({ length: count }, () => []);
  for (let corner = 0; corner < indices.length; corner += 3)
    for (let side = 0; side < 3; side++) {
      const a = indices[corner + side];
      const b = indices[corner + ((side + 1) % 3)];
      neighbours[a].push(b);
      neighbours[b].push(a);
    }
  // ring number of every vertex, by breadth-first search from the seeds
  const ring = new Int32Array(count).fill(-1);
  let front: number[] = [];
  for (const seed of seeds)
    if (ring[seed] < 0) {
      ring[seed] = 0;
      front.push(seed);
    }
  for (let at = 1; at <= rings && front.length > 0; at++) {
    const next: number[] = [];
    for (const vertex of front)
      for (const other of neighbours[vertex])
        if (ring[other] < 0) {
          ring[other] = at;
          next.push(other);
        }
    front = next;
  }
  const weight = (at: number): number => {
    const r = at / (rings + 1);
    return (1 - r) ** 4 * (4 * r + 1);
  };
  let current = normals.slice();
  for (let sweep = 0; sweep < rings; sweep++) {
    const blended = current.slice();
    for (let vertex = 0; vertex < count; vertex++) {
      if (ring[vertex] < 0 || neighbours[vertex].length === 0) continue;
      const mean = [0, 0, 0];
      for (const other of neighbours[vertex])
        for (let axis = 0; axis < 3; axis++)
          mean[axis] += current[other * 3 + axis];
      const a = weight(ring[vertex]);
      const mixed = [0, 1, 2].map(
        (axis) =>
          (1 - a) * current[vertex * 3 + axis] +
          (a * mean[axis]) / neighbours[vertex].length,
      );
      const length = Math.hypot(mixed[0], mixed[1], mixed[2]);
      if (length > 1e-12)
        for (let axis = 0; axis < 3; axis++)
          blended[vertex * 3 + axis] = mixed[axis] / length;
    }
    current = blended;
  }
  return current;
}
