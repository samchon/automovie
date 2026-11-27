import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieTransform } from "@automovie/interface";

import type { AutoMovieArchetype, AutoMovieArchetypeRefusal, AutoMovieArchetypeRide } from "../core";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedFooting } from "./AutoMovieArchetypeQuadrupedFooting";
import type { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import { AutoMovieArchetypeQuadruped } from "./AutoMovieArchetypeQuadruped";

/**
 * A grounded ride on authored footing whose course datum is the ground under
 * its start, for a ride that begins on a bank or bed far above or below Y=0.
 *
 * A course starts on Y=0 and the ride keeps its body near that datum, so
 * footing far from it cannot be stood on. The ride here runs over the footing
 * lowered by the authored ground height under the course's start, and every
 * sample and contact frame is raised by the same height: an exact vertical
 * translation of the whole scene. The returned `plan` stays in the ride's own
 * datum frame, so its placements' horizontal coordinates and headings are the
 * world's and its heights are relative to the datum.
 *
 * @param animal The quadruped, in its neutral pose.
 * @param course Its course and the authored footing, in world metres.
 * @param gait The gait of every stride whose leg names none; the speed chooses
 *   it when absent.
 * @returns The ride, its samples in the world.
 * @throws {AutoMovieArchetypeRefusal} When no authored surface lies under the
 *   course's start, and as `AutoMovieArchetypeQuadruped.ride` refuses.
 */
function quadrupedDatumRide<
  Affordance extends string,
  D extends string,
>(
  animal: AutoMovieArchetype<
    Affordance,
    D | AutoMovieArchetypeQuadrupedBody.Dimension
  >,
  course: AutoMovieArchetypeQuadrupedDatumRide.ICourse,
  gait?: AutoMovieArchetypeQuadrupedGait.Gait,
): AutoMovieArchetypeRide.IRide<
  Affordance,
  D | AutoMovieArchetypeQuadrupedBody.Dimension
> {
  type Dimension = D | AutoMovieArchetypeQuadrupedBody.Dimension;
  const datum: number = AutoMovieArchetypeQuadrupedFooting.prepare(
    animal.archetype,
    course.footing,
    false,
  )!.landing(
    { x: course.start.x, y: 0, z: course.start.z },
    Quaternion.identity(),
  ).point.y;
  const ride: AutoMovieArchetypeRide.IRide<Affordance, Dimension> =
    AutoMovieArchetypeQuadruped.ride(
      animal,
      {
        ...course,
        footing: {
          ...course.footing,
          planes: course.footing.planes.map(
            (
              plane: AutoMovieArchetypeQuadrupedFooting.IPlane,
            ): AutoMovieArchetypeQuadrupedFooting.IPlane => ({
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
    at: (
      seconds: number,
    ): AutoMovieArchetypeRide.ISample<Affordance, Dimension> => {
      const sample: AutoMovieArchetypeRide.ISample<Affordance, Dimension> =
        ride.at(seconds);
      return { ...sample, placement: raise(sample.placement) };
    },
    frame: (id: Affordance, seconds: number): IAutoMovieTransform =>
      raise(ride.frame(id, seconds)),
  };
}

/** Types of {@link AutoMovieArchetypeQuadrupedDatumRide}. */
export namespace AutoMovieArchetypeQuadrupedDatumRide {
  /**
   * Ride over authored footing translated to the course start datum.
   *
   * @param animal The quadruped, in its neutral pose.
   * @param course The course and authored world footing.
   * @param gait The gait for strides that do not name one.
   * @returns The ride, with samples in world coordinates.
   * @throws {AutoMovieArchetypeRefusal} When the course start has no authored surface, and as the ordinary quadruped ride refuses.
   */
  export function ride<Affordance extends string, D extends string>(
    animal: AutoMovieArchetype<
      Affordance,
      D | AutoMovieArchetypeQuadrupedBody.Dimension
    >,
    course: ICourse,
    gait?: AutoMovieArchetypeQuadrupedGait.Gait,
  ): AutoMovieArchetypeRide.IRide<
    Affordance,
    D | AutoMovieArchetypeQuadrupedBody.Dimension
  > {
    return quadrupedDatumRide(animal, course, gait);
  }

  /** A quadruped's course with its authored footing required. */
  export interface ICourse extends AutoMovieArchetypeQuadruped.IRideCourse {
    /** The authored world footing; the ground under the start is the datum. */
    footing: AutoMovieArchetypeQuadrupedFooting.IScene;
  }
}
