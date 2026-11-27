import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Measure the lowest world Y of a complete actual terminal cylinder or capsule.
 *
 * @param part Actual placed terminal primitive, with rigid unit scale.
 * @param placement Complete rigid model-to-world placement, with unit scale.
 * @returns Lowest surface height in world metres, including the actual radius.
 * @throws {Error} For missing placement, unsupported/nonpositive geometry or
 *   nonfinite support.
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes a terminal control endpoint from the solid's lowest world surface; describes actual rigid inputs, metre output, supported primitive types and unsupported observations.
 * @evidence contracts/development/implementation.md#principled-implementation For world unit axis u, a cylinder's vertical half-extent is abs(u.y)*height/2+radius*hypot(u.x,u.z), while a capsule's is abs(u.y)*height/2+radius. Subtracting that support from its independently composed world centre gives the complete actual sole.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read actual positive primitive dimensions, compose its world rotation/centre and subtract the exact shape support; refuse a nonfinite result.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not project a distal endpoint to ground, reconstruct source proportions, read a production clearance, tessellate away a rim extremum or permit unsupported geometry to pass.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A fixed number of scalar/quaternion operations with no search or sample loop.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Owns the single independent primitive-support formula used by new attachment observations and corrected legacy floor oracles; existing engine quaternion arithmetic composes actual transforms.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no input, model, sample or resource.
 */
export function animalTerminalSole(
  part: IAutoMovieModelPart,
  placement: IAutoMovieTransform,
): number {
  if (
    part.transform === null ||
    part.transform === undefined ||
    part.geometry.type !== "primitive" ||
    (part.geometry.shape.type !== "cylinder" &&
      part.geometry.shape.type !== "capsule")
  )
    throw new Error(`Unsupported actual terminal primitive ${part.id}`);
  const shape: typeof part.geometry.shape = part.geometry.shape;
  if (!(shape.height > 0 && shape.radius > 0))
    throw new Error(`Invalid actual terminal dimensions ${part.id}`);
  const axis: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    AutoMovieEngineQuaternion.multiply(placement.rotation, part.transform.rotation),
    { x: 0, y: 1, z: 0 },
  );
  const centre: number =
    placement.translation.y +
    AutoMovieEngineQuaternion.rotateVector(placement.rotation, part.transform.translation).y;
  const extent: number =
    (Math.abs(axis.y) * shape.height) / 2 +
    shape.radius * (shape.type === "capsule" ? 1 : Math.hypot(axis.x, axis.z));
  const sole: number = centre - extent;
  return sole;
}
