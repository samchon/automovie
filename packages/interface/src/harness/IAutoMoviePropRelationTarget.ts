/**
 * What a placement relation points at.
 *
 * Every arm cites an existing stable id rather than restating geometry: the
 * building graph owns spaces, elements, boundaries, openings, and support
 * patches, and a prop spec owns its affordances.
 *
 * @author Samchon
 */
export type IAutoMoviePropRelationTarget =
  | IAutoMoviePropRelationTarget.ISpace
  | IAutoMoviePropRelationTarget.IElement
  | IAutoMoviePropRelationTarget.IBoundary
  | IAutoMoviePropRelationTarget.IOpening
  | IAutoMoviePropRelationTarget.ISurface
  | IAutoMoviePropRelationTarget.IPropAffordance;
export namespace IAutoMoviePropRelationTarget {
  /** A logical space of a built environment. */
  export interface ISpace {
    /** Discriminator. */
    kind: "space";

    /** Built environment id. */
    environment: string;

    /** Logical space id inside that environment. */
    space: string;
  }

  /** A visible or grouping element of a built environment. */
  export interface IElement {
    /** Discriminator. */
    kind: "element";

    /** Built environment id. */
    environment: string;

    /** Element id inside that environment. */
    element: string;
  }

  /** A separation between spaces, such as a wall, floor, or ceiling. */
  export interface IBoundary {
    /** Discriminator. */
    kind: "boundary";

    /** Built environment id. */
    environment: string;

    /** Boundary id inside that environment. */
    boundary: string;
  }

  /** A passage cut through a boundary. */
  export interface IOpening {
    /** Discriminator. */
    kind: "opening";

    /** Built environment id. */
    environment: string;

    /** Opening id inside that environment. */
    opening: string;
  }

  /** A support patch assigned to a logical space. */
  export interface ISurface {
    /** Discriminator. */
    kind: "surface";

    /** Built environment id. */
    environment: string;

    /** Support surface id inside that environment. */
    surface: string;
  }

  /** A contact point declared by another prop's model. */
  export interface IPropAffordance {
    /** Discriminator. */
    kind: "prop-affordance";

    /** Scene node id of the supporting or hosting prop. */
    prop: string;

    /** Affordance id declared by that prop's model. */
    affordance: string;
  }
}
