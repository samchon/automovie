import { IAutoMovieRenderReport, IAutoMovieRenderTarget } from "@automovie/interface";
import { compareAutoMovieRenderTarget } from "./compareAutoMovieRenderTarget";

/**
 * Read the reported and current digests, for a one-line staleness log.
 *
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-current-stale Summarizes whether a report remains current and names each dependency drift when it does not.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Exposes the sealed report and current target identities in a deterministic recovery message.
 */
export const autoMovieRenderTargetSummary = (props: {
  report: IAutoMovieRenderReport;
  current: IAutoMovieRenderTarget;
}): string => {
  const { fresh, drift } = compareAutoMovieRenderTarget(props);
  return fresh
    ? `fresh: ${props.report.target.digest}`
    : `stale: report ${props.report.target.digest} against current ${props.current.digest}; ${drift
        .map((entry) => `${entry.field} ${entry.reported} -> ${entry.current}`)
        .join(", ")}`;
};
