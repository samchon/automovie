import type {
  IAutoMovieRecoveryImageLoft,
  IAutoMovieRecoveryImageLoftBudget,
  IAutoMovieRecoveryImageRealization,
  IAutoMovieRecoveryResult,
  IAutoMovieRecoverySupportLoft,
  IAutoMovieRecoverySupportLoftBudget,
  IAutoMovieRecoverySupportRealization,
} from "@automovie/interface";

import { compileRecoveryImageLoft as compileImageLoftOperation } from "./internal/compileRecoveryImageLoft";
import { compileRecoverySupportLoft as compileSupportLoftOperation } from "./internal/compileRecoverySupportLoft";

/** Compiles saved lateral loft recipes into AutoMovie models. */
export namespace AutoMovieRecoveryCompilation {
  /**
   * Compiles saved aligned-ellipse coefficients into a bicubic model and its
   * construction curves, in metres.
   *
   * Width, depth and height factors are independently in [0.25, 4]. Height
   * scales about the lowest saved station. The construction samples the same
   * atlas as the model, including its circular-cubic arc approximation.
   *
   * The budget requires positive finite tolerance in metres, a positive safe
   * cell cap, and a safe vertex cap of at least three. The atlas stores these
   * controls for later realization.
   *
   * A valid recipe returns partial coverage with unobserved caps and interior.
   * An invalid recipe or budget returns a refusal without model data.
   */
  export function compileImageLoft(
    recipe: IAutoMovieRecoveryImageLoft,
    budget: IAutoMovieRecoveryImageLoftBudget,
  ): IAutoMovieRecoveryResult<IAutoMovieRecoveryImageRealization> {
    return compileImageLoftOperation(recipe, budget);
  }

  /**
   * Compiles saved support curves into a lateral mesh, normal fans and
   * construction curves in metres.
   *
   * Width, depth and height factors are independently in [0.25, 4]. Plane
   * equations are transformed and renormalized in the edited horizontal chart.
   * Height scales about the lowest saved station. The Engine controls bound
   * topology events, cells and vertices during emission.
   *
   * Valid emission returns partial physical coverage. The finite-view model
   * leaves unseen concavity, caps and interior unobserved. Invalid recipes or
   * generation refusal return diagnostics without model data.
   */
  export function compileSupportLoft(
    recipe: IAutoMovieRecoverySupportLoft,
    budget: IAutoMovieRecoverySupportLoftBudget,
  ): IAutoMovieRecoveryResult<IAutoMovieRecoverySupportRealization> {
    return compileSupportLoftOperation(recipe, budget);
  }
}
