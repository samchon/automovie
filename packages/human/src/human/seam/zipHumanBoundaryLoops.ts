import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Triangulate the ribbon between two open boundary loops by zipping them,
 * always taking the shorter of the two diagonals that the next step could add.
 *
 * `first` and `second` are the positions of two loops, each listed in the
 * direction `findHumanBoundaryLoops` reports for its own surface, so each
 * surface lies on the left of its loop. The two surfaces face each other
 * across the ribbon, hence the second loop is walked backwards and the
 * triangles are wound so that every ribbon edge on a loop runs opposite to the
 * surface edge it meets. The ribbon then joins both surfaces as one oriented
 * manifold with no flipped triangle at either edge. Local vertex numbers are
 * the first loop's positions `0 .. n - 1` followed by the second loop's
 * `n .. n + m - 1`, in the order given.
 *
 * The walk starts from the two loop vertices nearest each other, advances one
 * loop vertex per triangle and closes after `n + m` triangles, one for each
 * loop edge, which is what a ribbon between two closed loops needs: every loop
 * edge sits in exactly one ribbon triangle. Taking the shorter diagonal keeps
 * the ribbon from fanning one vertex across a long stretch of the other loop
 * when the two run parallel, which is the situation of two cuts of one neck.
 * It is a greedy rule with no proof of a minimal total area; it can fold the
 * ribbon where the loops cross or wind about each other, and the caller judges
 * the result (`createHumanPersonSeam` refuses a ribbon whose triangles face
 * against the surfaces at the neutral).
 *
 * @evidence contracts/common.md#principled-implementation Advancing along the shorter diagonal is a greedy local rule for triangulating between two nearly parallel contours (it makes no claim to a global optimum, and the comment says so); the winding rule follows from requiring each shared edge to run in opposite directions in its two triangles.
 * @evidence contracts/common.md#clear-and-simple-design One loop walk with one comparison per step; start selection and closing are the only other logic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No loop length, subject or expected diagonal is special-cased; degenerate inputs (an empty or one-vertex loop) refuse.
 * @evidence contracts/common.md#meaningful-documentation The comment states the direction convention, the local numbering, the closing count and the greedy limits.
 * @evidence contracts/modeling.md#spatial-conventions Positions are metres in the caller's frame, used only for distances; the output is indices.
 * @evidence contracts/modeling.md#shared-boundaries The ribbon uses the two loops' own vertices, so it is one definition both surfaces share; edge directions are opposite to the surfaces' so the joined mesh is oriented.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function triangulates one ribbon and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The ribbon is exactly one triangle per loop edge, which the representation of a ribbon between two loops requires; no smaller triangulation joins them.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing; the seam that owns the ribbon is observed as assembled by its owner.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function defines no input a caller shapes a human form with.
 */
export function zipHumanBoundaryLoops(
  first: readonly IAutoMovieVector3[],
  second: readonly IAutoMovieVector3[],
): number[] {
  const n = first.length;
  const m = second.length;
  if (n < 2 || m < 2)
    throw new Error("A ribbon needs two loops of at least two vertices.");
  // the second loop walked backwards, as indices into it
  const walk = second.map((_, k) => m - 1 - k);
  const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  let start = { i: 0, k: 0, gap: Infinity };
  for (let i = 0; i < n; i++)
    for (let k = 0; k < m; k++) {
      const gap = distance(first[i], second[walk[k]]);
      if (gap < start.gap) start = { i, k, gap };
    }
  const indices: number[] = [];
  let advancedFirst = 0;
  let advancedSecond = 0;
  while (advancedFirst < n || advancedSecond < m) {
    const i = (start.i + advancedFirst) % n;
    const k = (start.k + advancedSecond) % m;
    const nextFirst = (i + 1) % n;
    const nextSecond = (k + 1) % m;
    const takeFirst =
      advancedSecond >= m ||
      (advancedFirst < n &&
        distance(first[nextFirst], second[walk[k]]) <=
          distance(first[i], second[walk[nextSecond]]));
    if (takeFirst) {
      indices.push(nextFirst, i, n + walk[k]);
      advancedFirst++;
    } else {
      indices.push(n + walk[k], n + walk[nextSecond], i);
      advancedSecond++;
    }
  }
  return indices;
}
