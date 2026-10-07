import type { IAutoMovieHumanPersonDocument } from "@automovie/human";
import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human/common/structures/IAutoMovieHumanConstructionAdmission";

/**
 * A constructed person whose owner refused admission: the exact document, the
 * model built from it and the unchanged admission report. It is shown and can
 * be edited further, saved or encoded with its report beside it, and it never
 * enters the accepted history.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Keeps a refused construction editable and visible with its qualification instead of presenting it as a committed person.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Holds draft geometry outside the transactional history of accepted documents.
 * @author Samchon
 */
export interface IConnectedPersonDraft<Model> {
  /** The numerical document this construction was evaluated from. */
  document: IAutoMovieHumanPersonDocument;

  /** The prepared model of that document; the viewport draws it. */
  model: Model;

  /** The owner's report of this exact model, carried without reinterpretation. */
  admission: IAutoMovieHumanConstructionAdmission;
}
