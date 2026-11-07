import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

/** Independent support projection of every actual head shape. Unlike the production audit's rotated bounds and planner's shape reference, this oracle evaluates transformed sphere/capsule axes and box corners directly. It assumes no zero capsule length or fixed head radius. */
export function observedBoutHeadFront(
  profile: Pick<P, "segments">,
  head: P.ITransform,
  facing: IAutoMovieVector3,
): number {
  const axis: IAutoMovieVector3 = Vector3.normalize(facing);
  return Math.max(
    ...profile.segments
      .find((segment: P.ISegment): boolean => segment.bone === "head")!
      .shapes.map((shape: P.IShape): number => {
        const center: IAutoMovieVector3 = Vector3.add(
          head.position,
          Quaternion.rotateVector(head.rotation, shape.transform.position),
        );
        const rotation: P.ITransform["rotation"] = Quaternion.multiply(
          head.rotation,
          shape.transform.rotation,
        );
        if (shape.kind === "sphere")
          return Vector3.dot(center, axis) + shape.radius;
        if (shape.kind === "capsule")
          return (
            Vector3.dot(center, axis) +
            shape.radius +
            shape.halfLength *
              Math.abs(
                Vector3.dot(
                  Quaternion.rotateVector(rotation, { x: 0, y: 1, z: 0 }),
                  axis,
                ),
              )
          );
        const extents: IAutoMovieVector3 = shape.halfExtents;
        return Math.max(
          ...[-1, 1].flatMap((x: number): number[] =>
            [-1, 1].flatMap((y: number): number[] =>
              [-1, 1].map((z: number): number =>
                Vector3.dot(
                  Vector3.add(
                    center,
                    Quaternion.rotateVector(rotation, {
                      x: x * extents.x,
                      y: y * extents.y,
                      z: z * extents.z,
                    }),
                  ),
                  axis,
                ),
              ),
            ),
          ),
        );
      }),
  );
}
