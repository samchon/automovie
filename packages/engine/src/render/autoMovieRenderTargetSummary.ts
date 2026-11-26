import type {
  IAutoMovieCompareRenderTarget,
  IAutoMovieRenderTargetDrift,
} from "@automovie/interface";

import { compareAutoMovieRenderTarget } from "./compareAutoMovieRenderTarget";

/** Read the reported and current digests, for a one-line staleness log. */
export function autoMovieRenderTargetSummary(
  props: IAutoMovieCompareRenderTarget.IProps,
): string {
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
}
