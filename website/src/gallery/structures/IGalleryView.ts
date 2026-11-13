/**
 * One archetype as the gallery shows it: what was built, the numbers it was
 * built with and where a person meets it.
 */
export interface IGalleryView {
  /** The archetype's readable name, as the package gives it. */
  name: string;

  /** Side in metres of one cell of the floor grid it is drawn on, which gives the picture its scale. */
  grid: number;

  /** The dimensions the seed drew, each with its band; empty for a producer that carries no bands. */
  dimensions: IGalleryView.IDimension[];

  /** The affordances, in the package's order; empty for an archetype that declares none. */
  affordances: IGalleryView.IAffordance[];
}
export namespace IGalleryView {
  /** One drawn dimension. */
  export interface IDimension {
    /** The dimension's name. */
    name: string;

    /** The value the seed drew, in `unit`. */
    value: number;

    /** The band's least value. */
    minimum: number;

    /** The band's greatest value. */
    maximum: number;

    /** The unit: `m`, `kg`, `degrees`, `N`, or empty for a ratio or a count. */
    unit: string;

    /** Where the band comes from. */
    source: string;

    /** Whether the band could not be read at its primary source. */
    provisional: boolean;
  }

  /** One affordance. */
  export interface IAffordance {
    /** The id an action attaches to. */
    id: string;

    /** What the contact is for, such as `seat` or `hinge`. */
    kind: string;

    /** The colour its mark is drawn in, as `#rrggbb`. */
    color: string;

    /** The range it moves through when it is an articulation with a stated travel; null otherwise. */
    travel: ITravel | null;
  }

  /** The travel of an articulation. */
  export interface ITravel {
    /** The least travel. */
    minimum: number;

    /** The greatest travel. */
    maximum: number;

    /** `degrees` for a turning kind, `m` otherwise. */
    unit: string;
  }
}
