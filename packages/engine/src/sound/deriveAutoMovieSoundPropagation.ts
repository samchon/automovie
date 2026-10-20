import {
  IAutoMovieProductionSoundEvent,
  IAutoMovieSoundPropagationProfile,
} from "@automovie/interface";

/**
 * Derive distance gain, one film-clock arrival and the selected segment/spectral outcome.
 *
 * @evidence contracts/common.md#principled-implementation Finite nonnegative distance and a positive speed/fps feed distance/speed and one nearest-frame rounding; softened inverse-square gain and optional dB/metre attenuation follow the selected profile. Binary64 products can overflow to zero gain or underflow, and this is a declared approximation.
 * @evidence contracts/common.md#clear-and-simple-design The pure propagation owner keeps emission independent of audible arrival and preserves the production's carry/trim boundary choice for the mixer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Out-of-film arrival and unsupported numeric/profile choices throw; spectral none remains null instead of fabricated attenuation, and authored assumptions are required rather than inferred from a scene name.
 * @evidence contracts/common.md#meaningful-documentation States metres, safe whole-frame bounds, exclusive segment/film ends, arrival rounding and closed carry/trim/no-spectral meanings; this derives no room response or occlusion.
 * @evidence contracts/performance.md#efficient-algorithms A assumptions require O(A) string validation; delay/gain/spectral calculations and the fresh result have constant scalar cost/storage.
 * @evidence contracts/performance.md#reuse-equivalent-work One computed arrival and distance feed the returned receipt consumed by the mix; changed profile or clock inputs require a new derivation rather than a retained stateful propagation cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The result transfers to the caller by value; the profile/request is not retained and no acoustic device, host handle or scheduled arrival task is acquired.
 */
export const deriveAutoMovieSoundPropagation: (props: {
  distanceMeters: number;
  emissionFrame: number;
  segmentEndFrame: number;
  fps: number;
  totalFrames: number;
  profile: IAutoMovieSoundPropagationProfile;
}) => {
  profile: string;
  arrivalFrame: number;
  arrivalTimeSeconds: number;
  distanceGain: number;
  highFrequencyGain: number | null;
  boundary: "inside-segment" | "carried-across-cut" | "trimmed-at-segment";
} = (props: {
  /** Effective source/listener distance in metres. */
  distanceMeters: number;
  /** Exact story emission frame. */
  emissionFrame: number;
  /** Exclusive end of the owning film segment. */
  segmentEndFrame: number;
  /** Production frame rate. */
  fps: number;
  /** Exclusive finished-film frame bound. */
  totalFrames: number;
  /** Explicitly selected production propagation profile. */
  profile: IAutoMovieSoundPropagationProfile;
}): NonNullable<IAutoMovieProductionSoundEvent["propagation"]> => {
  assertFiniteNonnegative(props.distanceMeters, "sound propagation distance");
  assertInteger(props.emissionFrame, "sound propagation emission frame", 0);
  assertInteger(
    props.segmentEndFrame,
    "sound propagation segment end frame",
    props.emissionFrame + 1,
  );
  assertFinitePositive(props.fps, "sound propagation frame rate");
  assertInteger(props.totalFrames, "sound propagation total frames", 1);
  if (props.emissionFrame >= props.totalFrames)
    throw new Error("sound propagation emission frame lies outside the film");
  if (props.segmentEndFrame > props.totalFrames)
    throw new Error("sound propagation segment end lies outside the film");
  if (props.profile.id.trim().length === 0)
    throw new Error("sound propagation profile id must not be blank");
  assertFinitePositive(
    props.profile.speedOfSoundMetersPerSecond,
    "sound propagation speed",
  );
  if (props.profile.distanceGain.kind !== "softened-inverse-square-v1")
    throw new Error("sound propagation distance-gain law is unsupported");
  assertFiniteNonnegative(
    props.profile.distanceGain.coefficient,
    "sound propagation distance coefficient",
  );
  if (
    props.profile.assumptions.length === 0 ||
    props.profile.assumptions.some(
      (assumption: string): boolean => assumption.trim().length === 0,
    )
  )
    throw new Error(
      "sound propagation profile must state non-blank physical assumptions",
    );
  if (
    props.profile.segmentBoundary !== "carry-across-cut" &&
    props.profile.segmentBoundary !== "trim-at-segment"
  )
    throw new Error("sound propagation segment-boundary policy is unsupported");

  const delaySeconds: number =
    props.distanceMeters / props.profile.speedOfSoundMetersPerSecond;
  const arrivalFrame: number =
    props.emissionFrame + Math.round(delaySeconds * props.fps);
  if (arrivalFrame >= props.totalFrames)
    throw new Error(
      `sound propagation arrival frame ${arrivalFrame} lies outside the ${props.totalFrames}-frame film`,
    );
  const crossed: boolean = arrivalFrame >= props.segmentEndFrame;
  const boundary: NonNullable<
    IAutoMovieProductionSoundEvent["propagation"]
  >["boundary"] = crossed
    ? props.profile.segmentBoundary === "carry-across-cut"
      ? "carried-across-cut"
      : "trimmed-at-segment"
    : "inside-segment";

  let highFrequencyGain: number | null;
  if (props.profile.spectral.kind === "none") highFrequencyGain = null;
  else if (props.profile.spectral.kind === "broadband-high-frequency-v1") {
    assertFiniteNonnegative(
      props.profile.spectral.absorptionDbPerMeter,
      "sound propagation high-frequency absorption",
    );
    highFrequencyGain = Math.pow(
      10,
      (-props.profile.spectral.absorptionDbPerMeter * props.distanceMeters) /
        20,
    );
  } else throw new Error("sound propagation spectral law is unsupported");

  return {
    profile: props.profile.id,
    arrivalFrame,
    arrivalTimeSeconds: arrivalFrame / props.fps,
    distanceGain:
      1 /
      (1 +
        props.profile.distanceGain.coefficient *
          props.distanceMeters *
          props.distanceMeters),
    highFrequencyGain,
    boundary,
  };
};

/** Refuse a non-finite or nonpositive speed/frame-rate scalar before delay arithmetic; the caller supplies its diagnostic label. */
const assertFinitePositive: (value: number, label: string) => void = (
  value: number,
  label: string,
): void => {
  if (!Number.isFinite(value) || value <= 0)
    throw new Error(`${label} must be finite and positive`);
};

/** Refuse a non-finite or negative distance/absorption/coefficient scalar while preserving admitted zero. */
const assertFiniteNonnegative: (value: number, label: string) => void = (
  value: number,
  label: string,
): void => {
  if (!Number.isFinite(value) || value < 0)
    throw new Error(`${label} must be finite and non-negative`);
};

/** Require a safe whole frame value at or above the caller's bound, without rounding fractional or unsafe input. */
const assertInteger: (value: number, label: string, minimum: number) => void = (
  value: number,
  label: string,
  minimum: number,
): void => {
  if (!Number.isSafeInteger(value) || value < minimum)
    throw new Error(`${label} must be an integer at least ${minimum}`);
};
