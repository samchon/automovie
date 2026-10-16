import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { AUTOMOVIE_HUMAN_THIGH_GIRTH } from "./AUTOMOVIE_HUMAN_THIGH_GIRTH";
import { AutoMovieHumanSide } from "./AutoMovieHumanSide";
import { IAutoMovieHumanRingShape } from "./IAutoMovieHumanRingShape";

/**
 * Shared opposite supports around the thigh's common mid-thigh ring.
 *
 * Preserve the leg's existing convention: a collar twelve percent of the vertical interval from the ring to suprapatella, projected onto the shared hip-to-knee bone axis. Both producers consume the resulting physical span; independent thigh length, girths and patella landmark remain independent. This support convention is not a clinical muscle or tendon measurement.
 *
 * @param props Existing shared ring, resolved measurements and rest skeleton
 * @returns One distance and opposite collar centres, all millimetres
 */
export function thighAutoMovieHumanCollar(props: {
  measurements: IAutoMovieHumanMeasurements;
  skeleton: IAutoMovieHumanSkeleton;
  side: AutoMovieHumanSide;
  ring: IAutoMovieHumanRingShape;
}): {
  distance: number;
  axis: IAutoMovieVector3;
  proximal: IAutoMovieVector3;
  distal: IAutoMovieVector3;
} {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const joint: (name: string) => IAutoMovieVector3 = (
    name: string,
  ): IAutoMovieVector3 => {
    const value: IAutoMovieHumanSkeleton.IJoint | undefined =
      props.skeleton.joints.find(
        (j: IAutoMovieHumanSkeleton.IJoint): boolean =>
          j.bone === `${props.side}${name}`,
      );
    if (value === undefined)
      throw new Error(`skeleton lacks ${props.side}${name}`);
    return value.position;
  };
  const axis: IAutoMovieVector3 = V.normalize(
    V.offset(joint("LowerLeg"), [joint("UpperLeg"), -1]),
  );
  const leg: typeof props.measurements.identity.body.leftLeg =
    props.side === "left"
      ? props.measurements.identity.body.leftLeg
      : props.measurements.identity.body.rightLeg;
  const landmarks: typeof props.skeleton.landmarks.left =
    props.side === "left"
      ? props.skeleton.landmarks.left
      : props.skeleton.landmarks.right;
  const supra: number =
    landmarks.patella.position.y +
    AUTOMOVIE_HUMAN_THIGH_GIRTH.suprapatella * leg.thighLength;
  // The old support was a vertical height fraction. Dividing by the distal
  // axis's downward component converts that interval into a physical span.
  const distance: number =
    (0.12 * (props.ring.frame.origin.y - supra)) / -axis.y;
  if (!(distance > 0) || !Number.isFinite(distance))
    throw new Error("thigh collar needs a positive standing support interval");
  return {
    distance,
    axis,
    proximal: V.offset(props.ring.frame.origin, [axis, -distance]),
    distal: V.offset(props.ring.frame.origin, [axis, distance]),
  };
}
