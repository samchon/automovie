/**
 * Everything the gallery can show: the polygon man's bodies and every
 * producer of `@automovie/archetypes` with its kinds, grouped as the package
 * groups them.
 */
export interface IGalleryCatalogue {
  /** The groups, the bodies first and then the archetype families in the package's order. */
  groups: IGalleryCatalogue.IGroup[];
}
export namespace IGalleryCatalogue {
  /** One group of subjects. */
  export interface IGroup {
    /** The group's name: `human`, or an archetype family such as `furniture`. */
    name: string;

    /** Its subjects. */
    subjects: ISubject[];
  }

  /** One thing the gallery shows. */
  export interface ISubject {
    /** The id an address names it by: `human`, or the producer's name such as `createSeat`. */
    id: string;

    /** What the list shows: `Polygon man`, or the producer's name without `create` as words, such as `Long tool`. */
    label: string;

    /** The group it belongs to. */
    group: string;

    /** The word for its variants: `body` for the polygon man, `kind` or `frame` for an archetype; empty when it has one form only. */
    variantKey: string;

    /** Its variants, each with the id an address names it by and what a picker shows; empty when it has one form only. */
    variants: { id: string; label: string }[];
  }
}
