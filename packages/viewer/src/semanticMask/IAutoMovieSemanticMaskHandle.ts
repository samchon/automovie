/**
 * A reversible semantic-mask override, restored exactly like a render mode.
 *
 * @author Samchon
 */
export interface IAutoMovieSemanticMaskHandle {
  /**
   * How many meshes were painted a semantic colour.
   */
  painted: number;

  /**
   * Meshes left at the reserved background colour because no entry claimed
   * them. Never silently zero: unaddressed geometry in a segmentation pass is a
   * hole in the evidence, and it is counted so a consumer can refuse it.
   */
  unaddressed: number;

  /**
   * Semantic ids that name a drawable this scene does not hold, ascending.
   *
   * The mirror image of {@link unaddressed}: that one counts pixels no id
   * claimed, this one names ids no pixels answered. See
   * {@link auditAutoMovieSemanticMaskScene}, which reports both without
   * painting, for why an empty list is the only proof that what a production
   * declared is what it drew.
   */
  unresolved: string[];

  /**
   * Undo the override completely, disposing everything it created.
   */
  restore: () => void;
}
