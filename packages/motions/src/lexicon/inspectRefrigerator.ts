import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanChainCore,
} from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";

/**
 * Open a refrigerator's fresh-food door by its handle, let go and look at
 * one of its shelves. Stage a standing performer with the handle in reach
 * and a sightline to the chosen shelf after opening. The fixed prop uses
 * the refrigerator affordances `fridgeHandle` and `shelf1` through `shelf4`.
 * The door stays at the resulting opening while the performer looks.
 *
 * @param chain The performer's entry chain.
 * @param scene The prop subject, shelf number from bottom to top, additional opening in degrees and optional operating hand (right by default).
 * @returns The chain with the handle operation followed by the shelf look.
 * @throws {HumanRefusal} If the requested additional opening is nonpositive or nonfinite.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the staging, prop contacts, timing and resulting door state.
 * @evidence contracts/development/implementation.md#principled-implementation The hinge operation uses the articulation that carries the handle, then the look targets the named shelf in the same staged prop. The existing laws plan reach, travel and gaze and own their refusals.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Check the opening's sign and append two typed actions in sequence.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Opening and shelf choice come from the scene. The composition supplies no hand path, pose or gaze offsets.
 * @evidence contracts/development/implementation.md#efficient-algorithms Appends a fixed two intents with the chain's sequence operator.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Independent calls produce independent chains.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The returned chain owns the intents and the helper keeps no state.
 */
export function inspectRefrigerator<
  Chain extends IAutoMovieMotionHumanChainCore,
>(
  chain: Chain,
  scene: {
    /** The fixed refrigerator prop's subject. */
    refrigerator: string;

    /** Shelf number from the bottom of the refrigerator compartment. */
    shelf: 1 | 2 | 3 | 4;

    /** Additional opening in degrees within the door's remaining travel. */
    swing: number;

    /** The hand on the handle. The `operate` default is right. */
    hand?: AutoMovieHumanSide;
  },
): Chain {
  const swing: number = HumanBound.above("swing", scene.swing, 0, "deg");
  return chain
    .act("operate", {
      ...(scene.hand === undefined ? {} : { hand: scene.hand }),
      mechanism: {
        kind: "hinge",
        at: {
          kind: "prop",
          subject: scene.refrigerator,
          point: "fridgeHandle",
        },
        swing,
      },
    })
    .act("look", {
      target: {
        kind: "prop",
        subject: scene.refrigerator,
        point: `shelf${scene.shelf}`,
      },
    });
}
