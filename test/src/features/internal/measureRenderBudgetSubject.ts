import { type IAutoMovieRenderSubject, IAutoMovieRenderInventory } from "@automovie/interface";
import { deriveAutoMovieSemanticMask, measureAutoMovieRenderInventory } from "@automovie/engine";


/** Derive a semantic mask and measure its exact subject without changing the caller's records. */
export const measureRenderBudgetSubject: (
  subject: IAutoMovieRenderSubject,
) => IAutoMovieRenderInventory = (
  subject: IAutoMovieRenderSubject,
): IAutoMovieRenderInventory =>
  measureAutoMovieRenderInventory({
    subject,
    mask: deriveAutoMovieSemanticMask(subject),
  });
