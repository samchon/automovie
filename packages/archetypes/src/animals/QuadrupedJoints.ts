import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMoviePrimitiveShape,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { QuadrupedBody } from "./QuadrupedBody";

/**
 * A quadruped's rest joints read back off its built bars, which a ride poses it from, kept apart from `QuadrupedBody` so each file stays within its size.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read and why it is its own file.
 * @evidence contracts/development/design.md#principled-representation The joints in `QuadrupedBody`'s own limb and bone vocabulary.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `read`, which `rideQuadruped` calls.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The joints come from the animal built, never rebuilt from a species' proportions.
 */
export namespace QuadrupedJoints {
  /**
   * The joints a ride poses from, read off an animal's own bars at rest: each limb's five joints and the neck's root.
   *
   * Each bone is a bar from joint to joint whose `+Y` runs from its upper joint to its lower (`QuadrupedBody.lay`), so its upper joint is its centre less half its length along that axis and its lower joint its centre plus as much. Reading them off the animal, rather than rebuilding them from a species' proportions, poses the animal the producer built, whatever breed or sample it drew.
   *
   * @param parts The animal's parts at rest.
   * @returns Each limb's five joints from the top down, and the neck's root.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is read, from which bars and why.
   * @evidence contracts/development/implementation.md#principled-implementation A bar's two ends from its transform and its cylinder's height, the convention `QuadrupedBody.lay` builds every bone by.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One end per bone, then the neck's root.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The parts are found by the bone vocabulary's ids; a model without them is no quadruped `QuadrupedBody.lay` built, and the ride refuses it by its species first.
   * @evidence contracts/development/implementation.md#efficient-algorithms Seventeen lookups.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function, called once per ride.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function read(parts: readonly IAutoMovieModelPart[]): {
    limbs: Readonly<Record<QuadrupedBody.Limb, readonly IAutoMovieVector3[]>>;
    neck: IAutoMovieVector3;
  } {
    const ends = (id: QuadrupedBody.Bone): [IAutoMovieVector3, IAutoMovieVector3] => {
      const part: IAutoMovieModelPart = parts.find(
        (p: IAutoMovieModelPart): boolean => p.id === id,
      )!;
      const shape: AutoMoviePrimitiveShape | null =
        part.geometry.type === "primitive" ? part.geometry.shape : null;
      const half: number =
        shape !== null &&
        (shape.type === "cylinder" || shape.type === "capsule")
          ? shape.height / 2
          : 0;
      const along: IAutoMovieVector3 = Quaternion.rotateVector(
        part.transform!.rotation,
        Vector3.create(0, half, 0),
      );
      return [
        Vector3.subtract(part.transform!.translation, along),
        Vector3.add(part.transform!.translation, along),
      ];
    };
    const limbs: Partial<Record<QuadrupedBody.Limb, IAutoMovieVector3[]>> = {};
    for (const limb of QuadrupedBody.LIMBS) {
      const bones: readonly (readonly [
        IAutoMovieVector3,
        IAutoMovieVector3,
      ])[] = QuadrupedBody.BONES[limb].map(ends);
      limbs[limb] = [
        bones[0]![0],
        ...bones.map(
          (
            b: readonly [IAutoMovieVector3, IAutoMovieVector3],
          ): IAutoMovieVector3 => b[1],
        ),
      ];
    }
    return {
      limbs: limbs as Record<QuadrupedBody.Limb, IAutoMovieVector3[]>,
      neck: ends("neck")[0],
    };
  }
}
