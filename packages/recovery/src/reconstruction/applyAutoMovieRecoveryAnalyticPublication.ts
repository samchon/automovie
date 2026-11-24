import type {
  AutoMovieCubicBezierControls3,
  AutoMovieVector3Tuple,
  IAutoMovieCubicBezierCurve64,
  IAutoMovieRecoveryAnalyticPublication,
  IAutoMovieRecoveryInputHashes,
  IAutoMovieRecoveryTensorFamiliesInput,
} from "@automovie/interface";

/**
 * Bind a source-free coefficient extension to its exact original curve and
 * graph bytes. Named replacements are atomic across closed and open consumers.
 * Original observation reports stay immutable and explicitly describe the prior
 * coefficient publication; each replacement supplies its own numerical PL-data
 * upper estimate. Neither record establishes interior fidelity, material phase,
 * regularity or original skin coverage.
 */
export function applyAutoMovieRecoveryAnalyticPublication(
  bundle: IAutoMovieRecoveryTensorFamiliesInput,
  publication: IAutoMovieRecoveryAnalyticPublication,
  hashes: IAutoMovieRecoveryInputHashes,
): IAutoMovieRecoveryTensorFamiliesInput {
  if (
    !/^[0-9a-f]{40,64}$/i.test(publication.sourceCommit) ||
    publication.curveBundleSha256 !== hashes.curveBundleSha256 ||
    publication.continuationSha256 !== hashes.continuationSha256 ||
    bundle.analyticDomains?.length ||
    bundle.coefficientPublication
  )
    throw new Error(
      "An unused analytic publication must bind both exact original inputs",
    );
  const originals: Map<string, IAutoMovieCubicBezierCurve64> = new Map(),
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
  const curves: Map<string, IAutoMovieCubicBezierCurve64> = new Map();
  for (const row of publication.curveOverrides) {
    const curve: IAutoMovieCubicBezierCurve64 = row.curve;
    if (
      !originals.has(curve.name) ||
      ambiguous.has(curve.name) ||
      curves.has(curve.name) ||
      curve.type !== "cubicBezier" ||
      curve.unit !== "mm" ||
      curve.phaseUnit !== "normalized" ||
      curve.closed !== originals.get(curve.name)?.closed ||
      !curve.spans.length ||
      curve.phaseIntervals.length !== curve.spans.length ||
      !curve.phaseIntervals.every((width: number): boolean => width > 0) ||
      row.dataUpperEstimateMm < 0 ||
      curve.spans.some(
        (net: AutoMovieCubicBezierControls3): boolean =>
          net.length !== 4 ||
          net.some(
            (point: Readonly<AutoMovieVector3Tuple>): boolean =>
              point.length !== 3,
          ),
      )
    )
      throw new Error(
        "A named override requires unique finite millimetre cubics and its separate numerical data estimate",
      );
    for (let i: number = 0; i < curve.spans.length; i++)
      if (i > 0 || curve.closed) {
        const a: Readonly<AutoMovieVector3Tuple> =
            curve.spans[(i + curve.spans.length - 1) % curve.spans.length]![3],
          b: Readonly<AutoMovieVector3Tuple> = curve.spans[i]![0];
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
          section: IAutoMovieRecoveryTensorFamiliesInput["loft"]["sections"][number],
        ): IAutoMovieRecoveryTensorFamiliesInput["loft"]["sections"][number] => ({
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
        row: IAutoMovieRecoveryTensorFamiliesInput["reports"][number],
      ): IAutoMovieRecoveryTensorFamiliesInput["reports"][number] => ({
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
