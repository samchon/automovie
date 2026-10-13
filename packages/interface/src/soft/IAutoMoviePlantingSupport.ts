/**
 * What a planting is carried by.
 *
 * Every arm cites an existing stable id of the built environment rather than
 * restating geometry: the building graph owns spaces, elements, boundaries and
 * support patches, and moving one of them must invalidate the planting bound to
 * it.
 */
export type IAutoMoviePlantingSupport =
  | IAutoMoviePlantingSupport.ISurface
  | IAutoMoviePlantingSupport.IElement
  | IAutoMoviePlantingSupport.IBoundary;
export namespace IAutoMoviePlantingSupport {
  /** A support patch assigned to a logical space: a floor, a roof deck. */
  export interface ISurface {
    /** Discriminator. */
    kind: "surface";

    /** Support-patch id inside the owning environment. */
    surface: string;
  }

  /** A visible element: a planter box, a shelf, a suspended basket rail. */
  export interface IElement {
    /** Discriminator. */
    kind: "element";

    /** Element id inside the owning environment. */
    element: string;
  }

  /** A separation the planting is trained against: the wall of a green wall. */
  export interface IBoundary {
    /** Discriminator. */
    kind: "boundary";

    /** Boundary id inside the owning environment. */
    boundary: string;
  }
}
