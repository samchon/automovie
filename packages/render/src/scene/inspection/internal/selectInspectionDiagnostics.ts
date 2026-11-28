import type { IAutoMovieInspectionDiagnostics as Diagnostics } from "@automovie/interface";

import type { AutoMovieRenderInspectionMarks } from "../../AutoMovieRenderInspectionMarks";

/* Select display records by canonical paths without changing the source audit. */
export function selectInspectionDiagnostics(
  props: AutoMovieRenderInspectionMarks.ISelectDiagnosticsProps,
): AutoMovieRenderInspectionMarks.ISelectedDiagnostics {
  const { observations, paths, scope, check, key } = props;
  const selects = (owned: readonly string[]): boolean =>
    paths.every((path) =>
      owned.some(
        (candidate) =>
          candidate === path ||
          candidate.startsWith(path + "/") ||
          candidate.startsWith(path + ".children["),
      ),
    );
  const matches = (
    owner: string,
    row: Pick<Diagnostics.ICoverage, "check" | "key">,
  ): boolean =>
    (scope === undefined || scope === owner) &&
    (check === undefined || check === row.check) &&
    (key === undefined || key === row.key);
  const episodes: readonly Diagnostics.IEpisode[] =
    observations.episodes.filter(
      (episode) =>
        matches(episode.scope, episode.first.finding) &&
        selects(episode.first.finding.paths),
    );
  const address = (
    owner: string,
    row: Pick<Diagnostics.ICoverage, "check" | "key">,
  ): string => JSON.stringify([owner, row.check, row.key]);
  const byFinding: Map<string, Diagnostics.IEpisode[]> = new Map();
  for (const episode of observations.episodes) {
    const identity = address(episode.scope, episode.first.finding);
    const previous = byFinding.get(identity);
    if (previous === undefined) byFinding.set(identity, [episode]);
    else previous.push(episode);
  }
  const coverage: AutoMovieRenderInspectionMarks.ISelectedCoverage[] = [];
  for (const range of observations.coverage) {
    const row = range.coverage;
    if (!matches(range.scope, row)) continue;
    const hasFindings: boolean =
      byFinding
        .get(address(range.scope, row))
        ?.some((episode) => sharesSample(range, episode)) ?? false;
    if (!selects(row.paths ?? [])) continue;
    coverage.push({
      range,
      status:
        row.status === "checked"
          ? hasFindings
            ? "checked-with-findings"
            : "checked-clear"
          : row.status,
    });
  }
  return {
    coverage,
    episodes,
    totalCoverage: observations.coverage.length,
    totalEpisodes: observations.episodes.length,
  };
}

/* Keep only times both records observed. Witness times can lie between frames. */
function sharesSample(
  range: Diagnostics.ICoverageRange,
  episode: Diagnostics.IEpisode,
): boolean {
  const first: number | undefined = range.first.outputFrame;
  const last: number | undefined = range.last.outputFrame;
  const sampled: number | undefined = episode.last.outputFrame;
  if (first !== undefined && last !== undefined && sampled !== undefined)
    return sampled >= first && sampled - episode.samples + 1 <= last;
  return (
    episode.last.filmSeconds >= range.first.filmSeconds &&
    episode.last.filmSeconds <= range.last.filmSeconds
  );
}
