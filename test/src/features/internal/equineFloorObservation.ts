import type { AutoMovieArchetypeRide } from "@automovie/archetypes";
import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMoviePrimitiveShape,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Reads how low a displayed equid's parts reach against the floor plane y = 0, from their actual primitive geometry at the sample's placement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the floor plane and the primitives read.
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed geometry only.
 * @evidence contracts/development/testing.md#independent-expectations Each primitive's lowest point is computed from its own shape, independently of the producer's floor reader.
 * @evidence contracts/development/testing.md#execution-ownership A pure reader shared by the equine specs.
 */
export namespace equineFloorObservation {
  /**
   * The lowest world height a part reaches.
   *
   * @param sample The displayed sample.
   * @param id The part.
   * @returns Its lowest point's height, metres.
   */
  export function part(
    sample: AutoMovieArchetypeRide.IPose<string, string>,
    id: string,
  ): number {
    const found: IAutoMovieModelPart = sample.archetype.parts.find(
      (each: IAutoMovieModelPart): boolean => each.id === id,
    )!;
    return lowest(sample.placement, found);
  }

  /**
   * The lowest world height any part reaches.
   *
   * @param sample The displayed sample.
   * @returns The lowest point's height, metres.
   */
  export function body(
    sample: AutoMovieArchetypeRide.IPose<string, string>,
  ): number {
    return Math.min(
      ...sample.archetype.parts.map((each: IAutoMovieModelPart): number =>
        lowest(sample.placement, each),
      ),
    );
  }

  /** A part's lowest world height under a placement. */
  function lowest(
    placement: IAutoMovieTransform,
    part: IAutoMovieModelPart,
  ): number {
    if (
      part.transform === undefined ||
      part.transform === null ||
      part.geometry.type !== "primitive"
    )
      return Infinity;
    const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      placement.rotation,
      part.transform.rotation,
    );
    const centre: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      AutoMovieEngineQuaternion.rotateVector(placement.rotation, part.transform.translation),
      placement.translation,
    );
    const shape: IAutoMoviePrimitiveShape = part.geometry.shape;
    const axis: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
    if (shape.type === "sphere") return centre.y - shape.radius;
    if (shape.type === "capsule")
      return centre.y - Math.abs(axis.y) * (shape.height / 2) - shape.radius;
    if (shape.type === "cylinder")
      return (
        centre.y -
        Math.abs(axis.y) * (shape.height / 2) -
        shape.radius * Math.hypot(axis.x, axis.z)
      );
    if (shape.type === "box") {
      let low: number = Infinity;
      for (const x of [-1, 1])
        for (const y of [-1, 1])
          for (const z of [-1, 1])
            low = Math.min(
              low,
              centre.y +
                AutoMovieEngineQuaternion.rotateVector(rotation, {
                  x: (x * shape.width) / 2,
                  y: (y * shape.height) / 2,
                  z: (z * shape.depth) / 2,
                }).y,
            );
      return low;
    }
    return Infinity;
  }
}
