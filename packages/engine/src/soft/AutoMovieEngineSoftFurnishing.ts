import { type IAutoMovieSoftFurnishingFrame, type IAutoMovieLowerSoftFurnishing, type IAutoMovieValidation, type IAutoMovieSoftFurnishing, type IAutoMovieValidateSoftFurnishings } from "@automovie/interface";
import { lowerSoftFurnishing as lowerSoftFurnishingImplementation } from "./internal/lowerSoftFurnishing";
import { validateAutoMovieSoftFurnishingDomainOwnership as validateAutoMovieSoftFurnishingDomainOwnershipImplementation } from "./internal/validateAutoMovieSoftFurnishingDomainOwnership";
import { validateSoftFurnishings as validateSoftFurnishingsImplementation } from "./internal/validateSoftFurnishings";

/** Public operations for Auto Movie Engine Soft Furnishing. */
export namespace AutoMovieEngineSoftFurnishing {
  /**
   * Lower one typed furnishing into a cloth surface and explicit
   * rest/solved/not-run/unsupported status. Domain/reference/state/budget
   * failures are reported before solve; unexpected numeric integration failures
   * can still throw. No production/viewer currently calls this public lowering
   * API.
   */
  export function lowerSoftFurnishing(props: IAutoMovieLowerSoftFurnishing.IProps): IAutoMovieSoftFurnishingFrame {
    return lowerSoftFurnishingImplementation(props);
  }

  /**
   * Refuse duplicate typed furnishing bindings to the same world-space cloth
   * domain, independently of building grouping. Domain and furnishing ids use
   * code-unit order; source indices still identify the original conflicting
   * rows.
   */
  export function validateAutoMovieSoftFurnishingDomainOwnership(furnishings: readonly IAutoMovieSoftFurnishing[]): IAutoMovieValidation {
    return validateAutoMovieSoftFurnishingDomainOwnershipImplementation(furnishings);
  }

  /**
   * Join typed furnishings to domains, supports and room volumes, then inspect
   * held rest particles.
   */
  export function validateSoftFurnishings(props: IAutoMovieValidateSoftFurnishings.IProps): IAutoMovieValidation {
    return validateSoftFurnishingsImplementation(props);
  }
}
