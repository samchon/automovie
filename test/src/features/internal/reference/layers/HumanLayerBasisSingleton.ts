
import { HumanLayerBasis } from "./HumanLayerBasis";

/**
 * Each reference's layer-comparison basis, built by each call and handed
 * by the real comparison and every made-defect proof of that reference.
 *
 * Building it reads the reference's normals, its welded-to-raw vertex order,
 * its head mask and the population bodies; none of it depends on the
 * generated skin, so one build serves every reading. Each alias has one
 * `Singleton`.
 */
export namespace HumanLayerBasisSingleton {
  /**
   * A reference's basis, built on first use.
   *
   * @param id Reference alias.
   */
  export function get(id: string): HumanLayerBasis.IBasis {
    return HumanLayerBasis.build(id);
  }

}
