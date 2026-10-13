import {
  IAutoMovieProductionSoundPlan,
} from "@automovie/interface";

/**
 * Construct independent typed audio inputs for the decoded cue unit consumers.
 * Each call returns fresh mutable plans and caller-owned PCM builders; it does
 * not execute a mix, cache a result, or supply an expected production output.
 */
export const createProductionSoundAssetTestInputs = (clock: {
  /** Film frames per second; PCM stays on the48000Hz native sample clock. */
  fps?: number;

  /** Exclusive film frame bound used by this consumer. */
  totalFrames?: number;

  /** Default cue presentation start on the film clock. */
  startFrame?: number;

  /** Default cue presentation and complete-source span. */
  durationFrames?: number;
} = {}) => {
  const FPS = clock.fps ?? 24;

  const SAMPLE_RATE = 48_000;

  const SAMPLES_PER_FRAME = SAMPLE_RATE / FPS;

  /** Cue presentation boundary, independently of the source trim. */
  const START_FRAME = clock.startFrame ?? 1;

  /** How many film frames the cue occupies. */
  const DURATION_FRAMES = clock.durationFrames ?? 2;

  /** How many film frames the plan runs. */
  const TOTAL_FRAMES = clock.totalFrames ?? 6;

  /**
   * One plan carrying one authored cue and nothing else.
   *
   * No events and no dialogue, so every sample in the render is the cue's or is
   * silence: a reading of this mix is a reading of the cue rather than of what
   * happened to be summed beside it.
   */
  const plan = (props: {
    sourceDurationFrames?: number;
    sourceOffsetFrame?: number;
    startFrame?: number;
    durationFrames?: number;
    gain?: number;
  }): IAutoMovieProductionSoundPlan => ({
    version: 1,
    inputFingerprint: "sha256:asset",
    fps: FPS,
    totalFrames: TOTAL_FRAMES,
    sampleRate: SAMPLE_RATE,
    channels: 2,
    events: [],
    dialogue: [],
    cues: [
      {
        id: "bed",
        asset: "public/bed.wav",
        startFrame: props.startFrame ?? START_FRAME,
        durationFrames: props.durationFrames ?? DURATION_FRAMES,
        sourceOffsetFrame: props.sourceOffsetFrame ?? 0,
        sourceDurationFrames: props.sourceDurationFrames ?? DURATION_FRAMES,
        gain: props.gain ?? 1,
        fadeInFrames: 0,
        fadeOutFrames: 0,
        bus: "ambience",
        seed: 7,
      },
    ],
  });

  /**
   * The same single-cue plan on the NTSC film clock, where one frame is 1601.6
   * samples and no frame boundary but the multiples of five lands on a sample.
   */
  const ntscPlan = (props: {
    sourceDurationFrames: number;
    sourceOffsetFrame: number;
    startFrame: number;
  }): IAutoMovieProductionSoundPlan => ({
    ...plan({ ...props, durationFrames: 1 }),
    fps: 30_000 / 1_001,
    frameRate: { numerator: 30_000, denominator: 1_001 },
    totalFrames: 6,
  });

  /**
   * A source whose every sample states its own index and none is zero.
   *
   * A constant would be mixed correctly by a renderer that read the wrong sample,
   * and a sine would be mixed nearly correctly by one that read a neighbouring
   * sample. A ramp makes the value carry the position, so where the mix read is
   * legible in what it wrote, and a ramp that never reaches zero keeps a read
   * sample distinguishable from silence.
   */
  const ramp = (length: number): Float32Array =>
    Float32Array.from({ length }, (_, index) => (index + 1) / (length + 1));

  /** The mixed sample at one offset into the cue, taken from the left channel. */
  const at = (pcm: Float32Array, offset: number): number =>
    pcm[Math.round((START_FRAME * SAMPLES_PER_FRAME + offset) * 2)]!;

  /** The left-channel mixed sample at one absolute sample index. */
  const sample = (pcm: Float32Array, index: number): number => pcm[index * 2]!;

  return { FPS, SAMPLE_RATE, SAMPLES_PER_FRAME, START_FRAME, DURATION_FRAMES, TOTAL_FRAMES, plan, ntscPlan, ramp, at, sample };
};
