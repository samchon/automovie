import type {
  IAutoMovieModelPart,
  IAutoMoviePhysicalShape,
} from "@automovie/interface";

import type { AutoMovieArchetypeConvexCell } from "../../core";

/*
 * A part's conservative physical bound for the footing's pole query
 * (`AutoMovieArchetypeQuadrupedFooting`): a box, sphere or capsule as itself,
 * any other round bar, such as a cylinder or cone, by the capsule of its radius
 * and height, which contains it.
 * Parameter part: The part with its world transform.
 * Parameter cells: The producer's convex solids, if supplied.
 * Returns: The physical shape.
 * For a plane or a non-primitive part.
 */
export function QuadrupedObstacleShape(
  part: IAutoMovieModelPart,
  cells?: AutoMovieArchetypeConvexCell.Table,
): IAutoMoviePhysicalShape {
  const base = {
    id: part.id,
    material: "footing",
    transform: {
      position: part.transform!.translation,
      rotation: part.transform!.rotation,
    },
  };
  if (part.geometry.type !== "primitive") {
    const cell: AutoMovieArchetypeConvexCell.ICell | undefined = cells?.get(part.id);
    if (cell === undefined || cell.geometry !== part.geometry)
      throw new RangeError("A pole query requires matching convex material");
    return { ...base, kind: "hull", points: cell.points.map((point) => ({ ...point })) };
  }
  const shape = part.geometry.shape;
  if (shape.type === "plane")
    throw new RangeError("A pole query requires a physical part");
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
