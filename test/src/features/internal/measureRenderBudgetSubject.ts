import { AutoMovieEngineRenderSemanticMask, AutoMovieEngineRenderMeasure } from "@automovie/engine";
import {
  IAutoMovieRenderInventory,
  type IAutoMovieRenderSubject,
} from "@automovie/interface";

/** Derive a semantic mask and measure its exact subject without changing the caller's records. */
export const measureRenderBudgetSubject: (
  subject: IAutoMovieRenderSubject,
) => IAutoMovieRenderInventory = (
  subject: IAutoMovieRenderSubject,
): IAutoMovieRenderInventory =>
  AutoMovieEngineRenderMeasure.measureAutoMovieRenderInventory({
    subject,
    mask: AutoMovieEngineRenderSemanticMask.deriveAutoMovieSemanticMask(subject),
  });
