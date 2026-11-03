
import type { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyHeadSites } from "./HumanAnatomyHeadSites";

/**
 * The face's landmarks of a skin, located once and shared by every observer.
 *
 * Locating them walks the median profile and cuts the skin thousands of times,
 * about half a minute for a generated person, and a skin never changes after it
 * is built, so every region audit, input-response test and consistency rule
 * reads the same result. Each entry is a value from the location
 * once. The entries are keyed by the skin object itself, never by a name, so a
 * deformed copy made for a red proof has its own entry and the source skin's
 * entry stays correct; they are weakly held, so a dropped copy frees them.
 */
export namespace HumanHeadSitesSingleton {
  /**
   * The face sites of a skin, located on first use.
   *
   * @param skin Skin to read; its identity is the cache key.
   * @param S Stature, mm.
   * @param mouth Whether the skin carries an oral cavity whose teeth to count.
   */
  export function get(skin: HumanAnatomy.ISkin, S: number, mouth: boolean): HumanAnatomyHeadSites.ISites {
    let byMouth: Map<boolean, HumanAnatomyHeadSites.ISites> | undefined = cache.get(skin);

    if (byMouth === undefined) {
      byMouth = new Map();
      cache.set(skin, byMouth);
    }

    let found: HumanAnatomyHeadSites.ISites | undefined = byMouth.get(mouth);

    if (found === undefined) {
      found = HumanAnatomyHeadSites.faceSites(skin, S, mouth);
      byMouth.set(mouth, found);
    }
    return found;
  }

  /** Values by skin, then by whether teeth were counted; each dies with its skin. */
  const cache: WeakMap<HumanAnatomy.ISkin, Map<boolean, HumanAnatomyHeadSites.ISites>> = new WeakMap();
}
