import { Quaternion, Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieClip,
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentModule,
  IAutoMovieModel,
  IAutoMoviePropSpec,
  IAutoMovieSurface,
  IAutoMovieTrackedRide,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../../core/AutoMovieArchetypeFrame";
import { createTrackedRails } from "./createTrackedRails";

/** Lateral and forward axes of the authored threshold. */
const LOCAL_X: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
const LOCAL_Z: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/**
 * Match the engine's unit-rotation admission scale when checking boarding
 * frames.
 */
const LEVEL_TOLERANCE: number = 1e-6;

/** Usable waiting width beside the car, in metres. */
const PLATFORM_WIDTH: number = 1.5;

/**
 * Place a course, its moving car and its usable waiting platforms as one
 * module.
 *
 * The route's geometric clock runs in metres. The film clock linearly advances
 * through the author's distance marks, inserting a clip key wherever a rail
 * station or distance mark is reached. Both the ordinary object motion reader
 * and the rider's carrier reader can sample the returned clip with
 * `bakedTransformFromClipsAt`. Between the keys, the motion uses linear
 * translation and quaternion interpolation, the same approximation in both
 * views; its centre lies on the sampled course and its border rails interpolate
 * corresponding cross sections. Named stops are static anchors. The exported
 * carrier-affordance anchors describe the initial pose.
 *
 * @param input Course, rigid car with a named threshold and rider contact, time
 *   marks, and named held stops.
 * @returns An environment module with models, set pieces, prop, support and
 *   object clip.
 * @throws On malformed timing, gauge, carrier, threshold or stop positions, or
 *   if a threshold is not level and side-aligned in its placed stop frame.
 */
export function createTrackedRide(
  input: IAutoMovieTrackedRide,
): IAutoMovieEnvironmentModule {
  const course: IAutoMovieTrackedRide["course"] = input.course;
  const gauge: number = input.gauge ?? 1.2;
  if (gauge <= 0.1)
    throw new Error(
      "Tracked ride gauge must be finite and wider than the 0.1 m rail",
    );

  const schedule: IAutoMovieTrackedRide.IMark[] = input.schedule.map(
    (mark: IAutoMovieTrackedRide.IMark): IAutoMovieTrackedRide.IMark => ({
      ...mark,
    }),
  );
  if (schedule.length < 2 || schedule[0]!.seconds !== 0)
    throw new Error(
      "Tracked ride expects at least two time marks, starting at zero",
    );
  schedule.forEach((mark: IAutoMovieTrackedRide.IMark, index: number): void => {
    if (index > 0 && mark.seconds <= schedule[index - 1]!.seconds)
      throw new Error(
        `Tracked ride schedule[${index}] seconds must increase finitely`,
      );
    if (mark.distance < 0 || mark.distance > course.length)
      throw new Error(
        `Tracked ride schedule[${index}] distance falls outside the course`,
      );
  });

  const stopDistances: Set<number> = new Set<number>();
  for (let i: number = 1; i < schedule.length; ++i)
    if (schedule[i]!.distance === schedule[i - 1]!.distance)
      stopDistances.add(placeDistance(course, schedule[i]!.distance));
  const stops: [string, number][] = Object.entries(input.stops);
  if (stops.length === 0)
    throw new Error("Tracked ride needs a named boarding stop");
  for (const [name, distance] of stops) {
    if (name.trim().length === 0 || name.includes("/"))
      throw new Error(
        `Tracked ride stop "${name}" must be one nonblank path segment`,
      );
    if (!stopDistances.has(placeDistance(course, distance)))
      throw new Error(
        `Tracked ride stop "${name}" needs a scheduled dwell at ${distance} m`,
      );
  }

  const car: IAutoMovieModel = structuredClone(input.car);
  if (car.origin !== "generated" || car.skeleton !== null)
    throw new Error("Tracked ride car must be a generated rigid model");
  const boarding: IAutoMovieAffordance | undefined = car.affordances?.find(
    (contact: IAutoMovieAffordance): boolean => contact.id === input.boarding,
  );
  if (
    boarding?.kind !== "surface" ||
    boarding.width === undefined ||
    boarding.width <= 0 ||
    Math.abs(boarding.frame.translation.x) <= LEVEL_TOLERANCE
  )
    throw new Error(
      `Tracked ride boarding "${input.boarding}" must be a dimensioned surface on a car side`,
    );
  if (
    !(car.affordances ?? []).some(
      (contact: IAutoMovieAffordance): boolean =>
        contact.kind === "seat" ||
        contact.kind === "handle" ||
        contact.kind === "bar",
    )
  )
    throw new Error("Tracked ride car needs a named seat, handle or bar");

  const samples: IAutoMovieTrackedRide.IMark[] = trackKeys(
    course.stations,
    schedule,
  );
  return (
    context: IAutoMovieEnvironmentModule.IContext,
  ): IAutoMovieEnvironmentContribution => {
    const scopedCar: IAutoMovieModel = {
      ...structuredClone(car),
      id: `${context.id}/carrier`,
    };
    const prop: IAutoMoviePropSpec = {
      node: scopedCar.id,
      model: scopedCar,
      articulation: null,
    };

    /** Compose the same local course with the occurrence's assigned world frame. */
    const at = (distance: number): IAutoMovieTransform =>
      AutoMovieArchetypeFrame.compose(context.frame, course.frame(distance));

    const first: IAutoMovieTransform = at(samples[0]!.distance);
    const rails: IAutoMovieModel = createTrackedRails(
      `${context.id}/track`,
      course,
      gauge,
    );
    const time: number[] = [];
    const positions: number[] = [];
    const rotations: number[] = [];
    for (const sample of samples) {
      const { translation, rotation }: IAutoMovieTransform = at(
        sample.distance,
      );
      time.push(sample.seconds);
      positions.push(translation.x, translation.y, translation.z);
      rotations.push(rotation.x, rotation.y, rotation.z, rotation.w);
    }

    const clip: IAutoMovieClip = {
      id: `${scopedCar.id}/travel`,
      name: "Tracked ride travel",
      duration: schedule[schedule.length - 1]!.seconds,
      loop: false,
      tracks: [
        {
          channel: { kind: "node", node: scopedCar.id, path: "translation" },
          interpolation: "linear",
          times: time,
          values: positions,
        },
        {
          channel: { kind: "node", node: scopedCar.id, path: "rotation" },
          interpolation: "linear",
          times: [...time],
          values: rotations,
        },
      ],
    };
    const anchors: Record<string, IAutoMovieTransform> = Object.fromEntries(
      (scopedCar.affordances ?? []).map(
        (contact: IAutoMovieAffordance): [string, IAutoMovieTransform] => [
          `carrier/${contact.id}`,
          AutoMovieArchetypeFrame.compose(first, contact.frame),
        ],
      ),
    );
    const platforms: Map<number, IAutoMovieSurface> = new Map<
      number,
      IAutoMovieSurface
    >();
    for (const [name, distance] of stops) {
      const position: number = placeDistance(course, distance);
      const root: IAutoMovieTransform = at(position);
      const threshold: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
        root,
        boarding.frame,
      );
      anchors[`stops/${name}`] = threshold;
      if (!platforms.has(position))
        platforms.set(
          position,
          createPlatform(
            `${context.id}/stops/${name}`,
            root,
            threshold,
            boarding,
          ),
        );
    }
    const surfaces: IAutoMovieSurface[] = [...platforms.values()];
    return {
      anchors,
      models: [rails, scopedCar],
      set: [
        {
          node: rails.id,
          model: rails.id,
          position: context.frame.translation,
          rotation: context.frame.rotation,
        },
        {
          node: scopedCar.id,
          model: scopedCar.id,
          position: first.translation,
          rotation: first.rotation,
        },
      ],
      props: [prop],
      spaces: [
        {
          id: `${context.id}/platforms`,
          surfaces,
          walkable: surfaces.map(
            (surface: IAutoMovieSurface): string => surface.id,
          ),
        },
      ],
      objectMotions: [clip],
    };
  };
}

/**
 * The endpoint of a closed course owns the same platform and anchor as its
 * start.
 */
function placeDistance(
  course: IAutoMovieTrackedRide["course"],
  distance: number,
): number {
  return course.closed && distance === course.length ? 0 : distance;
}

/** Find the first sample not less than a distance, excluding the upper bound. */
function lowerBound(samples: readonly number[], distance: number): number {
  let lo: number = 0;
  let hi: number = samples.length;
  while (lo < hi) {
    const mid: number = Math.floor((lo + hi) / 2);
    if (samples[mid]! < distance) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Put one time key at each explicitly authored mark and crossed rail station. */
function trackKeys(
  stations: readonly number[],
  schedule: readonly IAutoMovieTrackedRide.IMark[],
): IAutoMovieTrackedRide.IMark[] {
  const keys: IAutoMovieTrackedRide.IMark[] = [schedule[0]!];
  for (let i: number = 1; i < schedule.length; ++i) {
    const from: IAutoMovieTrackedRide.IMark = schedule[i - 1]!;
    const to: IAutoMovieTrackedRide.IMark = schedule[i]!;
    const low: number = Math.min(from.distance, to.distance);
    const high: number = Math.max(from.distance, to.distance);
    if (high > low) {
      const cuts: number[] = stations
        .slice(lowerBound(stations, low), lowerBound(stations, high))
        .filter((sample: number): boolean => sample > low);
      if (to.distance < from.distance) cuts.reverse();
      for (const distance of cuts) {
        const share: number =
          (distance - from.distance) / (to.distance - from.distance);
        const seconds: number =
          from.seconds + share * (to.seconds - from.seconds);
        if (seconds <= keys[keys.length - 1]!.seconds || seconds >= to.seconds)
          throw new Error(
            `Tracked ride schedule[${i}] interval cannot represent its rail station keys`,
          );
        keys.push({ seconds, distance });
      }
    }
    keys.push(to);
  }
  return keys;
}

/** Place a visible walkable platform directly alongside its level threshold. */
function createPlatform(
  id: string,
  root: IAutoMovieTransform,
  threshold: IAutoMovieTransform,
  boarding: IAutoMovieAffordance,
): IAutoMovieSurface {
  const lateral: IAutoMovieVector3 = Quaternion.rotateVector(
    threshold.rotation,
    LOCAL_X,
  );
  const forward: IAutoMovieVector3 = Quaternion.rotateVector(
    threshold.rotation,
    LOCAL_Z,
  );
  const carSide: IAutoMovieVector3 = Quaternion.rotateVector(
    root.rotation,
    LOCAL_X,
  );
  const alignment: number = Vector3.dot(lateral, carSide);
  if (
    Vector3.cross(lateral, forward).y >= 0 ||
    Math.abs(lateral.y) > LEVEL_TOLERANCE ||
    Math.abs(forward.y) > LEVEL_TOLERANCE ||
    Math.abs(alignment) < 1 - LEVEL_TOLERANCE
  )
    throw new Error(
      `Tracked ride stop "${id}" boarding surface must be level, upward and side-aligned`,
    );

  const side: number = Math.sign(alignment * boarding.frame.translation.x);
  const near: number = (side * boarding.width!) / 2;
  const far: number = near + side * PLATFORM_WIDTH;
  const halfDepth: number = Math.max(1.5, (boarding.depth ?? 0) / 2);
  const polygon: IAutoMovieVector3[] = [
    [near, -halfDepth],
    [far, -halfDepth],
    [far, halfDepth],
    [near, halfDepth],
  ].map(([x, z]: number[]): IAutoMovieVector3 => {
    const point: IAutoMovieVector3 = Vector3.add(
      threshold.translation,
      Vector3.add(Vector3.scale(lateral, x!), Vector3.scale(forward, z!)),
    );
    return { ...point, y: 0 };
  });
  return {
    id,
    kind: "platform",
    polygon,
    height: { kind: "constant", value: threshold.translation.y },
    color: AutoMovieEngineMath.srgbHexToLinearColor("#b9b4a9"),
  };
}
