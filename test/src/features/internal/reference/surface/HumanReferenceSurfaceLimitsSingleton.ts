import { Singleton } from "tstl";

import type { HumanReferenceSurface } from "./HumanReferenceSurface";
import { HumanReferenceSurfaceLimits } from "./HumanReferenceSurfaceLimits";

/**
 * Each reference's gross-defect limits, computed once per process and shared
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
    let found: Singleton<HumanReferenceSurface.ILimits> | undefined = cache.get(id);

    if (found === undefined) {
      found = new Singleton((): HumanReferenceSurface.ILimits => HumanReferenceSurfaceLimits.build(id));
      cache.set(id, found);
    }
    return found.get();
  }

  /** One singleton per reference alias. */
  const cache: Map<string, Singleton<HumanReferenceSurface.ILimits>> = new Map();
}
