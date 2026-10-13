import { IAutoMovieRenderTargetAsset,
  IAutoMovieRenderReport,
  IAutoMovieRenderTarget,
} from "@automovie/interface";

import { IAutoMovieRenderTargetDrift } from "./IAutoMovieRenderTargetDrift";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";

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
 * @evidence contracts/common.md#principled-implementation Compare sealed protocol, texture identity, renderer fields, settings and asset path/digest sets, then sort all differences by field path; freshness means no compared field changed, not that a target was remeasured.
 * @evidence contracts/common.md#clear-and-simple-design One comparator owns report/current equality while summaries and consumers format or act on its explicit drift rows.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent texture/asset markers cannot alias an admitted SHA digest; no stale target is converted into a budget pass or repaired using an expected value.
 * @evidence contracts/common.md#meaningful-documentation Props distinguish borrowed report and current target, and return docs identify freshness and ordered diagnostic rows; caller-admitted sealed records are required.
 * @evidence contracts/performance.md#efficient-algorithms A reported/current assets build two maps and linear comparison passes, followed by O(D log D) drift sorting; storage is O(A+D), including field strings.
 * @evidence contracts/performance.md#reuse-equivalent-work Asset maps serve all lookups in one comparison and each caller reuses the returned drift; no persistent cache assumes mutable sealed records remain unchanged.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only drift rows transfer to the caller; target assets remain borrowed and no asset handle, renderer or asynchronous work is retained.
 */
export const compareAutoMovieRenderTarget: (props: { report: IAutoMovieRenderReport; current: IAutoMovieRenderTarget; }) => { fresh: boolean; drift: IAutoMovieRenderTargetDrift[]; } = (props: {
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
  const reported: IAutoMovieRenderTarget = props.report.target;
  const current: IAutoMovieRenderTarget = props.current;
  const drift: IAutoMovieRenderTargetDrift[] = [];
  const compare: (field: string, left: unknown, right: unknown) => void = (field: string, left: unknown, right: unknown): void => {
    if (String(left) !== String(right))
      drift.push({ field, reported: String(left), current: String(right) });
  };
  compare("protocol", reported.protocol, current.protocol);
  compare("textureDigest", reported.textureDigest ?? "absent", current.textureDigest ?? "absent");
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
  const currentAssets: Map<string, string> = new Map(
    current.assets.map((asset: IAutoMovieRenderTargetAsset) : [string, string] => [asset.path, asset.digest]),
  );
  for (const asset of reported.assets)
    compare(
      `assets["${asset.path}"]`,
      asset.digest,
      currentAssets.get(asset.path) ?? "absent",
    );
  const reportedAssets: Map<string, string> = new Map(
    reported.assets.map((asset: IAutoMovieRenderTargetAsset) : [string, string] => [asset.path, asset.digest]),
  );
  for (const asset of current.assets)
    if (!reportedAssets.has(asset.path))
      drift.push({
        field: `assets["${asset.path}"]`,
        reported: "absent",
        current: asset.digest,
      });
  drift.sort((left: IAutoMovieRenderTargetDrift, right: IAutoMovieRenderTargetDrift) : number =>
    compareAutoMovieRenderIds(left.field, right.field),
  );
  return { fresh: drift.length === 0, drift };
};
