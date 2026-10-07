/**
 * Rows of one endpoint on one published surface that an authoring stage
 * added, removed or changed.
 *
 * @author Samchon
 */
export interface IHumanSourceEditedEndpoint {
  /** Which person view holds the surface. */
  view: "head" | "body";

  /** Surface ID in that view's basis, or `landmarks` for its landmark table. */
  surface: string;

  /** Endpoint name whose rows were edited. */
  endpoint: string;

  /** Vertex ordinals whose row of this endpoint was edited. */
  vertices: number[];
}
