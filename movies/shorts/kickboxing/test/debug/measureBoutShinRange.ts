import {
  type preparePhysicalGeometry as Geometry,
  Quaternion,
  Vector3,
  physicalShapeBounds,
  physicalSupportPoint,
} from "@automovie/engine";
import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

/** Measure a necessary hip-to-receiver range condition for this film's declared shin surface. Actual fixed joint anchors and every lower-leg shape define an orientation-free upper bound. This ignores ROM, support and collisions, so passing proves no feasible kick and a positive deficit supplies no chosen step or pose correction. */
export function measureBoutShinRange(
  profile: P,
  poses: Readonly<Record<string, P.ITransform>>,
  side: "left" | "right",
  receiver: Geometry.ICollider,
  geometry: Geometry.IQueries,
): {
  hip: P.ITransform["position"];
  thighLength: number;
  shinSurfaceRadius: number;
  reachUpper: number;
  receiverSurfacePoint: P.ITransform["position"];
  hipOutsideReceiverBounds: boolean;
  receiverDistance: number | null;
  necessaryRelativeApproachLower: number;
} {
  const hipJoint: P.IJoint = profile.joints.find(
    (joint: P.IJoint): boolean => joint.child === `${side}UpperLeg`,
  )!;
  const kneeJoint: P.IJoint = profile.joints.find(
    (joint: P.IJoint): boolean => joint.child === `${side}LowerLeg`,
  )!;
  const shin: P.ISegment = profile.segments.find(
    (segment: P.ISegment): boolean => segment.bone === kneeJoint.child,
  )!;
  const hip: P.ITransform["position"] = physicalSupportPoint(
    poses[hipJoint.parent]!,
    hipJoint.parentFrame.position,
  );
  const thighLength: number = Vector3.length(
    Vector3.subtract(
      kneeJoint.parentFrame.position,
      hipJoint.childFrame.position,
    ),
  );
  const shinSurfaceRadius: number = Math.max(
    ...shin.shapes.map((shape: P.IShape): number => {
      const center: P.ITransform["position"] = Vector3.subtract(
        shape.transform.position,
        kneeJoint.childFrame.position,
      );
      if (shape.kind === "sphere") return Vector3.length(center) + shape.radius;
      if (shape.kind === "capsule") {
        const axis: P.ITransform["position"] = Quaternion.rotateVector(
          shape.transform.rotation,
          { x: 0, y: shape.halfLength, z: 0 },
        );
        return (
          Math.max(
            Vector3.length(Vector3.add(center, axis)),
            Vector3.length(Vector3.subtract(center, axis)),
          ) + shape.radius
        );
      }
      return Math.max(
        ...[-1, 1].flatMap((x: number): number[] =>
          [-1, 1].flatMap((y: number): number[] =>
            [-1, 1].map((z: number): number =>
              Vector3.length(
                Vector3.add(
                  center,
                  Quaternion.rotateVector(shape.transform.rotation, {
                    x: x * shape.halfExtents.x,
                    y: y * shape.halfExtents.y,
                    z: z * shape.halfExtents.z,
                  }),
                ),
              ),
            ),
          ),
        ),
      );
    }),
  );
  const reachUpper: number = thighLength + shinSurfaceRadius;
  const bounds: ReturnType<typeof physicalShapeBounds> = physicalShapeBounds(
    receiver.pose,
    receiver.shape,
  );
  const hipOutsideReceiverBounds: boolean = (["x", "y", "z"] as const).some(
    (axis: "x" | "y" | "z"): boolean =>
      hip[axis] < bounds.min[axis] || hip[axis] > bounds.max[axis],
  );
  const receiverSurfacePoint: P.ITransform["position"] = geometry.project(
    receiver,
    hip,
  );
  const receiverDistance: number | null = hipOutsideReceiverBounds
    ? Vector3.length(Vector3.subtract(receiverSurfacePoint, hip))
    : null;
  return {
    hip,
    thighLength,
    shinSurfaceRadius,
    reachUpper,
    receiverSurfacePoint,
    hipOutsideReceiverBounds,
    receiverDistance,
    necessaryRelativeApproachLower:
      receiverDistance === null
        ? 0
        : Math.max(0, receiverDistance - reachUpper),
  };
}
