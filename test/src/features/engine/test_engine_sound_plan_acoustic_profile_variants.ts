import { AutoMovieEngineSound } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { createSoundPropagationTestInputs } from "../internal/audio/createSoundPropagationTestInputs";

/**
 * Planning preserves derived and providerless adopted acoustic-profile
 * variants.
 *
 * Scenarios:
 *
 * 1. The derived-room profile retains its selected kind.
 * 2. A providerless adopted response stays adopted and leaves the optional
 *    provider absent.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the real sound planner with derived-room and providerless adopted-response profiles, observing the derived discriminant and absent optional provider on the adopted branch.
 * @evidence contracts/development/testing.md#independent-expectations Authored profile literals determine the expected discriminants and undefined provider independently of planner output. The partial existing planning carriers and declared digest do not certify complete production admission, response bytes or acoustic execution.
 * @evidence contracts/development/common.md#meaningful-documentation A derived room retains its selected kind. An adopted response with no provider retains adoption and omits the optional citation.
 */
export function test_engine_sound_plan_acoustic_profile_variants(): void {
  const {
    digest,
    minimalTimeline,
    minimalContract,
    minimalCompiled,
  }: ReturnType<typeof createSoundPropagationTestInputs> =
    createSoundPropagationTestInputs();

  const derivedPlan: ReturnType<
    typeof AutoMovieEngineSound.deriveProductionSoundPlan
  > = AutoMovieEngineSound.deriveProductionSoundPlan({
    timeline: minimalTimeline(),
    contracts: new Map([["shot", minimalContract()]]),
    compiled: new Map([["shot", minimalCompiled()]]),
    acousticProfile: {
      kind: "derived-room-analysis",
      id: "derived-room",
      solver: "sabine-broadband-v1",
    },
  });

  const providerlessPlan: ReturnType<
    typeof AutoMovieEngineSound.deriveProductionSoundPlan
  > = AutoMovieEngineSound.deriveProductionSoundPlan({
    timeline: minimalTimeline(),
    contracts: new Map([["shot", minimalContract()]]),
    compiled: new Map([["shot", minimalCompiled()]]),
    acousticProfile: {
      kind: "adopted-response",
      id: "providerless",
      asset: "assets/ir.wav",
      digest,
      sampleRate: 48_000,
      roomMappings: [],
    },
  });

  TestValidator.equals(
    "derived and providerless acoustic profiles retain their declared variants",
    {
      derivedProfile: derivedPlan.acousticProfile?.kind,
      providerlessProfile:
        providerlessPlan.acousticProfile?.kind === "adopted-response"
          ? providerlessPlan.acousticProfile.provider
          : "wrong",
    },
    {
      derivedProfile: "derived-room-analysis",
      providerlessProfile: undefined,
    },
  );
}
