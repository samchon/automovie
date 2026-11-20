import {
  type ArchetypeCourse,
  ArchetypeFrame,
  ArchetypeRide,
  driveCar,
  rideBicycle,
  rideMotorcycle,
} from "@automovie/archetypes";
import type {
  IAutoMovieMotionHumanProp,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
} from "@automovie/interface";

import type { SceneArchetype } from "../../scenes/package/SceneArchetype";
import type { IPlaygroundComposition } from "../structures/IPlaygroundComposition";

/**
 * Adapt an authored vehicle course to the performance's native moving prop
 * and its articulation tracks. Root, grips and the take share one sampled
 * native ride. Prop tracks retain the final wheel and control positions.
 *
 * @param object The vehicle and its placed course.
 * @param model The same stationary archetype passed to the prop.
 * @returns The course reader and its tracks, absent for a stationary scene prop.
 * @throws {Error} If a fixed, worn, or unsupported prop names a vehicle course.
 */
export function playgroundVehicleCourse(
  object: IPlaygroundComposition.IObject,
  model: SceneArchetype.Model,
):
  | {
      placement: (seconds: number) => IAutoMovieRigidTransform;
      contact: (id: string, seconds: number) => IAutoMovieTransform;
      tracks: IAutoMovieMotionHumanProp.ITrack[];
    }
  | undefined {
  if (object.course === undefined) return undefined;
  if (
    object.worn !== undefined ||
    object.fixed === true ||
    object.rotation !== undefined ||
    (object.y ?? 0) !== 0
  )
    throw new Error(
      `The vehicle course of "${object.subject}" must start at a level moving prop's floor placement.`,
    );
  const course: ArchetypeCourse.ICourse = {
    ...object.course,
    start: { x: object.x, z: object.z, heading: object.yaw },
  };
  const ride: Pick<ArchetypeRide.IRide<string, string>, "at"> = (() => {
    switch (object.producer) {
      case "createCar":
        return driveCar(model as Parameters<typeof driveCar>[0], course);
      case "createBicycle":
        return rideBicycle(model as Parameters<typeof rideBicycle>[0], course);
      case "createMotorcycle":
        return rideMotorcycle(
          model as Parameters<typeof rideMotorcycle>[0],
          course,
        );
      case "createCart":
        return ArchetypeRide.along(
          model as Parameters<typeof ArchetypeRide.along>[0],
          course,
        );
      default:
        throw new Error(
          `"${object.producer}" does not supply a vehicle course.`,
        );
    }
  })();
  let previous: number | undefined;
  let sample: ArchetypeRide.ISample<string, string>;
  const at = (seconds: number): ArchetypeRide.ISample<string, string> => {
    if (seconds !== previous) {
      sample = ride.at(seconds);
      previous = seconds;
    }
    return sample;
  };
  const keyed = Object.entries(object.joints ?? {});
  for (const [id, keys] of keyed) {
    model.travel(id);
    if (
      keys[0]?.seconds !== 0 ||
      keys.some(
        (key, index) =>
          !Number.isFinite(key.value) ||
          !Number.isFinite(key.seconds) ||
          (index > 0 && key.seconds <= keys[index - 1]!.seconds),
      )
    )
      throw new Error(
        `Joint "${id}" on "${object.subject}" needs increasing keys from film second zero.`,
      );
  }
  const articulations: string[] = [
    ...new Set([
      ...Object.keys(at(0).archetype.state),
      ...keyed.map(([id]) => id),
    ]),
  ];
  const state = (seconds: number): Record<string, number | undefined> => ({
    ...at(seconds).archetype.state,
    ...Object.fromEntries(
      keyed.map(([id, keys]) => [id, jointValue(keys, seconds)]),
    ),
  });
  return {
    placement: (seconds: number): IAutoMovieRigidTransform => {
      const pose = at(seconds).placement;
      return { position: pose.translation, rotation: pose.rotation };
    },
    contact: (id: string, seconds: number): IAutoMovieTransform => {
      const shown = at(seconds);
      return ArchetypeFrame.compose(
        shown.placement,
        (keyed.length === 0
          ? shown.archetype
          : model.articulate(state(seconds))
        ).affordance(id).frame,
      );
    },
    tracks: articulations.map(
      (articulation): IAutoMovieMotionHumanProp.ITrack => ({
        articulation,
        start: 0,
        travel: (seconds: number): number => state(seconds)[articulation] ?? 0,
      }),
    ),
  };
}

/** Interpolate adjacent named values and hold the final one after its key. */
function jointValue(
  keys: readonly IPlaygroundComposition.IJointKey[],
  seconds: number,
): number {
  const later = keys.findIndex((key) => key.seconds > seconds);
  if (later < 1) return (later === -1 ? keys.at(-1) : keys[0])!.value;
  const a = keys[later - 1]!;
  const b = keys[later]!;
  return (
    a.value +
    ((seconds - a.seconds) / (b.seconds - a.seconds)) * (b.value - a.value)
  );
}
