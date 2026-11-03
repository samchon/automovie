
import type { HumanAnatomy } from "./HumanAnatomy";
import type { HumanAnatomyShared } from "./HumanAnatomyShared";

/**
 * The trunk's tape sites of a skin, located once and shared.
 *
 * Locating the sites scans the trunk every 2 mm for the waist, bust, fold and
 * hip, and the result is a pure function of the skin, so each skin has one
 * `Singleton` that locates them on first use. The entries are weakly held by
 * skin object: an edited copy made for a red proof has its own.
 */
export namespace HumanTrunkSitesSingleton {
  /**
   * The trunk sites of a skin.
   *
   * @param skin Skin to read; its identity is the cache key.
   * @param locate Locates the sites; called once per skin, on first use.
   */
  export function get(skin: HumanAnatomy.ISkin, locate: () => HumanAnatomyShared.ITrunk): HumanAnatomyShared.ITrunk {
    let found: HumanAnatomyShared.ITrunk | undefined = cache.get(skin);

    if (found === undefined) {
      found = locate();
      cache.set(skin, found);
    }
    return found;
  }

  /** Values by skin; each dies with its skin. */
  const cache: WeakMap<HumanAnatomy.ISkin, HumanAnatomyShared.ITrunk> = new WeakMap();
}
