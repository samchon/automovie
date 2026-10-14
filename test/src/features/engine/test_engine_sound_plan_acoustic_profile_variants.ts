import {
  deriveProductionSoundPlan,
} from "@automovie/engine";
import {
  TestValidator,
} from "@nestia/e2e";

import { createSoundPropagationTestInputs } from "../internal/audio/createSoundPropagationTestInputs";

/**
 * Planning preserves derived and providerless adopted acoustic-profile variants.
 *
 * Scenarios:
 * 1. The derived-room profile retains its selected kind.
 * 2. A providerless adopted response stays adopted and leaves the optional provider absent.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real sound planner with derived-room and providerless adopted-response profiles, observing the derived discriminant and absent optional provider on the adopted branch.
 * @evidence contracts/testing.md#independent-expectations Authored profile literals determine the expected discriminants and undefined provider independently of planner output. The partial existing planning carriers and declared digest do not certify complete production admission, response bytes or acoustic execution.
 * @evidence contracts/testing.md#distinguishing-cases Preserves both declared variants, including the adopted branch with no provider and empty room mappings; the branch guard distinguishes an incorrect variant from an actually omitted provider. Other tests own profile copying and consumed PCM.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns fresh planner inputs/results through the existing fixture, with no asset read, decoder, native solver/audio device, renderer, browser or GPU and no foreign-method replacement.
 */
export function test_engine_sound_plan_acoustic_profile_variants(): void {
  const { digest, minimalTimeline, minimalContract, minimalCompiled }: ReturnType<typeof createSoundPropagationTestInputs> = createSoundPropagationTestInputs();

  const derivedPlan: ReturnType<typeof deriveProductionSoundPlan> = deriveProductionSoundPlan({
      timeline: minimalTimeline(),
      contracts: new Map([["shot", minimalContract()]]),
      compiled: new Map([["shot", minimalCompiled()]]),
      acousticProfile: {
        kind: "derived-room-analysis",
        id: "derived-room",
        solver: "sabine-broadband-v1",
      },
    });

  const providerlessPlan: ReturnType<typeof deriveProductionSoundPlan> = deriveProductionSoundPlan({
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
            : "wrong"
  },
  {
  derivedProfile: "derived-room-analysis",
  providerlessProfile: undefined
  }
  );
}
