import type {
  IAutoMovieCombinePhysicalMassProperties,
  IAutoMovieFootfallPattern,
  IAutoMovieModel,
  IAutoMoviePhysicalHullFaces,
  IAutoMoviePhysicalHullMass,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalShape,
  IAutoMoviePrimitiveShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import { bodyCenterOfMass } from "./bodyCenterOfMass";
import { combinePhysicalMassProperties } from "./combinePhysicalMassProperties";
import { deriveCenterOfMass as derivePhysicalCenterOfMass } from "./deriveCenterOfMass";
import { physicalHullFacesMass } from "./physicalHullFacesMass";
import { physicalHullMass } from "./physicalHullMass";
import { physicalShapePairContact } from "./physicalShapePairContact";
import { physicalSupportFootprint } from "./physicalSupportFootprint";
import { primitiveCentroid as readPrimitiveCentroid } from "./primitiveCentroid";
import { primitiveVolume as readPrimitiveVolume } from "./primitiveVolume";

/** Neutral contact, mass and support geometry operations. */
export namespace AutoMovieEnginePhysics {
  /** Reads the declared center of mass or derives it from primitive solids. */
  export function centerOfMass(model: IAutoMovieModel): IAutoMovieVector3 | null {
    return bodyCenterOfMass(model);
  }

  /** Derives a model's volume-weighted center of mass from primitive solids. */
  export function deriveCenterOfMass(model: IAutoMovieModel): IAutoMovieVector3 | null {
    return derivePhysicalCenterOfMass(model);
  }

  /** Combines rigid-part mass and inertia properties in one frame. */
  export function combineMassProperties(
    parts: readonly IAutoMovieCombinePhysicalMassProperties.IPart[],
  ): IAutoMovieCombinePhysicalMassProperties.IPart {
    return combinePhysicalMassProperties(parts);
  }

  /** Returns a primitive's geometric centroid in its local frame. */
  export function primitiveCentroid(shape: IAutoMoviePrimitiveShape): IAutoMovieVector3 {
    return readPrimitiveCentroid(shape);
  }

  /** Returns the analytic solid volume of a primitive in cubic metres. */
  export function primitiveVolume(shape: IAutoMoviePrimitiveShape): number {
    return readPrimitiveVolume(shape);
  }

  /** Computes the volume, centroid and principal inertia of a convex hull. */
  export function hullFacesMass(
    hull: IAutoMoviePhysicalHullFaces.IHull,
  ): IAutoMoviePhysicalHullMass.IResult {
    return physicalHullFacesMass(hull);
  }

  /** Builds a convex hull from points and computes its mass properties. */
  export function hullMass(
    points: readonly IAutoMovieVector3[],
  ): IAutoMoviePhysicalHullMass.IResult {
    return physicalHullMass(points);
  }

  /** Computes signed distance and witnesses between two convex shapes. */
  export function shapePairContact(
    poseA: IAutoMovieRigidTransform,
    shapeA: IAutoMoviePhysicalShape,
    poseB: IAutoMovieRigidTransform,
    shapeB: IAutoMoviePhysicalShape,
  ): IShapePairContactResult {
    return physicalShapePairContact(poseA, shapeA, poseB, shapeB);
  }

  /** Projects the support shapes of one limb onto the floor plane. */
  export function supportFootprint(
    profile: IAutoMoviePhysicalProfile,
    poses:
      | ReadonlyMap<string, AutoMovieXpbdBody>
      | Readonly<Record<string, IAutoMovieRigidTransform>>,
    limb: IAutoMovieFootfallPattern["limbs"][number],
    floor: number,
  ): IAutoMovieVector3[] {
    return physicalSupportFootprint(profile, poses, limb, floor);
  }

  /** Contact between two convex colliders, in world metres. */
  export interface IShapePairContactResult {
    /** Signed distance, metres; negative when they overlap. */
    distance: number;
    /** Unit normal from the first shape toward the second. */
    normal: IAutoMovieVector3;
    /** The first shape's witness. */
    pointA: IAutoMovieVector3;
    /** The second shape's witness. */
    pointB: IAutoMovieVector3;
  }
}
