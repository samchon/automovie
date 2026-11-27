import type { AutoMoviePhysicalHull } from "../AutoMoviePhysicalHull";
import type {
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { AutoMoviePhysicalHullFaces } from "../AutoMoviePhysicalHullFaces";

/*
 * Open one hull constructor group with the same shared identity rotation.
 * Returns: The group's rotation, offset and shape constructors.
 */
export function createPhysicalHullShape(): AutoMoviePhysicalHull.IShapeFactory {
  const rotation: IAutoMovieQuaternion = Quaternion.identity();
  return {
    rotation,
    offset(
      a: () => IAutoMovieVector3,
      b: () => IAutoMovieVector3,
    ): IAutoMovieVector3 {
      return Vector3.subtract(a(), b());
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
        hull: AutoMoviePhysicalHullFaces.build(points),
      };
    },
  };
}
