import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * An explicit static-ground selection evaluated on a motion's local clock.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the sample and boundary clocks, model frame and metres, root versus foot purpose, and absent-height meaning.
 * @evidence contracts/development/design.md#principled-representation The support locator samples XYZ in model metres at local seconds. Absent support is encoded by null and any returned height must be finite. Boundaries give each change an exact frame on the planting clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The stance sampler uses the boundaries and query directly. Stage callers adapt world geometry to this model-frame operation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No nearest substitute is chosen by the stance sampler when the locator returns null. A root query observes the authored trajectory and does not project it.
 */
export interface IAutoMovieTimedGround {
  /** Additional exact sample times in seconds within the clip. */
  boundaries: readonly number[];

  /**
   * Read the eligible ground's model Y in metres. Root samples are observed
   * for path admission and feet for stance. Null means no static ground.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives the point frame, seconds and metre units, kinds, and null meaning.
   */
  at: (
    seconds: number,
    point: IAutoMovieVector3,
    kind: "root" | "foot",
  ) => number | null;
}
