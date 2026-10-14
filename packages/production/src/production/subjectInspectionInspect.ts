import type { IAutoMovieProductionServices } from "./IAutoMovieProductionServices";
import { foldAutoMovieSubjectReviewCoverage } from "@automovie/engine";
import { AutoMovieDiagnosticCode, IAutoMovieCaptureRuntimeIdentity, IAutoMovieSubjectReviewCoverage, IAutoMovieSubjectReviewObservation, IAutoMovieSubjectReviewPose, IAutoMovieSubjectReviewTarget, IAutoMovieSubjectReviewViewpoint, type IAutoMovieGeneratedManifest, type IAutoMovieBuildProjectOutput, type IAutoMovieProductionDesign } from "@automovie/interface";

import type { PNG } from "pngjs";
import { canonicalAutoMovieCaptureRuntimeIdentity } from "./canonicalAutoMovieCaptureRuntimeIdentity";
import { digestAutoMovieBytes, encodeAutoMoviePathSegment } from "./contentIdentity";
import { residentPngJs } from "./residentCodecs";
import { oracleServiceHasVisiblePixelVariance } from "./oracleServiceHasVisiblePixelVariance";
import { AUTOMOVIE_SUBJECT_INSPECTION_PLAN_FILE } from "./AUTOMOVIE_SUBJECT_INSPECTION_PLAN_FILE";
import { IAutoMovieSubjectInspectionPlanRecord } from "./IAutoMovieSubjectInspectionPlanRecord";
import { IAutoMovieSubjectInspectionObservationRecord } from "./IAutoMovieSubjectInspectionObservationRecord";
import { subjectInspectionINSPECTION_FOV_DEG } from "./subjectInspectionINSPECTION_FOV_DEG";
import { subjectInspectionDEFAULT_DISTANCE_FACTOR } from "./subjectInspectionDEFAULT_DISTANCE_FACTOR";
import { subjectInspectionDEFAULT_AZIMUTH_COUNT } from "./subjectInspectionDEFAULT_AZIMUTH_COUNT";
import { subjectInspectionDEFAULT_ELEVATIONS_DEG } from "./subjectInspectionDEFAULT_ELEVATIONS_DEG";
import { AutoMovieProductionSubjectInspection } from "./AutoMovieProductionSubjectInspection";
import { IAutoMovieSubjectInspectionAttemptRecord } from "./IAutoMovieSubjectInspectionAttemptRecord";
import { IAutoMovieSubjectInspectionView } from "./IAutoMovieSubjectInspectionView";
import { IAutoMovieInspectSubject } from "./IAutoMovieInspectSubject";
import { autoMovieSubjectInspectionPlan } from "./autoMovieSubjectInspectionPlan";
import { autoMovieSubjectInspectionElevations } from "./autoMovieSubjectInspectionElevations";
import { autoMovieSubjectInspectionPose } from "./autoMovieSubjectInspectionPose";
import { autoMovieSubjectInspectionPlanIdentity } from "./autoMovieSubjectInspectionPlanIdentity";
import { subjectInspectionIResolvedInspectionSubject } from "./subjectInspectionIResolvedInspectionSubject";
import { subjectInspectionResolveSubject } from "./subjectInspectionResolveSubject";
import { subjectInspectionIInspectionFrame } from "./subjectInspectionIInspectionFrame";
import { subjectInspectionInspectionFrame } from "./subjectInspectionInspectionFrame";
import { inspectionDirectory } from "./inspectionDirectory";
import { subjectInspectionPublishedInspectionPlanMatches } from "./subjectInspectionPublishedInspectionPlanMatches";
import { subjectInspectionBeginInspectionAttempt } from "./subjectInspectionBeginInspectionAttempt";
import { subjectInspectionRecordInspectionObservation } from "./subjectInspectionRecordInspectionObservation";
import { subjectInspectionFinishInspectionAttempt } from "./subjectInspectionFinishInspectionAttempt";
import { subjectInspectionPublishInspectionFile } from "./subjectInspectionPublishInspectionFile";
import { errorMessage as subjectInspectionInspectionErrorMessage } from "./designDerivation/errorMessage";
import { subjectInspectionRefuse } from "./subjectInspectionRefuse";

/**
 * Run one optional host's current subject sweep and retain its plan, per-view records and terminal history.
 *
 * @evidence contracts/common.md#principled-implementation Initial compile/status/target admission precedes plan publication, sequential host draws, PNG/context checks, per-view publication and final manifest/plan/runtime checks.
 * @evidence contracts/common.md#clear-and-simple-design The façade supplies a late adapter reader and original receiver; plan arithmetic, guarded reopen and lock-backed publication have separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No repository product host currently calls this service; opaque pixels/runtime callbacks are not visual proof, final source-status is not reread, and publication can leave an unjournalled failed row on disk.
 * @evidence contracts/common.md#meaningful-documentation Failed/unsupported/runtime-unidentified sweeps preserve admitted prefixes; only whole completion sets inspected true and all outputs retain false delivery lane.
 * @evidence contracts/performance.md#efficient-algorithms Includes initial status/shot/plan work, V sequential capture/decode/publications and repeated whole-journal read/write per row, plus final plan/runtime/hash and coverage work.
 * @evidence contracts/performance.md#reuse-equivalent-work One parsed subject and ordered plan/poses serve the sweep, but journal bytes are rewritten repeatedly and no images or host results are cached across attempts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The Promise retains services/adapter and accumulated views; per-file locks release individually, host disposal is external, and histories/artifacts have no eviction bound or whole-sweep rollback.
 */
export async function subjectInspectionInspect(
  receiver: object,
  readAdapter: () => AutoMovieProductionSubjectInspection | undefined,
  services: IAutoMovieProductionServices,
  input: IAutoMovieInspectSubject.IProps
): Promise<IAutoMovieInspectSubject> {
    const target: IAutoMovieSubjectReviewTarget = {
      shot: input.shot,
      subject: input.subject,
    };
    const refuse: (code: AutoMovieDiagnosticCode, message: string, partial?: Partial<IAutoMovieInspectSubject>) => IAutoMovieInspectSubject = (code: AutoMovieDiagnosticCode, message: string, partial?: Partial<IAutoMovieInspectSubject>): IAutoMovieInspectSubject => subjectInspectionRefuse(services, input, target, code, message, partial);
    if (readAdapter() === undefined)
      return refuse(
        "capture-host-unavailable",
        "This project supplies no subject inspection instrument, and the current scaffold supplies no adapter for this service. Pass an AutoMovieProductionSubjectInspection to the call that reached here and retry. AutoMovie will not fabricate an observation it did not draw.",
      );
    const generated: IAutoMovieGeneratedManifest | null = services.project.generatedManifest();
    if (generated === null)
      return refuse(
        "compile-missing",
        "Subject inspection requires a current source compile. Build the current source through the production builder before opening a subject.",
      );
    const status: IAutoMovieBuildProjectOutput = services.buildStatus();
    if (status.builder.inputFingerprint !== generated.inputFingerprint)
      return refuse(
        "generated-stale",
        `Generated input ${generated.inputFingerprint} differs from current ${status.builder.inputFingerprint}. Build the current source through the production builder before opening a subject.`,
      );
    if (status.success === false)
      return refuse(
        "compile-current-invalid",
        "Current source does not pass the read-only builder gate, so a subject read from it would describe a state nothing renders. Correct it and build the current source through the production builder.",
      );
    const production: IAutoMovieProductionDesign | null = services.project.graph().production;
    if (production === null)
      return refuse(
        "compile-missing",
        "Subject inspection requires a current production frame format. Create the tracked production design record and build the current source through the production builder.",
      );
    const width: number = input.width ?? production.frameFormat.width;
    const height: number = input.height ?? production.frameFormat.height;
    if (
      Number.isInteger(width) === false ||
      Number.isInteger(height) === false ||
      width <= 0 ||
      height <= 0 ||
      width > production.frameFormat.width ||
      height > production.frameFormat.height
    )
      return refuse(
        "preview-input-invalid",
        `Inspection dimensions must be positive integers no larger than the validated ${production.frameFormat.width}x${production.frameFormat.height} production frame. Correct inspectSubject input.`,
      );
    const resolved: subjectInspectionIResolvedInspectionSubject | null = subjectInspectionResolveSubject(services, target);
    if (resolved === null)
      return refuse(
        "capture-target-missing",
        `Subject "${input.subject}" is absent from current compiled artifact "${input.shot}". Correct the subject id or compile its source, then retry. Inspect the same artifact to list the ids it actually owns.`,
      );
    const frame: subjectInspectionIInspectionFrame | null = subjectInspectionInspectionFrame(resolved.description);
    if (frame === null)
      return refuse(
        "review-subject-viewpoint-unsupported",
        `Compiled subject "${input.subject}" has no measured extent this surface can frame, so no inspection-owned viewpoint can be derived for it. Report its viewpoint range as unsupported rather than as observed.`,
        { revision: resolved.revision, subject: resolved.description },
      );
    let plan: IAutoMovieSubjectReviewViewpoint[];
    try {
      const rule: Parameters<typeof autoMovieSubjectInspectionPlan>[0] = {
        bounds: frame.bounds,
        azimuthCount: input.azimuthCount ?? subjectInspectionDEFAULT_AZIMUTH_COUNT,
        elevationsDeg: input.elevationsDeg ?? subjectInspectionDEFAULT_ELEVATIONS_DEG,
        distanceFactor: input.distanceFactor ?? subjectInspectionDEFAULT_DISTANCE_FACTOR,
        fovDeg: subjectInspectionINSPECTION_FOV_DEG,
        aspect: width / height,
      };
      // The distance is asked of the plan rather than recomputed, so the one
      // rule that decides where the eye stands stays in one place and the
      // bit-for-bit agreement with the viewer harness survives this correction.
      const asked: IAutoMovieSubjectReviewViewpoint[] = autoMovieSubjectInspectionPlan(rule);
      const grounded: number[] = autoMovieSubjectInspectionElevations({
        bounds: frame.bounds,
        elevationsDeg: rule.elevationsDeg,
        distance: asked[0]!.distance,
      });
      plan =
        grounded.length === rule.elevationsDeg.length &&
        grounded.every(
          (degrees: number, index: number) : boolean => degrees === rule.elevationsDeg[index],
        )
          ? asked
          : autoMovieSubjectInspectionPlan({
              ...rule,
              elevationsDeg: grounded,
            });
    } catch (error) {
      return refuse(
        "preview-input-invalid",
        `${subjectInspectionInspectionErrorMessage(error)} Correct the inspectSubject viewpoint rule.`,
        { revision: resolved.revision, subject: resolved.description },
      );
    }
    const poses: IAutoMovieSubjectReviewPose[] = plan.map((viewpoint: IAutoMovieSubjectReviewViewpoint) : IAutoMovieSubjectReviewPose =>
      autoMovieSubjectInspectionPose({
        bounds: frame.bounds,
        coordinateSpace: frame.coordinateSpace,
        viewpoint,
        fovDeg: subjectInspectionINSPECTION_FOV_DEG,
        aspect: width / height,
      }),
    );
    const planRecordWithoutIdentity: Omit<IAutoMovieSubjectInspectionPlanRecord, "version" | "planIdentity" | "deliveryEvidence"> = {
      productionId: services.project.productionId,
      target: { shot: target.shot, subject: resolved.description.id },
      revision: resolved.revision,
      compileFingerprint: generated.inputFingerprint,
      planned: plan,
      poses,
    };
    const planRecord: IAutoMovieSubjectInspectionPlanRecord = {
      version: 2,
      ...planRecordWithoutIdentity,
      planIdentity: autoMovieSubjectInspectionPlanIdentity(
        planRecordWithoutIdentity,
      ),
      deliveryEvidence: false,
    };
    // The plan is published before the first picture is drawn, so a sweep that
    // refuses partway leaves a denominator standing beside the observations it
    // did manage. Without that, a half-finished inspection would read as a
    // completed one over a smaller plan, which is the shape of a rubber stamp.
    const directory: string = inspectionDirectory(
      services.project.productionId,
      target.shot,
      resolved.description.id,
    );
    subjectInspectionPublishInspectionFile(
      services.project.root,
      `${directory}/${AUTOMOVIE_SUBJECT_INSPECTION_PLAN_FILE}`,
      Buffer.from(`${JSON.stringify(planRecord, null, 2)}\n`, "utf8"),
    );
    const attempt: number = subjectInspectionBeginInspectionAttempt(
      services.project.root,
      directory,
      planRecord.planIdentity,
    );
    const views: IAutoMovieSubjectInspectionView[] = [];
    let runtimeIdentity: IAutoMovieCaptureRuntimeIdentity | null = null;
    let assertRuntimeCurrent: (() => void) | null = null;
    const terminalRefuse: (verdict: Exclude<IAutoMovieSubjectInspectionAttemptRecord["verdict"], "passed" | "not-run">, code: AutoMovieDiagnosticCode, message: string) => IAutoMovieInspectSubject = (
      verdict: Exclude<
        IAutoMovieSubjectInspectionAttemptRecord["verdict"],
        "passed" | "not-run"
      >,
      code: AutoMovieDiagnosticCode,
      message: string,
    ): IAutoMovieInspectSubject => {
      subjectInspectionFinishInspectionAttempt({
        root: services.project.root,
        directory,
        planIdentity: planRecord.planIdentity,
        attempt,
        verdict,
        reason: message,
      });
      return refuse(code, message, {
        revision: resolved.revision,
        planIdentity: planRecord.planIdentity,
        planRecord,
        runtimeIdentity,
        subject: resolved.description,
        plan,
        views,
      });
    };
    for (const [viewpointIndex, viewpoint] of plan.entries()) {
      const pose: IAutoMovieSubjectReviewPose = poses[viewpointIndex]!;
      let drawn: Awaited<ReturnType<AutoMovieProductionSubjectInspection>>;
      try {
        drawn = await Reflect.apply(readAdapter()!, receiver, [{
          projectRoot: services.project.root,
          productionId: services.project.productionId,
          compileFingerprint: generated.inputFingerprint,
          target: planRecord.target,
          revision: resolved.revision,
          viewpoint: viewpoint.id,
          pose,
          width,
          height,
        } satisfies Parameters<AutoMovieProductionSubjectInspection>[0]]);
      } catch (error) {
        return terminalRefuse(
          "failed",
          "capture-failed",
          `${subjectInspectionInspectionErrorMessage(error)} Correct the subject inspection instrument and retry inspectSubject.`,
        );
      }
      // Keep explicit unsupported framing separate from capture failure.
      if ("refused" in drawn)
        return terminalRefuse(
          "unsupported",
          "review-subject-viewpoint-unsupported",
          `The subject inspection instrument cannot frame compiled subject "${input.subject}": ${drawn.refused} Report its viewpoint range as unsupported rather than as observed.`,
        );
      if ("runtimeUnidentified" in drawn)
        return terminalRefuse(
          "runtime-unidentified",
          "capture-failed",
          `The subject inspection instrument did not return its complete current capture runtime identity: ${drawn.runtimeUnidentified}. Reopen the inspection host and recapture the subject.`,
        );
      if (
        drawn.runtimeIdentity === undefined ||
        drawn.assertRuntimeCurrent === undefined
      )
        return terminalRefuse(
          "runtime-unidentified",
          "capture-failed",
          "The subject inspection instrument did not return its complete current capture runtime identity: no runtime reason was reported. Reopen the inspection host and recapture the subject.",
        );
      let canonicalRuntime: string;
      try {
        drawn.assertRuntimeCurrent();
        canonicalRuntime = canonicalAutoMovieCaptureRuntimeIdentity(
          drawn.runtimeIdentity,
        );
      } catch (error) {
        return terminalRefuse(
          "failed",
          "capture-failed",
          `${subjectInspectionInspectionErrorMessage(error)} The capture runtime changed before the subject observation could be published. Reopen the inspection host and recapture the subject.`,
        );
      }
      if (
        runtimeIdentity !== null &&
        canonicalRuntime !==
          canonicalAutoMovieCaptureRuntimeIdentity(runtimeIdentity)
      )
        return terminalRefuse(
          "failed",
          "capture-failed",
          "The capture runtime identity changed during the subject sweep. Reopen the inspection host and recapture the whole subject.",
        );
      runtimeIdentity ??= drawn.runtimeIdentity;
      assertRuntimeCurrent ??= drawn.assertRuntimeCurrent;
      let png: PNG;
      try {
        if (drawn.bytes.length === 0)
          throw new Error("the inspection instrument returned zero bytes");
        png = residentPngJs().PNG.sync.read(Buffer.from(drawn.bytes));
      } catch (error) {
        return terminalRefuse(
          "failed",
          "capture-png-invalid",
          `${subjectInspectionInspectionErrorMessage(error)}. The subject inspection instrument must return a decodable PNG.`,
        );
      }
      if (
        drawn.width !== width ||
        drawn.height !== height ||
        png.width !== width ||
        png.height !== height
      )
        return terminalRefuse(
          "failed",
          "capture-size-mismatch",
          `Requested ${width}x${height}, instrument reported ${drawn.width}x${drawn.height}, and PNG decoded as ${png.width}x${png.height}. Fix the subject inspection viewport.`,
        );
      if (oracleServiceHasVisiblePixelVariance(png) === false)
        return terminalRefuse(
          "failed",
          "capture-png-blank",
          `Viewpoint "${viewpoint.id}" decoded with no visible pixel variance. An empty picture is not an observation of the subject; correct the framing, lighting, or instrument before recording it.`,
        );
      const bytes: Buffer<ArrayBuffer> = Buffer.from(drawn.bytes);
      const attemptDirectory: string = `${directory}/${encodeAutoMoviePathSegment(
        planRecord.planIdentity,
      )}/attempt-${attempt}`;
      const relative: string = `${attemptDirectory}/${encodeAutoMoviePathSegment(
        viewpoint.id,
      )}.png`;
      subjectInspectionPublishInspectionFile(services.project.root, relative, bytes);
      const digest: string = digestAutoMovieBytes(bytes);
      const observation: IAutoMovieSubjectReviewObservation = {
        kind: "subject-view",
        productionId: services.project.productionId,
        target: planRecord.target,
        subject: resolved.description.id,
        revision: resolved.revision,
        compileFingerprint: generated.inputFingerprint,
        planIdentity: planRecord.planIdentity,
        viewpoint: viewpoint.id,
        pose,
        runtimeIdentity: drawn.runtimeIdentity,
        artifact: relative,
        digest,
        verdict: "passed",
        deliveryEvidence: false,
      };
      subjectInspectionPublishInspectionFile(
        services.project.root,
        `${attemptDirectory}/${encodeAutoMoviePathSegment(viewpoint.id)}.json`,
        Buffer.from(
          `${JSON.stringify(
            {
              version: 2,
              productionId: services.project.productionId,
              target: planRecord.target,
              revision: resolved.revision,
              observation,
              pose,
              compileFingerprint: generated.inputFingerprint,
              planIdentity: planRecord.planIdentity,
              attempt,
              viewpoint: viewpoint.id,
              runtimeIdentity: drawn.runtimeIdentity,
              verdict: "passed",
              deliveryEvidence: false,
            } satisfies IAutoMovieSubjectInspectionObservationRecord,
            null,
            2,
          )}\n`,
          "utf8",
        ),
      );
      try {
        drawn.assertRuntimeCurrent();
      } catch (error) {
        return terminalRefuse(
          "failed",
          "capture-failed",
          `${subjectInspectionInspectionErrorMessage(error)} The capture runtime changed while the subject observation was published. Reopen the inspection host and recapture the whole subject.`,
        );
      }
      subjectInspectionRecordInspectionObservation({
        root: services.project.root,
        directory,
        planIdentity: planRecord.planIdentity,
        attempt,
        record: `${attemptDirectory}/${encodeAutoMoviePathSegment(
          viewpoint.id,
        )}.json`,
      });
      views.push({
        viewpoint: viewpoint.id,
        pose,
        path: relative,
        digest,
        width,
        height,
        observation,
      });
    }
    // A compile that moved while the sweep ran leaves a set of pictures taken
    // of two different models, and nothing in the individual images says so.
    const current: IAutoMovieGeneratedManifest | null = services.project.generatedManifest();
    if (
      current === null ||
      current.inputFingerprint !== generated.inputFingerprint
    )
      return terminalRefuse(
        "failed",
        "capture-input-changed",
        "Production source or generated output changed while the subject was being inspected. Discard this mixed sweep, compile the current project, and inspect the subject again.",
      );
    if (
      subjectInspectionPublishedInspectionPlanMatches({
        root: services.project.root,
        directory,
        planIdentity: planRecord.planIdentity,
      }) === false
    )
      return terminalRefuse(
        "failed",
        "capture-input-changed",
        "The current subject inspection plan changed while this sweep was running. Keep its passed prefix as history and recapture the current whole plan.",
      );
    const completedRuntime: IAutoMovieCaptureRuntimeIdentity =
      runtimeIdentity as IAutoMovieCaptureRuntimeIdentity;
    const completedAssertion: () => void = assertRuntimeCurrent as () => void;
    try {
      completedAssertion();
    } catch (error) {
      return terminalRefuse(
        "failed",
        "capture-failed",
        `${subjectInspectionInspectionErrorMessage(error)} The capture runtime changed before the sweep receipt was finalized. Reopen the inspection host and recapture the whole subject.`,
      );
    }
    subjectInspectionFinishInspectionAttempt({
      root: services.project.root,
      directory,
      planIdentity: planRecord.planIdentity,
      attempt,
      verdict: "passed",
      reason: null,
    });
    const runtimeCanonical: string =
      canonicalAutoMovieCaptureRuntimeIdentity(completedRuntime);
    const coverage: IAutoMovieSubjectReviewCoverage = foldAutoMovieSubjectReviewCoverage(
      resolved.unit,
      {
        productionId: services.project.productionId,
        target: planRecord.target,
        revision: resolved.revision,
        compileFingerprint: generated.inputFingerprint,
        planIdentity: planRecord.planIdentity,
        captureRuntimeIdentity: runtimeCanonical,
      },
      plan,
      views.map((view: IAutoMovieSubjectInspectionView) : { productionId: string; target: IAutoMovieSubjectReviewTarget; compileFingerprint: string; planIdentity: string; captureRuntimeIdentity: string; verdict: "passed"; kind: "subject-view"; subject: string; revision: string; viewpoint: string; pose: IAutoMovieSubjectReviewPose; runtimeIdentity: IAutoMovieCaptureRuntimeIdentity; artifact: string; digest: string; deliveryEvidence: false; } => ({
        ...view.observation,
        productionId: services.project.productionId,
        target: planRecord.target,
        compileFingerprint: generated.inputFingerprint,
        planIdentity: planRecord.planIdentity,
        captureRuntimeIdentity: runtimeCanonical,
        verdict: "passed" as const,
      })),
    );
    return {
      // Reaching here means every planned viewpoint produced a verified
      // observation, because the first one that did not returned a refusal.
      // A partial sweep is never reported as an inspection.
      inspected: true,
      productionId: services.project.productionId,
      target: planRecord.target,
      revision: resolved.revision,
      planIdentity: planRecord.planIdentity,
      planRecord,
      runtimeIdentity: completedRuntime,
      subject: resolved.description,
      plan,
      views,
      coverage,
      deliveryEvidence: false,
      diagnostics: [],
    };
  }
