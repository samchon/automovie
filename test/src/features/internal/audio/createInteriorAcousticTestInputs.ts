import {
  type IAutoMovieAcousticRequest,
} from "@automovie/engine";
import type {
  AutoMovieContentDigest,
  IAutoMovieAcousticResponseProfile,
  IAutoMovieProductionAcousticResponse,
  IAutoMovieProductionSoundPlan,
} from "@automovie/interface";

/**
 * Construct independent typed audio inputs for the room-response unit consumers.
 * Each call returns fresh mutable plans and caller-owned PCM builders; it does
 * not execute a mix, cache a result, or supply an expected production output.
 */
export const createInteriorAcousticTestInputs = () => {
  const digest =
    "sha256:1111111111111111111111111111111111111111111111111111111111111111" as AutoMovieContentDigest;

  const profile: IAutoMovieAcousticResponseProfile = {
    kind: "derived-room-analysis",
    id: "sabine",
    solver: "sabine-broadband-v1",
  };

  const request = (absorption = 0.5): IAutoMovieAcousticRequest => ({
    id: "room-analysis",
    subject: "room-a",
    inputRevision: digest,
    volume: 100,
    surfaces: [{ id: "shell", area: 100, absorption }],
    partitions: [{ id: "wall", area: 20, transmissionLoss: 20 }],
    sources: [
      {
        id: "event",
        position: { x: 0, y: 0, z: 0 },
        soundPower: 80,
        directivity: 1,
      },
    ],
    receivers: [{ id: "listener", position: { x: 1, y: 0, z: 0 } }],
    targets: [],
  });

  const soundPlan = (
    acousticResponse?: IAutoMovieProductionAcousticResponse,
  ): IAutoMovieProductionSoundPlan => ({
    version: 1,
    inputFingerprint: digest,
    fps: 48_000,
    totalFrames: 1,
    sampleRate: 48_000,
    channels: 2,
    events: [
      {
        id: "event",
        shot: "shot",
        event: "hit",
        kind: "contact",
        frame: 0,
        timeSeconds: 0,
        emitter: { x: 0, y: 0, z: 0 },
        listener: { x: 1, y: 0, z: 0 },
        distanceMeters: 1,
        memberCount: 1,
        spreadRadiusMeters: 0,
        densityGain: 1,
        pan: 0,
        attenuation: 1,
        ...(acousticResponse === undefined ? {} : { acousticResponse }),
        seed: 1,
      },
    ],
    cues: [],
    dialogue: [],
  });

  return { digest, profile, request, soundPlan };
};
