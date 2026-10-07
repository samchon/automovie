/**
 * What the simple tier reads on the whole person a body shape belongs to.
 *
 * A body basis has no head, so it cannot answer stature (floor to the top of
 * the head) or the volume of the closed person whose mass the simple tier
 * states. The caller that owns the person (a face subtree on a one-skin
 * generation) supplies both readings as functions of the body shape; the
 * simple tier never estimates the missing head.
 *
 * @evidence contracts/common.md#principled-implementation The owner of the whole person answers what only the whole person has, so no allowance stands in for a head.
 * @evidence contracts/common.md#clear-and-simple-design Two readings of one body shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The simple tier refuses stature and mass without these readings instead of estimating them.
 * @evidence contracts/common.md#meaningful-documentation States why the readings are injected and what each returns.
 * @evidence contracts/modeling.md#spatial-conventions Metres and cubic metres of the person frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The readings define no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The shape's channels belong to the body basis.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The readings emit no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The person owner closes the skin.
 * @evidenceExclude contracts/modeling.md#rendered-observation The readings are not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The person measurement rules cite the definitions.
 * @evidenceExclude contracts/anatomy.md#permitted-range The readings admit nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The readings convert no input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySimpleWhole {
  /**
   * The whole person's standing floor-to-vertex stature for a body shape, metres.
   *
   * @evidence contracts/common.md#principled-implementation The person owner reads its own closed skin.
   * @evidence contracts/common.md#clear-and-simple-design One shape in, one height out.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The member is a signature; it carries no behaviour.
   * @evidence contracts/common.md#meaningful-documentation States what it returns.
   * @evidence contracts/modeling.md#spatial-conventions Metres along +Y.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The member defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels The member defines no channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The member emits no geometry.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The member builds no boundary.
   * @evidenceExclude contracts/modeling.md#rendered-observation The member displays nothing.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The person rule cites the definition.
   * @evidenceExclude contracts/anatomy.md#permitted-range The member admits nothing.
   * @evidenceExclude contracts/anatomy.md#parametric-authority The member converts no input.
   */
  stature: (shape: Readonly<Record<string, number>>) => number;

  /**
   * The volume the whole person's closed skin encloses for a body shape, cubic metres.
   *
   * @evidence contracts/common.md#principled-implementation The person owner reads its own closed skin.
   * @evidence contracts/common.md#clear-and-simple-design One shape in, one volume out.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The member is a signature; it carries no behaviour.
   * @evidence contracts/common.md#meaningful-documentation States what it returns.
   * @evidence contracts/modeling.md#spatial-conventions Cubic metres.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The member defines no part.
   * @evidenceExclude contracts/modeling.md#parameter-channels The member defines no channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The member emits no geometry.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The member builds no boundary.
   * @evidenceExclude contracts/modeling.md#rendered-observation The member displays nothing.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The member carries no anatomical value of its own.
   * @evidenceExclude contracts/anatomy.md#permitted-range The member admits nothing.
   * @evidenceExclude contracts/anatomy.md#parametric-authority The member converts no input.
   */
  volume: (shape: Readonly<Record<string, number>>) => number;
}
