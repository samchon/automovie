import type { IAutoMovieModel } from "@automovie/interface";

import type { IHumanFaceOralMeasurementRegistration } from "../../face/anatomy/oral/IHumanFaceOralMeasurementRegistration";
import type { IHumanFaceHairContactLayout } from "../../face/anatomy/hair/IHumanFaceHairContactLayout";
import type { IHumanFaceMaterialAttachment } from "../../face/structures/IHumanFaceMaterialAttachment";

/**
 * One successful face-producer call used by the person evaluator. The model,
 * actual hair identities, optional source-neutral reference and compact oral
 * correspondence belong to this call, so later normal-reference calls cannot
 * replace their snapshots.
 * A missing reference means it was not requested or not supplied by this
 * source, never an implicit basis-neutral map.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonFaceBuild {
  /** Successfully admitted face model, owned by this evaluation's caller. */
  model: IAutoMovieModel;

  /** Copied semantic identities of hair emitted by this call. */
  hairPartIds: ReadonlySet<string>;

  /** Owned geometry-produced per-part station membership and clearance from this same call. */
  hairContactLayouts: ReadonlyMap<string, IHumanFaceHairContactLayout>;

  /** This emission's exact material seats, keyed by physical domain and ID. */
  materialAttachments: ReadonlyMap<string, ReadonlyMap<number, IHumanFaceMaterialAttachment>>;

  /** Owned source-neutral reference snapshot, when requested and available. */
  reference?: ReadonlyMap<string, readonly number[]>;

  /** Owned successful oral correspondence; absent crowns remain unavailable. */
  oral?: IHumanFaceOralMeasurementRegistration;
}
