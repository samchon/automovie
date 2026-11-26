import type {
  IAutoMovieRecoveryImageLoft,
  IAutoMovieRecoveryImageLoftBudget,
  IAutoMovieRecoveryImageRealization,
  IAutoMovieRecoveryResult,
  IAutoMovieRecoverySupportLoft,
  IAutoMovieRecoverySupportLoftBudget,
  IAutoMovieRecoverySupportRealization,
} from "@automovie/interface";

import {
  compileAutoMovieRecoveryImageLoft as compileImageLoftOperation,
} from "./internal/compileAutoMovieRecoveryImageLoft";
import {
  compileAutoMovieRecoverySupportLoft as compileSupportLoftOperation,
} from "./internal/compileAutoMovieRecoverySupportLoft";

/** Compile saved Recovery recipes into deterministic model geometry. */
export namespace AutoMovieRecoveryCompilation {
  /** Generate an elliptical loft from its saved section coefficients. */
  export function compileImageLoft(
    recipe: IAutoMovieRecoveryImageLoft,
    budget: IAutoMovieRecoveryImageLoftBudget,
  ): IAutoMovieRecoveryResult<IAutoMovieRecoveryImageRealization> {
    return compileImageLoftOperation(recipe, budget);
  }

  /** Generate a convex support loft from its saved support curves. */
  export function compileSupportLoft(
    recipe: IAutoMovieRecoverySupportLoft,
    budget: IAutoMovieRecoverySupportLoftBudget,
  ): IAutoMovieRecoveryResult<IAutoMovieRecoverySupportRealization> {
    return compileSupportLoftOperation(recipe, budget);
  }
}
