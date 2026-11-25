import type { IAutoMoviePanelValue } from "./IAutoMoviePanelValue";

/**
 * One named operating state and the travel it gives each panel.
 *
 * Every named state must give each panel exactly one finite in-range value.
 * After earlier graph/record checks pass, `validateBuiltStagedConfigurations`
 * checks current staging, each alternative with other operations current, and
 * all named-state combinations whose moved subtrees share an affected element.
 * Independent branches do not multiply each other's states. These are named
 * configurations; interpolation or simultaneous continuous travel between them
 * is not checked.
 */
export interface IAutoMovieOperationState {
  /**
   * Stable, non-blank state name such as `closed`, `open`, or a production
   * term, unique within the operation.
   */
  id: string;

  /** One value per panel; every panel of the operation must appear exactly once. */
  panels: IAutoMoviePanelValue[];
}
