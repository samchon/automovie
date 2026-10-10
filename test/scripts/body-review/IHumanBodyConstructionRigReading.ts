import type { IConnectedBodyRigReading } from "@automovie/playground/src/human/body/IConnectedBodyRigReading";

/**
 * Actual construction placements archived with the producer's source identity.
 * The shared reading owns units and rest/posed distinctions; these provenance
 * values come from the same producer that archived the static model.
 *
 * @evidence contracts/common.md#principled-implementation Extends the same reading used by the resident with original archive provenance.
 * @evidence contracts/common.md#clear-and-simple-design The placement population has one shared owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source digests and generation identities are supplied by the archive producer.
 * @evidence contracts/common.md#meaningful-documentation States placement and provenance ownership.
 * @evidence contracts/modeling.md#spatial-conventions Inherits the original metre positions and rest/posed body-basis distinction.
 * @author Samchon
 */
export interface IHumanBodyConstructionRigReading extends IConnectedBodyRigReading {
  /** Actual paired source generation used by the construction owner. */
  generation: string;

  /** Original registered assembly bytes consumed by this construction. */
  sourceAssemblySha256: string;
}
