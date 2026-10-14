import {
  IAutoMovieRenderReport,
  IAutoMovieRenderTarget,
} from "@automovie/interface";

import type { IAutoMovieRenderTargetDrift } from "./IAutoMovieRenderTargetDrift";
import { compareAutoMovieRenderTarget } from "./compareAutoMovieRenderTarget";

/** Read the reported and current digests, for a one-line staleness log.
 *
 * @evidence contracts/common.md#principled-implementation Use compareAutoMovieRenderTarget's exact freshness and drift rows to format reported/current target digests and field changes; formatting is diagnostic rather than validation authority.
 * @evidence contracts/common.md#clear-and-simple-design One comparator owns field equality and this function owns the readable one-line representation instead of duplicating target comparison rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The summary prints actual drift fields/values without interpreting fixture messages or repairing stale targets; embedded field text is preserved for diagnosis.
 * @evidence contracts/common.md#meaningful-documentation Docs distinguish fresh digest from stale report/current digests and list exact field transitions; report and current records are borrowed.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes the comparator's asset/field traversal and O(D) formatting for D drift rows, with output proportional to diagnostic string lengths.
 * @evidence contracts/performance.md#reuse-equivalent-work The completed comparison is used once for both freshness choice and drift text; no equality result is cached across mutable targets.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a string escapes; temporary drift rows belong to the call and no assets, renderer handle or running task are retained.
 */
export const autoMovieRenderTargetSummary: (props: {
  report: IAutoMovieRenderReport;
  current: IAutoMovieRenderTarget;
}) => string = (props: {
  report: IAutoMovieRenderReport;
  current: IAutoMovieRenderTarget;
}): string => {
  const {
    fresh,
    drift,
  }: { fresh: boolean; drift: IAutoMovieRenderTargetDrift[] } =
    compareAutoMovieRenderTarget(props);
  return fresh
    ? `fresh: ${props.report.target.digest}`
    : `stale: report ${props.report.target.digest} against current ${props.current.digest}; ${drift
        .map(
          (entry: IAutoMovieRenderTargetDrift): string =>
            `${entry.field} ${entry.reported} -> ${entry.current}`,
        )
        .join(", ")}`;
};
