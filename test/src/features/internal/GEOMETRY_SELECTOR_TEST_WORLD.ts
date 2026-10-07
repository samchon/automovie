import { worldRamp } from "@automovie/engine";
import { IAutoMovieWorldDesign } from "@automovie/interface";

/** Authored world surfaces and routes shared by the existing query scenarios. */
export const GEOMETRY_SELECTOR_TEST_WORLD: Pick<
  IAutoMovieWorldDesign,
  "landmarks" | "surfaces" | "routes"
> = {
  landmarks: [
    {
      id: "well",
      position: { x: 6, y: 0, z: 8 },
      radius: 1,
      meaning: "water",
    },
  ],
  surfaces: [
    // One metre high at z = 0, five metres at z = 10.
    worldRamp({
      id: "slope",
      from: { x: 0, z: 0 },
      to: { x: 0, z: 10 },
      width: 10,
      baseHeight: 1,
      rise: 4,
      walkable: true,
    }),
    worldRamp({
      id: "ledge",
      from: { x: 20, z: 0 },
      to: { x: 20, z: 10 },
      width: 4,
      baseHeight: 3,
      rise: 0,
      walkable: false,
    }),
  ],
  routes: [],
};
