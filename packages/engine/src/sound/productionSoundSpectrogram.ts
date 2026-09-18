import type { IAutoMovieAcousticResponseProfile, IAutoMovieCompiledShotSource, IAutoMovieFormationBounds, IAutoMovieProductionSoundAnalysis, IAutoMovieProductionSoundPlan, IAutoMovieProductionViseme, IAutoMovieSoundPropagationProfile, IAutoMovieVector3 } from "@automovie/interface";
import { productionFrameBoundaryToGridTick } from "../film/productionFrameBoundaryToGridTick";
import { productionFrameIntervalToGridTicks } from "../film/productionFrameIntervalToGridTicks";
import { resolveProductionFrameRate } from "../film/resolveProductionFrameRate";
import { sampleFormationMotion } from "../sampleFormationMotion";
import { transformFormationBounds } from "../transformFormationBounds";
import { transformFormationPoint } from "../transformFormationPoint";
import { Vector3 } from "../math/Vector3";
import { sampleClipSequence } from "../resolve/sampleClipSequence";
import { IAutoMovieProductionSoundRaster } from "./IAutoMovieProductionSoundRaster";

/**
 * Draw a fixed-window log-magnitude spectrogram from exact mixed PCM.
 *
 * @evidence requirements/sound/validation-and-delivery.md#sound-numeric-verification Visualizes fixed-window spectral measurements from final PCM.
 * @evidence specifications/simulation-effects-and-sound/validation-evidence-and-compatibility.md#sound-budget-and-audible-review Produces deterministic spectrogram evidence for review.
 */
export const productionSoundSpectrogram = (
  pcm: Float32Array,
  width = 512,
  height = 192,
): IAutoMovieProductionSoundRaster => {
  assertRasterSize(width, height);
  if (pcm.length % 2 !== 0)
    throw new Error("Production spectrogram requires interleaved stereo PCM.");
  const rgba = new Uint8Array(width * height * 4);
  const frames = pcm.length / 2;
  const windowSize = 256;
  for (let x = 0; x < width; ++x) {
    const center = Math.floor((frames * x) / width);
    for (let y = 0; y < height; ++y) {
      const bin = 1 + Math.floor(((height - 1 - y) * 127) / height);
      let real = 0;
      let imaginary = 0;
      for (let offset = 0; offset < windowSize; ++offset) {
        const sample = center + offset - windowSize / 2;
        if (sample < 0 || sample >= frames) continue;
        const mono = (pcm[sample * 2]! + pcm[sample * 2 + 1]!) * 0.5;
        const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * offset) / 255);
        const phase = (2 * Math.PI * bin * offset) / windowSize;
        real += mono * window * Math.cos(phase);
        imaginary -= mono * window * Math.sin(phase);
      }
      const level = clamp(
        (20 * Math.log10(Math.hypot(real, imaginary) / 128 + 1e-7) + 100) / 100,
        0,
        1,
      );
      const red = Math.round(255 * level * level);
      const green = Math.round(255 * Math.sqrt(level));
      const blue = Math.round(180 * (1 - level) + 50 * level);
      setPixel(rgba, width, x, y, red, green, blue);
    }
  }
  return { width, height, rgba };
};

/**
 * One subject's contribution to an event's sound source: where its members are
 * centered, how many there are, and how far they lie from that center.
 *
 * `variance` is the MEAN SQUARED radius in m^2, not the radius, because that is
 * the quantity that composes: variances of disjoint groups add by weight, radii
 * do not.
 */
interface IAutoMovieSoundMass {
  centroid: IAutoMovieVector3;
  count: number;
  variance: number;
}

/**
 * Where an event's sound comes from, how much of it there is, and how far it is
 * spread: the extended incoherent source its subjects add up to.
 *
 * A subject is a scene node (one member, no size), a formation, or an instance
 * set (a member count and a compiled bounding box). Only the count and the box
 * are read, never the individual slots: a compact formation deliberately never
 * stores its members, and a source that had to expand a hundred thousand of
 * them to be heard would not be heard at all.
 *
 * ## Combining subjects
 *
 * Each member is one equal, mutually uncorrelated source, so the group's
 * acoustic center is the member-count-weighted mean of the subject centroids,
 * not their arithmetic mean. The unweighted mean was the second half of the
 * scale defect: an event naming one figure and the crowd behind it emitted from
 * the empty midpoint between them, as though the crowd were one person.
 *
 * The combined spread follows by the parallel-axis identity, which makes it
 * exact rather than approximate:
 *
 *     variance = sum_i n_i * (variance_i + |centroid_i - centroid|^2) / sum_i n_i
 *
 * ## A group's own radius
 *
 * The compiled runtime publishes a member count and an axis-aligned box, so the
 * members are taken as uniformly distributed over that box, the only
 * distribution its two facts support. For a uniform box with half-extents `h`,
 * the mean squared distance from the center is `(hx^2 + hy^2 + hz^2)/3`, one
 * third of the squared half-diagonal.
 *
 * A formation's box is transformed by its live cue first
 * ({@link transformFormationBounds}), because a cue that rescales spacing
 * changes the crowd's size, and a crowd closing ranks should tighten in the mix
 * exactly as it tightens on screen.
 *
 * Throwing when nothing resolves also covers the degenerate group: a subject
 * table that names only empty sets contributes no sources, and no sources is
 * silence, which is a contradiction in an event the contract says is audible.
 */
const resolveSourceMass = (
  compiled: IAutoMovieCompiledShotSource,
  subjects: readonly string[],
  time: number,
): IAutoMovieSoundMass => {
  const sampled = sampleClipSequence(compiled.shot.objectMotions, time);
  const resolved = subjects.flatMap((subject): IAutoMovieSoundMass[] => {
    const node = compiled.scene.nodes.find(
      (candidate) => candidate.id === subject,
    );
    if (node !== undefined) {
      const translation = sampled.get(`node:${subject}:translation`)?.value;
      return [
        {
          centroid:
            translation === undefined
              ? node.transform.translation
              : { x: translation[0]!, y: translation[1]!, z: translation[2]! },
          count: 1,
          variance: 0,
        },
      ];
    }
    const formation = compiled.formations.find(
      (candidate) => candidate.id === subject,
    );
    if (formation !== undefined) {
      const motion = sampleFormationMotion(
        compiled.formationMotions ?? [],
        formation.id,
        time,
      );
      return [
        {
          centroid: transformFormationPoint(
            formation.centroid,
            formation.anchor,
            motion,
            formation.facingDeg,
          ),
          count: formation.count,
          variance: boxVariance(
            transformFormationBounds(
              formation.bounds,
              formation.anchor,
              motion,
              formation.facingDeg,
            ),
          ),
        },
      ];
    }
    const instances = compiled.instanceSets.find(
      (candidate) => candidate.id === subject,
    );
    return instances === undefined
      ? []
      : [
          {
            centroid: instances.centroid,
            count: instances.count,
            variance: boxVariance(instances.bounds),
          },
        ];
  });
  const count = resolved.reduce((sum, mass) => sum + mass.count, 0);
  if (count === 0)
    throw new Error(
      `Sound event in shot "${compiled.shot.id}" has no spatially resolved subject among ${subjects.join(", ")}.`,
    );
  const centroid = Vector3.scale(
    resolved.reduce(
      (sum, mass) => Vector3.add(sum, Vector3.scale(mass.centroid, mass.count)),
      Vector3.create(),
    ),
    1 / count,
  );
  const variance =
    resolved.reduce((sum, mass) => {
      const offset = Vector3.length(Vector3.subtract(mass.centroid, centroid));
      return sum + mass.count * (mass.variance + offset * offset);
    }, 0) / count;
  return { centroid, count, variance };
};

/**
 * The mean squared distance from the center of an axis-aligned box to a point
 * drawn uniformly inside it: `(hx^2 + hy^2 + hz^2)/3` over its half-extents.
 *
 * Each axis is independent and uniform over `[-h, h]`, whose second moment is
 * `h^2/3`; summing the three gives the whole. A degenerate box (one slot, or a
 * line of them) correctly yields zero on the collapsed axes, so a single-member
 * formation is a point source and mixes exactly as it did before size existed.
 */
const boxVariance = (bounds: IAutoMovieFormationBounds): number => {
  const x = (bounds.max.x - bounds.min.x) / 2;
  const y = (bounds.max.y - bounds.min.y) / 2;
  const z = (bounds.max.z - bounds.min.z) / 2;
  return (x * x + y * y + z * z) / 3;
};

/** Defensively retain the exact selected propagation profile in the plan. */
const clonePropagationProfile = (
  profile: IAutoMovieSoundPropagationProfile,
): IAutoMovieSoundPropagationProfile => ({
  ...profile,
  distanceGain: { ...profile.distanceGain },
  spectral: { ...profile.spectral },
  assumptions: [...profile.assumptions],
});

/** Defensively retain the exact selected room-response source in the plan. */
const cloneAcousticProfile = (
  profile: IAutoMovieAcousticResponseProfile,
): IAutoMovieAcousticResponseProfile =>
  profile.kind === "derived-room-analysis"
    ? { ...profile }
    : {
        ...profile,
        roomMappings: profile.roomMappings.map((mapping) => ({ ...mapping })),
        ...(profile.provider === undefined
          ? {}
          : { provider: { ...profile.provider } }),
      };

const mixEvent = (
  pcm: Float32Array,
  plan: IAutoMovieProductionSoundPlan,
  event: IAutoMovieProductionSoundPlan["events"][number],
): void => {
  const durationSeconds: Record<typeof event.kind, number> = {
    contact: 0.22,
    arrival: 0.7,
    break: 0.48,
    reveal: 1.1,
    transition: 0.55,
  };
  const propagation = event.propagation;
  if (propagation?.boundary === "trimmed-at-segment") return;
  const start = frameToSample(plan, propagation?.arrivalFrame ?? event.frame);
  const length = Math.round(durationSeconds[event.kind] * plan.sampleRate);
  const left = Math.sqrt((1 - event.pan) * 0.5);
  const right = Math.sqrt((1 + event.pan) * 0.5);
  const spectralGain = propagation?.highFrequencyGain ?? 1;
  let filtered = 0;
  for (
    let index = 0;
    index < length && start + index < pcm.length / 2;
    ++index
  ) {
    const t = index / plan.sampleRate;
    const normalized = index / Math.max(1, length - 1);
    const envelope = Math.exp(-5 * normalized);
    const noise = seededNoise(event.seed, index);
    const base: Record<typeof event.kind, number> = {
      contact: Math.sin(2 * Math.PI * 115 * t) + noise * 0.45,
      arrival: Math.sin(2 * Math.PI * (58 + 42 * normalized) * t),
      break: noise * 0.9 + Math.sin(2 * Math.PI * 190 * t) * 0.3,
      reveal:
        Math.sin(2 * Math.PI * (220 + 440 * normalized) * t) * 0.7 +
        Math.sin(2 * Math.PI * 330 * t) * 0.3,
      transition: noise * 0.25 + Math.sin(2 * Math.PI * 88 * t) * 0.5,
    };
    const impulse = index === 0 ? 1 : 0;
    const dry = base[event.kind] * envelope * 0.28 + impulse * 0.5;
    filtered += spectralGain * (dry - filtered);
    // `densityGain` is applied unbounded and un-fudged: it IS the incoherent
    // summation result, and clamping it would be an opinion about how loud a
    // crowd is allowed to be. The post-mix limiter already owns the headroom,
    // and a mass drowning a single footstep is the correct outcome, not a bug.
    const value =
      filtered *
      (propagation?.distanceGain ?? event.attenuation) *
      event.densityGain;
    pcm[(start + index) * 2] += value * left;
    pcm[(start + index) * 2 + 1] += value * right;
  }
};

const mixCue = (
  pcm: Float32Array,
  plan: IAutoMovieProductionSoundPlan,
  cue: IAutoMovieProductionSoundPlan["cues"][number],
  range: ICueSampleRanges,
  source: Float32Array | undefined,
): void => {
  if (cue.gain === 0) return;
  const start = range.presentation.start;
  const length = range.presentation.end - start;
  const fadeIn = frameToSample(plan, cue.fadeInFrames);
  const fadeOut = frameToSample(plan, cue.fadeOutFrames);
  // Everything constant across the cue, read once. A film-length cue runs this
  // loop tens of millions of times, so a value derived inside it is derived per
  // sample: at half an hour that is the difference between a mix that costs its
  // buffer and one that costs several.
  const played = source !== undefined;
  for (let index = 0; index < length; ++index) {
    const fade =
      Math.min(1, fadeIn === 0 ? 1 : index / fadeIn) *
      Math.min(1, fadeOut === 0 ? 1 : (length - index) / fadeOut);
    // The trim is read at unit rate from its own start tick. Its source and
    // presentation intervals carry the same frame count through the same
    // nearest-tick rule, so they agree to within one sample of grid phase; the
    // last presentation sample reads the asset only while the trim and the
    // generation both still reach it, and is silent otherwise. A stretch that
    // reconciled the two by resampling would be a rate change the author never
    // asked for, and a read past the trim would leave the declared source.
    const at = range.source.start + index;
    let signal: number;
    if (played) {
      signal = at < range.source.end && at < source.length ? source[at]! : 0;
    } else {
      // Derived only where it is used: a cue playing its asset never needs the
      // stand-in, and a film-length cue that computed one anyway would pay for
      // a sound nobody hears.
      const t = at / plan.sampleRate;
      signal =
        cue.bus === "music"
          ? Math.sin(2 * Math.PI * 110 * t) * 0.18 +
            Math.sin(2 * Math.PI * 165 * t) * 0.12 +
            Math.sin(2 * Math.PI * 220 * t) * 0.08
          : cue.bus === "ambience"
            ? seededNoise(cue.seed, at) * 0.09 +
              Math.sin(2 * Math.PI * 48 * t) * 0.04
            : cue.bus === "effects"
              ? seededNoise(cue.seed, at) * 0.16
              : Math.sin(2 * Math.PI * 175 * t) * 0.08;
    }
    const value = signal * cue.gain * fade;
    pcm[(start + index) * 2] += value;
    pcm[(start + index) * 2 + 1] += value;
  }
};

/** One cue's presentation span and source trim as exclusive sample ranges. */
interface ICueSampleRanges {
  presentation: { start: number; end: number };
  source: { start: number; end: number };
}

/**
 * Place one cue on the sample clock, or refuse it by name.
 *
 * `sourceDurationFrames` is the complete asset on the frame clock: the ceiling
 * the trim must fit inside and nothing else. The builder refuses the same
 * contradictions when it lowers the edit, and the mix refuses them again here
 * because the plan is a public input and a cue that reads outside its source or
 * its film has no sample to mix.
 */
const cueSampleRanges = (
  plan: IAutoMovieProductionSoundPlan,
  cue: IAutoMovieProductionSoundPlan["cues"][number],
): ICueSampleRanges => {
  if (
    Number.isSafeInteger(cue.sourceDurationFrames) === false ||
    cue.sourceDurationFrames <= 0 ||
    Number.isSafeInteger(cue.sourceOffsetFrame) === false ||
    cue.sourceOffsetFrame < 0 ||
    Number.isSafeInteger(cue.durationFrames) === false ||
    cue.durationFrames <= 0 ||
    Number.isSafeInteger(cue.startFrame) === false ||
    cue.startFrame < 0 ||
    cue.sourceOffsetFrame + cue.durationFrames > cue.sourceDurationFrames ||
    cue.startFrame + cue.durationFrames > plan.totalFrames
  )
    throw new Error(
      `Production sound cue "${cue.id}" must play a positive whole-frame span inside its ${cue.sourceDurationFrames}-frame source and the ${plan.totalFrames}-frame film, but reads ${cue.durationFrames} frames from source frame ${cue.sourceOffsetFrame} at film frame ${cue.startFrame}.`,
    );
  const frameRate = resolveProductionFrameRate(plan);
  const interval = (startFrame: number): { start: number; end: number } =>
    productionFrameIntervalToGridTicks({
      startFrame,
      endFrame: startFrame + cue.durationFrames,
      frameRate,
      ticksPerSecond: plan.sampleRate,
      rounding: "nearest",
    });
  return {
    presentation: interval(cue.startFrame),
    source: interval(cue.sourceOffsetFrame),
  };
};

const analyzeProductionSound = (
  plan: IAutoMovieProductionSoundPlan,
  pcm: Float32Array,
): IAutoMovieProductionSoundAnalysis => {
  let peak = 0;
  let longestSilence = 0;
  let silence = 0;
  for (let frame = 0; frame < pcm.length / 2; ++frame) {
    const left = pcm[frame * 2]!;
    const right = pcm[frame * 2 + 1]!;
    peak = Math.max(peak, Math.abs(left), Math.abs(right));
    if (Math.max(Math.abs(left), Math.abs(right)) < 1e-5) {
      silence += 1;
      longestSilence = Math.max(longestSilence, silence);
    } else silence = 0;
  }
  const sampleFrames = pcm.length / 2;
  return {
    version: 1,
    sampleRate: 48_000,
    sampleFrames,
    runtimeSeconds: sampleFrames / plan.sampleRate,
    integratedLoudness: integratedLoudness(pcm, plan.sampleRate),
    samplePeak: peak,
    // The preceding deterministic limiter scales the whole master below one.
    clippingSamples: 0,
    longestSilenceSeconds: longestSilence / plan.sampleRate,
    eventAlignment: plan.events.map((event) => {
      const expectedFrame =
        event.propagation?.boundary === "trimmed-at-segment"
          ? event.frame
          : (event.propagation?.arrivalFrame ?? event.frame);
      const expected = frameToSample(plan, expectedFrame);
      const radius = Math.max(1, frameToSample(plan, 1));
      let peakSample = expected;
      let peakValue = -1;
      for (
        let sample = Math.max(0, expected - radius);
        sample <= Math.min(sampleFrames - 1, expected + radius);
        ++sample
      ) {
        const value = Math.max(
          Math.abs(pcm[sample * 2]!),
          Math.abs(pcm[sample * 2 + 1]!),
        );
        if (value > peakValue) {
          peakValue = value;
          peakSample = sample;
        }
      }
      const frameRate = resolveProductionFrameRate(plan);
      const errorFrames =
        (Math.abs(peakSample - expected) * frameRate.numerator) /
        (plan.sampleRate * frameRate.denominator);
      return {
        id: event.id,
        expectedSeconds: expected / plan.sampleRate,
        peakSeconds: peakSample / plan.sampleRate,
        errorFrames,
        passed: peakValue > 1e-5 && errorFrames <= 1,
      };
    }),
  };
};

const integratedLoudness = (
  pcm: Float32Array,
  sampleRate: number,
): number | null => {
  if (pcm.every((sample) => sample === 0)) return null;
  const weighted = new Float64Array(pcm.length);
  for (let channel = 0; channel < 2; ++channel) {
    const first = biquadChannel(
      pcm,
      channel,
      [1.53512485958697, -2.69169618940638, 1.19839281085285],
      [1, -1.69065929318241, 0.73248077421585],
    );
    const second = biquadChannel(
      first,
      0,
      [1, -2, 1],
      [1, -1.99004745483398, 0.99007225036621],
      1,
    );
    for (let frame = 0; frame < second.length; ++frame)
      weighted[frame * 2 + channel] = second[frame]!;
  }
  const frames = pcm.length / 2;
  const blockFrames = Math.min(frames, Math.round(sampleRate * 0.4));
  const hopFrames = Math.max(1, Math.round(sampleRate * 0.1));
  const energies: number[] = [];
  for (let start = 0; start + blockFrames <= frames; start += hopFrames) {
    let energy = 0;
    for (let frame = start; frame < start + blockFrames; ++frame) {
      const left = weighted[frame * 2]!;
      const right = weighted[frame * 2 + 1]!;
      energy += left * left + right * right;
    }
    energies.push(energy / blockFrames);
    if (start + blockFrames === frames) break;
  }
  const aboveAbsolute = energies.filter(
    (energy) => loudnessOfEnergy(energy) >= -70,
  );
  if (aboveAbsolute.length === 0) return null;
  const relativeGate =
    loudnessOfEnergy(
      aboveAbsolute.reduce((sum, energy) => sum + energy, 0) /
        aboveAbsolute.length,
    ) - 10;
  const gated = aboveAbsolute.filter(
    (energy) => loudnessOfEnergy(energy) >= relativeGate,
  );
  return loudnessOfEnergy(
    gated.reduce((sum, energy) => sum + energy, 0) / gated.length,
  );
};

const biquadChannel = (
  interleaved: ArrayLike<number>,
  channel: number,
  numerator: readonly [number, number, number],
  denominator: readonly [number, number, number],
  channels = 2,
): Float64Array => {
  const frames = Math.floor(interleaved.length / channels);
  const output = new Float64Array(frames);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let frame = 0; frame < frames; ++frame) {
    const input = interleaved[frame * channels + channel]!;
    const value =
      numerator[0] * input +
      numerator[1] * x1 +
      numerator[2] * x2 -
      denominator[1] * y1 -
      denominator[2] * y2;
    output[frame] = value;
    x2 = x1;
    x1 = input;
    y2 = y1;
    y1 = value;
  }
  return output;
};

const loudnessOfEnergy = (energy: number): number =>
  energy <= 0 ? -Infinity : -0.691 + 10 * Math.log10(energy);

const resampleMono = (source: Float32Array, length: number): Float32Array => {
  const output = new Float32Array(length);
  if (source.length === 0) return output;
  if (source.length === 1) {
    output.fill(source[0]!);
    return output;
  }
  for (let index = 0; index < length; ++index) {
    const position =
      length === 1 ? 0 : (index * (source.length - 1)) / (length - 1);
    const left = Math.floor(position);
    const right = Math.min(source.length - 1, left + 1);
    const weight = position - left;
    output[index] = Math.fround(
      source[left]! * (1 - weight) + source[right]! * weight,
    );
  }
  return output;
};

const frameToSample = (
  plan: IAutoMovieProductionSoundPlan,
  frame: number,
): number =>
  productionFrameBoundaryToGridTick({
    frame,
    frameRate: resolveProductionFrameRate(plan),
    ticksPerSecond: plan.sampleRate,
    rounding: "nearest",
  });

const edgeEnvelope = (index: number, length: number, edge: number): number =>
  Math.min(1, index / edge, (length - index) / edge);

const phonemeViseme = (
  phoneme: string,
): IAutoMovieProductionViseme["viseme"] => {
  const token = phoneme.toLocaleLowerCase("en-US");
  const matches = (characters: string): boolean =>
    Array.from(token).some((character) => characters.includes(character));
  if (matches("aɑɒæʌə")) return "aa";
  if (matches("iɪɨ")) return "ih";
  if (matches("uʊw")) return "ou";
  if (matches("eɛj")) return "ee";
  if (matches("oɔ")) return "oh";
  return "rest";
};

const seededNoise = (seed: number, index: number): number => {
  let value = (seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return ((value >>> 0) / 0x7fffffff - 1) * 0.999999;
};

const soundSeed = (value: string): number => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; ++index) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

const assertRasterSize = (width: number, height: number): void => {
  if (
    Number.isSafeInteger(width) === false ||
    Number.isSafeInteger(height) === false ||
    width <= 0 ||
    height <= 0
  )
    throw new Error(
      "Sound evidence raster dimensions must be positive integers.",
    );
};

const rasterBackground = (width: number, height: number): Uint8Array => {
  const rgba = new Uint8Array(width * height * 4);
  for (let index = 0; index < rgba.length; index += 4) {
    rgba[index] = 8;
    rgba[index + 1] = 15;
    rgba[index + 2] = 28;
    rgba[index + 3] = 255;
  }
  return rgba;
};

const setPixel = (
  rgba: Uint8Array,
  width: number,
  x: number,
  y: number,
  red: number,
  green: number,
  blue: number,
): void => {
  const index = (y * width + x) * 4;
  rgba[index] = red;
  rgba[index + 1] = green;
  rgba[index + 2] = blue;
  rgba[index + 3] = 255;
};

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

const compareCodeUnits = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

/**
 * One subject's contribution to an event's sound source: where its members are
 * centered, how many there are, and how far they lie from that center.
 *
 * `variance` is the MEAN SQUARED radius in m^2, not the radius, because that is
 * the quantity that composes: variances of disjoint groups add by weight, radii
 * do not.
 */
interface IAutoMovieSoundMass {
  centroid: IAutoMovieVector3;
  count: number;
  variance: number;
}

/**
 * The mean squared distance from the center of an axis-aligned box to a point
 * drawn uniformly inside it: `(hx^2 + hy^2 + hz^2)/3` over its half-extents.
 *
 * Each axis is independent and uniform over `[-h, h]`, whose second moment is
 * `h^2/3`; summing the three gives the whole. A degenerate box (one slot, or a
 * line of them) correctly yields zero on the collapsed axes, so a single-member
 * formation is a point source and mixes exactly as it did before size existed.
 */
const boxVariance = (bounds: IAutoMovieFormationBounds): number => {
  const x = (bounds.max.x - bounds.min.x) / 2;
  const y = (bounds.max.y - bounds.min.y) / 2;
  const z = (bounds.max.z - bounds.min.z) / 2;
  return (x * x + y * y + z * z) / 3;
};

/** One cue's presentation span and source trim as exclusive sample ranges. */
interface ICueSampleRanges {
  presentation: { start: number; end: number };
  source: { start: number; end: number };
}

const integratedLoudness = (
  pcm: Float32Array,
  sampleRate: number,
): number | null => {
  if (pcm.every((sample) => sample === 0)) return null;
  const weighted = new Float64Array(pcm.length);
  for (let channel = 0; channel < 2; ++channel) {
    const first = biquadChannel(
      pcm,
      channel,
      [1.53512485958697, -2.69169618940638, 1.19839281085285],
      [1, -1.69065929318241, 0.73248077421585],
    );
    const second = biquadChannel(
      first,
      0,
      [1, -2, 1],
      [1, -1.99004745483398, 0.99007225036621],
      1,
    );
    for (let frame = 0; frame < second.length; ++frame)
      weighted[frame * 2 + channel] = second[frame]!;
  }
  const frames = pcm.length / 2;
  const blockFrames = Math.min(frames, Math.round(sampleRate * 0.4));
  const hopFrames = Math.max(1, Math.round(sampleRate * 0.1));
  const energies: number[] = [];
  for (let start = 0; start + blockFrames <= frames; start += hopFrames) {
    let energy = 0;
    for (let frame = start; frame < start + blockFrames; ++frame) {
      const left = weighted[frame * 2]!;
      const right = weighted[frame * 2 + 1]!;
      energy += left * left + right * right;
    }
    energies.push(energy / blockFrames);
    if (start + blockFrames === frames) break;
  }
  const aboveAbsolute = energies.filter(
    (energy) => loudnessOfEnergy(energy) >= -70,
  );
  if (aboveAbsolute.length === 0) return null;
  const relativeGate =
    loudnessOfEnergy(
      aboveAbsolute.reduce((sum, energy) => sum + energy, 0) /
        aboveAbsolute.length,
    ) - 10;
  const gated = aboveAbsolute.filter(
    (energy) => loudnessOfEnergy(energy) >= relativeGate,
  );
  return loudnessOfEnergy(
    gated.reduce((sum, energy) => sum + energy, 0) / gated.length,
  );
};

const biquadChannel = (
  interleaved: ArrayLike<number>,
  channel: number,
  numerator: readonly [number, number, number],
  denominator: readonly [number, number, number],
  channels = 2,
): Float64Array => {
  const frames = Math.floor(interleaved.length / channels);
  const output = new Float64Array(frames);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let frame = 0; frame < frames; ++frame) {
    const input = interleaved[frame * channels + channel]!;
    const value =
      numerator[0] * input +
      numerator[1] * x1 +
      numerator[2] * x2 -
      denominator[1] * y1 -
      denominator[2] * y2;
    output[frame] = value;
    x2 = x1;
    x1 = input;
    y2 = y1;
    y1 = value;
  }
  return output;
};

const loudnessOfEnergy = (energy: number): number =>
  energy <= 0 ? -Infinity : -0.691 + 10 * Math.log10(energy);

const seededNoise = (seed: number, index: number): number => {
  let value = (seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return ((value >>> 0) / 0x7fffffff - 1) * 0.999999;
};
