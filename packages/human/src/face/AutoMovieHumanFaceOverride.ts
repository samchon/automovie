/**
 * An object override recurses through fields; an array replaces its whole
 * population, including an explicitly empty optional population.
 * This merge shape also describes immutable source recipes. It does not make
 * every array an editable facial parameter: assertHumanFaceEditableDetail
 * refuses new source geometry arrays in a replay document's detail or sides.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Arrays retain whole-population replacement while object members become recursively optional and scalar leaves preserve their original type.
 * @evidence contracts/common.md#clear-and-simple-design The same merge shape describes immutable source recipes separately from restricted replay-document detail edits.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Permitting array replacement in this generic type does not bypass assertHumanFaceEditableDetail's source-geometry refusal.
 * @evidence contracts/common.md#meaningful-documentation The prose distinguishes empty optional populations, immutable recipes and the separate runtime geometry boundary.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Recursive full-source override type is erased by TypeScript; its runtime consumer owns the actual geometry or measurement traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Recursive full-source override type specifies caller data and performs no runtime recomputation or cache lookup.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Recursive full-source override type acquires no runtime handle or retained cache; concrete array and map ownership belongs to its producing and consuming functions.
 */
export type AutoMovieHumanFaceOverride<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: AutoMovieHumanFaceOverride<T[K]> }
    : T;
