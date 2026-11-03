
import type { HumanAnatomy } from "./HumanAnatomy";
import type { HumanAnatomyShared } from "./HumanAnatomyShared";

/**
 * The neck reading of a skin, taken once and shared.
 *
 * Reading the neck cuts the skin into sections and meridians and costs
 * seconds, and a reading taken without given locators is a pure function of the
 * skin, so each skin has one value that takes it on first use. The
 * entries are weakly held by skin object: an edited copy made for a red proof
 * is another skin and has its own.
 */
export namespace HumanNeckReadingSingleton {
  /**
   * The neck reading of a skin.
   *
   * @param skin Skin to read; its identity is the cache key.
   * @param produce Takes the reading; called once per skin, on first use.
   */
  export function get(skin: HumanAnatomy.ISkin, produce: () => HumanAnatomyShared.INeck): HumanAnatomyShared.INeck {
    let found: HumanAnatomyShared.INeck | undefined = cache.get(skin);

    if (found === undefined) {
      found = produce();
      cache.set(skin, found);
    }
    return found;
  }

  /** Values by skin; each dies with its skin. */
  const cache: WeakMap<HumanAnatomy.ISkin, HumanAnatomyShared.INeck> = new WeakMap();
}
