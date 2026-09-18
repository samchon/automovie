/**
 * Shared by AUTOMOVIE_QUANTITY_MAX_CONTRIBUTORS, AUTOMOVIE_QUANTITY_SUBJECTS, measureAutoMovieQuantities, which were one file until each public identity took its own.
 *
 * @evidence requirements/interior/deliverables-and-quantities.md#interior-quantities-waste Bounds each take-off's named owner sample while preserving the count and value of every omitted contributor.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-drawing-schedule-quantity Sets the canonical contributor-list limit to eight before omitted owners are separately counted and summed.
 * @author Samchon
 */
export const canonical = (report: Omit<IAutoMovieQuantityReport, "digest">): string =>
  [
    report.protocol,
    report.environment,
    ...report.findings.map((finding) =>
      [
        finding.subject,
        finding.unit,
        String(finding.total),
        String(finding.owners),
        finding.basis,
        String(finding.approximation),
        ...finding.contributors.map(
          (contributor) => `${contributor.owner}=${contributor.value}`,
        ),
        String(finding.omittedOwners),
        String(finding.omittedValue),
      ].join("|"),
    ),
    ...report.gaps.map((gap) =>
      [gap.subject, gap.status, gap.reason, gap.remedy].join("|"),
    ),
  ].join("\n");
