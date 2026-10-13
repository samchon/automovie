import { IAutoMoviePanelValue } from "./IAutoMoviePanelValue";

/**
 * One named operating state and the travel it gives each panel.
 *
 * Every state is validated, not only the one the operation currently stands
 * in: each must give every panel one value within its travel, and applying it
 * must not compose shear into any element it moves. Each non-current state is
 * checked with every other operation at its own current state.
 *
 * @evidence contracts/common.md#principled-implementation `validateBuiltEnvironment` requires a unique non-blank id, resolving and unrepeated panel entries, a value for every panel, finite values inside each panel's travel, and, for each non-current state, decomposes and recomposes every moved element's world matrix to detect shear.
 * @evidence contracts/common.md#clear-and-simple-design A state is a name plus one value per panel, so the operation's vocabulary is data and every state, current or not, is applied by the same delta composition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing panel value is refused rather than defaulted to rest; the remaining gap is that a combination of non-current states across several operations, which naming one state id for a whole work stages, is not checked for shear.
 * @evidence contracts/common.md#meaningful-documentation States that every state is validated, the coverage and range rules, the shear rule, and which combination of states the shear check covers.
 * @author Samchon
 */
export interface IAutoMovieOperationState {
  /**
   * Stable, non-blank state name such as `closed`, `open`, or a production
   * term, unique within the operation.
   */
  id: string;

  /**
   * One value per panel; every panel of the operation must appear exactly once.
   */
  panels: IAutoMoviePanelValue[];
}
