import type { IAutoMovieModel } from "@automovie/interface";

import type { IHumanFaceOralMeasurementRegistration } from "../../face/anatomy/oral/IHumanFaceOralMeasurementRegistration";

/**
 * One successful face-producer call used by the person evaluator. The model,
 * actual hair identities, optional source-neutral reference and compact oral
 * correspondence belong to this call, so later normal-reference calls cannot
 * replace their snapshots.
 * A missing reference means it was not requested or not supplied by this
 * source, never an implicit basis-neutral map.
 *
 * @evidence contracts/common.md#principled-implementation The named return contract represents both ready and unavailable reference states after the producer's synchronous observer publication.
 * @evidence contracts/common.md#clear-and-simple-design One call's model and its observed identities/reference/oral correspondence, with explicit unavailable state omission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing observation stays absent without a source-rest replacement or type cast.
 * @evidence contracts/common.md#meaningful-documentation States snapshot ownership, reference omission and independence of subsequent calls.
 * @evidence contracts/modeling.md#spatial-conventions Model and source-neutral reference positions use the producer's head-frame metres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The face producer owns its parts; this record transports its result.
 * @evidenceExclude contracts/modeling.md#parameter-channels The record adds no authored channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The face producer owns emission.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The person evaluator owns composition.
 * @evidenceExclude contracts/modeling.md#rendered-observation The model's consumers observe output.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The reference owner defines its source-neutral state.
 * @evidenceExclude contracts/anatomy.md#permitted-range The record admits no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority This is output, not a person-authoring input.
 * @author Samchon
 */
export interface IAutoMovieHumanPersonFaceBuild {
  /** Successfully admitted face model, owned by this evaluation's caller. */
  model: IAutoMovieModel;

  /** Copied semantic identities of hair emitted by this call. */
  hairPartIds: ReadonlySet<string>;

  /** Owned source-neutral reference snapshot, when requested and available. */
  reference?: ReadonlyMap<string, readonly number[]>;

  /** Owned successful oral correspondence; absent crowns remain unavailable. */
  oral?: IHumanFaceOralMeasurementRegistration;
}
