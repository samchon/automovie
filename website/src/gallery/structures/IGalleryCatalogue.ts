/**
 * Everything the object gallery can show: every producer of
 * `@automovie/archetypes` with its kinds, grouped by the families the
 * package's `ARCHETYPE_FAMILIES` names.
 */
export interface IGalleryCatalogue {
  /** The groups, the archetype families in the package's order. */
  groups: IGalleryCatalogue.IGroup[];
}
export namespace IGalleryCatalogue {
  /** One group of subjects. */
  export interface IGroup {
    /** The group's name: an archetype family, such as `furniture`. */
    name: string;

    /** Its subjects. */
    subjects: ISubject[];
  }

  /** One thing the gallery shows. */
  export interface ISubject {
    /** The id an address names it by: the producer's name, such as `createSeat`. */
    id: string;

    /** What a card shows: the producer's name without `create` as words, such as `Long tool`. */
    label: string;

    /** The group it belongs to. */
    group: string;

    /** The word for its variants, `kind` or `frame`; empty when it has one form only. */
    variantKey: string;

    /** Its variants, each with the id an address names it by and what a picker shows; empty when it has one form only. */
    variants: { id: string; label: string }[];
  }
}
