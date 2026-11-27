/**
 * The displayed producers of `@automovie/archetypes` and their variants,
 * grouped by the package's public topic entrypoints.
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
    variants: IAliasVariant[];
  }

  /** A displayed subject and the variant selected on it. */
  export interface ITarget {
    /** The displayed producer's name, such as `createCamera`. */
    subject: string;

    /** The selected variant id, or empty for a producer with one form. */
    variant: string;
  }

  /** One earlier variant of an alias and the displayed target it opens. */
  export interface IAliasVariant extends ITarget {
    /** The variant id the saved address used under the earlier dispatcher. */
    id: string;
  }

  /** One variant a picker offers. */
  export interface IVariant {
    /** The id an address names it by. */
    id: string;

    /** What a picker shows. */
    label: string;
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
    variants: IVariant[];
  }
}
