import {
  deriveProductionSoundPlan,
} from "@automovie/engine";
import {
  TestValidator,
} from "@nestia/e2e";

import { createSoundPropagationTestInputs } from "../internal/audio/createSoundPropagationTestInputs";

/**
 *
 * Planning preserves derived and providerless adopted acoustic-profile variants.
 *
 * Scenarios:
 * 1. The derived-room profile retains its selected kind.
 * 2. A providerless adopted response stays adopted and leaves the optional provider absent.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `deriveProductionSoundPlan` once with a derived-room profile and once with an adopted response that names no provider, and asserts the plan's profile kind and the adopted profile's `provider` field; it catches a planner that rewrites a derived profile into another variant, drops the adopted variant, or invents a placeholder provider for an adopted response that declared none.
 * @evidence contracts/testing.md#independent-expectations Both expectations restate the caller's own input: the kind `derived-room-analysis` and an absent `provider` are what the selected profiles declared, so the oracle is the input rather than any planner output; it does not check the rest of the snapshot, such as asset, digest or sample rate.
 * @evidence contracts/testing.md#distinguishing-cases Positive derived variant and the boundary of an adopted variant whose optional provider is absent; snapshot isolation of a provider-bearing adopted profile belongs to `test_engine_sound_plan_motion_and_profiles`, and the consumption of a derived response by the mixer to `test_engine_interior_acoustic_mix_consumption`.
 */
export const test_engine_sound_plan_acoustic_profile_variants = (): void => {
  const { digest, minimalTimeline, minimalContract, minimalCompiled } = createSoundPropagationTestInputs();

  const derivedPlan = deriveProductionSoundPlan({
      timeline: minimalTimeline(),
      contracts: new Map([["shot", minimalContract()]]),
      compiled: new Map([["shot", minimalCompiled()]]),
      acousticProfile: {
        kind: "derived-room-analysis",
        id: "derived-room",
        solver: "sabine-broadband-v1",
      },
    });

  const providerlessPlan = deriveProductionSoundPlan({
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
};
