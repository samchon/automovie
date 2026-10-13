import { IAutoMoviePanelValue } from "./IAutoMoviePanelValue";

/** One named operating state and the travel it gives each panel. */
export interface IAutoMovieOperationState {
  /** Stable state name such as `closed`, `open`, or a production term. */
  id: string;

  /**
   * One value per panel; every panel of the operation must appear exactly once.
   */
  panels: IAutoMoviePanelValue[];
}
