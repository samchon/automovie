import { IAutoMovieRenderSubject, deriveAutoMovieSemanticMask, measureAutoMovieRenderInventory } from "@automovie/engine";
import { IAutoMovieRenderInventory } from "@automovie/interface";

/** Derive a semantic mask and measure its exact subject without changing the caller's records. */
export const measureRenderBudgetSubject: (subject: IAutoMovieRenderSubject) => IAutoMovieRenderInventory = (subject: IAutoMovieRenderSubject): IAutoMovieRenderInventory =>
  measureAutoMovieRenderInventory({
    subject,
    mask: deriveAutoMovieSemanticMask(subject),
  });
