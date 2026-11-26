import type {
  IAutoMovieCombinePhysicalMassProperties,
  IAutoMovieFootfallPattern,
  IAutoMovieModel,
  IAutoMoviePhysicalHullFaces,
  IAutoMoviePhysicalHullMass,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalShapePairContact,
  IAutoMoviePrimitiveShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import { bodyCenterOfMass } from "./internal/bodyCenterOfMass";
import { combinePhysicalMassProperties } from "./internal/combinePhysicalMassProperties";
import { deriveCenterOfMass as derivePhysicalCenterOfMass } from "./internal/deriveCenterOfMass";
import { physicalHullFacesMass } from "./internal/physicalHullFacesMass";
import { physicalHullMass } from "./internal/physicalHullMass";
import { physicalShapePairContact } from "./internal/physicalShapePairContact";
import { physicalSupportFootprint } from "./internal/physicalSupportFootprint";
import { primitiveCentroid as readPrimitiveCentroid } from "./internal/primitiveCentroid";
import { primitiveVolume as readPrimitiveVolume } from "./internal/primitiveVolume";

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
  ): IAutoMoviePhysicalShapePairContact {
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
}
