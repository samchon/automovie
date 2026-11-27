import { AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMoviePhysicalShape,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The surface probes shared by the body tangle audit and the arm planner: a
 * hull's vertices, a box's corners, and the poles and equators of a sphere or
 * capsule, in the shape's own frame before its transform.
 *
 * @param shape The collider shape.
 * @returns Its surface probes, local metres.
 */
export function HumanColliderCorners(
  shape: IAutoMoviePhysicalShape,
): readonly IAutoMovieVector3[] {
  if (shape.kind === "hull") return AutoMovieEnginePhysics.physicalShapeHull(shape).vertices;
  if (shape.kind === "box") {
    const h: IAutoMovieVector3 = shape.halfExtents;
    return [-1, 1].flatMap((x: number): IAutoMovieVector3[] =>
      [-1, 1].flatMap((y: number): IAutoMovieVector3[] =>
        [-1, 1].map(
          (z: number): IAutoMovieVector3 => ({
            x: x * h.x,
            y: y * h.y,
            z: z * h.z,
          }),
        ),
      ),
    );
  }
  const r: number = shape.radius;
  const half: number = shape.kind === "capsule" ? shape.halfLength : 0;
  return [
    { x: 0, y: half + r, z: 0 },
    { x: 0, y: -half - r, z: 0 },
    ...(half === 0 ? [0] : [-half, 0, half]).flatMap(
      (y: number): IAutoMovieVector3[] => [
        { x: r, y, z: 0 },
        { x: -r, y, z: 0 },
        { x: 0, y, z: r },
        { x: 0, y, z: -r },
      ],
    ),
  ];
}
