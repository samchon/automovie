import type {
  IAutoMovieModelPart,
  IAutoMoviePhysicalShape,
} from "@automovie/interface";

/**
 * A part's conservative physical bound for the footing's pole query
 * (`AutoMovieArchetypeQuadrupedFooting`): a box, sphere or capsule as itself,
 * any other round bar, such as a cylinder or cone, by the capsule of its radius
 * and height, which contains it.
 *
 * @param part The part with its world transform.
 * @returns The physical shape.
 * @throws {RangeError} For a plane or a non-primitive part.
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
