import type { IAutoMovieHumanPose } from "../../../../packages/human/src/structures/pose/IAutoMovieHumanPose";
import { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyPose } from "./HumanAnatomyPose";
import { HumanPeople } from "./HumanPeople";
import { HumanSkinIntegrity } from "./HumanSkinIntegrity";

/**
 * The integrity audit read on generated people: a person's bind skin against
 * the openings its body declares, and its skin under every pose the pose
 * audit reads. This is the only piece of the audit that needs the generator.
 */
export namespace HumanSkinIntegrityPerson {
  /** A generated person's bind skin against the openings its body declares. */
  export function bind(name: string): HumanSkinIntegrity.IFinding[] {
    return HumanSkinIntegrity.audit(HumanAnatomy.bind(name), HumanSkinIntegrity.openings(HumanPeople.person(name).body.apertures));
  }

  /**
   * Crossings of a generated person's skin in every pose the pose audit
   * reads, each finding's person named with its pose.
   */
  export function posed(name: string): HumanSkinIntegrity.IFinding[] {
    const out: HumanSkinIntegrity.IFinding[] = [];

    for (const [pose, value] of Object.entries(HumanAnatomyPose.POSES)) {
      const skin: HumanAnatomy.ISkin = HumanAnatomy.posed(name, value as IAutoMovieHumanPose);

      out.push(...HumanSkinIntegrity.intersections({ ...skin, name: `${name} ${pose}` }));
    }

    return HumanSkinIntegrity.sort(out);
  }
}
