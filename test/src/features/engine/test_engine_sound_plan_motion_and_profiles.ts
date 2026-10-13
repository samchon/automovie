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
 * Planning snapshots selected profiles and samples both emitter and listener at the event's actual story time.
 *
 * Scenarios:
 * 1. Planning captures independent propagation assumptions and adopted room mappings before callers mutate their inputs.
 * 2. At event time0.2 s, emitter x6 and listener x1 derive distance5 and arrival frame 3.
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
