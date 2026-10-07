import type { AutoMovieHumanBodyAnatomicalUnavailableReason } from "./AutoMovieHumanBodyAnatomicalUnavailableReason";

/**
 * A named anatomical component that was not generated, with its cause.
 *
 * @evidence contracts/common.md#principled-implementation Absence is explicit per part rather than a missing entry.
 * @evidence contracts/common.md#clear-and-simple-design The unavailable branch of the resolution union as its own record.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No geometry or default stands in for the part.
 * @evidence contracts/common.md#meaningful-documentation States each field's meaning.
 * @evidence contracts/modeling.md#part-identity-and-grouping The id names exactly the part that was not generated.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions It carries no spatial value.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Consumers display it; it renders nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It is generated output, not an authoring input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyAnatomicalUnavailable<Id extends string> {
  /** Names the exact part that could not be resolved. */
  readonly id: Id;
  /** No validated individual component was generated. */
  readonly status: "unavailable";
  /** Distinguishes missing input, missing anatomy and domain failure. */
  readonly reason: AutoMovieHumanBodyAnatomicalUnavailableReason;
}
