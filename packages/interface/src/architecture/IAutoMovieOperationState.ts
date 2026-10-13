import { IAutoMoviePanelValue } from "./IAutoMoviePanelValue";

/**
 * One named operating state and the travel it gives each panel.
 *
 * Every state is validated, not only the one the operation currently stands
 * in: each must give every panel one value within its travel, and applying it
 * must not compose shear into any element it moves.
 *
 * @evidence contracts/common.md#principled-implementation A named state gives every panel of its operation one rest-relative value; validation refuses unknown panels, repeats, missing panels, non-finite values, and values outside the panel's `[min, max]` travel.
 * @evidence contracts/common.md#clear-and-simple-design An id and a value list; which state is staged is chosen once by the operation's `state`, so a state record carries no current flag.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No state id is reserved, and each non-current state is re-checked for shear on the subtree it moves instead of being trusted because the current state passed.
 * @evidence contracts/common.md#meaningful-documentation States the stable-name role of `id`, the exactly-once panel rule, and that every state, not only the current one, is checked.
 * @author Samchon
 */
export interface IAutoMovieOperationState {
  /** Stable state name such as `closed`, `open`, or a production term. */
  id: string;

  /**
   * One value per panel; every panel of the operation must appear exactly once.
   */
  panels: IAutoMoviePanelValue[];
}
