import type {
  IAutoMovieCompiledShotSource,
  IAutoMovieFilmTimeline,
  IAutoMovieProductionSoundPlan,
  IAutoMovieShotContract,
  IAutoMovieSoundPropagationProfile,
  IAutoMovieTransform,
} from "@automovie/interface";

/**
 * Existing propagation inputs and partial planning carriers borrowed by portable sound units.
 *
 * @author Samchon
 */
interface ISoundPropagationTestInputs {
  /** Declared identity string; this helper computes no content provenance. */
  digest: string;

  /** Fresh direct-path profile with authored speed, gain and segment choices. */
  profile: () => IAutoMovieSoundPropagationProfile;

  /** Existing 10 fps plan with one contact event at frame two. */
  eventPlan: (propagation?: IAutoMovieProductionSoundPlan["events"][number]["propagation"]) => IAutoMovieProductionSoundPlan;

  /** First stereo sample frame with a nonzero sample, or -1; no perceptual hearing threshold is modeled. */
  firstAudibleFrame: (pcm: Float32Array) => number;

  /** Sum of adjacent left-channel sample differences, a comparison proxy rather than a spectral analysis. */
  adjacentEnergy: (pcm: Float32Array) => number;

  /** Fresh identity rotation/unit scale translated along the x axis in metres. */
  transform: (x: number) => IAutoMovieTransform;

  /** Partial film carrier supplying only the fields the tested planner reads. */
  minimalTimeline: () => IAutoMovieFilmTimeline;

  /** Partial shot carrier exposing the existing contact event. */
  minimalContract: () => IAutoMovieShotContract;

  /** Partial compiled carrier; returning it does not prove full compiled-source admission. */
  minimalCompiled: () => IAutoMovieCompiledShotSource;
}

/**
 * Supply the existing propagation and sound-planning inputs without rendering a predicted answer.
 *
 * Consumers run actual propagation, planning and PCM mixing; the returned functions only construct their existing mutable arrangements or observe resulting PCM.
 *
 * Authored speed=100 m/s, gain coefficient=0.01, loss=1 dB/m and the frame/sample clocks support independent arithmetic in the units. The nonzero-frame search and adjacent-sample sum are observation carriers with no perceptual or full spectral guarantee.
 *
 * Optional propagation and caller edits preserve zero-distance, carried/trimmed arrival, spectral twins, profile snapshots, moving endpoints, short dialogue and malformed-input cases. The asserted minimal timeline/contract/compiled shapes exercise planner fields rather than certify complete production records.
 *
 * Each call returns fresh mutable inputs and closures for portable units, with no retained cache, filesystem access, audio device, decoder or new host.
 */
export const createSoundPropagationTestInputs: () => ISoundPropagationTestInputs = (): ISoundPropagationTestInputs => {
  const digest: string =
    "sha256:0000000000000000000000000000000000000000000000000000000000000000" as string;

  const profile: () => IAutoMovieSoundPropagationProfile = (): IAutoMovieSoundPropagationProfile => ({
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

  const eventPlan: (propagation?: IAutoMovieProductionSoundPlan["events"][number]["propagation"]) => IAutoMovieProductionSoundPlan = (
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

  const firstAudibleFrame: (pcm: Float32Array) => number = (pcm: Float32Array): number => {
    const sample: number = pcm.findIndex((value: number): boolean => value !== 0);
    return sample < 0 ? -1 : Math.floor(sample / 2);
  };

  const adjacentEnergy: (pcm: Float32Array) => number = (pcm: Float32Array): number => {
    let total: number = 0;
    for (let index: number = 2; index < pcm.length; index += 2)
      total += Math.abs(pcm[index]! - pcm[index - 2]!);
    return total;
  };

  const transform: (x: number) => IAutoMovieTransform = (x: number): IAutoMovieTransform => ({
    translation: { x, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  });

  const minimalTimeline: () => IAutoMovieFilmTimeline = (): IAutoMovieFilmTimeline =>
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

  const minimalContract: () => IAutoMovieShotContract = (): IAutoMovieShotContract =>
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

  const minimalCompiled: () => IAutoMovieCompiledShotSource = (): IAutoMovieCompiledShotSource =>
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
