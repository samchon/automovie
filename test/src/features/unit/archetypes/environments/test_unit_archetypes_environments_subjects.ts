import type {
  AutoMovieDrawSubjects,
  IAutoMovieDrawScene,
} from "@automovie/render";

import { bankedParkRide } from "./bankedParkRide";
import { bridgeCampus } from "./bridgeCampus";
import { drawEnvironmentExample } from "./drawEnvironmentExample";
import { hillsideStop } from "./hillsideStop";
import { pondTrail } from "./pondTrail";
import { railShuttle } from "./railShuttle";

/** Draw the compiled production examples through the ordinary capture host. */
export const subjects: AutoMovieDrawSubjects = () => ({
  "hillside-stop": {
    create: async (): Promise<IAutoMovieDrawScene> =>
      drawEnvironmentExample(hillsideStop(), {
        sill: () => ({ position: [5, 3.1, -3.6], target: [3, 2.15, 0] }),
        room: () => ({
          position: [12.8, 3.15, 5.45],
          target: [9.5, 2.05, 2.6],
        }),
      }),
  },
  "pond-trail": {
    create: async (): Promise<IAutoMovieDrawScene> =>
      drawEnvironmentExample(pondTrail(), {
        shoreline: () => ({ position: [22, 6, 2], target: [11, 0, 9] }),
        parcel: () => ({ position: [26, 9, 0], target: [15, 0, 9] }),
      }),
  },
  "bridge-campus": {
    create: async (): Promise<IAutoMovieDrawScene> =>
      drawEnvironmentExample(bridgeCampus(), {
        span: () => ({ position: [9.5, 7, -3], target: [9.5, 3.4, 4] }),
        garden: () => ({ position: [16.5, 4.7, 17], target: [9, 1.0, 9.5] }),
        ground: () => ({ position: [1.1, 1.65, 1.0], target: [4, 1, 4] }),
        upper: () => ({ position: [1.1, 5.05, 1.0], target: [4, 4.4, 4] }),
        lift: () => ({ position: [19, 6, -7], target: [15, 3, 0] }),
        "lift-ground": () => ({
          position: [15.8, 1.55, 3],
          target: [15, 1, -1],
        }),
        "lift-upper": () => ({
          position: [15.8, 4.95, 3],
          target: [15, 4.4, -1],
        }),
      }),
  },
  "banked-park-ride": {
    create: async (): Promise<IAutoMovieDrawScene> =>
      drawEnvironmentExample(bankedParkRide(), {
        station: () => ({ position: [10, 4, -11], target: [7.4, 1.15, -6.8] }),
        bank: () => ({ position: [23, 8.2, 5], target: [14, 4, -0.8] }),
      }),
  },
  "rail-shuttle": {
    create: async (): Promise<IAutoMovieDrawScene> =>
      drawEnvironmentExample(railShuttle(), {
        board: () => ({ position: [6, 2.1, 9.6], target: [1.5, 0.9, 12] }),
        arrival: () => ({ position: [6, 2.1, 35.6], target: [1.5, 0.9, 38] }),
      }),
  },
});
