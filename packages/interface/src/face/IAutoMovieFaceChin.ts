/**
 * Chin traits of an {@link IAutoMovieFace}'s jaw: signed morph weights in
 * `[-2, 2]`, with `0` or omission leaving the template's chin unchanged.
 *
 * The chin is unsided, and its leaves project onto the `chinLength` and
 * `chinProtrusion` morph targets.
 *
 * @evidence contracts/common.md#principled-implementation `flattenFace` reads `jaw.chin.length` and `jaw.chin.protrusion` through its single-target table, so each leaf drives exactly one morph target and is range-checked at that document path.
 * @evidence contracts/common.md#clear-and-simple-design Nesting the chin under the jaw follows the anatomy a reader expects while each leaf still maps to one flat target name.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A midline feature has no side rule to apply, and the leaves get no treatment beyond the shared range check and linear morph.
 * @evidence contracts/common.md#meaningful-documentation States the weight range and neutral meaning, where the chin sits in the document, that it is unsided, and the two morph targets; members give each sign's direction.
 * @author Samchon
 */
export interface IAutoMovieFaceChin {
  /** Vertical reach of the chin tip: `+` a longer chin, `-` a shorter one. */
  length?: number;

  /** Forward projection of the chin: `+` protrudes, `-` recedes. */
  protrusion?: number;
}
