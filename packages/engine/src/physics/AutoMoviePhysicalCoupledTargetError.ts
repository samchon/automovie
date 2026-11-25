import type { IAutoMoviePhysicalCoupledTargetFit } from "@automovie/interface";

/** A coupled target interval failed before a completed bake could be published. */
export class AutoMoviePhysicalCoupledTargetError extends Error {
  /**
   * Keep the typed failure and form the ordinary message from its step, group,
   * kind and reason, plus the refusal detail.
   *
   * @param fit Named failure at one sampled output interval.
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
