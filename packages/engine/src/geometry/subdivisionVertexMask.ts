import { ISubdivisionVertexMask } from "./ISubdivisionVertexMask";
import { decaySubdivisionSharpness } from "./decaySubdivisionSharpness";

/**
 * The Catmull-Clark vertex-point mask for a vertex with the given fan edge
 * sharpness, including the semi-sharp transition blend.
 *
 * The rule follows the number of fan edges with positive sharpness (boundary
 * edges count, at 10): none or one (smooth or dart) takes Catmull and Clark's
 * `(F + 2R + (n - 3) P) / n`, which is `(n - 2) / n` on the vertex and `1 / n^2`
 * on each edge neighbour and face point; two (crease) takes the crease rule
 * `(6 P + A + B) / 8` over the two sharp neighbours; three or more (corner)
 * keeps the vertex. When decaying the sharpness changes the rule, the mask is
 * the blend DeRose, Kass and Truong (1998) give for fractional sharpness: the
 * parent rule weighted by the mean parent sharpness of the edges that turn
 * smooth, at most one, and the child rule weighted by the rest, as OpenSubdiv
 * computes it.
 *
 * @param sharpness Sharpness of each fan edge, 10 for boundary edges.
 * @param faceCount Number of fan faces.
 * @returns The vertex, edge-neighbour and face-point weights.
 *
 * @evidence contracts/common.md#principled-implementation The smooth rule is Catmull and Clark (1978), the crease and corner rules are those of Hoppe et al. as used by DeRose, Kass and Truong (1998), and the transition weight is that paper's fractional-sharpness interpolation in OpenSubdiv's form; a smooth rule only arises at interior vertices, where edges and faces are equal in number.
 * @evidence contracts/common.md#clear-and-simple-design Rule selection and blending depend on sharpness alone, so one function serves the refinement of every level and the local ring iteration of the limit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No valence or geometry special case; a dart deliberately takes the smooth rule as the published rules prescribe.
 * @evidence contracts/common.md#meaningful-documentation States each rule with its weights, how the rule is chosen, the transition blend and its weight, and the sources.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the vertex valence: two passes over the sharpness to classify and at most two masks built and blended.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of its arguments; callers keep the mask for every attribute of one vertex.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns a fresh mask and retains nothing.
 */
export const subdivisionVertexMask = (
  sharpness: readonly number[],
  faceCount: number,
): ISubdivisionVertexMask => {
  const child: number[] = sharpness.map(decaySubdivisionSharpness);
  const parentMask: ISubdivisionVertexMask = ruleMask(sharpness, faceCount);
  const sharpParent: number = countSharp(sharpness);
  const sharpChild: number = countSharp(child);
  if (rank(sharpParent) === rank(sharpChild)) return parentMask;
  let sum: number = 0;
  let count: number = 0;
  sharpness.forEach((s: number, i: number): void => {
    if (s > 0 && child[i] === 0) {
      sum += s;
      ++count;
    }
  });
  const weight: number = Math.min(1, sum / count);
  const childMask: ISubdivisionVertexMask = ruleMask(child, faceCount);
  return {
    vertex: weight * parentMask.vertex + (1 - weight) * childMask.vertex,
    edges: parentMask.edges.map(
      (w: number, i: number): number =>
        weight * w + (1 - weight) * childMask.edges[i]!,
    ),
    faces: parentMask.faces.map(
      (w: number, i: number): number =>
        weight * w + (1 - weight) * childMask.faces[i]!,
    ),
  };
};

/** Number of edges with positive sharpness. */
const countSharp: (sharpness: readonly number[]) => number = (
  sharpness: readonly number[],
): number =>
  sharpness.reduce(
    (count: number, s: number): number => (s > 0 ? count + 1 : count),
    0,
  );

/** Rule rank by sharp edge count: 0 smooth or dart, 1 crease, 2 corner. */
const rank: (sharp: number) => number = (sharp: number): number =>
  sharp <= 1 ? 0 : sharp === 2 ? 1 : 2;

/** The unblended mask of the rule the sharpness selects. */
const ruleMask: (
  sharpness: readonly number[],
  faceCount: number,
) => ISubdivisionVertexMask = (
  sharpness: readonly number[],
  faceCount: number,
): ISubdivisionVertexMask => {
  const sharp: number = countSharp(sharpness);
  const edges: number[] = new Array<number>(sharpness.length).fill(0);
  const faces: number[] = new Array<number>(faceCount).fill(0);
  if (sharp <= 1) {
    const n: number = sharpness.length;
    edges.fill(1 / (n * n));
    faces.fill(1 / (n * n));
    return { vertex: (n - 2) / n, edges, faces };
  }
  if (sharp === 2) {
    sharpness.forEach((s: number, i: number): void => {
      if (s > 0) edges[i] = 1 / 8;
    });
    return { vertex: 3 / 4, edges, faces };
  }
  return { vertex: 1, edges, faces };
};
