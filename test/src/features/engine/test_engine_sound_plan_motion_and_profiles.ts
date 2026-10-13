import {
  deriveProductionSoundPlan,
} from "@automovie/engine";
import type {
  IAutoMovieAcousticResponseProfile,
} from "@automovie/interface";
import {
  TestValidator,
} from "@nestia/e2e";

import { createSoundPropagationTestInputs } from "../internal/audio/createSoundPropagationTestInputs";

/**
 *
 * Planning snapshots selected profiles and samples both emitter and listener at the event's actual story time.
 *
 * Scenarios:
 * 1. Planning captures independent propagation assumptions and adopted room mappings before callers mutate their inputs.
 * 2. At event time0.2 s, emitter x6 and listener x1 derive distance5 and arrival frame 3.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `deriveProductionSoundPlan` with a propagation profile and a provider-bearing adopted response, mutates both inputs afterwards, and asserts the event's propagation profile id and the plan's retained assumption and room mapping; then plans a shot whose actor and camera both move and asserts emitter x, listener x, distance and arrival frame; it catches a plan aliasing caller-owned profiles, an emitter or listener sampled at rest or at shot start instead of event time, and propagation computed from stale positions.
 * @evidence contracts/testing.md#independent-expectations Positions are hand interpolation at t = 0.2 s: the actor moves 4 to 14 m and the camera 0 to 5 m over one second, giving 6 and 1, so the distance is 5 m; arrival is 0.2 s plus 5 m at the declared 100 m/s, 0.25 s, which at 10 fps lands in frame 3; the snapshot values are the caller's pre-mutation literals.
 * @evidence contracts/testing.md#distinguishing-cases Positive mutation-after-planning case for both profile kinds and a positive moving-emitter, moving-listener case; equal sort keys and static formations belong to `test_engine_sound_plan_member_ordering`, providerless adopted profiles to `test_engine_sound_plan_acoustic_profile_variants`, and the propagation law itself to `test_engine_sound_propagation`.
 */
export const test_engine_sound_plan_motion_and_profiles = (): void => {
  const { digest, profile, minimalTimeline, minimalContract, minimalCompiled } = createSoundPropagationTestInputs();

  const selectedProfile = profile();

  const acousticProfile: IAutoMovieAcousticResponseProfile = {
      kind: "adopted-response",
      id: "hall-ir",
      asset: "assets/hall.wav",
      digest,
      sampleRate: 48_000,
      roomMappings: [{ source: "hall", listener: "hall", response: "main" }],
      provider: { name: "declared archive", version: "1" },
    };

  const planned = deriveProductionSoundPlan({
      timeline: minimalTimeline(),
      contracts: new Map([["shot", minimalContract()]]),
      compiled: new Map([["shot", minimalCompiled()]]),
      propagationProfile: selectedProfile,
      acousticProfile,
    });

  selectedProfile.assumptions[0] = "mutated";

  acousticProfile.roomMappings[0]!.response = "mutated";

  TestValidator.equals(
      "planning derives the event receipt and snapshots selected profiles",
      {
        event: planned.events[0]!.propagation?.profile,
        assumption: planned.propagationProfile?.assumptions[0],
        response:
          planned.acousticProfile?.kind === "adopted-response"
            ? planned.acousticProfile.roomMappings[0]!.response
            : null,
      },
      {
        event: "declared-air",
        assumption: "caller supplied the effective path length",
        response: "main",
      },
    );

  const moving = minimalCompiled();

  moving.shot.objectMotions = [
      {
        id: "actor-motion",
        name: null,
        duration: 1,
        loop: false,
        tracks: [
          {
            channel: { kind: "node", node: "actor", path: "translation" },
            times: [0, 1],
            values: [4, 0, 0, 14, 0, 0],
            interpolation: "linear",
          },
        ],
      },
    ];

  moving.shot.cameraMotion = {
      id: "camera-motion",
      name: null,
      duration: 1,
      loop: false,
      tracks: [
        {
          channel: { kind: "node", node: "camera", path: "translation" },
          times: [0, 1],
          values: [0, 0, 0, 5, 0, 0],
          interpolation: "linear",
        },
      ],
    };

  const movingEvent = deriveProductionSoundPlan({
      timeline: minimalTimeline(),
      contracts: new Map([["shot", minimalContract()]]),
      compiled: new Map([["shot", moving]]),
      propagationProfile: profile(),
    }).events[0]!;

  TestValidator.equals(
      "event-time motion samples both the emitter and listener before propagation",
      {
        emitterX: movingEvent.emitter.x,
        listenerX: movingEvent.listener.x,
        distance: movingEvent.distanceMeters,
        arrival: movingEvent.propagation?.arrivalFrame,
      },
      { emitterX: 6, listenerX: 1, distance: 5, arrival: 3 },
    );
};
