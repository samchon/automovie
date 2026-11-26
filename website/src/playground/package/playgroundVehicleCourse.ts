import {
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRide,
  driveCar,
  rideBicycle,
  rideMotorcycle,
  rideQuadruped,
} from "@automovie/archetypes";
import type {
  IAutoMovieMotionHumanProp,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
} from "@automovie/interface";

import type { SceneArchetype } from "../../scenes/package/SceneArchetype";
import { sceneCourseBuilder } from "../../scenes/sceneCourseBuilder";
import type { IPlaygroundComposition } from "../structures/IPlaygroundComposition";

/**
 * Adapt an authored vehicle or ridden-animal course to the performance's native
 * moving prop and its articulation tracks. Root, grips and the take share one
 * sampled native ride. Prop tracks retain the final wheel and control
 * positions.
 *
 * @param object The vehicle and its placed course.
 * @param model The same stationary archetype passed to the prop.
 * @returns The course reader and its tracks, absent for a stationary scene
 *   prop.
 * @throws {Error} If a fixed, worn, or unsupported prop names a vehicle course.
 */
export function playgroundVehicleCourse(
  object: IPlaygroundComposition.IObject,
  model: SceneArchetype.Model,
): playgroundVehicleCourse.ICourse | undefined {
  if (object.course === undefined) {
    if (object.joints !== undefined)
      throw new Error(
        "Native joint keys need a vehicle course on " + object.subject + ".",
      );
    return undefined;
  }
  if (
    object.worn !== undefined ||
    object.fixed === true ||
    object.rotation !== undefined ||
    (object.y ?? 0) !== 0
  )
    throw new Error(
      `The vehicle course of "${object.subject}" must start at a level moving prop's floor placement.`,
    );
  const course: AutoMovieArchetypeCourse.ICourse = {
    ...object.course,
    start: { x: object.x, z: object.z, heading: object.yaw },
  };
  const ride: Pick<
    AutoMovieArchetypeRide.IRide<string, string>,
    "at" | "instants"
  > = (() => {
    switch (sceneCourseBuilder(object.producer)) {
      case "driveCar":
        return driveCar(model as Parameters<typeof driveCar>[0], course);
      case "rideBicycle":
        return rideBicycle(model as Parameters<typeof rideBicycle>[0], course);
      case "rideMotorcycle":
        return rideMotorcycle(
          model as Parameters<typeof rideMotorcycle>[0],
          course,
        );
      case "rideQuadruped":
        return rideQuadruped(
          model as Parameters<typeof rideQuadruped>[0],
          course,
        );
      case "AutoMovieArchetypeRide.along":
        return AutoMovieArchetypeRide.along(
          model as Parameters<typeof AutoMovieArchetypeRide.along>[0],
          course,
        );
    }
  })();

  // Every reader of one film second shares one native ride sample.
  let previous: number | undefined;
  let sample: AutoMovieArchetypeRide.ISample<string, string>;
  const at: (
    seconds: number,
  ) => AutoMovieArchetypeRide.ISample<string, string> = (
    seconds: number,
  ): AutoMovieArchetypeRide.ISample<string, string> => {
    if (seconds !== previous) {
      sample = ride.at(seconds);
      previous = seconds;
    }
    return sample;
  };
  const keyed: [string, readonly IPlaygroundComposition.IJointKey[]][] =
    Object.entries(object.joints ?? {});
  for (const [id, keys] of keyed) {
    model.travel(id);
    if (
      keys[0]?.seconds !== 0 ||
      keys.some(
        (key: IPlaygroundComposition.IJointKey, index: number): boolean =>
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
      ...keyed.map(
        ([id]: [string, readonly IPlaygroundComposition.IJointKey[]]): string =>
          id,
      ),
    ]),
  ];
  const state: (seconds: number) => Partial<Record<string, number>> = (
    seconds: number,
  ): Partial<Record<string, number>> => ({
    ...at(seconds).archetype.state,
    ...Object.fromEntries(
      keyed.map(
        ([id, keys]: [string, readonly IPlaygroundComposition.IJointKey[]]): [
          string,
          number,
        ] => [id, jointValue(keys, seconds)],
      ),
    ),
  });
  return {
    placement: (seconds: number): IAutoMovieRigidTransform => {
      const pose: IAutoMovieTransform = at(seconds).placement;
      return { position: pose.translation, rotation: pose.rotation };
    },
    contact: (id: string, seconds: number): IAutoMovieTransform => {
      const shown: AutoMovieArchetypeRide.ISample<string, string> = at(seconds);
      return AutoMovieArchetypeFrame.compose(
        shown.placement,
        (keyed.length === 0
          ? shown.archetype
          : model.articulate(state(seconds))
        ).affordance(id).frame,
      );
    },
    gaits: ride.instants
      .filter(
        (
          instant: AutoMovieArchetypeRide.IRide<
            string,
            string
          >["instants"][number],
        ): boolean => instant.label.startsWith("gait:"),
      )
      .map(
        (
          instant: AutoMovieArchetypeRide.IRide<
            string,
            string
          >["instants"][number],
        ): IPlaygroundComposition.ICue => ({
          name: instant.label,
          seconds: instant.seconds,
        }),
      ),
    tracks: articulations.map(
      (articulation: string): IAutoMovieMotionHumanProp.ITrack => ({
        articulation,
        start: 0,
        travel: (seconds: number): number => state(seconds)[articulation] ?? 0,
      }),
    ),
  };
}
export namespace playgroundVehicleCourse {
  /** A vehicle course's readers on the film clock. */
  export interface ICourse {
    /** The vehicle's world frame at a film second. */
    placement: (seconds: number) => IAutoMovieRigidTransform;

    /**
     * A named affordance's world frame at a film second, on the articulated
     * model.
     */
    contact: (id: string, seconds: number) => IAutoMovieTransform;

    /**
     * The ride's own gait changes, each named by its `gait:<from>-<to>` label
     * at its film second; none for a vehicle.
     */
    gaits: IPlaygroundComposition.ICue[];

    /** Each articulation's travel over the film. */
    tracks: IAutoMovieMotionHumanProp.ITrack[];
  }
}

/** Interpolate adjacent named values and hold the final one after its key. */
function jointValue(
  keys: readonly IPlaygroundComposition.IJointKey[],
  seconds: number,
): number {
  const later: number = keys.findIndex(
    (key: IPlaygroundComposition.IJointKey): boolean => key.seconds > seconds,
  );
  if (later < 1) return (later === -1 ? keys.at(-1) : keys[0])!.value;
  const a: IPlaygroundComposition.IJointKey = keys[later - 1]!;
  const b: IPlaygroundComposition.IJointKey = keys[later]!;
  return (
    a.value +
    ((seconds - a.seconds) / (b.seconds - a.seconds)) * (b.value - a.value)
  );
}
