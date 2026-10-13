import type { IAutoMovieHumanPersonDocument } from "@automovie/human";
import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human/common/structures/IAutoMovieHumanConstructionAdmission";

/**
 * A constructed person whose owner refused admission: the exact document, the
 * model built from it and the unchanged admission report. It is shown and can
 * be edited further, saved or encoded with its report beside it, and it never
 * enters the accepted history.
 *
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
