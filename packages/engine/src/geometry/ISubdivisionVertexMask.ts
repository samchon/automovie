/**
 * Weights that place one refined vertex point from its parent neighbourhood.
 *
 * The point is `vertex` times the parent vertex, plus `edges[i]` times the far
 * end of the vertex's fan edge `i`, plus `faces[i]` times the new face point of
 * its fan face `i`, in the order of `ISubdivisionTopology`'s fans. The weights
 * sum to one.
 *
 * @evidence contracts/development/design.md#principled-representation Expressing every vertex rule as an affine mask over the parent vertex, its edge neighbours and the child face points is the subdivision-mask form of OpenSubdiv's Sdc layer, which lets positions and face-varying UVs share one rule.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Three weight groups match the three kinds of neighbourhood point the Catmull-Clark rules read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The mask is computed from sharpness alone and applied unchanged to every attribute that follows the vertex rule.
 * @evidence contracts/development/common.md#meaningful-documentation States how each weight group is applied, the fan order it follows, and that the weights are affine.
 */
export interface ISubdivisionVertexMask {
  /** Weight of the parent vertex. */
  vertex: number;

  /** Weight of each fan edge's far end. */
  edges: number[];

  /** Weight of each fan face's new face point. */
  faces: number[];
}
