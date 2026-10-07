/**
 * One eye's lashes on a lash surface: the surface, its upper and lower lash
 * regions, and the vertices this eye owns.
 *
 * @evidence contracts/common.md#principled-implementation Names the upper and lower regions so they can be replaced independently.
 * @evidence contracts/common.md#clear-and-simple-design Four named members.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Roles come from the source producer's registration, never from asset names.
 * @evidence contracts/common.md#meaningful-documentation States what each member identifies and who supplies it.
 * @evidence contracts/modeling.md#spatial-conventions Vertex rows index the named surface.
 * @evidenceExclude contracts/modeling.md#parameter-channels Registers identity; defines no channel.
 * @evidence contracts/modeling.md#part-identity-and-grouping Identifies the upper and lower lash parts of one eye.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidence contracts/modeling.md#shared-boundaries The lashes root on this eye's margins.
 * @evidenceExclude contracts/modeling.md#rendered-observation The face builder's consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The source manifest records the CC0 data or mesh reading each entry comes from.
 * @evidenceExclude contracts/anatomy.md#permitted-range Registers identity; bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Producer registration, not an authored control.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularLashes {
  /** ID of the basis surface that carries the lashes. */
  surface: string;

  /** ID of the region of that surface drawing the upper lashes. */
  upperRegion: string;

  /** ID of the region of that surface drawing the lower lashes. */
  lowerRegion: string;

  /** Vertex indices of that surface owned by this eye, ascending. */
  vertices: number[];
}
