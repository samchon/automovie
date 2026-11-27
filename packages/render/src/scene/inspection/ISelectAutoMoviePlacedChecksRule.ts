import type { IObserveAutoMoviePlacedSceneCheck } from "./IObserveAutoMoviePlacedSceneCheck.js";

/** Identity shared by every declaration. */
export interface ISelectAutoMoviePlacedChecksRule {
  /** Stable identity of the rule across samples. */
  readonly key: string;
  /** Whether delivery requires this obligation to be checked. */
  readonly required: boolean;
  /** Source path of the declaration, prefixed to every violation path. */
  readonly path: string;
  /** Entity paths reported with every finding. */
  readonly paths?: readonly string[];
  /**
   * Actual touching evidence for the declared pair at a film second, when the
   * producer has it.
  */
  readonly contact?: (
    filmSeconds: number,
  ) => IObserveAutoMoviePlacedSceneCheck["observedContact"];
}
