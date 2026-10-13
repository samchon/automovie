import type { IAutoMovieHumanBodyMeasurement } from "../../structures/IAutoMovieHumanBodyMeasurement";
import type { IAutoMovieHumanBodyExteriorTarget } from "./IAutoMovieHumanBodyExteriorTarget";

/**
 * One supplied bound surface target, ready to solve: its table binding, the instrument oriented to the binding's side and the requested metres.
 *
 * @evidence contracts/common.md#principled-implementation The supplied binding, side-oriented measurement rule and absolute meter target preserve the correspondence consumed by coupled surface solving.
 * @evidence contracts/common.md#clear-and-simple-design Collection prepares the rule once; the solver reads this request instead of reconstructing instrument ownership from paths.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Meter targets are numerical conditions, not observed acquisition registration or a proof that the current source can meet them.
 * @evidence contracts/common.md#meaningful-documentation Members state binding ownership, oriented instrument meaning and absolute meter units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Request typing chooses no coupled inverse or geometric measurement algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The request describes one solve's dependencies and owns no equivalence cache across different shape states.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The readonly request carrier acquires no measurement reader, numerical workspace or active inverse task.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExteriorRequest {
  /** The table binding the target was supplied under. */
  readonly binding: IAutoMovieHumanBodyExteriorTarget;

  /** The binding's rule oriented to its side. */
  readonly rule: IAutoMovieHumanBodyMeasurement;

  /** Requested absolute value, metres. */
  readonly metres: number;
}
