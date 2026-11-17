import { physicalHullFaces } from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * The surface probes shared by the body tangle audit and the arm planner:
 * a hull's vertices, a box's corners, and the poles and equators of a sphere
 * or capsule, in the shape's own frame before its transform.
 *
 * @param shape The collider shape.
 * @returns Its surface probes, local metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the shared consumers, each shape's probes, their frame and units.
 * @evidence contracts/development/implementation.md#principled-implementation Reuses the audit's existing surface sampling for every collider kind so the planner reads the same corners in both directions of a collision pair.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One exhaustive branch per collider kind.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The points follow from the collider's dimensions; no body, action, clearance or contact tolerance is introduced.
 * @evidence contracts/development/implementation.md#efficient-algorithms A hull reuses the engine's cached hull faces; every other kind has a fixed number of probes.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One canonical generator serves the audit and the planner instead of duplicating the audit's sampling.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns the probes and retains no state.
 */
export function HumanColliderCorners(
  shape: IAutoMoviePhysicalProfile.IShape,
): readonly IAutoMovieVector3[] {
  if (shape.kind === "hull") return physicalHullFaces(shape.points).vertices;
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
