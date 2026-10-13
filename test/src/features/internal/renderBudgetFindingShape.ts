import { IAutoMovieRenderReport } from "@automovie/interface";

/** Project the contributor and recovery fields each over-limit experiment observes. */
export const renderBudgetFindingShape = (
  finding: IAutoMovieRenderReport["findings"][number],
): Record<string, unknown> => ({
  status: finding.status,
  excess: finding.excess,
  owner: finding.contributors[0]?.owner,
  source: finding.contributors[0]?.source,
  cost: finding.contributors[0]?.cost,
  recovers:
    (finding.recovery ?? "").includes("over") &&
    (finding.recovery ?? "").includes(finding.contributors[0]?.owner ?? "!"),
});
