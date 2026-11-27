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
  compileRecoveryImageLoft as compileImageLoftOperation,
} from "./internal/compileRecoveryImageLoft";
import {
  compileRecoverySupportLoft as compileSupportLoftOperation,
} from "./internal/compileRecoverySupportLoft";

/** Compile saved Recovery recipes into deterministic model geometry. */
export namespace AutoMovieRecoveryCompilation {
  /**
   * Generate an ordinary AutoMovie bicubic model and its actual construction from
   * saved section coefficients alone. Positive axis scales preserve the other two
   * coordinate extents; height edits anchor at the lowest saved station.
   * Construction evaluates the generated atlas coefficients, including its
   * declared circular-cubic approximation. The viewer and numerical mesh consumer
   * use that same atlas. Partial describes unobserved caps/interior,
   * independently of the engine's later tessellation completion or source/image
   * fidelity.
   */
  export function compileImageLoft(
    recipe: IAutoMovieRecoveryImageLoft,
    budget: IAutoMovieRecoveryImageLoftBudget,
  ): IAutoMovieRecoveryResult<IAutoMovieRecoveryImageRealization> {
    return compileImageLoftOperation(recipe, budget);
  }

  /**
   * Generate new geometry, normal fans and construction from saved support
   * curves. Independent coordinate edits transform the support equations by the
   * inverse diagonal map and renormalize each plane, preserving other axis
   * extents. No source image, measurement row, source mesh or source normal is
   * consulted. Partial denotes inferred finite-view coverage, regardless of
   * completed emission.
   */
  export function compileSupportLoft(
    recipe: IAutoMovieRecoverySupportLoft,
    budget: IAutoMovieRecoverySupportLoftBudget,
  ): IAutoMovieRecoveryResult<IAutoMovieRecoverySupportRealization> {
    return compileSupportLoftOperation(recipe, budget);
  }
}
