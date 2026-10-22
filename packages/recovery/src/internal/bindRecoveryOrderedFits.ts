import type { IAutoMovieCurve64 as C } from "@automovie/engine/geometry/curve";

import { convertAutoMovieRecoveryCurves } from "../curves/convertAutoMovieRecoveryCurves";
import type { AutoMovieRecoveryOrderedLineage } from "../observation/AutoMovieRecoveryOrderedLineage";
import type { IAutoMovieRecoveryHermiteCurve } from "../structures/curve/IAutoMovieRecoveryHermiteCurve";
import type { CutPoint } from "./mesh-observations/CutPoint";
import { planeFrame } from "./mesh-observations/planeFrame";
import { sourceOrientation } from "./mesh-observations/sourceOrientation";
import { observeRecoverySection } from "./observeRecoverySection";
import { prepareRecoveryMeshIncidence } from "./prepareRecoveryMeshIncidence";

/** Recover a new pointwise correspondence for explicitly requested saved cubics.
 * The caller byte-verifies cuts, target publications and their actual policies.
 * The original section fitter replays each target once; conversion to the saved
 * cubic basis must reproduce its JSON numeric geometry and physical h exactly.
 * A per-target failure retains completed milestones and any obtained replay
 * quality, but returns unavailable without samples or replacement coefficients.
 * Source/physical-frame admission failures throw before targets.
 * Historical accepted parameters, independent control effects and surface
 * transverse jets are not qualified. This synchronous call has no cancellation
 * hook or aggregate byte budget beyond the caller's finite targets/fit budgets.
 *
 * @evidence contracts/common.md#principled-implementation The saved raw publication and immutable original fit policy define the established section-fitter problem; its accepted-parameter observer supplies new sample parameters. Exact type/unit/closure/h/span JSON numeric equality gates the map, then reversal maps indices back to raw order. This is a new replay registration, not proof of historical accepted parameters, exact source-surface fit, high-degree/rational conversion or bitwise signed-zero identity.
 * @evidence contracts/common.md#clear-and-simple-design Cut admission is consumed as a separate committed input without recutting; one target loop owns lookup, existing fitter replay, same-basis comparison and unavailable outcomes. Original and replay fit qualities remain separate; already obtained replay quality and completed milestones survive later rejection, while unavailable maps and replacement coefficients never escape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No nearest-point/root matcher, relaxed policy, person table, averaged knot tangent, source mesh/normal fallback or replacement fit is emitted. Duplicate targets and coefficient mismatches remain unavailable; source-wide identity/frame mismatch refuses the call.
 * @evidence contracts/common.md#meaningful-documentation AutoMovieRecoveryOrderedLineage.Target and AutoMovieRecoveryOrderedLineage.Binding members document physical h, reversal, original one-sided curve derivatives, optional failure fields and caller policy provenance; the function documents the distinction between admission throws, per-target unavailable and unverified historical/surface claims.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices, T faces, K saved planes, C contours per target plane, N targets, P target samples and S fitted spans, each call prepares O(V+T) incidence and at most two O(T) orientation closures. Repeated find operations cost O(N(K+C)); selected fits retain the existing balanced O(P log S), worst O(P squared) fitter cost. Per-target point copying, conversion, JSON comparison, sample mapping and endpoint copying add O(P+S); no cut or unselected curve fit runs.
 * @evidence contracts/performance.md#reuse-equivalent-work Immutable ordered cuts are reused for every target, incidence is prepared once, and material orientations are reused per actual sign. Duplicate raw addresses are rejected, while differing targets keep their own policies and saved coefficients; no effectful replay is shared across calls or accepted from a matching string alone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Preparation/orientation maps live for this synchronous call; each target owns temporary copied points, accepted trace and replay/converted spans, which expire after its outcome. Returned maps and saved endpoint jets grow with target samples/spans and transfer to the caller; no aggregate byte ceiling, host handle, task, listener or global cache is added. Per-target errors retain diagnostics, completed milestones and obtained scalar replay-quality metadata but no maps or replacement coefficients; an admission throw releases call-local references.
 */
export function bindRecoveryOrderedFits(
  input: AutoMovieRecoveryOrderedLineage.Input,
  cuts: AutoMovieRecoveryOrderedLineage.Cuts,
  targets: readonly AutoMovieRecoveryOrderedLineage.Target[],
): AutoMovieRecoveryOrderedLineage.Binding[] {
  if (
    cuts.sourceIdentity !== input.sourceIdentity ||
    cuts.sourceSelectionIdentity !== input.sourceSelectionIdentity
  )
    throw new Error("Ordered cut artifact belongs to another source selection");
  const prepared: ReturnType<typeof prepareRecoveryMeshIncidence> =
    prepareRecoveryMeshIncidence(input, input.verticesMm);
  const frame: ReturnType<typeof planeFrame> = planeFrame(
    [0, 0, 0],
    input.axis,
    input.reference,
  );
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
    ReturnType<typeof sourceOrientation>
  > = new Map();
  const seen: Set<string> = new Set();
  return targets.map(
    (
      target: AutoMovieRecoveryOrderedLineage.Target,
    ): AutoMovieRecoveryOrderedLineage.Binding => {
      const base: Pick<
        AutoMovieRecoveryOrderedLineage.Binding,
        "coordinateMm" | "contourIndex" | "observationIdentity"
      > = {
        coordinateMm: target.coordinateMm,
        contourIndex: target.contourIndex,
        observationIdentity: target.observationIdentity,
      };
      const completedStages: NonNullable<
        AutoMovieRecoveryOrderedLineage.Binding["completedStages"]
      > = [];
      let replayFitQualification: unknown;
      try {
        const key: string = JSON.stringify([
          target.coordinateMm,
          target.contourIndex,
        ]);
        if (seen.has(key)) throw new Error("Repeated saved-fit target");
        seen.add(key);
        const section:
          | AutoMovieRecoveryOrderedLineage.Cuts["sections"][number]
          | undefined = cuts.sections.find(
          (
            s: AutoMovieRecoveryOrderedLineage.Cuts["sections"][number],
          ): boolean =>
            s.coordinateMm === target.coordinateMm &&
            s.observationIdentity === target.observationIdentity,
        );
        const raw: AutoMovieRecoveryOrderedLineage.Contour | undefined =
          section?.contours.find(
            (c: AutoMovieRecoveryOrderedLineage.Contour): boolean =>
              c.contourIndex === target.contourIndex,
          );
        if (!raw || raw.points.length < (raw.closed ? 3 : 2))
          throw new Error(
            "Saved-fit target has no qualified nondegenerate raw contour",
          );
        const savedSection:
          | AutoMovieRecoveryOrderedLineage.Input["savedSections"][number]
          | undefined = input.savedSections.find(
          (
            s: AutoMovieRecoveryOrderedLineage.Input["savedSections"][number],
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
            Number.isFinite(target.policy.toleranceMm) &&
            target.policy.cornerDegrees > 0 &&
            target.policy.cornerDegrees < 180 &&
            Number.isSafeInteger(target.policy.maxSpans) &&
            target.policy.maxSpans > 0 &&
            [1, -1].includes(target.policy.sourceOrientationSign)
          )
        )
          throw new Error("Saved-fit policy is invalid");
        const sign: 1 | -1 = target.policy.sourceOrientationSign;
        if (!orientations.has(sign))
          orientations.set(sign, sourceOrientation(prepared.mesh, sign));
        /** Current section callback record, not evidence of historical parameters.
         *
         */
        type Trace = Parameters<
          NonNullable<
            Parameters<typeof observeRecoverySection>[0]["onAcceptedFit"]
          >
        >[0];
        const traces: Trace[] = [];
        const plane: ReturnType<typeof planeFrame> = {
          ...frame,
          origin: [
            frame.n[0] * target.coordinateMm,
            frame.n[1] * target.coordinateMm,
            frame.n[2] * target.coordinateMm,
          ],
        };
        // The private fitter borrows mutable tuples; own these copies without changing source metadata or casting away readonly.
        const points: CutPoint[] = raw.points.map(
          (
            p: AutoMovieRecoveryOrderedLineage.Contour["points"][number],
          ): CutPoint => ({
            p: [p.p[0], p.p[1], p.p[2]],
            a: p.a,
            b: p.b,
            t: p.t,
          }),
        );
        const observed: ReturnType<typeof observeRecoverySection> =
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
        const fitted: C.Cubic | undefined =
          observed.section.loops[0]?.curve ?? observed.report.open[0]?.curve;
        if (fitted !== undefined) {
          const openFit: (typeof observed.report.open)[number] | undefined =
            observed.report.open[0];
          replayFitQualification =
            observed.section.loops[0] === undefined && openFit !== undefined
              ? Object.fromEntries(
                  Object.entries(openFit).filter(
                    ([key]: [string, unknown]): boolean => key !== "curve",
                  ),
                )
              : observed.report.fits[0];
          completedStages.push("replay-fit");
        }
        if (!fitted || traces.length !== 1)
          throw new Error(
            observed.report.diagnostics.join("; ") ||
              "Replay did not emit one accepted trace",
          );
        const converted: C.Cubic | IAutoMovieRecoveryHermiteCurve =
          convertAutoMovieRecoveryCurves(
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
          AutoMovieRecoveryOrderedLineage.Binding["samples"]
        > = [];
        for (const span of trace.spans) {
          if (
            span.parameters.length !== span.last - span.first + 1 ||
            span.parameters.some(
              (v: number, i: number): boolean =>
                !Number.isFinite(v) ||
                v < 0 ||
                v > 1 ||
                (i > 0 && !(v > span.parameters[i - 1]!)),
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
          convertAutoMovieRecoveryCurves(target.curve, "hermite");
        const endpointJets: NonNullable<
          AutoMovieRecoveryOrderedLineage.Binding["endpointJets"]
        > = hermite.spans.map(
          (
            s: (typeof hermite.spans)[number],
            spanIndex: number,
          ): NonNullable<
            AutoMovieRecoveryOrderedLineage.Binding["endpointJets"]
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

/** Serialize the numeric cubic geometry compared by saved-fit binding.
 * Names are checked against publication before this helper and are excluded
 * here; type, units, closure, actual physical widths and every span remain.
 * JSON equality treats signed zero alike and is not binary-buffer equality.
 *
 */
function geometry(curve: C.Cubic | IAutoMovieRecoveryHermiteCurve): string {
  return JSON.stringify({
    type: curve.type,
    closed: curve.closed,
    unit: curve.unit,
    phaseUnit: curve.phaseUnit,
    phaseIntervals: curve.phaseIntervals,
    spans: curve.spans,
  });
}
