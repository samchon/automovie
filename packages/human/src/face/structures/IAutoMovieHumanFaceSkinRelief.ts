/**
 * Regional authored skin geometry, separate from clinical skin-condition
 * observations and pigmentation. The connected pose owner consumes these
 * values before contact and common normal construction; they therefore survive
 * person composition and static export as geometry. An exported static asset
 * does not restore the editable numerical record.
 *
 * Existing qualified member names are declared beside this owner and refer
 * to independently owned canonical interfaces.
 * The aliases add no runtime value or second field definition.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceSkinRelief {
  /** Independent source-relative nasolabial relief; omission changes no geometry. */
  nasolabial?: IAutoMovieHumanFaceSkinRelief.Nasolabial;
  /** Other visible source-host regions; no lower-lid or ocular cage is duplicated. */
  regions?: IAutoMovieHumanFaceSkinRelief.Regions;
}

/** Qualified compatibility names share the canonical records and emit no runtime values. */
export namespace IAutoMovieHumanFaceSkinRelief {
  /**
   * Retain IAutoMovieHumanFaceSkinRelief.Nasolabial as the qualified name of its canonical record.
   */
  export type Nasolabial =
    import("./IAutoMovieHumanFaceSkinRelief/Nasolabial").Nasolabial;

  /**
   * Retain IAutoMovieHumanFaceSkinRelief.Regions as the qualified name of its canonical record.
   */
  export type Regions =
    import("./IAutoMovieHumanFaceSkinRelief/Regions").Regions;
}
