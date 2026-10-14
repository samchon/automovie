import type { IAutoMovieMeshSeparationAttachment } from "@automovie/engine";

import type { IHumanFaceHairContactStation } from "./IHumanFaceHairContactStation";

/**
 * Ordered actual geometry stations and their native root registration. Consumers must preserve the registration while checking this emitted curve; this interface neither freezes it nor admits geometry by itself.
 *
 * @evidence contracts/common.md#principled-implementation Native triangle registration accompanies actual root-to-tip stations so body-contact consumers can retain source attachment; unchanged registration is a consumer premise rather than runtime freezing.
 * @evidence contracts/common.md#clear-and-simple-design The record keeps one root attachment with one ordered station population; mesh consumers need not reconstruct correspondence from vertex pairing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Complete incident support is geometry-owned evidence rather than a fabricated authoring address or special strand lookup.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies barycentric root registration, incident support and emitter-owned station membership, and distinguishes required stability from enforced immutability.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This contact-curve type performs no nearest-surface query or station traversal; its producer and body-contact consumer own that work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Native attachment and emitted station membership describe one actual curve; no cross-curve cached answer is identified here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Station count and each station's vertex membership determine retained layout bytes while the owning hair part retains the record.
 *
 * @author Samchon
 */
export interface IHumanFaceHairContactCurve {
  /** Native source triangle, ordered barycentric weights and complete incident support. */
  attachment: IAutoMovieMeshSeparationAttachment;

  /** Root-to-tip station membership emitted by the representation owner. */
  stations: readonly IHumanFaceHairContactStation[];
}
