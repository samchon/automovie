import {
  createCafeKit,
  createTerrain,
} from "@automovie/archetypes/environments";
import type { IAutoMovieMotion } from "@automovie/interface";

import { locationTrackedRideFixture } from "../../../internal/locationTrackedRideFixture";
import { locationTrackedRidePassenger } from "../../../internal/locationTrackedRidePassenger";
import { bakeEnvironmentPerformance } from "./bakeEnvironmentPerformance";
import type { compileEnvironmentExample } from "./compileEnvironmentExample";

/** A performer sits at a named park station before the vehicle's banked lap. */
export function test_unit_archetypes_environments_bankedParkRide(): compileEnvironmentExample.IInput {
  const fixture: ReturnType<typeof locationTrackedRideFixture> =
    locationTrackedRideFixture({
      terrain: {
        at: {
          anchor: "coaster/stops/departure",
          offset: { x: 1.6, y: 0, z: -4 },
        },
        use: createTerrain({
          size: [12, 10],
          paths: {
            approach: {
              points: [
                [4, 4],
                [0, 4],
              ],
              width: 0.8,
            },
          },
          amenities: { kitchen: [7.5, 4] },
        }),
      },
      concession: {
        use: createCafeKit({ room: [8, 6], tables: 1 }),
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
