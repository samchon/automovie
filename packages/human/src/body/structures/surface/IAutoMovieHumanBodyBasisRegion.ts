/**
 * One material region of the connected body, retaining its oriented triangle and corner-UV partition.
 *
 * @evidence contracts/common.md#principled-implementation Oriented source triangle corners and aligned optional corner UVs partition one material region of connected skin.
 * @evidence contracts/common.md#clear-and-simple-design Material and region identity stay beside the exact source-corner table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts UV seam splitting does not create an independent physical skin surface.
 * @evidence contracts/common.md#meaningful-documentation Members identify oriented source order, material ownership and null untextured state.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The material region partition has no runtime implementation that chooses an algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The material region partition schema implements no cache or request sharing.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The material region partition declaration allocates no runtime state or handles.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasisRegion {
  /** Source region identity. */
  id: string;

  /** Existing material identity. */
  material: string;

  /** Oriented triangle corners in the shared source vertex order. */
  indices: number[];

  /** UV pairs per corner, or null for untextured geometry. */
  uvs: number[] | null;
}
