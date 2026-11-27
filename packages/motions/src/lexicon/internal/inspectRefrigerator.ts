import type {
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionHumanDining,
} from "@automovie/interface";

import { HumanBound } from "../../law/internal/HumanBound";

/*
 * Open a refrigerator's fresh-food door by its handle, let go and look at one
 * of its shelves. Stage a standing performer with the handle in reach and a
 * sightline to the chosen shelf after opening. The fixed prop uses the
 * refrigerator affordances `fridgeHandle` and `shelf1` through `shelf4`. The
 * door stays at the resulting opening while the performer looks.
 * Parameter chain: The performer's entry chain.
 * Parameter scene: The prop subject, shelf number from bottom to top, additional
 * opening in degrees and optional operating hand (right by default).
 * Returns: The chain with the handle operation followed by the shelf look.
 * If the requested additional opening is nonpositive or
 * nonfinite.
 */
export function inspectRefrigerator<
  Chain extends IAutoMovieMotionHumanChainCore,
>(
  chain: Chain,
  scene: IAutoMovieMotionHumanDining.IInspectRefrigerator,
): Chain {
  const swing: number = HumanBound.above("swing", scene.swing, 0, "deg");
  return chain
    .act("operate", {
      ...(scene.hand === undefined ? {} : { hand: scene.hand }),
      kind: {
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
