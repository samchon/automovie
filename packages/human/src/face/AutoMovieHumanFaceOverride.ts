/**
 * An object override recurses through fields; an array replaces its whole
 * population, including an explicitly empty optional population.
 * This merge shape also describes immutable source recipes. It does not make
 * every array an editable facial parameter: assertHumanFaceEditableDetail
 * refuses new source geometry arrays in a replay document's detail or sides.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Distinguishes object-field overrides from complete array replacement.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Defines the typed override interpretation without mutating the basis recipe.
 * @author Samchon
 */
export type AutoMovieHumanFaceOverride<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: AutoMovieHumanFaceOverride<T[K]> }
    : T;
