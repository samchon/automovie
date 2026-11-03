import type { IAutoMovieHumanBindingRegion } from "./IAutoMovieHumanBindingRegion";

/**
 * The toes' region: the metatarsophalangeal hinges and the toes' own joints.
 *
 * The rig carries every toe on one bone, so the toes are one channel: a toe's
 * joint cuts nothing from the toe before it, and the limb tree holds them only
 * for their shape. They are kept out of the trunk's capsules an arm is told
 * from.
 */
export namespace AutoMovieHumanToeBinding {
  /** The region of the great toe's and the lesser toes' joints. */
  export const region: IAutoMovieHumanBindingRegion = {
    name: "toe",
    bones: /Hallux|Toe\d/,
  };
}
