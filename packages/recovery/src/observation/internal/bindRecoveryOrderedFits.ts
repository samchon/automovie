import type {
  IAutoMovieCubicBezierCurve64,
  IAutoMovieMeshPlaneIntersection,
  IAutoMovieMeshSectionOrientation,
  IAutoMoviePlaneFrameConstruction,
  IAutoMoviePolylineFit,
  IAutoMovieRecoveryHermiteCurve,
  IAutoMovieRecoveryMeshIncidencePreparationOperation,
  IAutoMovieRecoveryOrderedContour,
  IAutoMovieRecoveryOrderedCuts,
  IAutoMovieRecoveryOrderedLineage,
  IAutoMovieRecoverySavedCurveBinding,
  IAutoMovieRecoverySectionObservationOperation,
} from "@automovie/interface";

import { convertAutoMovieRecoveryCurve } from "../../curves/internal/convertAutoMovieRecoveryCurve";
import { planeFrame } from "../../geometry/internal/planeFrame";
import { sourceOrientation } from "../../geometry/internal/sourceOrientation";
import { observeRecoverySection } from "../../geometry/internal/observeRecoverySection";
import { prepareRecoveryMeshIncidence } from "../../geometry/internal/prepareRecoveryMeshIncidence";

/*
 * Recover a new pointwise correspondence for explicitly requested saved cubics.
 * The caller byte-verifies cuts, target publications and their actual policies.
 * The original section fitter replays each target once; conversion to the saved
 * cubic basis must reproduce its JSON numeric geometry and physical h exactly.
 * A per-target failure retains completed milestones and any obtained replay
 * quality, but returns unavailable without samples or replacement coefficients.
 * Source/physical-frame admission failures throw before targets. Historical
 * accepted parameters, independent control effects and surface transverse jets
 * are not qualified. This synchronous call has no cancellation hook or
 * aggregate byte budget beyond the caller's finite targets/fit budgets.
 */
export function bindRecoveryOrderedFits(
  input: IAutoMovieRecoveryOrderedLineage.Input,
  cuts: IAutoMovieRecoveryOrderedCuts,
  targets: readonly IAutoMovieRecoveryOrderedLineage.Target[],
): IAutoMovieRecoverySavedCurveBinding[] {
  if (
    cuts.sourceIdentity !== input.sourceIdentity ||
    cuts.sourceSelectionIdentity !== input.sourceSelectionIdentity
  )
    throw new Error("Ordered cut artifact belongs to another source selection");
  const prepared: ReturnType<IAutoMovieRecoveryMeshIncidencePreparationOperation.Operation> =
    prepareRecoveryMeshIncidence(input, input.verticesMm);
  const frame: ReturnType<IAutoMoviePlaneFrameConstruction.Operation> =
    planeFrame([0, 0, 0], input.axis, input.reference);
  if (
    JSON.stringify(cuts.frame) !==
    JSON.stringify({
      originMm: frame.origin,
      n: frame.n,
      u: frame.u,
      v: frame.v,
    })
  )
    throw new Error("Ordered cut artifact has a different physical frame");
  const orientations: Map<
    1 | -1,
    ReturnType<IAutoMovieMeshSectionOrientation.Operation>
  > = new Map();
  const seen: Set<string> = new Set();
  return targets.map(
    (
      target: IAutoMovieRecoveryOrderedLineage.Target,
    ): IAutoMovieRecoverySavedCurveBinding => {
      const base: Pick<
        IAutoMovieRecoverySavedCurveBinding,
        "coordinateMm" | "contourIndex" | "observationIdentity"
      > = {
        coordinateMm: target.coordinateMm,
        contourIndex: target.contourIndex,
        observationIdentity: target.observationIdentity,
      };
      const completedStages: NonNullable<
        IAutoMovieRecoverySavedCurveBinding["completedStages"]
      > = [];
      let replayFitQualification:
        | Omit<IAutoMoviePolylineFit, "curve">
        | undefined;
      try {
        const key: string = JSON.stringify([
          target.coordinateMm,
          target.contourIndex,
        ]);
        if (seen.has(key)) throw new Error("Repeated saved-fit target");
        seen.add(key);
        const section:
          | IAutoMovieRecoveryOrderedCuts["sections"][number]
          | undefined = cuts.sections.find(
          (s: IAutoMovieRecoveryOrderedCuts["sections"][number]): boolean =>
            s.coordinateMm === target.coordinateMm &&
            s.observationIdentity === target.observationIdentity,
        );
        const raw: IAutoMovieRecoveryOrderedContour | undefined =
          section?.contours.find(
            (c: IAutoMovieRecoveryOrderedContour): boolean =>
              c.contourIndex === target.contourIndex,
          );
        if (!raw || raw.points.length < (raw.closed ? 3 : 2))
          throw new Error(
            "Saved-fit target has no qualified nondegenerate raw contour",
          );
        const savedSection:
          | IAutoMovieRecoveryOrderedLineage.Input["savedSections"][number]
          | undefined = input.savedSections.find(
          (
            s: IAutoMovieRecoveryOrderedLineage.Input["savedSections"][number],
          ): boolean =>
            s.coordinateMm === target.coordinateMm &&
            s.observationIdentity === target.observationIdentity,
        );
        const publication:
          | NonNullable<
              typeof savedSection
            >["sourceLineage"][number]["publication"]
          | undefined = savedSection?.sourceLineage.find(
          (
            r: NonNullable<typeof savedSection>["sourceLineage"][number],
          ): boolean => r.contourIndex === target.contourIndex,
        )?.publication;
        if (
          !publication ||
          (publication.kind !== "closed" && publication.kind !== "open") ||
          publication.curveName !== target.curve.name ||
          (publication.kind === "closed") !== target.curve.closed
        )
          throw new Error(
            "Saved coefficient target is not its committed raw publication",
          );
        if (
          !(
            target.policy.toleranceMm > 0 &&
            target.policy.cornerDegrees > 0 &&
            target.policy.cornerDegrees < 180 &&
            target.policy.maxSpans > 0 &&
            [1, -1].includes(target.policy.sourceOrientationSign)
          )
        )
          throw new Error("Saved-fit policy is invalid");
        const sign: 1 | -1 = target.policy.sourceOrientationSign;
        if (!orientations.has(sign))
          orientations.set(sign, sourceOrientation(prepared.mesh, sign));

        /*
         * Current section callback record, not evidence of historical
         * parameters.
         */
        type Trace = Parameters<
          NonNullable<
            Parameters<IAutoMovieRecoverySectionObservationOperation.Operation>[0]["onAcceptedFit"]
          >
        >[0];
        const traces: Trace[] = [];
        const plane: ReturnType<IAutoMoviePlaneFrameConstruction.Operation> = {
          ...frame,
          origin: [
            frame.n[0] * target.coordinateMm,
            frame.n[1] * target.coordinateMm,
            frame.n[2] * target.coordinateMm,
          ],
        };
        // The private fitter borrows mutable tuples; own these copies without changing source metadata or casting away readonly.
        const points: IAutoMovieMeshPlaneIntersection[] = raw.points.map(
          (
            p: IAutoMovieRecoveryOrderedContour["points"][number],
          ): IAutoMovieMeshPlaneIntersection => ({
            p: [p.p[0], p.p[1], p.p[2]],
            a: p.a,
            b: p.b,
            t: p.t,
          }),
        );
        const observed: ReturnType<IAutoMovieRecoverySectionObservationOperation.Operation> =
          observeRecoverySection({
            coordinateMm: target.coordinateMm,
            plane,
            contours: [{ closed: raw.closed, pts: points }],
            faceEdges: prepared.faceEdges,
            vertexFaces: prepared.vertexFaces,
            orientation: orientations.get(sign)!,
            policy: target.policy,
            name: "saved-fit-trace",
            onAcceptedFit: (trace: Trace): void => {
              traces.push(trace);
            },
          });
        const fitted: IAutoMovieCubicBezierCurve64 | undefined =
          observed.section.loops[0]?.curve ?? observed.report.open[0]?.curve;
        if (fitted !== undefined) {
          const openFit: (typeof observed.report.open)[number] | undefined =
            observed.report.open[0];
          if (
            observed.section.loops[0] === undefined &&
            openFit !== undefined
          ) {
            const { curve: _curve, ...quality }: IAutoMoviePolylineFit =
              openFit;
            replayFitQualification = quality;
          } else replayFitQualification = observed.report.fits[0];
          completedStages.push("replay-fit");
        }
        if (!fitted || traces.length !== 1)
          throw new Error(
            observed.report.diagnostics.join("; ") ||
              "Replay did not emit one accepted trace",
          );
        const converted:
          | IAutoMovieCubicBezierCurve64
          | IAutoMovieRecoveryHermiteCurve = convertAutoMovieRecoveryCurve(
          fitted,
          target.curve.type === "cubicHermite" ? "hermite" : "bezier",
        );
        if (geometry(converted) !== geometry(target.curve))
          throw new Error(
            "Replay coefficients, basis, degree or physical h differ from the saved curve; no phase map emitted",
          );
        completedStages.push("saved-geometry-equality");
        const trace: Trace = traces[0]!;
        if (
          trace.spans.length !== target.curve.spans.length ||
          trace.spans.some(
            (s: Trace["spans"][number], i: number): boolean => s.span !== i,
          )
        )
          throw new Error(
            "Accepted trace does not cover every saved span in order",
          );
        const starts: number[] = [0];
        for (const h of target.curve.phaseIntervals)
          starts.push(starts.at(-1)! + h);
        const samples: NonNullable<
          IAutoMovieRecoverySavedCurveBinding["samples"]
        > = [];
        for (const span of trace.spans) {
          if (
            span.parameters.length !== span.last - span.first + 1 ||
            span.parameters.some(
              (v: number, i: number): boolean =>
                v < 0 || v > 1 || (i > 0 && !(v > span.parameters[i - 1]!)),
            )
          )
            throw new Error(
              "Accepted trace has no strict pointwise parameter map",
            );
          for (let i: number = span.first; i <= span.last; i++) {
            const orderedIndex: number = i % raw.points.length;
            const rawPointIndex: number = trace.reversed
              ? raw.points.length - 1 - orderedIndex
              : orderedIndex;
            const parameter: number = span.parameters[i - span.first]!;
            samples.push({
              rawPointIndex,
              spanIndex: span.span,
              localParameter: parameter,
              fittedPhaseMm:
                starts[span.span]! +
                target.curve.phaseIntervals[span.span]! * parameter,
            });
          }
        }
        completedStages.push("accepted-sample-map");
        const hermite: IAutoMovieRecoveryHermiteCurve =
          convertAutoMovieRecoveryCurve(target.curve, "hermite");
        const endpointJets: NonNullable<
          IAutoMovieRecoverySavedCurveBinding["endpointJets"]
        > = hermite.spans.map(
          (
            s: (typeof hermite.spans)[number],
            spanIndex: number,
          ): NonNullable<
            IAutoMovieRecoverySavedCurveBinding["endpointJets"]
          >[number] => ({
            spanIndex,
            widthMm: hermite.phaseIntervals[spanIndex]!,
            start: [...s.start],
            end: [...s.end],
            startDerivative: [...s.startDerivative],
            endDerivative: [...s.endDerivative],
          }),
        );
        completedStages.push("saved-endpoint-jets");
        return {
          ...base,
          status: "bound-exact-saved-cubic",
          diagnostic:
            "New accepted correspondence for an exact saved JSON numeric cubic replay; historical accepted parameters were not saved or independently verified. Original and replay fit errors remain separate; transverse surface jets remain unsupported",
          completedStages: [...completedStages],
          replayFitQualification,
          historicalAcceptedTraceVerified: false,
          reversed: trace.reversed,
          samples,
          endpointJets,
        };
      } catch (failure: unknown) {
        return {
          ...base,
          status: "unavailable",
          diagnostic:
            failure instanceof Error ? failure.message : String(failure),
          completedStages: [...completedStages],
          ...(replayFitQualification === undefined
            ? {}
            : { replayFitQualification }),
          ...(completedStages.includes("replay-fit")
            ? { historicalAcceptedTraceVerified: false as const }
            : {}),
        };
      }
    },
  );
}

/*
 * Serialize the numeric cubic geometry compared by saved-fit binding. Names are
 * checked against publication before this helper and are excluded here; type,
 * units, closure, actual physical widths and every span remain. JSON equality
 * treats signed zero alike and is not binary-buffer equality.
 */
function geometry(
  curve: IAutoMovieCubicBezierCurve64 | IAutoMovieRecoveryHermiteCurve,
): string {
  return JSON.stringify({
    type: curve.type,
    closed: curve.closed,
    unit: curve.unit,
    phaseUnit: curve.phaseUnit,
    phaseIntervals: curve.phaseIntervals,
    spans: curve.spans,
  });
}
