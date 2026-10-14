import {
  canonicalAutoMovieJsonBytes,
  digestAutoMovieBytes,
  normalizeAutoMovieVisualDeliveryLanes,
  planAutoMovieVisualDelivery,
  productionDeterministicVisualSourceDigest,
} from "@automovie/production";
import { TestValidator } from "@nestia/e2e";

const digest: (character: string) => string = (character: string): string => `sha256:${character.repeat(64)}`;
const timeline: Parameters<typeof planAutoMovieVisualDelivery>[0]["timeline"] = [
  { occurrence: "occurrence-1", shot: "a" },
  { occurrence: "occurrence-2", shot: "b" },
  { occurrence: "occurrence-3", shot: "b" },
];

/**
 * Final delivery consumes one explicit visual source per timeline occurrence.
 *
 * Scenarios:
 *
 * 1. A deterministic/repainted/repainted film resolves with exactly one
 *    reviewed crossing, preserving repeated shot occurrence identity.
 * 2. Missing, reordered, fallback-shaped and unreviewed lanes are
 *    refused while all-one-lane normalization remains explicit; a lane whose
 *    declared source is absent is a source refusal rather than a thrown error.
 * 3. The deterministic source digest is one domain-separated identity over the
 *    compile fingerprint and occurrence, so a changed occurrence changes it.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real lane planner and legacy normalizer, comparing admitted segments and exact ordered diagnostic codes; also checks deterministic source identity composition and sensitivity to occurrence identity.
 * @evidence contracts/testing.md#independent-expectations Explicit source records, crossing policy and literal diagnostic arrays define the lane oracle. The digest expectation spells the protocol fields but uses shared canonical/hash helpers, so it verifies composition rather than an independent hash implementation.
 * @evidence contracts/testing.md#distinguishing-cases Preserves repeated shot occurrences, a current mixed crossing, missing/reordered population, fallback and absent sources, missing/stale policy observation, and explicit all-deterministic/all-repainted normalization with their distinct observation requirements.
 * @evidence contracts/testing.md#execution-ownership This named synchronous metadata unit uses resident identities and actual planners without opening media, playing the aggregate film or verifying review artifacts; source bytes and visual transition quality have separate owners.
 */
export function test_production_repaint_visual_delivery(): void {
  const deterministic: ReturnType<Parameters<typeof normalizeAutoMovieVisualDeliveryLanes>[0]["deterministic"]> = {
    path: "render/a.mp4",
    digest: digest("1"),
  };
  const repaint: ReturnType<Parameters<typeof normalizeAutoMovieVisualDeliveryLanes>[0]["repaint"]> = {
    path: "renditions/b.mp4",
    digest: digest("2"),
    receiptDigest: digest("3"),
    selectionDigest: digest("4"),
  };
  const lanes: Parameters<typeof planAutoMovieVisualDelivery>[0]["lanes"][number][] = [
    {
      ...timeline[0]!,
      lane: "deterministic" as const,
      deterministic,
      repaint: null,
    },
    {
      ...timeline[1]!,
      lane: "repainted" as const,
      deterministic: null,
      repaint,
    },
    {
      ...timeline[2]!,
      lane: "repainted" as const,
      deterministic: null,
      repaint,
    },
  ];
  const policy: NonNullable<Parameters<typeof planAutoMovieVisualDelivery>[0]["policy"]> = {
    version: 1 as const,
    observationDigest: digest("5"),
    transitions: [
      {
        fromOccurrence: "occurrence-1",
        toOccurrence: "occurrence-2",
        reviewDigest: digest("6"),
      },
    ],
  };
  const missing: ReturnType<typeof planAutoMovieVisualDelivery> = planAutoMovieVisualDelivery({
    timeline,
    lanes: lanes.slice(1),
    policy,
    currentObservationDigest: policy.observationDigest,
  });
  const reordered: ReturnType<typeof planAutoMovieVisualDelivery> = planAutoMovieVisualDelivery({
    timeline,
    lanes: [lanes[1]!, lanes[0]!, lanes[2]!],
    policy,
    currentObservationDigest: policy.observationDigest,
  });
  const fallback: typeof lanes = structuredClone(lanes);
  fallback[0] = {
    ...fallback[0]!,
    repaint,
  } as (typeof lanes)[number];
  TestValidator.equals(
    "explicit occurrence lanes and crossings are exact",
    {
      mixed: planAutoMovieVisualDelivery({
        timeline,
        lanes,
        policy,
        currentObservationDigest: policy.observationDigest,
      }),
      missing: missing.diagnostics,
      reordered: reordered.diagnostics,
      fallback: planAutoMovieVisualDelivery({
        timeline,
        lanes: fallback,
        policy,
        currentObservationDigest: policy.observationDigest,
      }).diagnostics,
      noPolicy: planAutoMovieVisualDelivery({
        timeline,
        lanes,
        policy: null,
        currentObservationDigest: policy.observationDigest,
      }).diagnostics,
      staleObservation: planAutoMovieVisualDelivery({
        timeline,
        lanes,
        policy,
        currentObservationDigest: digest("7"),
      }).diagnostics,
      allDeterministic: planAutoMovieVisualDelivery({
        timeline,
        lanes: normalizeAutoMovieVisualDeliveryLanes({
          timeline,
          visualDelivery: "deterministic",
          deterministic: (): typeof deterministic => deterministic,
          repaint: (): typeof repaint => repaint,
        }),
        policy: null,
        currentObservationDigest: null,
      }).diagnostics,
      allDeterministicWithPolicy: planAutoMovieVisualDelivery({
        timeline,
        lanes: normalizeAutoMovieVisualDeliveryLanes({
          timeline,
          visualDelivery: "deterministic",
          deterministic: (): typeof deterministic => deterministic,
          repaint: (): typeof repaint => repaint,
        }),
        policy: { ...policy, transitions: [] },
        currentObservationDigest: policy.observationDigest,
      }).diagnostics,
      allRepaintedMissingObservation: planAutoMovieVisualDelivery({
        timeline,
        lanes: normalizeAutoMovieVisualDeliveryLanes({
          timeline,
          visualDelivery: "repainted",
          deterministic: (): typeof deterministic => deterministic,
          repaint: (): typeof repaint => repaint,
        }),
        policy: null,
        currentObservationDigest: null,
      }).diagnostics,
      allRepainted: planAutoMovieVisualDelivery({
        timeline,
        lanes: normalizeAutoMovieVisualDeliveryLanes({
          timeline,
          visualDelivery: "repainted",
          deterministic: (): typeof deterministic => deterministic,
          repaint: (): typeof repaint => repaint,
        }),
        policy: null,
        currentObservationDigest: policy.observationDigest,
      }).diagnostics,
    },
    {
      mixed: { segments: lanes, diagnostics: [] },
      missing: ["visual-lane-population-invalid"],
      reordered: ["visual-lane-population-invalid"],
      fallback: ["visual-lane-source-invalid"],
      noPolicy: ["visual-lane-policy-missing"],
      staleObservation: ["visual-lane-transition-invalid"],
      allDeterministic: [],
      allDeterministicWithPolicy: [
        "visual-lane-observation-invalid",
        "visual-lane-transition-invalid",
      ],
      allRepaintedMissingObservation: ["visual-lane-observation-invalid"],
      allRepainted: [],
    },
  );

  const sourceless: typeof lanes = structuredClone(lanes);
  sourceless[0] = {
    ...sourceless[0]!,
    deterministic: null,
  } as unknown as (typeof lanes)[number];
  const sourceDigest: string = productionDeterministicVisualSourceDigest({
    compileFingerprint: digest("1"),
    occurrence: "occurrence-1",
  });
  TestValidator.equals(
    "an absent declared source is a lane refusal and the source digest is domain-separated",
    {
      sourceless: planAutoMovieVisualDelivery({
        timeline,
        lanes: sourceless,
        policy,
        currentObservationDigest: policy.observationDigest,
      }).diagnostics,
      sourceDigest,
      anotherOccurrence:
        productionDeterministicVisualSourceDigest({
          compileFingerprint: digest("1"),
          occurrence: "occurrence-2",
        }) === sourceDigest,
    },
    {
      sourceless: ["visual-lane-source-invalid"],
      sourceDigest: digestAutoMovieBytes(
        canonicalAutoMovieJsonBytes({
          protocol: "automovie.deterministic-visual-source.v1",
          compileFingerprint: digest("1"),
          occurrence: "occurrence-1",
        }),
      ),
      anotherOccurrence: false,
    },
  );
}
