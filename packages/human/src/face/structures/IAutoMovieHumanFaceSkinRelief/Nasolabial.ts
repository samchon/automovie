import type { IAutoMovieHumanFaceNasolabialRelief } from "../IAutoMovieHumanFaceNasolabialRelief";

/** Anatomical sides in the basis frame (+X left), each independently omitted.
 *
 * @evidence contracts/common.md#principled-implementation Independent anatomical sides preserve existing numerical relief records and omission without changing their geometry owner.
 * @evidence contracts/common.md#clear-and-simple-design This named file owns the sole Nasolabial field definition; a separate compatibility alias preserves its existing public namespace.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing namespace qualification, fields and units are preserved without duplicate definitions or runtime patching.
 * @evidence contracts/common.md#meaningful-documentation Each retained member documents its established units, optional meaning and styling responsibility.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The two members select traits of the existing connected skin, not independently emitted skin parts.
 * @evidence contracts/modeling.md#parameter-channels Left and right records are independently optional and never mirrored; IAutoMovieHumanFaceNasolabialRelief separates persistent depth, this side's smile-dependent depth and transverse support, with zero amplitudes adding no relief.
 * @evidenceExclude contracts/modeling.md#emitted-geometry applyHumanFaceNasolabialRelief and its shared course kernel displace existing source vertices without adding primitives; this pair container decides no topology.
 * @evidence contracts/modeling.md#spatial-conventions Side names follow the basis head frame (+X left); member depths and widths are mm and the relief owner converts once to metres before displacement along the live inward host normal.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The pair stores no boundary geometry; the relief owner preserves registered lip-margin vertices and fades contributions at source alar/cheilion endpoints.
 * @evidenceExclude contracts/modeling.md#rendered-observation This input container has no displayed result of its own; the connected relief and face assembly owners owe current skin/neighbour observation.
 * @evidence contracts/anatomy.md#anatomical-source Members retain additional authored visible relief on source-registered alar/cheilion courses; neither side is a clinical crease grade, age estimate, tissue modulus or measured individual fold reconstruction.
 * @evidenceExclude contracts/anatomy.md#permitted-range Member numerical admission, representable widths, same-side support and actual contributors are checked by applyHumanFaceNasolabialRelief; coupled contact remains downstream and this container declares no clinical range.
 * @evidence contracts/anatomy.md#parametric-authority Each side carries the existing named depth/width measurements while registered source identities and deterministic projection remain with the producer; no personal vertices or free crease curves enter.
 *
 * @author Samchon
 */
export interface Nasolabial {
  /** Relief on the anatomical left. */
  left?: IAutoMovieHumanFaceNasolabialRelief;

  /** Relief on the anatomical right. */
  right?: IAutoMovieHumanFaceNasolabialRelief;
}
