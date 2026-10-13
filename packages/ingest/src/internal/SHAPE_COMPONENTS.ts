

/**
 * Component counts of glTF scalar, vector and matrix accessor shapes.
 *
 * The fixed glTF shape vocabulary defines scalar/vector width and square-matrix component counts used after shape admission. Dense ranges, motion arity and element sizing share this fixed seven-entry table; logical matrix counts do not replace physical column-padding rules.
 *
 * @author Samchon
 */
export const SHAPE_COMPONENTS: Readonly<Record<string, number>> = {
  /** One logical scalar component. */
  SCALAR: 1,

  /** Two logical vector components. */
  VEC2: 2,

  /** Three logical vector components. */
  VEC3: 3,

  /** Four logical vector components. */
  VEC4: 4,

  /** Four logical matrix components, independent of byte-column padding. */
  MAT2: 4,

  /** Nine logical matrix components, independent of byte-column padding. */
  MAT3: 9,

  /** Sixteen logical matrix components. */
  MAT4: 16,
};
