import {
  IAutoMovieRenderReport,
  IAutoMovieRenderTarget,
} from "@automovie/interface";

import { compareAutoMovieRenderTarget } from "./compareAutoMovieRenderTarget";

/** Read the reported and current digests, for a one-line staleness log. */
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
