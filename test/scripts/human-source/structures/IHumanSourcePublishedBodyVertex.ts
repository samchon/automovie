/**
 * A vertex of the published body basis's skin, carried into the generation
 * through its exact source twin.
 *
 * @author Samchon
 */
export interface IHumanSourcePublishedBodyVertex {
  /** Discriminator. */
  kind: "published-body-vertex";

  /** Vertex index on the published body basis's first surface. */
  vertex: number;
}
