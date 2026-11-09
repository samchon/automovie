import {
  Quaternion,
  Vector3,
  derivePhysicalActuators,
  quaternionFromAutoMovieBasis,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import type { AutoMovieHumanPhysicalProfile as Provider } from "./AutoMovieHumanPhysicalProfile";
import type { IAutoMovieHumanPhysicalSource as Source } from "./IAutoMovieHumanPhysicalSource";

/**
 * Derive native-neutral joint frames from the source's probed angular
 * coordinates and clinical domains. The first coordinate fixes the frame's x
 * axis, the second its y axis after removing its x component, and z completes
 * the right-handed basis. A coordinate whose axis is not one of those basis
 * directions within 1e-5 is refused, because a native joint actuates only
 * orthogonal axes; a coordinate opposite its basis axis keeps its channel by a
 * negative `coordinateSign` and mirrored limits.
 */
export function deriveAutoMovieHumanPhysicalJoints(
  source: Source,
  segments: P.ISegment[],
  options: Provider.IOptions,
): P.IJoint[] {
  const neutral: (bone: string) => P.ITransform = (
    bone: string,
  ): P.ITransform => {
    const segment: Source.ISegment | undefined = source.segments.find(
      (candidate: Source.ISegment): boolean => candidate.bone === bone,
    );
    if (!segment) throw new Error(`Missing physical segment ${bone}`);
    return segment.neutral;
  };
  const joints: P.IJoint[] = segments
    .filter((segment: P.ISegment): boolean => segment.bone !== "hips")
    .map((segment: P.ISegment): P.IJoint => {
      const own: Source.ISegment = source.segments.find(
        (candidate: Source.ISegment): boolean =>
          candidate.bone === segment.bone,
      )!;
      const parent: string | null = own.parent;
      if (!parent)
        throw new Error(`Missing physical parent of ${segment.bone}`);
      const directions: IAutoMovieVector3[] = own.coordinates.map(
        (coordinate: Source.ICoordinate): IAutoMovieVector3 => {
          if (!(Vector3.length(coordinate.direction) > 0))
            throw new Error(
              `Unresolved physical angular coordinate ${coordinate.channel}`,
            );
          return Vector3.normalize(coordinate.direction);
        },
      );

      // The basis follows the coordinates' own order: x, then y orthogonalized.
      const x: IAutoMovieVector3 = directions[0] ?? { x: 1, y: 0, z: 0 };
      const candidateY: IAutoMovieVector3 =
        directions[1] ??
        (Math.abs(x.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 0, y: 0, z: 1 });
      const y: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(
          candidateY,
          Vector3.scale(x, Vector3.dot(x, candidateY)),
        ),
      );
      const z: IAutoMovieVector3 = Vector3.cross(x, y);
      const basis: IAutoMovieQuaternion = quaternionFromAutoMovieBasis(x, y, z);
      const basisDirections: IAutoMovieVector3[] = [x, y, z];
      const inertia: number = Math.max(
        segment.inertia.x,
        segment.inertia.y,
        segment.inertia.z,
      );
      const axes: P.IAxis[] = own.coordinates.map(
        (coordinate: Source.ICoordinate, index: number): P.IAxis => {
          const alignment: number = Vector3.dot(
            directions[index]!,
            basisDirections[index]!,
          );
          if (Math.abs(alignment) < 1 - 1e-5)
            throw new Error(
              `Human physical coordinates are not orthogonal: ${coordinate.channel}`,
            );
          const sign: 1 | -1 = alignment < 0 ? -1 : 1;
          return {
            axis: index === 0 ? "x" : index === 1 ? "y" : "z",
            channel: coordinate.channel,
            coordinateSign: sign,
            sourceDomain: {
              minimum: (coordinate.minimum * Math.PI) / 180,
              maximum: (coordinate.maximum * Math.PI) / 180,
            },
            minimum:
              ((sign === 1 ? coordinate.minimum : -coordinate.maximum) *
                Math.PI) /
              180,
            maximum:
              ((sign === 1 ? coordinate.maximum : -coordinate.minimum) *
                Math.PI) /
              180,
            stiffness: inertia * options.frequency ** 2,
            damping: 2 * options.dampingRatio * inertia * options.frequency,
            maximumTorque: segment.mass * options.torquePerKg,
          };
        },
      );

      // Both frames meet at the child's joint centre in the neutral pose.
      const above: P.ITransform = neutral(parent);
      return {
        id: segment.bone,
        parent,
        child: segment.bone,
        parentFrame: {
          position: Quaternion.rotateVector(
            Quaternion.inverse(above.rotation),
            Vector3.subtract(segment.neutral.position, above.position),
          ),
          rotation: Quaternion.multiply(
            Quaternion.multiply(
              Quaternion.inverse(above.rotation),
              segment.neutral.rotation,
            ),
            basis,
          ),
        },
        childFrame: { position: { x: 0, y: 0, z: 0 }, rotation: basis },
        axes,
      };
    });
  return derivePhysicalActuators(segments, joints, options);
}
