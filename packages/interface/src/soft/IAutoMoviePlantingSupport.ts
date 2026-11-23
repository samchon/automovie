/**
 * What a planting is carried by.
 *
 * Every arm cites an existing stable id of the built environment rather than
 * restating geometry: the building graph owns spaces, elements, boundaries and
 * support patches. The binding validator resolves these references; this record
 * does not itself reposition a planting when support geometry changes.
 */
export type IAutoMoviePlantingSupport =
  | IAutoMoviePlantingSupport.ISurface
  | IAutoMoviePlantingSupport.IElement
  | IAutoMoviePlantingSupport.IBoundary;
/** Building records that may carry a planting installation. */
export namespace IAutoMoviePlantingSupport {
  /** Support patch assigned to a logical space. */
  export interface ISurface {
    /** Discriminator. */
    kind: "surface";

    /** Support-patch id inside the owning environment. */
    surface: string;
  }

  /** Visible environment element carrying the planting. */
  export interface IElement {
    /** Discriminator. */
    kind: "element";

    /** Element id inside the owning environment. */
    element: string;
  }

  /** Environment boundary the planting is trained against. */
  export interface IBoundary {
    /** Discriminator. */
    kind: "boundary";

    /** Boundary id inside the owning environment. */
    boundary: string;
  }
}
