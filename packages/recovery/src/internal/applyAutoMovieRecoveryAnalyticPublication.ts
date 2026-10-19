import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";
import type { realizeAutoMovieRecoveryTensorFamilies } from "./realizeAutoMovieRecoveryTensorFamilies";

/**
 * Bind a source-free coefficient extension to its exact original curve and graph bytes.
 * Named replacements are atomic across closed and open consumers. Original observation
 * reports stay immutable and explicitly describe the prior coefficient publication;
 * each replacement supplies its own numerical PL-data upper estimate. Neither record
 * establishes interior fidelity, material phase, regularity or original skin coverage.
 *
 * @evidence contracts/common.md#principled-implementation Exact input hashes, unique saved names and finite continuous cubic coefficients establish one replacement registry before any engine dispatch; no geometry is evaluated here.
 * @evidence contracts/common.md#clear-and-simple-design This pure admission owner maps the same curve registry into both saved closed and open banks and attaches separately owned analytic domains.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source topology, nearest matching, coefficient averaging or fallback mesh is accepted; invalid coefficient publications reject before geometry execution.
 * @evidence contracts/common.md#meaningful-documentation States original-report scope, immutable replacement, millimetres, exact hash binding and independent data and surface qualifications.
 * @evidence contracts/performance.md#efficient-algorithms Admission and replacement scan original named curves and replacement controls once; O(N+K) maps and copied row shells scale with the saved publication.
 * @evidence contracts/performance.md#reuse-equivalent-work One admitted replacement map supplies every occurrence and both downstream operators without fitting or repeated coefficient construction.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Input coefficients and geometry remain caller-owned immutable arrays. Row shells and the returned publication transfer to reconstruction; local maps expire on return.
 */
export function applyAutoMovieRecoveryAnalyticPublication(
  bundle: realizeAutoMovieRecoveryTensorFamilies.Input,
  publication: {
    schema: "automovie-recovery-analytic-publication-v1";
    sourceCommit: string;
    curveBundleSha256: string;
    continuationSha256: string;
    curveOverrides: readonly { curve: C.Cubic; dataUpperEstimateMm: number }[];
    analyticDomains: NonNullable<
      realizeAutoMovieRecoveryTensorFamilies.Input["analyticDomains"]
    >;
  },
  hashes: { curveBundleSha256: string; continuationSha256: string },
): realizeAutoMovieRecoveryTensorFamilies.Input {
  if (
    publication.schema !== "automovie-recovery-analytic-publication-v1" ||
    !/^[0-9a-f]{40,64}$/i.test(publication.sourceCommit) ||
    publication.curveBundleSha256 !== hashes.curveBundleSha256 ||
    publication.continuationSha256 !== hashes.continuationSha256 ||
    !Array.isArray(publication.curveOverrides) ||
    !Array.isArray(publication.analyticDomains) ||
    bundle.analyticDomains?.length ||
    bundle.coefficientPublication
  )
    throw new Error(
      "An unused analytic publication must bind both exact original inputs",
    );
  const originals: Map<string, C.Cubic> = new Map(),
    ambiguous: Set<string> = new Set();
  for (const section of bundle.loft.sections)
    for (const loop of section.loops) {
      if (originals.has(loop.curve.name)) ambiguous.add(loop.curve.name);
      originals.set(loop.curve.name, loop.curve);
    }
  for (const row of bundle.reports)
    for (const arc of row.open) {
      if (originals.has(arc.curve.name)) ambiguous.add(arc.curve.name);
      originals.set(arc.curve.name, arc.curve);
    }
  const curves: Map<string, C.Cubic> = new Map();
  for (const row of publication.curveOverrides) {
    const curve: C.Cubic = row.curve;
    if (
      !originals.has(curve.name) ||
      ambiguous.has(curve.name) ||
      curves.has(curve.name) ||
      curve.type !== "cubicBezier" ||
      curve.unit !== "mm" ||
      curve.phaseUnit !== "normalized" ||
      typeof curve.closed !== "boolean" ||
      curve.closed !== originals.get(curve.name)?.closed ||
      !Array.isArray(curve.spans) ||
      !curve.spans.length ||
      curve.phaseIntervals.length !== curve.spans.length ||
      !curve.phaseIntervals.every(
        (width: number): boolean => width > 0 && Number.isFinite(width),
      ) ||
      !Number.isFinite(row.dataUpperEstimateMm) ||
      row.dataUpperEstimateMm < 0 ||
      curve.spans.some(
        (net: C.Span): boolean =>
          net.length !== 4 ||
          net.some(
            (point: C.Vector): boolean =>
              point.length !== 3 || !point.every(Number.isFinite),
          ),
      )
    )
      throw new Error(
        "A named override requires unique finite millimetre cubics and its separate numerical data estimate",
      );
    for (let i: number = 0; i < curve.spans.length; i++)
      if (i > 0 || curve.closed) {
        const a: C.Vector =
            curve.spans[(i + curve.spans.length - 1) % curve.spans.length]![3],
          b: C.Vector = curve.spans[i]![0];
        if (a.some((x: number, axis: number): boolean => x !== b[axis]))
          throw new Error(
            "A named override must retain exact C0 endpoint authority",
          );
      }
    curves.set(curve.name, curve);
  }
  return {
    ...bundle,
    loft: {
      ...bundle.loft,
      sections: bundle.loft.sections.map(
        (
          section: realizeAutoMovieRecoveryTensorFamilies.Input["loft"]["sections"][number],
        ): realizeAutoMovieRecoveryTensorFamilies.Input["loft"]["sections"][number] => ({
          ...section,
          loops: section.loops.map(
            (
              loop: (typeof section.loops)[number],
            ): (typeof section.loops)[number] => ({
              ...loop,
              curve: curves.get(loop.curve.name) ?? loop.curve,
            }),
          ),
        }),
      ),
    },
    reports: bundle.reports.map(
      (
        row: realizeAutoMovieRecoveryTensorFamilies.Input["reports"][number],
      ): realizeAutoMovieRecoveryTensorFamilies.Input["reports"][number] => ({
        ...row,
        open: row.open.map(
          (arc: (typeof row.open)[number]): (typeof row.open)[number] => ({
            ...arc,
            curve: curves.get(arc.curve.name) ?? arc.curve,
          }),
        ),
      }),
    ),
    analyticDomains: publication.analyticDomains,
    coefficientPublication: {
      sourceCommit: publication.sourceCommit,
      originalReportsRetained: true,
      overrides: publication.curveOverrides.map(
        (
          row: (typeof publication.curveOverrides)[number],
        ): { curveName: string; dataUpperEstimateMm: number } => ({
          curveName: row.curve.name,
          dataUpperEstimateMm: row.dataUpperEstimateMm,
        }),
      ),
    },
    diagnostics: [
      ...bundle.diagnostics,
      "Original observation-fit reports are retained. Replaced named coefficients have separate numerical PL-data estimates in coefficientPublication; no source-interior, material-phase or embedding qualification follows.",
    ],
  };
}
