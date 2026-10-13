import type {
  AutoMovieContentDigest,
  IAutoMovieCompiledShotSource,
  IAutoMovieFilmTimeline,
  IAutoMovieProductionSoundPlan,
  IAutoMovieShotContract,
  IAutoMovieSoundPropagationProfile,
} from "@automovie/interface";

/**
 * Construct independent typed audio inputs for the propagation and sound planning unit consumers.
 * Each call returns fresh mutable plans and caller-owned PCM builders; it does
 * not execute a mix, cache a result, or supply an expected production output.
 */
export const createSoundPropagationTestInputs = () => {
  const digest =
    "sha256:0000000000000000000000000000000000000000000000000000000000000000" as AutoMovieContentDigest;

  const profile = (): IAutoMovieSoundPropagationProfile => ({
    id: "declared-air",
    speedOfSoundMetersPerSecond: 100,
    distanceGain: { kind: "softened-inverse-square-v1", coefficient: 0.01 },
    spectral: {
      kind: "broadband-high-frequency-v1",
      absorptionDbPerMeter: 1,
    },
    segmentBoundary: "carry-across-cut",
    assumptions: ["caller supplied the effective path length"],
  });

  const eventPlan = (
    propagation?: IAutoMovieProductionSoundPlan["events"][number]["propagation"],
  ): IAutoMovieProductionSoundPlan => ({
    version: 1,
    inputFingerprint: digest,
    fps: 10,
    totalFrames: 7,
    sampleRate: 48_000,
    channels: 2,
    events: [
      {
        id: "0:shot:hit",
        shot: "shot",
        event: "hit",
        kind: "contact",
        frame: 2,
        timeSeconds: 0.2,
        emitter: { x: 4, y: 0, z: 0 },
        listener: { x: 0, y: 0, z: 0 },
        distanceMeters: 4,
        memberCount: 1,
        spreadRadiusMeters: 0,
        densityGain: 1,
        pan: 0,
        attenuation: 1,
        ...(propagation === undefined ? {} : { propagation }),
        seed: 1,
      },
    ],
    cues: [],
    dialogue: [],
  });

  const firstAudibleFrame = (pcm: Float32Array): number => {
    const sample = pcm.findIndex((value) => value !== 0);
    return sample < 0 ? -1 : Math.floor(sample / 2);
  };

  const adjacentEnergy = (pcm: Float32Array): number => {
    let total = 0;
    for (let index = 2; index < pcm.length; index += 2)
      total += Math.abs(pcm[index]! - pcm[index - 2]!);
    return total;
  };

  const transform = (x: number) => ({
    translation: { x, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  });

  const minimalTimeline = (): IAutoMovieFilmTimeline =>
    ({
      inputFingerprint: digest,
      fps: 10,
      totalFrames: 20,
      segments: [
        {
          shot: "shot",
          sourceInFrame: 0,
          sourceOutFrame: 10,
          startFrame: 0,
          endFrame: 10,
        },
      ],
      tracks: { audio: [], captions: [] },
    }) as unknown as IAutoMovieFilmTimeline;

  const minimalContract = (): IAutoMovieShotContract =>
    ({
      events: [
        {
          id: "hit",
          kind: "contact",
          window: { from: 0, to: 1 },
          subjects: ["actor"],
          predicates: [{}],
        },
      ],
    }) as IAutoMovieShotContract;

  const minimalCompiled = (): IAutoMovieCompiledShotSource =>
    ({
      eventSamples: [{ id: "hit", time: 0.2 }],
      scene: {
        nodes: [
          {
            id: "actor",
            model: "actor-model",
            transform: transform(4),
            motion: null,
            pose: null,
          },
        ],
        cameras: [
          {
            id: "camera",
            transform: transform(0),
            fovY: 50,
            near: 0.1,
            far: 100,
          },
        ],
        lights: [],
      },
      shot: {
        id: "shot",
        camera: "camera",
        cameraMotion: null,
        objectMotions: [],
      },
      formations: [],
      formationMotions: [],
      instanceSets: [],
    }) as unknown as IAutoMovieCompiledShotSource;

  return { digest, profile, eventPlan, firstAudibleFrame, adjacentEnergy, transform, minimalTimeline, minimalContract, minimalCompiled };
};
