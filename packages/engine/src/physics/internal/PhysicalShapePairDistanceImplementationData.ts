import type { IAutoMoviePhysicalShape, IAutoMovieVector3, IAutoMoviePhysicalHullFaces } from "@automovie/interface";
import type { AutoMovieEnginePhysicsPairDistanceTypes } from "../AutoMovieEnginePhysicsPairDistanceTypes";


import { physicalShapeHull } from "./physicalShapeHull";
import { physicalHullEdges } from "./physicalHullEdges";

export namespace PhysicalShapePairDistanceImplementationData {
  /*
   * The wire frame of one shape.
   */
  export const frameOf = (
    shape: IAutoMoviePhysicalShape,
  ): AutoMovieEnginePhysicsPairDistanceTypes.IWires => {
    if (shape.kind === "sphere")
      return {
        segments: [
          [
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 0, z: 0 },
          ],
        ],
        radius: shape.radius,
      };
    if (shape.kind === "capsule")
      return {
        segments: [
          [
            { x: 0, y: -shape.halfLength, z: 0 },
            { x: 0, y: shape.halfLength, z: 0 },
          ],
        ],
        radius: shape.radius,
      };
    if (shape.kind === "box") {
      const h: IAutoMovieVector3 = shape.halfExtents;
      const segments: [IAutoMovieVector3, IAutoMovieVector3][] = [];
      for (const u of [-1, 1])
        for (const v of [-1, 1])
          segments.push(
            [
              { x: -h.x, y: u * h.y, z: v * h.z },
              { x: h.x, y: u * h.y, z: v * h.z },
            ],
            [
              { x: u * h.x, y: -h.y, z: v * h.z },
              { x: u * h.x, y: h.y, z: v * h.z },
            ],
            [
              { x: u * h.x, y: v * h.y, z: -h.z },
              { x: u * h.x, y: v * h.y, z: h.z },
            ],
          );
      return { segments, radius: 0 };
    }
    if (shape.kind === "hull") {
      const hull: IAutoMoviePhysicalHullFaces.IHull = physicalShapeHull(shape);
      return { segments: hull.edges ?? physicalHullEdges(hull), radius: 0 };
    }
    shape satisfies never;
    throw new Error("Unknown physical shape kind");
  };
}
