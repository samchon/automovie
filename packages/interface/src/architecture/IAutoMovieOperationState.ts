import { IAutoMoviePanelValue } from "./IAutoMoviePanelValue";

/**
 * One named operating state and the travel it gives each panel.
 *
 * Every named state must give each panel exactly one finite in-range value. After earlier graph/record checks pass, `validateBuiltStagedConfigurations` checks current staging, each alternative with other operations current, and all named-state combinations whose moved subtrees share an affected element. Independent branches do not multiply each other's states. These are named configurations; interpolation or simultaneous continuous travel between them is not checked.
 *
 * @evidence contracts/common.md#principled-implementation Opening-operation validation checks unique state identity and total finite in-range panel assignments. The staged gate decomposes/recomposes affected world matrices for named configurations and rejects nonfinite results or linear-basis error above 1e-8 times max(1, largest absolute basis entry); translation does not enlarge that tolerance, and tiny bases retain its absolute floor.
 * @evidence contracts/common.md#clear-and-simple-design A state is a name plus one value per panel, so the operation's vocabulary is data and every state, current or not, is applied by the same delta composition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing values are refused at admission rather than silently defaulted to rest. Shared-influence Cartesian combinations are checked without selecting favored state names; their worst-case population can be exponential. The numerical TRS round-trip threshold can admit small residual shear and does not prove continuous intermediate configurations are representable.
 * @evidence contracts/common.md#meaningful-documentation States that every state is validated, the coverage and range rules, the shear rule, and which combination of states the shear check covers.
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
