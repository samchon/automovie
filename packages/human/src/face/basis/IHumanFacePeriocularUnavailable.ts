/**
 * Why a periocular document field cannot be built on a basis.
 *
 * `field` is the document field that asked for it and `missing` what is
 * absent: the source registration the actual producer needs (`opticalSupport`,
 * `periocular`, or the anterior `lashRoots`). `basis` is that basis's ID.
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
