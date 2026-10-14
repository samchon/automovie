import { IPortraitTongueShape } from "./IPortraitTongueShape";
import { portraitTongueParameters } from "./portraitTongueParameters";

/**
 * Admit a complete optional tongue before allocating its surface. The median
 * depression cannot consume the upper half of the body.
 * A nonblank material name is required; this check does not resolve catalogue
 * residency, oral containment or anatomical validity.
 *
 * @evidence contracts/common.md#principled-implementation Each of the eight authored millimetre parameters must be finite within its inclusive catalogue range, and groove depth must remain below body half-thickness before the tongue builder allocates geometry.
 * @evidence contracts/common.md#clear-and-simple-design One admission function consumes the shared parameter catalogue and checks the coupled groove condition; geometry construction, oral fitting and resident material resolution remain with their actual owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Out-of-range values and empty material names throw instead of clamping; these authored bounds do not certify anatomical validity, inside-arch placement or material existence.
 * @evidence contracts/common.md#meaningful-documentation The comment states preallocation admission, the groove/body condition and the unresolved containment and residency checks; failure leaves the input unchanged.
 * @evidence contracts/performance.md#efficient-algorithms Admission scans P catalogue entries once and compares one coupled inequality, using constant auxiliary storage; P is the shared eight-parameter definition rather than mesh resolution.
 * @evidence contracts/performance.md#reuse-equivalent-work Validation reads the existing catalogue instead of duplicating bounds or constructing a surface; it has no effectful result or cross-request cache to share.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only local catalogue references are borrowed and no input mutation, retained buffer, task or external handle is acquired on success or failure.
 */
export function assertPortraitTongueShape(shape: IPortraitTongueShape): void {
  for (const p of portraitTongueParameters)
    if (
      !Number.isFinite(shape[p.id]) ||
      shape[p.id] < p.minimum ||
      shape[p.id] > p.maximum
    )
      throw new Error(
        `Tongue ${p.id} must be finite in [${p.minimum},${p.maximum}] mm.`,
      );
  if (shape.grooveDepth >= shape.halfThickness)
    throw new Error(
      "Tongue groove depth must be less than its half thickness.",
    );
  if (shape.material.trim().length === 0)
    throw new Error("Tongue needs a nonempty resident material identity.");
}
