/**
 * Vertices of one published surface whose neutral position an authoring stage moved.
 *
 * @author Samchon
 */
export interface IHumanSourceEditedVertices {
  /** Which person view holds the surface. */
  view: "head" | "body";

  /** Surface ID in that view's basis, or `landmarks` for its landmark table. */
  surface: string;

  /** Vertex ordinals of that surface, in the published address space. */
  vertices: number[];
}
