import type { AutoMovieEnginePhysicalHull } from "../AutoMovieEnginePhysicalHull";
import type {
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { AutoMovieEnginePhysicalHullFaces } from "../AutoMovieEnginePhysicalHullFaces";

/*
 * Open one hull constructor group with the same shared identity rotation.
 * Returns: The group's rotation, offset and shape constructors.
 */
export function createPhysicalHullShape(): AutoMovieEnginePhysicalHull.IShapeFactory {
  const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.identity();
  return {
    rotation,
    offset(
      a: () => IAutoMovieVector3,
      b: () => IAutoMovieVector3,
    ): IAutoMovieVector3 {
      return AutoMovieEngineVector3.subtract(a(), b());
    },
    shape(
      id: string,
      material: string,
      position: IAutoMovieVector3,
      points: IAutoMovieVector3[],
    ): IAutoMoviePhysicalShape {
      return {
        id,
        material,
        transform: { position, rotation },
        kind: "hull",
        points,
        hull: AutoMovieEnginePhysicalHullFaces.build(points),
      };
    },
  };
}
