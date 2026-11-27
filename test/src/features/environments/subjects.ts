import type {
  AutoMovieRenderDrawSubjects,
  IAutoMovieRenderDrawScene,
} from "@automovie/render";

import { bankedParkRide } from "./bankedParkRide";
import { bridgeCampus } from "./bridgeCampus";
import { drawEnvironmentExample } from "./drawEnvironmentExample";
import { hillsideStop } from "./hillsideStop";
import { pondTrail } from "./pondTrail";
import { railShuttle } from "./railShuttle";

/** Draw the compiled production examples through the ordinary capture host. */
export const subjects: AutoMovieRenderDrawSubjects = () => ({
  "hillside-stop": {
    create: async (): Promise<IAutoMovieRenderDrawScene> =>
      drawEnvironmentExample(hillsideStop(), {
        sill: () => ({
          position: { x: 5, y: 3.1, z: -3.6 },
          target: { x: 3, y: 2.15, z: 0 },
        }),
        room: () => ({
          position: { x: 12.8, y: 3.15, z: 5.45 },
          target: { x: 9.5, y: 2.05, z: 2.6 },
        }),
      }),
  },
  "pond-trail": {
    create: async (): Promise<IAutoMovieRenderDrawScene> =>
      drawEnvironmentExample(pondTrail(), {
        shoreline: () => ({
          position: { x: 22, y: 6, z: 2 },
          target: { x: 11, y: 0, z: 9 },
        }),
        parcel: () => ({
          position: { x: 26, y: 9, z: 0 },
          target: { x: 15, y: 0, z: 9 },
        }),
      }),
  },
  "bridge-campus": {
    create: async (): Promise<IAutoMovieRenderDrawScene> =>
      drawEnvironmentExample(bridgeCampus(), {
        span: () => ({
          position: { x: 9.5, y: 7, z: -3 },
          target: { x: 9.5, y: 3.4, z: 4 },
        }),
        garden: () => ({
          position: { x: 16.5, y: 4.7, z: 17 },
          target: { x: 9, y: 1.0, z: 9.5 },
        }),
        ground: () => ({
          position: { x: 1.1, y: 1.65, z: 1.0 },
          target: { x: 4, y: 1, z: 4 },
        }),
        upper: () => ({
          position: { x: 1.1, y: 5.05, z: 1.0 },
          target: { x: 4, y: 4.4, z: 4 },
        }),
        lift: () => ({
          position: { x: 19, y: 6, z: -7 },
          target: { x: 15, y: 3, z: 0 },
        }),
        "lift-ground": () => ({
          position: { x: 15.8, y: 1.55, z: 3 },
          target: { x: 15, y: 1, z: -1 },
        }),
        "lift-upper": () => ({
          position: { x: 15.8, y: 4.95, z: 3 },
          target: { x: 15, y: 4.4, z: -1 },
        }),
      }),
  },
  "banked-park-ride": {
    create: async (): Promise<IAutoMovieRenderDrawScene> =>
      drawEnvironmentExample(bankedParkRide(), {
        station: () => ({
          position: { x: 10, y: 4, z: -11 },
          target: { x: 7.4, y: 1.15, z: -6.8 },
        }),
        bank: () => ({
          position: { x: 23, y: 8.2, z: 5 },
          target: { x: 14, y: 4, z: -0.8 },
        }),
      }),
  },
  "rail-shuttle": {
    create: async (): Promise<IAutoMovieRenderDrawScene> =>
      drawEnvironmentExample(railShuttle(), {
        board: () => ({
          position: { x: 6, y: 2.1, z: 9.6 },
          target: { x: 1.5, y: 0.9, z: 12 },
        }),
        arrival: () => ({
          position: { x: 6, y: 2.1, z: 35.6 },
          target: { x: 1.5, y: 0.9, z: 38 },
        }),
      }),
  },
});
