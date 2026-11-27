import type {
  IAutoMovieDeliveryContentAudit,
  IAutoMovieDrawnVideoResult,
  IAutoMovieInspectionDiagnostics,
} from "@automovie/interface";

/*
 * Selects the first usable cursor in each audit while retaining complete
 * details in the report.
 *
 * A content finding whose detector `skip` names does not block; a transparent
 * render skips `black`, which reads a transparent frame as black.
 */
export function listAutoMovieReleaseFindings(
  diagnostics: IAutoMovieDrawnVideoResult["diagnostics"] | null,
  delivery: IAutoMovieDeliveryContentAudit.IResult,
  skip: readonly string[] = [],
): string[] {
  const details: string[] = [];
  if (diagnostics?.hasBlockingFinding) {
    const blocking: IAutoMovieInspectionDiagnostics.IEpisode | undefined =
      diagnostics.episodes.find(
        ({
          worst: { finding },
        }: IAutoMovieInspectionDiagnostics.IEpisode): boolean =>
          finding.category === "error" && finding.confidence === "confirmed",
      );
    const first: IAutoMovieInspectionDiagnostics.IObservation | undefined =
      blocking?.first.finding.category === "error" &&
      blocking.first.finding.confidence === "confirmed"
        ? blocking.first
        : blocking?.worst;
    details.push(
      first === undefined
        ? "Scene inspection failed"
        : first.finding.code +
            cursor(first.time.filmSeconds, first.time.outputFrame),
    );
  }
  if (diagnostics?.unresolvedRequiredCoverage) {
    const unresolved:
      | IAutoMovieInspectionDiagnostics.ICoverageRange
      | undefined = diagnostics.coverage.find(
      ({ coverage }: IAutoMovieInspectionDiagnostics.ICoverageRange): boolean =>
        coverage.required &&
        (coverage.status === "deferred" || coverage.status === "unsupported"),
    );
    details.push(
      unresolved === undefined
        ? "Required scene inspection coverage is unresolved"
        : "Required scene " +
            unresolved.coverage.check +
            " coverage is unresolved" +
            cursor(unresolved.first.filmSeconds, unresolved.first.outputFrame),
    );
  }

  for (const finding of delivery.findings) {
    if (!finding.blocking) continue;
    if (finding.kind !== "content") {
      details.push(finding.media + ": " + finding.reason);
      continue;
    }
    if (skip.includes(finding.detector)) continue;
    const {
      ticks,
      timeBase: [numerator, denominator],
    }: IAutoMovieDeliveryContentAudit.ITimestamp = finding.start;
    details.push(
      finding.outcome +
        " " +
        finding.detector +
        cursor((ticks * numerator) / denominator, finding.firstOutputFrame),
    );
  }
  return details;
}

/*
 * Formats the available output frame and film seconds without inventing an
 * audio frame.
 */
function cursor(seconds: number, frame?: number): string {
  return (
    (frame === undefined ? "" : " at frame " + frame) + " (" + seconds + " s)"
  );
}
