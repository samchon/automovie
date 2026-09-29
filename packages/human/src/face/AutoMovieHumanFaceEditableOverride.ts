/**
 * Editable scalar/enum fields of a source profile. A nonempty geometric
 * population is an asset, not a per-person override: an edit may omit it or
 * use [] to remove an inherited variable-length population. A fixed XYZ or
 * other tuple cannot be emptied and is not an editable coordinate. The
 * legacy hair-layer scalar transaction and skin-colour appearance population
 * are explicit document-level exceptions with a runtime geometry boundary.
 */
export type AutoMovieHumanFaceEditableOverride<T> = T extends readonly unknown[]
  ? number extends T["length"]
    ? []
    : never
  : T extends object
    ? { [K in keyof T]?: AutoMovieHumanFaceEditableOverride<T[K]> }
    : T;
