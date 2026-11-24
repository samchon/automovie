import {
  createEnvironment,
  createTrackedCourse,
  createTrackedRide,
} from "@automovie/archetypes/environments";
import { createRailCarriage } from "@automovie/archetypes/vehicles";
import type {
  IAutoMovieEnvironment,
  IAutoMovieTrackCourse,
} from "@automovie/interface";

import { bakeEnvironmentPerformance } from "./bakeEnvironmentPerformance";
import type { compileEnvironmentExample } from "./compileEnvironmentExample";
import { railShuttlePassenger } from "./railShuttlePassenger";

/** A straight two-stop shuttle reusing the same track and boarding producer. */
export function railShuttle(): compileEnvironmentExample.IInput {
  const seconds: number = 18;
  const origin: number = 12;
  const destination: number = 38;
  const railHeight: number = -createRailCarriage.REFERENCE.floor;
  const carriage: ReturnType<typeof createRailCarriage> = createRailCarriage({
    id: "shuttle-car",
  });
  const course: IAutoMovieTrackCourse.IPrepared = createTrackedCourse({
    points: [
      { x: 0, y: railHeight, z: 0 },
      { x: 0, y: railHeight, z: 50 },
    ],
  });
  const environment: IAutoMovieEnvironment = createEnvironment({
    id: "rail",
    items: {
      shuttle: {
        use: createTrackedRide({
          course,
          car: carriage.articulate({
            door: carriage.affordance("door").travel!,
          }),
          boarding: "threshold",
          schedule: [
            { seconds: 0, distance: origin },
            { seconds: 5.75, distance: origin },
            { seconds: 10.75, distance: destination },
            { seconds, distance: destination },
          ],
          stops: { origin, destination },
        }),
      },
    },
  });
  const passenger: ReturnType<typeof railShuttlePassenger> =
    railShuttlePassenger(environment, 11);
  const motion: ReturnType<typeof bakeEnvironmentPerformance> =
    bakeEnvironmentPerformance(passenger.film, passenger.actor, seconds);
  return {
    id: "rail-shuttle",
    summary:
      "A commuter boards a rail shuttle and disembarks at the next named platform.",
    seconds,
    environment,
    visible: ["rail/shuttle/carrier"],
    camera: {
      position: { x: 37, y: 13, z: 25 },
      target: { x: 0, y: 0.7, z: 25 },
    },
    actors: [passenger.actor],
    actions: [
      {
        actor: passenger.actor.node,
        verb: "enact",
        clip: motion.id,
        start: 0,
        duration: seconds,
      },
    ],
    motions: { [motion.id]: motion },
  };
}
