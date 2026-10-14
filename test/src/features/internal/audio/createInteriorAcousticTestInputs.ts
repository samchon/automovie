import type {
  IAutoMovieAcousticResponseProfile,
  IAutoMovieProductionAcousticResponse,
  IAutoMovieProductionSoundPlan,
} from "@automovie/interface";

import type { IAutoMovieAcousticRequest } from "@automovie/engine";

/**
 * Existing mutable room-response input constructors borrowed by portable audio units.
 *
 * @author Samchon
 */
interface IInteriorAcousticTestInputs {
  /** Declared matching revision string, not a recomputed physical-input digest. */
  digest: string;

  /** The supported bounded Sabine profile. */
  profile: IAutoMovieAcousticResponseProfile;

  /** Fresh 100 cubic metre room requests with caller-selected dimensionless absorption. */
  request: (absorption?: number) => IAutoMovieAcousticRequest;

  /** One native sample frame carrying the optionally supplied room response. */
  soundPlan: (
    acousticResponse?: IAutoMovieProductionAcousticResponse,
  ) => IAutoMovieProductionSoundPlan;
}

/**
 * Supply the existing room-response arrangements without predicting an output.
 *
 * Consumers call real derivation, PCM application and native-rate mixing against these requests; this helper does not derive a response or evaluate expected samples.
 *
 * V=100, area=100, authored absorption and partition loss=20 dB support the units' independent Sabine and 10^(-dB/20) expectations. The digest is declared metadata rather than measured geometry provenance.
 *
 * Caller-selected absorption, optional response and separate mutable requests preserve reflective/absorptive, same/different/outdoor and malformed-input twins; supplied samples and all existing numeric bounds stay with the units.
 *
 * Each call owns fresh mutable inputs and closures for portable units, with no cache, filesystem access, audio device or native build. Returning a plan does not prove that its response is available.
 */
export const createInteriorAcousticTestInputs: () => IInteriorAcousticTestInputs =
  (): IInteriorAcousticTestInputs => {
    const digest: string =
      "sha256:1111111111111111111111111111111111111111111111111111111111111111" as string;

    const profile: IAutoMovieAcousticResponseProfile = {
      kind: "derived-room-analysis",
      id: "sabine",
      solver: "sabine-broadband-v1",
    };

    const request: (absorption?: number) => IAutoMovieAcousticRequest = (
      absorption: number = 0.5,
    ): IAutoMovieAcousticRequest => ({
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

    const soundPlan: (
      acousticResponse?: IAutoMovieProductionAcousticResponse,
    ) => IAutoMovieProductionSoundPlan = (
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
