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
