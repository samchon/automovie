import type { IAutoMovieHumanBindingRegion } from "./IAutoMovieHumanBindingRegion";
import { AutoMovieHumanLimbCapsule } from "./AutoMovieHumanLimbCapsule";

/**
 * The thoracic region: the cut between the lower trunk and the rib cage, whose
 * capsule narrows into the neck.
 *
 * The chest's flesh narrows from the ribs to the base of the neck, so its
 * capsule ends at the skin's depth there rather than at the ribs' girth;
 * otherwise the chest's capsule would hold the neck's skin against the neck's
 * own capsule. The breast and the rib cage are not separated here: they hang
 * from this one joint and the arms' band against the trunk
 * ({@link AutoMovieHumanAxillaBinding}) decides what the arm takes of them.
 */
export namespace AutoMovieHumanThoracicBinding {
  /** The region of the `chest` joint. */
  export const region: IAutoMovieHumanBindingRegion = {
    name: "thoracic",
    bones: /^chest$/,
    radii: (
      input: IAutoMovieHumanBindingRegion.IRadiiInput,
    ): IAutoMovieHumanBindingRegion.IRadii => ({
      radius: input.girth,
      near: input.girth,
      far: Math.min(
        input.girth,
        AutoMovieHumanLimbCapsule.depth(input.to, input.skin),
      ),
    }),
  };
}
