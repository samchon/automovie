import type {
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { physicalHullFaces } from "./physicalHullFaces";

/** One profile construction owns a shared rotation and its placed hulls. */
interface IAutoMovieHullShapeFactory {
  /** The identity rotation every hull of the group shares. */
  rotation: IAutoMovieQuaternion;

  /** The offset from one point to another, the hull's placement. */
  offset(
    a: () => IAutoMovieVector3,
    b: () => IAutoMovieVector3,
  ): IAutoMovieVector3;

  /** A hull shape placed at a position with the shared rotation. */
  shape(
    id: string,
    material: string,
    position: IAutoMovieVector3,
    points: IAutoMovieVector3[],
  ): IAutoMoviePhysicalShape;
}

/**
 * Open one hull constructor group with the same shared identity rotation.
 *
 * @returns The group's rotation, offset and shape constructors.
 */
export function createPhysicalHullShape(): IAutoMovieHullShapeFactory {
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
        hull: physicalHullFaces(points),
      };
    },
  };
}
