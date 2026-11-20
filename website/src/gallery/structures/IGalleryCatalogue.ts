/**
 * The displayed producers of `@automovie/archetypes` and their variants,
 * grouped by the families the package's `ARCHETYPE_FAMILIES` names.
 */
export interface IGalleryCatalogue {
  /** The groups, the archetype families in the package's order. */
  groups: IGalleryCatalogue.IGroup[];

  /** Saved dispatchers whose variants resolve to displayed subjects. */
  aliases?: IGalleryCatalogue.IAlias[];
}
export namespace IGalleryCatalogue {
  /** An earlier subject and its variants, in the earlier default order. */
  export interface IAlias {
    /** The producer name used by the saved address. */
    id: string;

    /** Each earlier variant and the displayed subject and variant it opens. */
    variants: { id: string; subject: string; variant: string }[];
  }

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

    /** The parameter name for its variants, or empty for one form. */
    variantKey: string;

    /** Its variants, each with the id an address names it by and what a picker shows; empty when it has one form only. */
    variants: { id: string; label: string }[];
  }
}
