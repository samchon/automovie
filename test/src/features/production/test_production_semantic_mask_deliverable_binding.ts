import {
  renderAutoMovieSemanticMaskSidecar,
} from "@automovie/engine";
import {
  AUTOMOVIE_SEMANTIC_MASK_MEDIA_TYPE,
  assertAutoMovieProductionDeliverableSemanticMask,
  classifyAutoMovieProductionDeliverableSemanticMask,
  probeProductionMedia,
  productionRenderPlanOwnsSemanticMaskReceipt,
} from "@automovie/production";
import type {
  IAutoMovieProductionRenderChunk,
  IAutoMovieProductionRenderJobPlan,
} from "@automovie/render";
import {
  TestValidator,
} from "@nestia/e2e";
import {
  throwsError,
} from "../internal/predicates";
import {
  productionPng,
} from "../internal/productionMedia/productionPng";
import {
  productionWebVtt,
} from "../internal/productionMedia/productionWebVtt";

import { createSemanticMaskEvidenceTestInputs } from "../internal/createSemanticMaskEvidenceTestInputs";

/**
 * A delivered sidecar is classified by its actual bytes, receipt and scheduled guide-layer ownership.
 *
 * Scenarios:
 * 1. Native PNG and WebVTT probes retain plain-media and foreign-owner behavior alongside the actual sidecar probe.
 * 2. Every original missing, foreign frame/shot/deliverable/pass/path, stale byte and incomplete-coverage cause keeps its exact message.
 * 3. Current receipt ownership and the assert form preserve supported media and current sidecar behavior while refusing an unreceipted sidecar.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs native media probes, receipt creation and the real delivered-file classifier/assertion; compares each refusal reason, admitted receipt and scheduled ownership result.
 * @evidence contracts/testing.md#independent-expectations Expected cause strings and booleans are literal assertions; fixture sidecar bytes and receipt are produced by the canonical APIs, so this checks their integration rather than independently proving their encoding or digest.
 * @evidence contracts/testing.md#distinguishing-cases Keeps plain media and current-mask positives beside missing receipt, wrong owner/media/path/frame/shot/deliverable/pass, padded bytes and incomplete coverage; PNG and captions retain their separate ordinary-media behavior.
 * @evidence contracts/testing.md#execution-ownership The exported test executes its synchronous in-memory cases without files, renderer or subprocess. The partial plan supplies the fields consumed by ownership; it does not prove full render-plan admission or actual pixel coverage.
 */
export function test_production_semantic_mask_deliverable_binding(): void {
  const { validEvidence, withCoverage, createReceipt, bytes, digest }: ReturnType<typeof createSemanticMaskEvidenceTestInputs> = createSemanticMaskEvidenceTestInputs();

  const evidence: ReturnType<typeof validEvidence> = validEvidence();

  const sidecarBytes: Uint8Array = bytes(renderAutoMovieSemanticMaskSidecar(evidence.mask));

  const chunk: IAutoMovieProductionRenderChunk = {
      slot: "mask/00000000-00000001",
      id: digest("a"),
      deliverable: "semantic-guide",
      kind: "guide-pass",
      pass: "mask",
      frameStart: 0,
      frameEndExclusive: 1,
      frames: [
        {
          globalFrame: 0,
          timelineFrame: 0,
          timeSeconds: 0,
          layers: [{ shot: "opening", sourceFrame: 0, weight: 1 }],
        },
      ],
    } satisfies IAutoMovieProductionRenderChunk;

  const plan: IAutoMovieProductionRenderJobPlan = {
      frameFormat: { width: 16, height: 16, fps: 24 },
      chunks: [chunk],
    } as unknown as IAutoMovieProductionRenderJobPlan;

  const sidecarPath: string =
      "deliverables/final/0f/semantic-guide/frames/mask/frame_00000000.semantic.json";

  const delivered: ReturnType<typeof createReceipt> = createReceipt({
      evidence,
      sidecarBytes,
      path: sidecarPath,
    });

  const sidecarProbe: ReturnType<typeof probeProductionMedia> = probeProductionMedia({
      kind: "guide-pass",
      mediaType: AUTOMOVIE_SEMANTIC_MASK_MEDIA_TYPE,
      bytes: sidecarBytes,
    });

  const png: Uint8Array = productionPng(16, 16);

  const pngProbe: ReturnType<typeof probeProductionMedia> = probeProductionMedia({
      kind: "guide-pass",
      mediaType: "image/png",
      bytes: png,
    });

  const vtt: Uint8Array = productionWebVtt();

  const vttProbe: ReturnType<typeof probeProductionMedia> = probeProductionMedia({
      kind: "captions",
      mediaType: "text/vtt",
      bytes: vtt,
    });

  const guide: { id: string; kind: "guide-pass" } = { id: "semantic-guide", kind: "guide-pass" };

  const classify: (overrides: Partial<Parameters<typeof classifyAutoMovieProductionDeliverableSemanticMask>[0]>) => ReturnType<typeof classifyAutoMovieProductionDeliverableSemanticMask> = (
      overrides: Partial<
        Parameters<typeof classifyAutoMovieProductionDeliverableSemanticMask>[0]
      >,
    ): ReturnType<typeof classifyAutoMovieProductionDeliverableSemanticMask> =>
      classifyAutoMovieProductionDeliverableSemanticMask({
        deliverable: guide,
        file: { path: sidecarPath, semanticMask: delivered },
        probe: sidecarProbe,
        bytes: sidecarBytes,
        plan,
        ...overrides,
      });

  const reasonOf: (finding: ReturnType<typeof classifyAutoMovieProductionDeliverableSemanticMask>) => string = (
      finding: ReturnType<
        typeof classifyAutoMovieProductionDeliverableSemanticMask
      >,
    ): string => ("reason" in finding ? finding.reason : finding.status);

  const paddedBytes: Uint8Array = bytes(
      `${renderAutoMovieSemanticMaskSidecar(evidence.mask)}\n`,
    );

  const beautyPlan: IAutoMovieProductionRenderJobPlan = {
      ...plan,
      chunks: [{ ...chunk, kind: "feature", pass: "beauty" }],
    } as unknown as IAutoMovieProductionRenderJobPlan;

  const deliverableFindings: Record<string, ReturnType<typeof classifyAutoMovieProductionDeliverableSemanticMask>> & { current: ReturnType<typeof classifyAutoMovieProductionDeliverableSemanticMask> } = {
      media: classify({
        file: {
          path: "deliverables/final/0f/semantic-guide/frames/mask/frame_00000000.png",
        },
        probe: pngProbe,
        bytes: png,
      }),
      current: classify({}),
      unreceipted: classify({ file: { path: sidecarPath } }),
      captionsOwner: classify({
        deliverable: { id: "subtitles", kind: "captions" },
        file: {
          path: "deliverables/final/0f/subtitles/captions.vtt",
          semanticMask: delivered,
        },
        probe: vttProbe,
        bytes: vtt,
      }),
      pngBytes: classify({ probe: pngProbe, bytes: png }),
      pathMismatch: classify({
        file: { path: `${sidecarPath}.moved`, semanticMask: delivered },
      }),
      foreignFrame: classify({
        file: {
          path: sidecarPath,
          semanticMask: createReceipt({
            frame: 1,
            evidence,
            sidecarBytes,
            path: sidecarPath,
          }),
        },
      }),
      foreignShot: classify({
        file: {
          path: sidecarPath,
          semanticMask: createReceipt({
            evidence: { ...evidence, shot: "closing" },
            expectedShot: "closing",
            sidecarBytes,
            path: sidecarPath,
          }),
        },
      }),
      foreignDeliverable: classify({
        deliverable: { id: "other-guide", kind: "guide-pass" },
      }),
      beautyPlan: classify({ plan: beautyPlan }),
      stale: classify({
        probe: probeProductionMedia({
          kind: "guide-pass",
          mediaType: AUTOMOVIE_SEMANTIC_MASK_MEDIA_TYPE,
          bytes: paddedBytes,
        }),
        bytes: paddedBytes,
      }),
      incomplete: classify({
        file: {
          path: sidecarPath,
          semanticMask: createReceipt({
            evidence: withCoverage(evidence, {
              unresolved: ["node:missing"],
              unaddressed: 0,
            }),
            sidecarBytes,
            path: sidecarPath,
          }),
        },
      }),
    };

  TestValidator.equals(
      "a delivered ledger file is classified from its receipt, bytes, and plan",
      {
        findings: Object.fromEntries(
          Object.entries(deliverableFindings).map(([name, finding]: [string, ReturnType<typeof classifyAutoMovieProductionDeliverableSemanticMask>]): [string, string] => [
            name,
            reasonOf(finding),
          ]),
        ),
        currentReceipt:
          deliverableFindings.current.status === "semantic-mask"
            ? deliverableFindings.current.receipt
            : null,
        owned: productionRenderPlanOwnsSemanticMaskReceipt({
          plan,
          deliverable: "semantic-guide",
          receipt: delivered,
        }),
        asserted: {
          media: assertAutoMovieProductionDeliverableSemanticMask({
            deliverable: guide,
            file: {
              path: "deliverables/final/0f/semantic-guide/frames/mask/frame_00000000.png",
            },
            probe: pngProbe,
            bytes: png,
            plan,
          }),
          current: assertAutoMovieProductionDeliverableSemanticMask({
            deliverable: guide,
            file: { path: sidecarPath, semanticMask: delivered },
            probe: sidecarProbe,
            bytes: sidecarBytes,
            plan,
          }),
          unreceipted: throwsError(
            (): void =>
              assertAutoMovieProductionDeliverableSemanticMask({
                deliverable: guide,
                file: { path: sidecarPath },
                probe: sidecarProbe,
                bytes: sidecarBytes,
                plan,
              }),
            `Semantic sidecar "${sidecarPath}" has no semantic receipt`,
          ),
        },
      },
      {
        findings: {
          media: "media",
          current: "semantic-mask",
          unreceipted: `Semantic sidecar "${sidecarPath}" has no semantic receipt in its deliverable ledger.`,
          captionsOwner:
            'Semantic receipt on "deliverables/final/0f/subtitles/captions.vtt" belongs to captions deliverable "subtitles"; only a guide-pass deliverable owns mask sidecars.',
          pngBytes: `Semantic receipt on "${sidecarPath}" describes bytes that are not a semantic-mask sidecar.`,
          pathMismatch: `Semantic receipt on "${sidecarPath}.moved" names sidecar path "${sidecarPath}".`,
          foreignFrame: `Semantic sidecar "${sidecarPath}" is not bound to a current mask frame 1 of shot "opening" in guide deliverable "semantic-guide".`,
          foreignShot: `Semantic sidecar "${sidecarPath}" is not bound to a current mask frame 0 of shot "closing" in guide deliverable "semantic-guide".`,
          foreignDeliverable: `Semantic sidecar "${sidecarPath}" is not bound to a current mask frame 0 of shot "opening" in guide deliverable "other-guide".`,
          beautyPlan: `Semantic sidecar "${sidecarPath}" is not bound to a current mask frame 0 of shot "opening" in guide deliverable "semantic-guide".`,
          stale:
            'semantic sidecar bytes for shot "opening" do not match its canonical palette',
          incomplete: `Semantic sidecar "${sidecarPath}" records 1 unresolved ids and 0 unaddressed meshes for shot "opening"; a delivered mask product requires complete runtime coverage.`,
        },
        currentReceipt: delivered,
        owned: true,
        asserted: { media: undefined, current: undefined, unreceipted: true },
      },
    );
}
