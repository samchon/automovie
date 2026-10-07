import type { IAutoMovieHumanFaceAnatomicalParameters } from "../parameters/IAutoMovieHumanFaceAnatomicalParameters";
import type { IAutoMovieHumanFaceMeasurementTarget } from "./IAutoMovieHumanFaceMeasurementTarget";

/**
 * A face document's anatomical record: requested measurement targets and
 * clinical observations, resolved by the face anatomical resolver.
 *
 * Each target is solved by the editor onto existing channels and stored with
 * them; each observation field is either kept as an observation that does not
 * change shape or refused by name where the basis cannot represent it. A
 * field the resolver has no rule for is refused rather than ignored. Omission
 * changes nothing; a static asset does not restore this record.
 *
 * @evidence contracts/common.md#principled-implementation Every anatomical value reaches one of three named outcomes: a solved measurement, an unchanged observation, or a named refusal.
 * @evidence contracts/common.md#clear-and-simple-design One record carries targets and observations beside the existing channel weights.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No field is silently ignored or filled with a default; unruled fields refuse.
 * @evidence contracts/common.md#meaningful-documentation States both parts, their outcomes, omission and the export boundary.
 * @evidence contracts/modeling.md#parameter-channels Targets resolve onto named channels; observations never move a channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The record names no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The record emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Targets and observations state their own units.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The record builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The editor and builder observe the resolved face.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The observation types state their protocols and sources.
 * @evidenceExclude contracts/anatomy.md#permitted-range Ranges belong to the measurements and the solved channels.
 * @evidence contracts/anatomy.md#parametric-authority The record holds named anatomical values only.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceAnatomicalRequest {
  /** Requested measurement values, solved onto existing channels by the editor. */
  targets?: IAutoMovieHumanFaceMeasurementTarget[];

  /** Clinical observations, kept unchanged or refused by name. */
  observations?: IAutoMovieHumanFaceAnatomicalParameters;
}
