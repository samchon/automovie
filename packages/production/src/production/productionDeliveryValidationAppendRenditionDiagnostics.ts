import { IAutoMovieDiagnostic, IAutoMovieFilmTimeline, IAutoMovieProductionRenderManifest, type IAutoMovieFilmTimelineSegment, type IAutoMovieProductionDeliverableFile, type IAutoMovieProductionRenditionDeliveryShot, type IAutoMovieRepaintObservationMember, type IAutoMovieRepaintSequenceObservation } from "@automovie/interface";
import { productionVisualDeliveryOccurrence } from "@automovie/render";
import { assertProductionFeatureUsesRenditionClips } from "@automovie/render/node";
import { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import { canonicalAutoMovieJsonBytes, digestAutoMovieBytes, encodeAutoMoviePathSegment } from "./contentIdentity";
import { readAutoMovieFilmTimeline } from "./filmTimeline";
import { errorMessage } from "./productionBuildDiagnostics";
import { planAutoMovieVisualDelivery, productionDeterministicVisualSourceDigest, type IAutoMovieVisualDeliveryLane, type IAutoMovieVisualDeliveryPlan } from "./repaintDeliveryLane";
import { autoMovieRepaintSequenceObservationDiagnostics, digestAutoMovieRepaintObservationMembers } from "./repaintSequenceObservation";





import type { IAutoMovieVerifiedRepaintSelection } from "./IAutoMovieVerifiedRepaintSelection";


import { productionDeliveryValidationDiagnostic } from "./productionDeliveryValidationDiagnostic";

/**
 * Append one rendition provenance refusal when a feature's ordered visual lanes, current selections, or aggregate observation cannot be reconciled. Deterministic features without rendition metadata return immediately.
 *
 * @evidence contracts/common.md#principled-implementation The canonical timeline defines occurrence order, deterministic identities derive from the compile fingerprint, and repaint identities join exact active selection receipts. Mixed-lane policy and five observation verdicts are checked; the observation's stored baseline is passed through rather than independently measured here.
 * @evidence contracts/common.md#clear-and-simple-design A single guarded sequence appends one provenance diagnostic on failure. All-repaint features additionally compare compressed sample payloads against selected clips, while mixed delivery uses lane identity and policy checks without that all-repaint sample assertion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Non-feature rendition claims and mismatched request, attempt, selection, output, receipt, and occurrence identities are refused. No deterministic fallback substitutes for repaint provenance, and a passed stored observation is not presented as a fresh visual inspection.
 * @evidence contracts/common.md#meaningful-documentation The comment states the mutation of the caller's diagnostic list, deterministic early return, ordered current-selection premise, and scope of the sample and observation checks. Publication and encoder effects belong to other owners.
 * @evidence contracts/performance.md#efficient-algorithms Work grows with timeline occurrences, unique repaint shots, metadata size, and clip bytes. Canonical digesting and all-repaint sample comparison scan full inputs; rereading the timeline per applicable deliverable is an existing repeated cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Occurrence arrays and a selection map are reused during this feature's checks. Current artifact and clip bytes are reread, and no cache crosses calls because selection or resident bytes can change under the same production id.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Arrays, the verified-selection map, canonical encodings, and any all-repaint clip buffers live for this invocation without an enforced population or byte bound. Project readers close their descriptors; this helper retains no asynchronous tasks or handles.
 */
export const productionDeliveryValidationAppendRenditionDiagnostics: (diagnostics: IAutoMovieDiagnostic[], project: AutoMovieProductionProject, production: NonNullable<ReturnType<AutoMovieProductionProject["graph"]>["production"]>, inputFingerprint: string, deliverable: IAutoMovieProductionRenderManifest["deliverables"][number]) => void = (
  diagnostics: IAutoMovieDiagnostic[],
  project: AutoMovieProductionProject,
  production: NonNullable<
    ReturnType<AutoMovieProductionProject["graph"]>["production"]
  >,
  inputFingerprint: string,
  deliverable: IAutoMovieProductionRenderManifest["deliverables"][number],
): void => {
  if (deliverable.kind !== "feature") {
    if (deliverable.rendition !== undefined)
      diagnostics.push(
        productionDeliveryValidationDiagnostic(
          "render-rendition-provenance-invalid",
          deliverable.id,
          "Only feature delivery may claim repaint rendition provenance.",
        ),
      );
    return;
  }
  if (
    production.visualDelivery === "deterministic" &&
    deliverable.rendition === undefined
  )
    return;
  try {
    const timeline: IAutoMovieFilmTimeline = readAutoMovieFilmTimeline(project, inputFingerprint);
    const occurrences: { occurrence: string; shot: string; }[] = timeline.segments.map((segment: IAutoMovieFilmTimelineSegment, index: number) : { occurrence: string; shot: string; } => ({
      occurrence: productionVisualDeliveryOccurrence(segment, index),
      shot: segment.shot,
    }));
    const declared: { lane: "deterministic" | "repainted" | "mixed"; occurrence: string; shot: string; }[] =
      production.visualDelivery === "mixed"
        ? // The design validator requires an explicit lane population for a
          // mixed delivery, and a design that fails it never reaches this gate
          // with a current compile fingerprint.
          production.visualDeliveryLanes!
        : occurrences.map((occurrence: { occurrence: string; shot: string; }) : { lane: "deterministic" | "repainted" | "mixed"; occurrence: string; shot: string; } => ({
            ...occurrence,
            lane: production.visualDelivery,
          }));
    const repaintShots: string[] = [
      ...new Set(
        declared.flatMap((lane: { lane: "deterministic" | "repainted" | "mixed"; occurrence: string; shot: string; }) : string[] =>
          lane.lane === "repainted" ? [lane.shot] : [],
        ),
      ),
    ];
    const selections: Map<string, IAutoMovieVerifiedRepaintSelection> = new Map(
      project
        .verifiedRepaintSelections(repaintShots)
        .map((selection: IAutoMovieVerifiedRepaintSelection) : readonly [string, IAutoMovieVerifiedRepaintSelection] => [selection.receipt.shot, selection] as const),
    );
    if (
      deliverable.rendition === undefined ||
      deliverable.rendition.version !== 2 ||
      deliverable.rendition.kind !== "visual-lanes" ||
      deliverable.rendition.shots.length !== occurrences.length
    )
      throw new Error(
        "Feature manifest does not carry the exact current occurrence-lane protocol.",
      );
    const members: IAutoMovieRepaintObservationMember[] = deliverable.rendition.shots.map((segment: IAutoMovieProductionRenditionDeliveryShot, index: number) : IAutoMovieRepaintObservationMember => {
      const occurrence: { occurrence: string; shot: string; } = occurrences[index];
      const lane: { lane: "deterministic" | "repainted" | "mixed"; occurrence: string; shot: string; } = declared[index];
      if (
        occurrence === undefined ||
        lane === undefined ||
        segment.occurrence !== occurrence.occurrence ||
        segment.shot !== occurrence.shot ||
        lane.occurrence !== occurrence.occurrence ||
        lane.shot !== occurrence.shot ||
        segment.lane !== lane.lane
      )
        throw new Error(
          `Visual lane occurrence ${index} is stale or reordered.`,
        );
      if (segment.lane === "deterministic") {
        if (
          segment.receiptDigest !== null ||
          segment.selectionDigest !== null ||
          segment.sourceDigest !== segment.digest ||
          segment.path !==
            `generated/deterministic/${encodeAutoMoviePathSegment(segment.occurrence)}` ||
          segment.digest !==
            productionDeterministicVisualSourceDigest({
              compileFingerprint: inputFingerprint,
              occurrence: segment.occurrence,
            })
        )
          throw new Error(
            `Deterministic occurrence ${index} carries repaint provenance.`,
          );
        return {
          occurrence: segment.occurrence,
          shot: segment.shot,
          lane: "deterministic" as const,
          sourceDigest: segment.sourceDigest,
        };
      }
      const selection: IAutoMovieVerifiedRepaintSelection | undefined = selections.get(segment.shot);
      if (
        selection === undefined ||
        segment.requestId !== selection.receipt.requestId ||
        segment.attemptId !== selection.receipt.attemptId ||
        segment.selectionId !== selection.selectionId ||
        segment.selectionDigest !== selection.selectionDigest ||
        segment.path !== selection.receipt.output.path ||
        segment.digest !== selection.receipt.output.digest ||
        segment.sourceDigest !== selection.receipt.output.digest ||
        segment.receiptDigest !==
          digestAutoMovieBytes(canonicalAutoMovieJsonBytes(selection.receipt))
      )
        throw new Error(
          `Repaint occurrence ${index} does not cite its exact current selection chain.`,
        );
      return {
        occurrence: segment.occurrence,
        shot: segment.shot,
        lane: "repainted" as const,
        requestId: segment.requestId,
        attemptId: segment.attemptId,
        outputDigest: segment.digest,
        candidateReceiptDigest: segment.receiptDigest,
        selectionId: segment.selectionId,
        selectionDigest: segment.selectionDigest,
      };
    });
    if (
      deliverable.rendition.memberSetDigest !==
      digestAutoMovieRepaintObservationMembers(members)
    )
      throw new Error("Feature manifest active visual member set is stale.");
    const observation: IAutoMovieRepaintSequenceObservation | null = deliverable.rendition.observation;
    const observationDigest: string | null =
      observation === null
        ? null
        : digestAutoMovieBytes(canonicalAutoMovieJsonBytes(observation));
    if (
      deliverable.rendition.observationDigest !== observationDigest ||
      (repaintShots.length === 0
        ? observation !== null
        : observation === null ||
          autoMovieRepaintSequenceObservationDiagnostics({
            observation,
            productionId: production.id,
            compileFingerprint: inputFingerprint,
            timelineFingerprint: digestAutoMovieBytes(
              canonicalAutoMovieJsonBytes(timeline),
            ),
            baseline: observation.baseline,
            members,
            artifactDigest: (() : string | null => {
              try {
                return digestAutoMovieBytes(
                  project.readRenderFile(observation.artifact.path),
                );
              } catch {
                return null;
              }
            })(),
          }).length !== 0)
    )
      throw new Error(
        "Feature manifest aggregate sequence observation is stale.",
      );
    const deliveryPlan: IAutoMovieVisualDeliveryPlan = planAutoMovieVisualDelivery({
      timeline: occurrences,
      lanes: deliverable.rendition.shots.map((segment: IAutoMovieProductionRenditionDeliveryShot) : IAutoMovieVisualDeliveryLane =>
        segment.lane === "deterministic"
          ? {
              occurrence: segment.occurrence,
              shot: segment.shot,
              lane: "deterministic" as const,
              deterministic: {
                path: segment.path,
                digest: segment.digest,
              },
              repaint: null,
            }
          : {
              occurrence: segment.occurrence,
              shot: segment.shot,
              lane: "repainted" as const,
              deterministic: null,
              repaint: {
                path: segment.path,
                digest: segment.digest,
                receiptDigest: segment.receiptDigest,
                selectionDigest: segment.selectionDigest,
              },
            },
      ),
      policy:
        production.visualDelivery === "mixed"
          ? // Required by the design validator beside the lane population.
            production.mixedVisualDeliveryPolicy!
          : null,
      currentObservationDigest: observationDigest,
    });
    if (deliveryPlan.diagnostics.length !== 0)
      throw new Error(
        `Feature manifest visual delivery plan is invalid: ${deliveryPlan.diagnostics.join(", ")}.`,
      );
    const feature: IAutoMovieProductionDeliverableFile | undefined = deliverable.files.find(
      (file: IAutoMovieProductionDeliverableFile) : boolean => file.mediaType === "video/mp4",
    );
    if (feature === undefined)
      throw new Error("Feature manifest has no video/mp4 output.");
    if (declared.every((lane: { lane: "deterministic" | "repainted" | "mixed"; occurrence: string; shot: string; }) : boolean => lane.lane === "repainted"))
      assertProductionFeatureUsesRenditionClips({
        feature: project.readRenderFile(feature.path),
        timeline,
        clips: new Map(
          repaintShots.map((shot: string) : readonly [string, Uint8Array<ArrayBufferLike>] => {
            const selection: IAutoMovieVerifiedRepaintSelection = selections.get(shot)!;
            return [
              shot,
              project.readRenderFile(selection.receipt.output.path),
            ] as const;
          }),
        ),
      });
  } catch (error) {
    diagnostics.push(
      productionDeliveryValidationDiagnostic(
        "render-rendition-provenance-invalid",
        deliverable.id,
        `${errorMessage(error)} Re-finalize from current reviewed repaint receipts; deterministic fallback is not accepted for repainted delivery.`,
      ),
    );
  }
};
