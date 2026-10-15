import { IAutoMovieHumanLandmarks } from "../measure/IAutoMovieHumanLandmarks";
import { IAutoMovieHumanSkeletalMeasurements } from "../measure/IAutoMovieHumanSkeletalMeasurements";
import { measureAutoMovieHumanLandmarks } from "../measure/measureAutoMovieHumanLandmarks";
import { IAutoMovieHumanSkeleton } from "./IAutoMovieHumanSkeleton";
import { abductAutoMovieHumanArms } from "./abductAutoMovieHumanArms";

/**
 * Measure a generated skeleton the way its identity was measured.
 *
 * The rest skeleton stands in the T-pose. Span, fingertip to fingertip with the arms outstretched, is measured there; then the arms are lowered 90 degrees about the shoulder joint centres back to the anthropometric posture by the same conversion that raised them, sliding back out by the distance each shoulder joint centre stands inside its acromion, and the landmarks are measured by `measureAutoMovieHumanLandmarks`. For a skeleton generated from an identity, every returned length equals the identity's own to floating-point precision; a difference means generation lost a measurement.
 *
 * @param skeleton Generated skeleton in the T-pose rest
 * @returns The skeletal measurements its landmarks give
 */
export function measureAutoMovieHumanSkeleton(
  skeleton: IAutoMovieHumanSkeleton,
): IAutoMovieHumanSkeletalMeasurements {
  const { left, right }: IAutoMovieHumanLandmarks = skeleton.landmarks;
  // a hanging shoulder joint centre stands under its acromion, so the T-pose gap is the slide
  const inside: (side: "left" | "right") => number = (
    side: "left" | "right",
  ): number => {
    const shoulder: IAutoMovieHumanSkeleton.IJoint = skeleton.joints.find(
      (joint: IAutoMovieHumanSkeleton.IJoint): boolean =>
        joint.bone === `${side}UpperArm`,
    )!;
    return (
      (side === "left" ? 1 : -1) *
      (skeleton.landmarks[side].acromion.position.x - shoulder.position.x)
    );
  };
  const measured: IAutoMovieHumanSkeletalMeasurements.IHanging = measureAutoMovieHumanLandmarks(
    abductAutoMovieHumanArms(skeleton, -90, {
      left: inside("left"),
      right: inside("right"),
    }).landmarks,
  );
  return {
    ...measured,
    body: {
      ...measured.body,
      span: left.dactylion.position.x - right.dactylion.position.x,
    },
  };
}
