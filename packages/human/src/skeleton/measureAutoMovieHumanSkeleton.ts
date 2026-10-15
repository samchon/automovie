import { IAutoMovieHumanLandmarks } from "../measure/IAutoMovieHumanLandmarks";
import { IAutoMovieHumanSkeletalMeasurements } from "../measure/IAutoMovieHumanSkeletalMeasurements";
import { measureAutoMovieHumanLandmarks } from "../measure/measureAutoMovieHumanLandmarks";
import { IAutoMovieHumanSkeleton } from "./IAutoMovieHumanSkeleton";
import { abductAutoMovieHumanArms } from "./abductAutoMovieHumanArms";

/**
 * Measure a generated skeleton the way its identity was measured.
 *
 * The rest skeleton stands in the T-pose. Span, fingertip to fingertip with the arms outstretched, is measured there; then the arms are lowered back to the anthropometric posture by the inverse of the conversion that raised them, and the landmarks are measured by `measureAutoMovieHumanLandmarks`. For a skeleton generated from an identity, every returned length equals the identity's own to floating-point precision; a difference means generation lost a measurement.
 *
 * @param skeleton Generated skeleton in the T-pose rest
 * @returns The skeletal measurements its landmarks give
 */
export function measureAutoMovieHumanSkeleton(
  skeleton: IAutoMovieHumanSkeleton,
): IAutoMovieHumanSkeletalMeasurements {
  const { left, right }: IAutoMovieHumanLandmarks = skeleton.landmarks;
  const measured: IAutoMovieHumanSkeletalMeasurements.IHanging = measureAutoMovieHumanLandmarks(
    abductAutoMovieHumanArms(skeleton, "lower", { left: 0, right: 0 }).landmarks,
  );
  return {
    ...measured,
    body: {
      ...measured.body,
      span: left.dactylion.position.x - right.dactylion.position.x,
    },
  };
}
