
import type { HumanAnatomy } from "../../HumanAnatomy";
import { HumanReferenceSurfacePair } from "./HumanReferenceSurfacePair";

/**
 * The generated side of a pairing, built by each call for each generated
 * skin and shared by every comparison that reads it.
 *
 * Building it costs seconds: the normals, the outer-skin test of 290,000
 * vertices and the hierarchies over the whole and the outer skin.
 * `HumanAnatomy.bind` hands back the same skin object for one person, so each
 * skin object has one value. The key is the object, not the alias,
 * because a red proof compares a copy of the skin with a made defect, which
 * must get its own side; the entries are weakly held, so a dropped copy frees
 * its side. The result is read-only to its consumers, which only query the
 * hierarchy.
 */
export namespace HumanReferenceSurfaceGenerateds {
  /**
   * The shared generated side of a skin, built on first use.
   *
   * @param skin The generated skin; its identity is the key.
   */
  export function side(skin: HumanAnatomy.ISkin): HumanReferenceSurfacePair.IGeneratedSide {
    let found: HumanReferenceSurfacePair.IGeneratedSide | undefined = sides.get(skin);

    if (found === undefined) {
      found = HumanReferenceSurfacePair.ofGenerated(skin);
      sides.set(skin, found);
    }
    return found;
  }

  /** Values by skin object, released with the skin. */
  const sides: WeakMap<HumanAnatomy.ISkin, HumanReferenceSurfacePair.IGeneratedSide> = new WeakMap();
}
