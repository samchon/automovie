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
 * @evidence contracts/common.md#principled-implementation Independent sides preserve asymmetric authored identity and performance.
 * @evidence contracts/common.md#clear-and-simple-design Nasolabial and other source-host regional courses share one numerical record while retaining independent sides and performed fractions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Clinical observations remain separate and are never converted to displacement.
 * @evidence contracts/common.md#meaningful-documentation States the actual consumer order and static document boundary.
 * @evidence contracts/modeling.md#parameter-channels Each omitted side adds no relief; neither side inherits the other.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record groups traits of existing skin, not parts.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The member settings state their units.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The regional producer owns its joins.
 * @evidenceExclude contracts/modeling.md#rendered-observation The producer and connected consumer observe the result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The regional settings state their source and qualification.
 * @evidenceExclude contracts/anatomy.md#permitted-range The producer admits each region and its combinations.
 * @evidence contracts/anatomy.md#parametric-authority Only named regional numerical traits enter.
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
   *
   * @evidence contracts/common.md#principled-implementation The Nasolabial alias names its existing canonical interface without changing structural assignability.
   * @evidence contracts/common.md#clear-and-simple-design The Nasolabial field record remains owned by one canonical interface rather than copied into this namespace.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The Nasolabial alias preserves the existing public qualification and creates no runtime forwarding or replacement.
   * @evidence contracts/common.md#meaningful-documentation Names the canonical Nasolabial record that owns field meaning and admission.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The Nasolabial alias preserves a type name; the canonical record and its consuming producer own this responsibility.
   * @evidenceExclude contracts/modeling.md#parameter-channels The Nasolabial alias preserves a type name; the canonical record and its consuming producer own this responsibility.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The Nasolabial alias preserves a type name; the canonical record and its consuming producer own this responsibility.
   * @evidenceExclude contracts/modeling.md#spatial-conventions The Nasolabial alias preserves a type name; the canonical record and its consuming producer own this responsibility.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The Nasolabial alias preserves a type name; the canonical record and its consuming producer own this responsibility.
   * @evidenceExclude contracts/modeling.md#rendered-observation The Nasolabial alias preserves a type name; the canonical record and its consuming producer own this responsibility.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The Nasolabial alias defines no physiological value or admission; those remain with the canonical record and producer.
   * @evidenceExclude contracts/anatomy.md#permitted-range The Nasolabial alias defines no physiological value or admission; those remain with the canonical record and producer.
   * @evidenceExclude contracts/anatomy.md#parametric-authority The Nasolabial alias defines no physiological value or admission; those remain with the canonical record and producer.
   */
  export type Nasolabial =
    import("./IAutoMovieHumanFaceSkinRelief/Nasolabial").Nasolabial;

  /**
   * Retain IAutoMovieHumanFaceSkinRelief.Regions as the qualified name of its canonical record.
   *
   * @evidence contracts/common.md#principled-implementation The Regions alias names its existing canonical interface without changing structural assignability.
   * @evidence contracts/common.md#clear-and-simple-design The Regions field record remains owned by one canonical interface rather than copied into this namespace.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The Regions alias preserves the existing public qualification and creates no runtime forwarding or replacement.
   * @evidence contracts/common.md#meaningful-documentation Names the canonical Regions record that owns field meaning and admission.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The Regions alias preserves a type name; the canonical record and its consuming producer own this responsibility.
   * @evidenceExclude contracts/modeling.md#parameter-channels The Regions alias preserves a type name; the canonical record and its consuming producer own this responsibility.
   * @evidenceExclude contracts/modeling.md#emitted-geometry The Regions alias preserves a type name; the canonical record and its consuming producer own this responsibility.
   * @evidenceExclude contracts/modeling.md#spatial-conventions The Regions alias preserves a type name; the canonical record and its consuming producer own this responsibility.
   * @evidenceExclude contracts/modeling.md#shared-boundaries The Regions alias preserves a type name; the canonical record and its consuming producer own this responsibility.
   * @evidenceExclude contracts/modeling.md#rendered-observation The Regions alias preserves a type name; the canonical record and its consuming producer own this responsibility.
   * @evidenceExclude contracts/anatomy.md#anatomical-source The Regions alias defines no physiological value or admission; those remain with the canonical record and producer.
   * @evidenceExclude contracts/anatomy.md#permitted-range The Regions alias defines no physiological value or admission; those remain with the canonical record and producer.
   * @evidenceExclude contracts/anatomy.md#parametric-authority The Regions alias defines no physiological value or admission; those remain with the canonical record and producer.
   */
  export type Regions =
    import("./IAutoMovieHumanFaceSkinRelief/Regions").Regions;
}
