import {
  type IAutoMovieDeriveSoundPropagation,
  IAutoMovieProductionSoundEvent,
} from "@automovie/interface";

/*
 * Derive distance gain, one film-clock arrival and the selected
 * segment/spectral outcome.
 */
export const deriveSoundPropagation: (
  props: IAutoMovieDeriveSoundPropagation.IProps,
) => {
  profile: string;
  arrivalFrame: number;
  arrivalTimeSeconds: number;
  distanceGain: number;
  highFrequencyGain: number | null;
  boundary: "inside-segment" | "carried-across-cut" | "trimmed-at-segment";
} = (
  props: IAutoMovieDeriveSoundPropagation.IProps,
): NonNullable<IAutoMovieProductionSoundEvent["propagation"]> => {
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

/*
 * Refuse a non-finite or nonpositive speed/frame-rate scalar before delay
 * arithmetic; the caller supplies its diagnostic label.
 */
const assertFinitePositive: (value: number, label: string) => void = (
  value: number,
  label: string,
): void => {
  if (value <= 0) throw new Error(`${label} must be finite and positive`);
};

/*
 * Refuse a non-finite or negative distance/absorption/coefficient scalar while
 * preserving admitted zero.
 */
const assertFiniteNonnegative: (value: number, label: string) => void = (
  value: number,
  label: string,
): void => {
  if (value < 0) throw new Error(`${label} must be finite and non-negative`);
};

/*
 * Require a safe whole frame value at or above the caller's bound, without
 * rounding fractional or unsafe input.
 */
const assertInteger: (value: number, label: string, minimum: number) => void = (
  value: number,
  label: string,
  minimum: number,
): void => {
  if (value < minimum)
    throw new Error(`${label} must be an integer at least ${minimum}`);
};
