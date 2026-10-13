/**
 * World-space box a subject occupies, in metres.
 *
 * The engine already answers this for every kind that has an answer -
 * `builtEnvironmentSpaceContentBounds` for a space, `builtEnvironmentElementBounds`
 * for an element, `builtInstanceSetPlacementBounds` for a population - so this
 * shape is deliberately the structural intersection of all three rather than a
 * fourth spelling of the same box.
 *
 * @author Samchon
 */
export interface IAutoMovieViewerSubjectBounds {
  /**
   * Lower world corner, in metres.
   */
  min: { x: number; y: number; z: number };

  /**
   * Upper world corner, in metres.
   */
  max: { x: number; y: number; z: number };
}
