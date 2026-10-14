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
 * @evidence contracts/common.md#principled-implementation Separate nasolabial and other registered regional courses add persistent/performed authored source-normal relief before actual contact and normal construction, distinct from clinical observations and pigmentation.
 * @evidence contracts/common.md#clear-and-simple-design Two optional canonical region owners share the current connected skin while ocular/lower-lid deformation remains exclusively with the cage owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Clinical grades do not become mm offsets, missing active source registration refuses, and exported geometry supplies no restoration of the saved editable numerical record or visual acceptance.
 * @evidence contracts/common.md#meaningful-documentation Source-host sequencing, clinical-versus-authored meaning and independent omission explain how the numerical request survives composition/export as geometry.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This aggregate performs no course compilation, skin displacement or normals.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Reference/derivative regeneration belongs to the pose owner rather than a cache in this type.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller region records acquire no host, mesh or query buffers.
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
   *
   * @evidence contracts/common.md#principled-implementation The qualified alias resolves directly to the canonical independently sided nasolabial relief owner.
   * @evidence contracts/common.md#clear-and-simple-design A type-only namespace address preserves compatibility without another region implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias adds no copied schema, relief default or clinical grade conversion.
   * @evidence contracts/common.md#meaningful-documentation The canonical module explicitly owns side fields and their metric relief contract.
   * @evidenceExclude contracts/performance.md#efficient-algorithms No relief algorithm executes in the alias.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared type identity implements no runtime geometry cache.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The alias emits no value or resource.
   */
  export type Nasolabial =
    import("./IAutoMovieHumanFaceSkinRelief/Nasolabial").Nasolabial;

  /**
   * Retain IAutoMovieHumanFaceSkinRelief.Regions as the qualified name of its canonical record.
   *
   * @evidence contracts/common.md#principled-implementation The qualified name shares the canonical registered forehead/glabellar/marionette/philtral/perioral region schema.
   * @evidence contracts/common.md#clear-and-simple-design One type alias delegates all supported course fields to their existing module.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts It neither invents unsupported regions nor turns skin-condition observations into geometry.
   * @evidence contracts/common.md#meaningful-documentation The referenced canonical declaration owns source-landmark course and omission meanings.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The alias runs no course or displacement calculation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared schema identity is unrelated to evaluated-pose memoization.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No runtime buffer or task is emitted.
   */
  export type Regions =
    import("./IAutoMovieHumanFaceSkinRelief/Regions").Regions;
}
