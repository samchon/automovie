import type {
  IAutoMovieModelPart,
  IAutoMoviePhysicalShape,
} from "@automovie/interface";

/**
 * A part's conservative physical bound for the footing's pole query (`QuadrupedFooting`): a box, sphere or capsule as itself, any other round bar, such as a cylinder or cone, by the capsule of its radius and height, which contains it.
 *
 * @param part The part with its world transform.
 * @returns The physical shape.
 * @throws {RangeError} For a plane or a non-primitive part.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the bound per solid and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation A capsule of the bar's radius and half-length contains a cylinder or cone of the same radius and height.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One case per solid.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The bound only grows a round part, so a clear bound is a clear part.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one fresh shape.
 */
export function QuadrupedObstacleShape(
  part: IAutoMovieModelPart,
): IAutoMoviePhysicalShape {
  if (
    part.geometry.type !== "primitive" ||
    part.geometry.shape.type === "plane"
  )
    throw new RangeError("A pole query requires a physical part");
  const shape = part.geometry.shape;
  const base = {
    id: part.id,
    material: "footing",
    transform: {
      position: part.transform!.translation,
      rotation: part.transform!.rotation,
    },
  };
  if (shape.type === "box")
    return {
      ...base,
      kind: "box",
      halfExtents: {
        x: shape.width / 2,
        y: shape.height / 2,
        z: shape.depth / 2,
      },
    };
  if (shape.type === "sphere")
    return { ...base, kind: "sphere", radius: shape.radius };
  return {
    ...base,
    kind: "capsule",
    radius: shape.radius,
    halfLength: shape.height / 2,
  };
}
