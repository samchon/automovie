import type { IAutoMoviePhysicalCoupledTargetFit } from "@automovie/interface";

/**
 * A coupled target interval failed before a completed bake could be published.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the Engine's typed group failure.
 * @evidence contracts/development/design.md#principled-representation Carries the exact interval and discriminated failure outcome alongside the Error message.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One read-only report supplies the step, group and reason to callers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The report contains status and witness data without a partial successful target map.
 */
export class AutoMoviePhysicalCoupledTargetError extends Error {
  /**
   * @param fit Named failure at one sampled output interval.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the supplied fit failure and its clock.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the interval id and typed reason to form the ordinary Error message.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Retains the typed report once on the error.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original named failure on the report.
   * @evidence contracts/development/implementation.md#efficient-algorithms Forms a fixed-size message and passes the report reference.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the same error for input refusal and numerical failure.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds only the failure report and Error's own fields.
   */
  public constructor(
    /** The interval's refusal or unconverged report; it carries no target poses. */
    public readonly fit: IAutoMoviePhysicalCoupledTargetFit.IFailure,
  ) {
    super(
      `Physical coupled target fit at step ${fit.step} for "${fit.group}" ${fit.kind} (${fit.reason})` +
        (fit.kind === "refused" ? `: ${fit.detail}` : ""),
    );
    this.name = "AutoMoviePhysicalCoupledTargetError";
  }
}
