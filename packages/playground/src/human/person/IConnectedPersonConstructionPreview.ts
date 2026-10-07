import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human/common/structures/IAutoMovieHumanConstructionAdmission";

/**
 * A prepared viewport model and its source owner's actual admission report.
 * It is separate from the accepted editor snapshot and undo history.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Keeps the full constructed person visible with its explicitly qualified draft status.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Separates preparation of draft geometry from committed editor state.
 * @author Samchon
 */
export interface IConnectedPersonConstructionPreview<Model> {
  /** Prepared model owned by this preview; the same viewport publishes it. */
  model: Model;

  /** Original checks of this exact model, without renderer or UI reinterpretation. */
  admission: IAutoMovieHumanConstructionAdmission;
}
