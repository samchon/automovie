import { type AutoMovieEnginePhysicsFaceContactTypes, AutoMovieEnginePhysics, AutoMovieEngineQuaternion, AutoMovieEnginePhysicalHullFaces } from "@automovie/engine";

import type {
  IAutoMovieModelPart,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetypeConvexCell,
  AutoMovieArchetypeFrame,
} from "../../core";
import type { AutoMovieArchetypeQuadrupedFooting } from "../AutoMovieArchetypeQuadrupedFooting";

/*
 * The actual lowest part surface over the named finite world XZ patch.
 */
export namespace QuadrupedFootingClip {
  /*
   * Prepare one material surface and cache each owner's local shape geometry.
   */
  export function prepare(
    plane: AutoMovieArchetypeQuadrupedFooting.IPlane,
    frame: IAutoMovieTransform,
  ): (
    part: IAutoMovieModelPart,
    cells?: AutoMovieArchetypeConvexCell.Table,
  ) => number {
    const outline: IAutoMovieVector3[] = [];
    for (const [x, z] of [
      [plane.x[0], plane.z[0]],
      [plane.x[1], plane.z[0]],
      [plane.x[1], plane.z[1]],
      [plane.x[0], plane.z[1]],
    ] as const)
      outline.push(
        AutoMovieArchetypeFrame.point(frame, {
          x,
          y:
            plane.origin.y +
            (x - plane.origin.x) * plane.slope.x +
            (z - plane.origin.z) * plane.slope.z,
          z,
        }),
      );
    const read: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeFaceContactPrepare> =
      AutoMovieEnginePhysics.physicalShapeFaceContactPrepare(
        {
          position: plane.origin,
          rotation: AutoMovieEngineQuaternion.inverse(frame.rotation),
        },
        outline,
        AutoMovieEngineQuaternion.rotateVector(frame.rotation, { x: 0, y: 1, z: 0 }),
      );
    const known: WeakMap<
      IAutoMovieModelPart["geometry"],
      AutoMovieEnginePhysicsFaceContactTypes.Shape
    > = new WeakMap();
    return (
      part: IAutoMovieModelPart,
      cells?: AutoMovieArchetypeConvexCell.Table,
    ): number => {
      let solid: AutoMovieEnginePhysicsFaceContactTypes.Shape | undefined = known.get(
        part.geometry,
      );
      if (solid === undefined) {
        solid = shape(part, cells);
        if (solid === undefined) return Infinity;
        known.set(part.geometry, solid);
      }
      return (
        read(
          {
            position: part.transform!.translation,
            rotation: part.transform!.rotation,
          },
          solid,
        )?.clearance ?? Infinity
      );
    };
  }
}

/*
 * Each local collider matches the visible solid's bounds, including flat ends.
 */
function shape(
  part: IAutoMovieModelPart,
  cells: AutoMovieArchetypeConvexCell.Table | undefined,
): AutoMovieEnginePhysicsFaceContactTypes.Shape | undefined {
  const transform: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: AutoMovieEngineQuaternion.identity(),
  };
  const base = { id: part.id, material: "footing", transform };
  if (part.geometry.type !== "primitive") {
    const cell: AutoMovieArchetypeConvexCell.ICell | undefined = cells?.get(
      part.id,
    );
    if (cell === undefined || cell.geometry !== part.geometry)
      throw new RangeError("Footing requires a matching convex cell");
    const points: IAutoMovieVector3[] = [...cell.points];
    return { ...base, kind: "hull", points, hull: AutoMovieEnginePhysicalHullFaces.build(points) };
  }
  const primitive = part.geometry.shape;
  if (primitive.type === "plane") return undefined;
  if (primitive.type === "sphere")
    return { ...base, kind: "sphere", radius: primitive.radius };
  if (primitive.type === "capsule")
    return {
      ...base,
      kind: "capsule",
      radius: primitive.radius,
      halfLength: primitive.height / 2,
    };
  if (primitive.type === "box")
    return {
      ...base,
      kind: "box",
      halfExtents: {
        x: primitive.width / 2,
        y: primitive.height / 2,
        z: primitive.depth / 2,
      },
    };
  return {
    kind: primitive.type,
    transform,
    height: primitive.height,
    radius: primitive.radius,
  };
}
