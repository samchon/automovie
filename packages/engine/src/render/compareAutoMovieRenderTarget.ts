import { IAutoMovieRenderReport, IAutoMovieRenderTarget } from "@automovie/interface";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";
import { IAutoMovieRenderTargetDrift } from "./IAutoMovieRenderTargetDrift";

/**
 * Decide whether a report is still evidence about the target in front of you.
 *
 * A budget verdict is a claim about a specific renderer drawing specific bytes
 * at a specific size. Change any of that and the verdict is not conservative,
 * it is wrong in an unknown direction: a smaller shadow map makes a failing
 * report pass and a larger one makes a passing report fail, and neither
 * re-measured anything. So a mismatch is `stale`, never `pass`, and every
 * differing field is named so the drift is actionable instead of mysterious.
 *
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale Rejects reuse when renderer, settings, asset membership, or asset bytes differ from the reported target.
 * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-cache-identity-integrity Compares every sealed render-input and dependency field before treating a prior report as reusable evidence.
 * @evidence requirements/operations-and-recovery/cache-integrity-and-dependency-loss.md#operations-stale-cache-invalidation Marks the prior report stale and names each renderer, setting, asset membership, or digest drift instead of reusing it.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Compares every field in the sealed target closure and returns stable ordered drift.
 * @evidence specifications/execution-and-recovery/checkpoints-resume-cache-and-dependencies.md#execution-cache-identity-invalidation Implements render-report invalidation from the sealed canonical target comparison without claiming ownership of a general cache store.
 */
export const compareAutoMovieRenderTarget = (props: {
  /** The report being re-used as evidence. */
  report: IAutoMovieRenderReport;
  /** The target a consumer is about to render with. */
  current: IAutoMovieRenderTarget;
}): {
  /** Whether the report still describes the current target. */
  fresh: boolean;
  /** Every differing field, ascending; empty when fresh. */
  drift: IAutoMovieRenderTargetDrift[];
} => {
  const reported = props.report.target;
  const current = props.current;
  const drift: IAutoMovieRenderTargetDrift[] = [];
  const compare = (field: string, left: unknown, right: unknown): void => {
    if (String(left) !== String(right))
      drift.push({ field, reported: String(left), current: String(right) });
  };
  compare("renderer.api", reported.renderer.api, current.renderer.api);
  compare("renderer.vendor", reported.renderer.vendor, current.renderer.vendor);
  compare("renderer.device", reported.renderer.device, current.renderer.device);
  for (const key of [
    "width",
    "height",
    "pixelRatio",
    "shadows",
    "shadowType",
    "toneMapping",
    "exposure",
  ] as const)
    compare(`settings.${key}`, reported.settings[key], current.settings[key]);
  const currentAssets = new Map(
    current.assets.map((asset) => [asset.path, asset.digest]),
  );
  for (const asset of reported.assets)
    compare(
      `assets["${asset.path}"]`,
      asset.digest,
      currentAssets.get(asset.path) ?? "absent",
    );
  const reportedAssets = new Map(
    reported.assets.map((asset) => [asset.path, asset.digest]),
  );
  for (const asset of current.assets)
    if (!reportedAssets.has(asset.path))
      drift.push({
        field: `assets["${asset.path}"]`,
        reported: "absent",
        current: asset.digest,
      });
  drift.sort((left, right) =>
    compareAutoMovieRenderIds(left.field, right.field),
  );
  return { fresh: drift.length === 0, drift };
};
