import type { IAutoMovieHumanPose } from "../../../../packages/human/src/structures/pose/IAutoMovieHumanPose";
import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyPose } from "./HumanAnatomyPose";
import { HumanSkinIntegrity } from "./HumanSkinIntegrity";

/**
 * The integrity audit read on generated people: a person's bind skin against
 * the openings its body declares, and its skin under every pose the pose
 * audit reads. This is the only piece of the audit that needs the generator.
 */
export namespace HumanSkinIntegrityPerson {
  /** A generated person's bind skin against the openings its body declares. */
  export function bind(name: string): HumanSkinIntegrity.IFinding[] {
    const views: HumanAnatomy.IViews = HumanAnatomy.views(name);
    return HumanSkinIntegrity.audit(views.bind(), HumanSkinIntegrity.openings(views.person.body.apertures));
  }

  /**
   * Crossings of a generated person's skin in every pose the pose audit
   * reads, each finding's person named with its pose.
   */
  export function posed(name: string): HumanSkinIntegrity.IFinding[] {
    const out: HumanSkinIntegrity.IFinding[] = [];
    const views: HumanAnatomy.IViews = HumanAnatomy.views(name);

    for (const [pose, value] of Object.entries(HumanAnatomyPose.POSES)) {
      const skin: HumanAnatomy.ISkin = views.posed(value as IAutoMovieHumanPose);

      out.push(...HumanSkinIntegrity.intersections({ ...skin, name: `${name} ${pose}` }));
    }

    return HumanSkinIntegrity.sort(out);
  }
}
