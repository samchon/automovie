import { IAutoMoviePanelValue } from "./IAutoMoviePanelValue";

/**
 * One named operating state and the travel it gives each panel.
 *
 * Every state is validated, not only the one the operation currently stands
 * in: each must give every panel one value within its travel, and applying it
 * must not compose shear into any element it moves.
 *
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
