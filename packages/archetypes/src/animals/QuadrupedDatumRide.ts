import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieTransform } from "@automovie/interface";

import type { Archetype, ArchetypeRide } from "../core";
import type { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedFooting } from "./QuadrupedFooting";
import type { QuadrupedGait } from "./QuadrupedGait";
import { rideQuadruped } from "./rideQuadruped";

/**
 * A grounded ride on authored footing whose course datum is the ground under its start, for a ride that begins on a bank or bed far above or below Y=0.
 *
 * A course starts on Y=0 and the ride keeps its body near that datum, so footing far from it cannot be stood on. The ride here runs over the footing lowered by the authored ground height under the course's start, and every sample and contact frame is raised by the same height: an exact vertical translation of the whole scene. The returned `plan` stays in the ride's own datum frame, so its placements' horizontal coordinates and headings are the world's and its heights are relative to the datum.
 *
 * @param animal The quadruped, in its neutral pose.
 * @param course Its course and the authored footing, in world metres.
 * @param gait The gait of every stride whose leg names none; the speed chooses it when absent.
 * @returns The ride, its samples in the world.
 * @throws {ArchetypeRefusal} When no authored surface lies under the course's start, and as `rideQuadruped` refuses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States why the datum moves, the translation, which outputs are raised and the frame the plan keeps.
 * @evidence contracts/development/implementation.md#principled-implementation A rigid vertical translation of footing and samples leaves every relation of the ride to its footing unchanged.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the datum, ride over the lowered footing, raise the two samplers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The datum is the authored surface under the start, not a fitted offset; an uncovered start refuses.
 * @evidence contracts/development/implementation.md#efficient-algorithms One landing query and S plane copies at preparation; one vector addition per sample.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The underlying ride's preparation serves every sample.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the underlying ride and one height.
 */
export function QuadrupedDatumRide<Affordance extends string, D extends string>(
  animal: Archetype<Affordance, D | QuadrupedBody.Dimension>,
  course: QuadrupedDatumRide.ICourse,
  gait?: QuadrupedGait.Gait,
): ArchetypeRide.IRide<Affordance, D | QuadrupedBody.Dimension> {
  type Dimension = D | QuadrupedBody.Dimension;
  const datum: number = QuadrupedFooting.prepare(
    animal.archetype,
    course.footing,
    false,
  )!.landing(
    { x: course.start.x, y: 0, z: course.start.z },
    Quaternion.identity(),
  ).point.y;
  const ride: ArchetypeRide.IRide<Affordance, Dimension> = rideQuadruped(
    animal,
    {
      ...course,
      footing: {
        ...course.footing,
        planes: course.footing.planes.map(
          (plane: QuadrupedFooting.IPlane): QuadrupedFooting.IPlane => ({
            ...plane,
            origin: { ...plane.origin, y: plane.origin.y - datum },
          }),
        ),
      },
    },
    gait,
  );
  const raise = (placement: IAutoMovieTransform): IAutoMovieTransform => ({
    ...placement,
    translation: Vector3.add(placement.translation, { x: 0, y: datum, z: 0 }),
  });
  return {
    ...ride,
    at: (seconds: number): ArchetypeRide.ISample<Affordance, Dimension> => {
      const sample: ArchetypeRide.ISample<Affordance, Dimension> =
        ride.at(seconds);
      return { ...sample, placement: raise(sample.placement) };
    },
    frame: (id: Affordance, seconds: number): IAutoMovieTransform =>
      raise(ride.frame(id, seconds)),
  };
}

/**
 * Types of {@link QuadrupedDatumRide}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the required footing.
 * @evidence contracts/development/design.md#principled-representation A ride course whose footing is required, since the datum is read from it.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `QuadrupedDatumRide`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace QuadrupedDatumRide {
  /** A quadruped's course with its authored footing required. */
  export interface ICourse extends rideQuadruped.ICourse {
    /** The authored world footing; the ground under the start is the datum. */
    footing: QuadrupedFooting.IScene;
  }
}
