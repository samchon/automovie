import type { IAutoMovieCurve64 } from "../../../../packages/engine/src/geometry/curve/IAutoMovieCurve64.ts";
import { evaluateAutoMovieCurve64 } from "../../../../packages/engine/src/geometry/curve/evaluateAutoMovieCurve64.ts";
import { tessellateAutoMovieCurveGrid64 } from "../../../../packages/engine/src/geometry/curve/tessellateAutoMovieCurveGrid64.ts";
import { fitCurve } from "../fit/fitCurve.ts";
import { faceTypes } from "./faceTypes.ts";

type Point = faceTypes.Point;
type Fit = ReturnType<typeof fitCurve>;

/**
 * Publish fitted observations as complete engine cubic contracts and invoke the engine tensor operator. This adapter performs schema and unit conversion only; the engine constructs every reconstructed vertex, face, geometric normal and generating isocurve. Legacy millimetre fields remain diagnostic serialization of that same engine result.
 *
 * @evidence contracts/common.md#principled-implementation Source polygon fits become exact P0/P1/P2/P3 cubic spans with their normalized widths; tessellateAutoMovieCurveGrid64 owns coefficient interpolation and new geometry.
 * @evidence contracts/common.md#clear-and-simple-design Fitting, engine generation and diagnostic unit conversion have separate owners; no surface evaluator remains in this adapter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source triangles, topology and normals are absent; complete fitted controls are not replaced by Catmull-Rom waypoints or a foreign mesh.
 * @evidence contracts/common.md#meaningful-documentation States coefficient authority, metre engine output, diagnostic serialization and unresolved dense-baseline limits.
 * @evidence contracts/performance.md#efficient-algorithms Fitting runs once per section; curve publication and legacy conversion scan fitted coefficients and generated buffers, while the engine owns bounded tessellation cost.
 * @evidence contracts/performance.md#reuse-equivalent-work The same engine result supplies mesh, construction and shared boundary diagnostics without a second surface calculation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only per-call fit, engine and serialization arrays survive in the returned artifact; no handles or cross-input cache are acquired.
 */
export function compileFaceFamily(
  family: faceTypes.Family,
  fitMm: number,
  resolutionMm: number,
): faceTypes.Result {
  if (!Number.isFinite(fitMm) || fitMm <= 0)
    throw new Error("Positive finite observation fitting tolerance required");
  if (
    family.periodic &&
    (!Number.isFinite(family.period) || family.period! <= 0)
  )
    throw new Error(
      "Periodic family requires an explicit finite complete period",
    );
  const fits: Fit[] = family.sections.map(
    (section: faceTypes.Section): Fit =>
      section.fitted ??
      fitCurve(
        section.points,
        fitMm,
        family.knots.map(
          (
            fraction: number,
            i: number,
          ): { semantic: string; fraction: number } => ({
            semantic: family.knotLabels[i] ?? `section-knot-${i}`,
            fraction,
          }),
        ),
        false,
      ),
  );
  if (
    fits.some(
      (fit: Fit): boolean =>
        fit.closed ||
        !fit.segments.length ||
        !Number.isFinite(fit.boundMm) ||
        fit.boundMm > fitMm + 1e-8 ||
        fit.segments[0].t0 !== 0 ||
        fit.segments.at(-1)!.t1 !== 1 ||
        fit.segments.some(
          (segment: Fit["segments"][number], i: number): boolean =>
            !(segment.t1 > segment.t0) ||
            (i > 0 && segment.t0 !== fit.segments[i - 1].t1),
        ),
    )
  )
    throw new Error(
      "Contiguous open section fits within the requested observation tolerance required",
    );
  const curves: IAutoMovieCurve64.Cubic[] = fits.map(
    (fit: Fit, i: number): IAutoMovieCurve64.Cubic => ({
      type: "cubicBezier",
      name: family.sections[i].id,
      closed: false,
      unit: "mm",
      phaseUnit: "normalized",
      phaseIntervals: fit.segments.map(
        (segment: Fit["segments"][number]): number => segment.t1 - segment.t0,
      ),
      spans: fit.segments.map(
        (segment: Fit["segments"][number]): IAutoMovieCurve64.Span => [
          segment.p0,
          segment.p1,
          segment.p2,
          segment.p3,
        ],
      ),
    }),
  );
  const engine: ReturnType<typeof tessellateAutoMovieCurveGrid64> =
    tessellateAutoMovieCurveGrid64({
      name: family.id,
      topologyDomain: `reference-candidate.${family.id}`,
      stations: family.sections.map(
        (section: faceTypes.Section): number => section.station,
      ),
      courses: curves,
      period: family.periodic ? family.period : undefined,
      resolutionMm,
      guides: family.knots,
      stationSamples: family.heldOutSections?.map(
        (section: faceTypes.Section): number => section.station,
      ),
      maxVertices: 2_000_000,
    });
  const unpack: (flat: number[], scale: number) => Point[] = (
    flat: number[],
    scale: number,
  ): Point[] =>
    Array.from(
      { length: flat.length / 3 },
      (_: unknown, i: number): Point => [
        flat[i * 3] * scale,
        flat[i * 3 + 1] * scale,
        flat[i * 3 + 2] * scale,
      ],
    );
  const mm: (points: Point[]) => Point[] = (points: Point[]): Point[] =>
    points.map((p: Point): Point => [p[0] * 1000, p[1] * 1000, p[2] * 1000]);
  const vertices: Point[] = unpack(engine.mesh.positions, 1000);
  const triangles: [number, number, number][] = unpack(engine.mesh.indices!, 1);
  const normals: Point[] = unpack(engine.mesh.normals!, 1);
  const b: typeof engine.boundaries = engine.boundaries;
  const heldOut: faceTypes.Result["qualification"]["heldOut"] = family
    .heldOutSections?.length
    ? {
        kind: "angular-station",
        sections: family.heldOutSections.length,
        samples: 0,
        maximumMm: 0,
        rmsMm: 0,
        scope: "retrospective-leave-section-out",
        independentOfFittedSections: false,
        untouchedIndependentValidation: false,
        populationIndependent: false,
      }
    : undefined;
  let heldOutSquares: number = 0;
  for (const section of family.heldOutSections ?? []) {
    const row: number = engine.parameters.station.indexOf(section.station);
    if (row < 0)
      throw new Error(
        "Reserved angular station was not evaluated by the engine",
      );
    const arcs: number[] = [0];
    for (let j: number = 1; j < section.points.length; j++)
      arcs.push(
        arcs[j - 1] +
          Math.hypot(
            ...section.points[j].map(
              (x: number, axis: number): number =>
                x - section.points[j - 1][axis],
            ),
          ),
      );
    for (let i: number = 0; i < engine.parameters.course.length; i++) {
      const target: number = engine.parameters.course[i] * arcs.at(-1)!;
      let j: number = 1;
      while (j < arcs.length - 1 && arcs[j] < target) j++;
      const width: number = arcs[j] - arcs[j - 1];
      const t: number = width > 0 ? (target - arcs[j - 1]) / width : 0;
      const observation: Point = section.points[j - 1].map(
        (x: number, axis: number): number =>
          x + (section.points[j][axis] - x) * t,
      ) as Point;
      const prediction: Point =
        vertices[row * engine.parameters.course.length + i];
      const error: number = Math.hypot(
        ...prediction.map(
          (x: number, axis: number): number => x - observation[axis],
        ),
      );
      heldOut!.samples++;
      heldOut!.maximumMm = Math.max(heldOut!.maximumMm, error);
      heldOutSquares += error * error;
    }
  }
  if (heldOut) heldOut.rmsMm = Math.sqrt(heldOutSquares / heldOut.samples);
  let maximumKnotResidualMm: number = 0;
  for (let i: number = 0; i < fits.length; i++) {
    // Fitter fractions are normalized. The evaluator's endpoint is the actual binary64 sum of its declared widths, which can differ from one by an ulp.
    const domain: number = curves[i].phaseIntervals.reduce(
      (sum: number, width: number): number => sum + width,
      0,
    );
    for (const pin of fits[i].featurePins) {
      const p: IAutoMovieCurve64.Vector = evaluateAutoMovieCurve64(
        curves[i],
        pin.fraction * domain,
      ).point;
      maximumKnotResidualMm = Math.max(
        maximumKnotResidualMm,
        Math.hypot(p[0] - pin.p[0], p[1] - pin.p[1], p[2] - pin.p[2]),
      );
    }
  }
  return {
    id: family.id,
    engine,
    curves,
    vertices,
    triangles,
    normals,
    construction: {
      points: [],
      lines: engine.construction.lines.map(
        (line: (typeof engine.construction.lines)[number]): faceTypes.Line => ({
          name: line.id,
          closed: line.closed,
          points: mm(line.points),
          color: line.id.includes(".guide.") ? "#a536ac" : "#14873c",
          cls: line.id.includes(".guide.")
            ? "actual-derived-guide"
            : "actual-generating-section",
        }),
      ),
    },
    boundaries: {
      start: mm(b.courseStart.positions),
      end: mm(b.courseEnd.positions),
      first: mm(b.stationFirst.positions),
      last: mm(b.stationLast.positions),
    },
    derivatives: {
      start: mm(b.courseStart.coursePartials),
      end: mm(b.courseEnd.coursePartials),
      first: mm(b.stationFirst.stationPartials),
      last: mm(b.stationLast.stationPartials),
    },
    qualification: {
      maxFitBoundMm: Math.max(...fits.map((fit: Fit): number => fit.boundMm)),
      maximumKnotResidualMm,
      c0CurveJoins: fits.reduce(
        (sum: number, fit: Fit): number =>
          sum +
          fit.joins.filter(
            (join: Fit["joins"][number]): boolean => join.continuity === "C0",
          ).length,
        0,
      ),
      minimumTriangleAreaMm2: engine.counts.minimumTriangleAreaMm2,
      zeroAreaCells: engine.counts.omittedZeroAreaTriangles,
      ...(heldOut ? { heldOut } : {}),
      method:
        "IAutoMovieCurve64.Cubic → engine exact common-span restrictions → coefficientwise PCHIP fields → Bernstein Hermite grids → engine-generated metre mesh and triangle-derived geometric normals.",
      limits: [
        ...family.limits,
        "Dense source-derived curve replay is a diagnostic baseline, not a compact anatomical equation or population model.",
        "Coefficientwise PCHIP preserves section controls and station C1 continuity, but does not establish cross-course G1 joins, injectivity, feature correspondence or a full-surface error bound.",
        "Requested physical tessellation spacing is not a certified approximation bound; narrow unrequested source features may be unresolved.",
        "Boundary derivatives belong to this same engine evaluator; neighboring chart assembly and exact common collar trim remain unqualified.",
        "Near-coincident common phase boundaries have produced exactly zero course partials despite nonzero original curve tangents. These derivative records are diagnostic and are not qualified assembly constraints.",
        ...(heldOut
          ? [
              "Reserved angular sections measure retrospective interpolation on previously inspected source identities and courses. Exclusion from this invocation does not establish untouched independent validation or population generalization.",
            ]
          : []),
        `Boundary convention: ${family.boundaryMeaning}`,
      ],
    },
  };
}
