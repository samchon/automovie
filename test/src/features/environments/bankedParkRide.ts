import {
  AutoMovieArchetypeEnvironment
} from "../../../../packages/archetypes/src/environments/AutoMovieArchetypeEnvironment";
import {
  AutoMovieArchetypeEnvironmentFurnishing
} from "../../../../packages/archetypes/src/environments/AutoMovieArchetypeEnvironmentFurnishing";
import type { IAutoMovieMotion } from "@automovie/interface";

import { locationTrackedRideFixture } from "../internal/locationTrackedRideFixture";
import { locationTrackedRidePassenger } from "../internal/locationTrackedRidePassenger";
import { bakeEnvironmentPerformance } from "./bakeEnvironmentPerformance";
import type { compileEnvironmentExample } from "./compileEnvironmentExample";

/** A performer sits at a named park station before the vehicle's banked lap. */
export function bankedParkRide(): compileEnvironmentExample.IInput {
  const fixture: ReturnType<typeof locationTrackedRideFixture> =
    locationTrackedRideFixture({
      terrain: {
        at: {
          anchor: "coaster/stops/departure",
          offset: { x: 1.6, y: 0, z: -4 },
        },
        use: AutoMovieArchetypeEnvironment.terrain({
          size: { width: 12, depth: 10 },
          paths: {
            approach: {
              points: [
                { x: 4, z: 4 },
                { x: 0, z: 4 },
              ],
              width: 0.8,
            },
          },
          amenities: { kitchen: { x: 7.5, z: 4 } },
        }),
      },
      concession: {
        use: AutoMovieArchetypeEnvironmentFurnishing.cafeKit({
          room: { width: 8, depth: 6 },
          tables: 1,
        }),
        at: { anchor: "terrain/amenities/kitchen" },
      },
    });
  const { film, actor }: ReturnType<typeof locationTrackedRidePassenger> =
    locationTrackedRidePassenger(fixture);
  const ride: IAutoMovieMotion = bakeEnvironmentPerformance(film, actor, 15);
  return {
    id: "banked-park-ride",
    summary: "The passenger takes a seat before a banked lap.",
    seconds: 15,
    environment: fixture.environment,
    visible: [fixture.carrier],
    actors: [actor],
    actions: [
      {
        actor: actor.node,
        verb: "enact",
        clip: ride.id,
        start: 0,
        duration: 15,
      },
    ],
    motions: { [ride.id]: ride },
    camera: {
      position: { x: 31, y: 14, z: 12 },
      target: { x: 10, y: 1.8, z: -6 },
    },
  };
}
