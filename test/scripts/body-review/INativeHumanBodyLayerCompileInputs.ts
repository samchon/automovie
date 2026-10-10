import type { IAutoMovieHumanBodyLayerThicknessField } from "@automovie/human/body/anatomy/layer/IAutoMovieHumanBodyLayerThicknessField";

import type { IHumanBodyAnatomicalCompileInputs } from "./IHumanBodyAnatomicalCompileInputs";

/**
 * Admitted native exterior inputs before anatomical registration exists.
 * This preparation consumes no placeholder assembly and makes no anatomical
 * construction claim. Its thickness field is required and basis-addressed.
 * @author Samchon
 */
export interface INativeHumanBodyLayerCompileInputs extends Pick<
  IHumanBodyAnatomicalCompileInputs, "plan" | "head" | "body" | "layerFieldSha256" | "skinIndices"
> {
  /** Actual required native thickness field of the selected body view. */
  layerField: IAutoMovieHumanBodyLayerThicknessField;
}
