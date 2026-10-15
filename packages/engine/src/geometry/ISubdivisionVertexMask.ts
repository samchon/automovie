/**
 * Weights that place one refined vertex point from its parent neighbourhood.
 *
 * The point is `vertex` times the parent vertex, plus `edges[i]` times the far
 * end of the vertex's fan edge `i`, plus `faces[i]` times the new face point of
 * its fan face `i`, in the order of `ISubdivisionTopology`'s fans. The weights
 * sum to one.
 *
 * @evidence contracts/common.md#principled-implementation Expressing every vertex rule as an affine mask over the parent vertex, its edge neighbours and the child face points is the subdivision-mask form of OpenSubdiv's Sdc layer, which lets positions and face-varying UVs share one rule.
 * @evidence contracts/common.md#clear-and-simple-design Three weight groups match the three kinds of neighbourhood point the Catmull-Clark rules read.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The mask is computed from sharpness alone and applied unchanged to every attribute that follows the vertex rule.
 * @evidence contracts/common.md#meaningful-documentation States how each weight group is applied, the fan order it follows, and that the weights are affine.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A data record; its construction is answered on `subdivisionVertexMask`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each level computes one mask per vertex and reuses it for positions and UVs.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two short arrays sized by the vertex valence, released with the level.
 * @author Samchon
 */
export interface ISubdivisionVertexMask {
  /** Weight of the parent vertex. */
  vertex: number;

  /** Weight of each fan edge's far end. */
  edges: number[];

  /** Weight of each fan face's new face point. */
  faces: number[];
}
