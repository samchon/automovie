import {
  AutoMovieArchetypeFrame,
  type AutoMovieArchetypeRide,
} from "@automovie/archetypes";
import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Displayed-geometry readers for equine expression tests: a bar part's world axis, a muzzle's surface distance to a point and a plate's direction.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each reader returns and its frame.
 * @evidence contracts/development/design.md#principled-representation World metres read from a sample's posed parts and placement.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Shared by the expression and reaction tests.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reads only displayed parts; no producer constant.
 */
export namespace equineExpressionObservation {
  /**
   * A bar's displayed world axis and radius.
   *
   * @evidence contracts/development/common.md#meaningful-documentation World metres.
   * @evidence contracts/development/design.md#principled-representation Two cap centres and a radius.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by `bar`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IBar {
    /** The bar's start, its local -Y end. */
    from: IAutoMovieVector3;

    /** The bar's end, its local +Y end. */
    to: IAutoMovieVector3;

    /** Its radius, metres. */
    radius: number;
  }

  /**
   * A part's displayed world frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation World frame of a named part of a sample.
   * @evidence contracts/development/implementation.md#principled-implementation The sample's placement composed with the part's model transform.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup, one composition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing part throws.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the parts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses `AutoMovieArchetypeFrame.compose`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function frame(
    sample: AutoMovieArchetypeRide.IPose<string, string>,
    id: string,
  ): IAutoMovieTransform {
    const part: IAutoMovieModelPart | undefined = sample.archetype.parts.find(
      (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
    );
    if (part?.transform === undefined || part.transform === null)
      throw new Error(`No displayed part ${id}`);
    return AutoMovieArchetypeFrame.compose(sample.placement, part.transform);
  }

  /**
   * A bar part's displayed world axis.
   *
   * @evidence contracts/development/common.md#meaningful-documentation World metres of a capsule or cylinder part.
   * @evidence contracts/development/implementation.md#principled-implementation The part's centre plus and minus half its height along its rotated +Y.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One frame, one axis.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A non-bar part throws.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the parts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `frame`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function bar(
    sample: AutoMovieArchetypeRide.IPose<string, string>,
    id: string,
  ): IBar {
    const part: IAutoMovieModelPart = sample.archetype.parts.find(
      (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
    )!;
    const geometry: IAutoMovieModelPart["geometry"] = part.geometry;
    if (
      geometry.type !== "primitive" ||
      (geometry.shape.type !== "capsule" && geometry.shape.type !== "cylinder")
    )
      throw new Error(`${id} is not a bar`);
    const world: IAutoMovieTransform = frame(sample, id);
    const half: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(world.rotation, {
      x: 0,
      y: geometry.shape.height / 2,
      z: 0,
    });
    return {
      from: AutoMovieEngineVector3.subtract(world.translation, half),
      to: AutoMovieEngineVector3.add(world.translation, half),
      radius: geometry.shape.radius,
    };
  }

  /**
   * The signed distance from a point to a bar's surface, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Negative inside the bar.
   * @evidence contracts/development/implementation.md#principled-implementation Distance to the axis segment less the radius.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One segment query.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the engine's segment query.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function surface(bar: IBar, point: IAutoMovieVector3): number {
    return (
      AutoMovieEngineMath.closestPointsBetweenSegments(point, point, bar.from, bar.to).distance -
      bar.radius
    );
  }

  /**
   * A part's displayed world +Y direction.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A unit world vector.
   * @evidence contracts/development/implementation.md#principled-implementation The world rotation applied to +Y.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rotation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the parts.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `frame`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function axis(
    sample: AutoMovieArchetypeRide.IPose<string, string>,
    id: string,
  ): IAutoMovieVector3 {
    return AutoMovieEngineQuaternion.rotateVector(frame(sample, id).rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
  }

  /**
   * The angle between two directions, degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Degrees in [0, 180].
   * @evidence contracts/development/implementation.md#principled-implementation atan2 of the cross product's length over the dot product.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work None to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function degrees(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
    return (
      (Math.atan2(AutoMovieEngineVector3.length(AutoMovieEngineVector3.cross(a, b)), AutoMovieEngineVector3.dot(a, b)) *
        180) /
      Math.PI
    );
  }
}
