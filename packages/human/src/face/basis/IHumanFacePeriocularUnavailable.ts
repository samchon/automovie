/**
 * Why a periocular document field cannot be built on a basis.
 *
 * `field` is the document field that asked for it and `missing` what is
 * absent: the source registration the actual producer needs (`opticalSupport`,
 * `periocular`, anterior `lashRoots`, lid `cage`, `browBand`, or
 * `canthalSupport`). `basis` is that basis's ID.
 *
 * @evidence contracts/common.md#principled-implementation assertHumanFacePeriocularAvailable names the actual requested field and absent optical/periocular/lash/cage/brow/canthal producer support on the admitted basis.
 * @evidence contracts/common.md#clear-and-simple-design Closed field/registration vocabularies provide structured detail for the named unavailable Error instead of encoding causes only in prose.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Presence is capability admission, not completed geometry; complete registrations still reach actual profile/contact gates and absent support is never replaced by an asset name.
 * @evidence contracts/common.md#meaningful-documentation Members identify requested field, absent producer registration and exact basis id across every supported cause.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This detail type performs no capability checks; its admission owner does.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type schedules no work; each actual refusal records its own field/basis cause.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no resource; the thrown Error retains its detail until released.
 *
 * @author Samchon
 */
export interface IHumanFacePeriocularUnavailable {
  /** The document field that cannot be built. */
  field:
    | "eyes"
    | "lashes.upper"
    | "lashes.lower"
    | "eyelids"
    | "periocularTissues"
    | "brows"
    | "ocularSurfaces";

  /** The absent producer-qualified registration. */
  missing:
    | "opticalSupport"
    | "periocular"
    | "lashRoots"
    | "cage"
    | "browBand"
    | "canthalSupport";

  /** ID of the basis the document was built on. */
  basis: string;
}
