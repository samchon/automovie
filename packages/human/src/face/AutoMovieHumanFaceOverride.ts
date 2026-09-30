/**
 * An object override recurses through fields; an array replaces its whole
 * population, including an explicitly empty optional population.
 * This merge shape also describes immutable source recipes. It does not make
 * every array an editable facial parameter: assertHumanFaceEditableDetail
 * refuses new source geometry arrays in a replay document's detail or sides.
 *
 * @author Samchon
 */
export type AutoMovieHumanFaceOverride<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [K in keyof T]?: AutoMovieHumanFaceOverride<T[K]> }
    : T;
