
import type { HumanReferenceSurface } from "./HumanReferenceSurface";
import { HumanReferenceSurfaceLimits } from "./HumanReferenceSurfaceLimits";

/**
 * Each reference's gross-defect limits, computed by each call and handed
 * by every comparison of that reference.
 *
 * Computing them aligns every one of the 66 population bodies onto the
 * reference segment by segment, about a minute per reference, and they read
 * nothing generated, so one computation serves the real comparison and every
 * made-defect proof alike. Each alias has one `Singleton`.
 */
export namespace HumanReferenceSurfaceLimitsSingleton {
  /**
   * A reference's limits, computed on first use.
   *
   * @param id Reference alias; it must be in the population.
   */
  export function get(id: string): HumanReferenceSurface.ILimits {
    return HumanReferenceSurfaceLimits.build(id);
  }

}
