/**
 * Triangulate the ribbon between two boundary loops by merging them in order
 * along the first, so that a second loop lying on the first is bridged by
 * triangles that lie along it.
 *
 * The first loop has `count` vertices `0 .. count - 1` in the direction its
 * surface's triangles run, and vertex `i` stands at position `i` along it, with
 * the edge from `i` to `i + 1` covering positions `i` to `i + 1` (the last edge
 * wraps to position `count`). `parameters[j]` is where vertex `j` of the second
 * loop lies along the first, in the same units, and the second loop is given in
 * the direction its own surface's triangles run, which is the reverse of the
 * first's, so its parameters must run down as `j` rises. Walking the second loop
 * backwards then visits its vertices in increasing position, and the two loops
 * are merged as two sorted lists: at every step the pointer whose next vertex
 * lies sooner along the first loop advances (the first loop on a tie), and one
 * triangle joins the edge it crosses to the vertex the other pointer holds. Each
 * loop edge therefore lies in exactly one triangle, `count + parameters.length`
 * in all, wound so that every ribbon edge on a loop runs opposite to the
 * surface edge it meets and the two surfaces and the ribbon are one oriented
 * manifold. Local vertex numbers are the first loop's `0 .. count - 1` followed
 * by the second loop's `count + j`.
 *
 * When the second-loop vertices lie on the first polyline, triangles on one
 * edge are collinear but triangles spanning a corner retain area: a body edge
 * cuts across that corner rather than following it. The stencil therefore
 * supplies logical adjacency for the seam's normal sharing, not renderable
 * zero-area geometry. `stitchHumanPersonBoundary` subdivides each skin onto
 * the union of the loop samples before display, so neither a collinear face
 * nor the corner's wedge needs to be emitted as a third skin region.
 *
 * The parameters must be cyclically ordered, that is nonincreasing in the
 * given direction around the loop with at most one wrap from the smallest back
 * to the largest; anything else has no merge and refuses. Positions run in
 * `[0, count]`, and `count` and `0` name the same place.
 *
 * @evidence contracts/common.md#principled-implementation Merging two sorted sequences by comparing the next element of each is the standard linear merge, and on a circle it needs the cyclic rotation to the smallest element, which the single permitted descent identifies; each step consumes one edge of one loop, so every loop edge is in one triangle, and the winding follows from requiring each shared edge to run in opposite directions in its two triangles.
 * @evidence contracts/common.md#clear-and-simple-design One rotation, one merge loop, one triangle per step.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No loop length or subject is special-cased; disordered parameters and loops of under two vertices refuse.
 * @evidence contracts/common.md#meaningful-documentation The comment states the coordinate, the direction convention, the local numbering, why merging replaces choosing diagonals and the ordering precondition.
 * @evidence contracts/modeling.md#spatial-conventions Positions are dimensionless edge units along the first loop; the output is indices.
 * @evidence contracts/modeling.md#shared-boundaries The ribbon uses the two loops' own vertices, so both sides share one definition of the boundary, and its edge directions oppose the surfaces' so the joined mesh is oriented.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function triangulates one ribbon and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The ribbon is exactly one triangle per loop edge, which a ribbon between two closed loops requires; no smaller triangulation joins them.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; the seam that owns the ribbon is observed as assembled by its owner.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no input a caller shapes a human form with.
 */
export function mergeHumanBoundaryLoops(
  count: number,
  parameters: readonly number[],
): number[] {
  const m = parameters.length;
  if (count < 2 || m < 2)
    throw new Error("A ribbon needs two loops of at least two vertices.");
  // the second loop walked backwards, as indices into it
  const walk = parameters.map((_, k) => m - 1 - k);
  const along = walk.map((j) => parameters[j]);
  let descents = 0;
  let start = 0;
  for (let k = 0; k < m; k++)
    if (along[k] < along[(k + m - 1) % m]) {
      descents++;
      start = k;
    }
  if (descents > 1 || along.some((value) => !(value >= 0 && value <= count)))
    throw new Error(
      "The second loop does not run along the first in order.",
    );
  const order = walk.map((_, b) => walk[(start + b) % m]);
  const position = order.map((j) => parameters[j]);
  const first = Math.min(Math.floor(position[0]), count - 1);
  const indices: number[] = [];
  let faceDone = 0;
  let bodyDone = 0;
  while (faceDone < count || bodyDone < m) {
    const face = (first + faceDone) % count;
    const nextFace = (first + faceDone + 1) % count;
    const nextPosition =
      bodyDone >= m
        ? Infinity
        : bodyDone + 1 < m
          ? position[bodyDone + 1]
          : position[0] + count;
    if (bodyDone >= m || (faceDone < count && first + faceDone + 1 <= nextPosition)) {
      indices.push(nextFace, face, count + order[bodyDone % m]);
      faceDone++;
    } else {
      indices.push(
        count + order[bodyDone % m],
        count + order[(bodyDone + 1) % m],
        face,
      );
      bodyDone++;
    }
  }
  return indices;
}
