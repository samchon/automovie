import { worldRamp } from "@automovie/engine";
import { IAutoMovieWorldDesign } from "@automovie/interface";

/** Level ground nobody may stand on, far along +x. */
const BOG = worldRamp({
  id: "bog",
  from: { x: 100, z: -10 },
  to: { x: 100, z: 30 },
  width: 20,
  baseHeight: 0,
  rise: 0,
  walkable: false,
});

/** Ground height `(z + 10) / 2`: 5 m under z = 0, 6.5 m under z = 3. */
const RISE = worldRamp({
  id: "rise",
  from: { x: 0, z: -10 },
  to: { x: 0, z: 30 },
  width: 40,
  baseHeight: 0,
  rise: 20,
  walkable: true,
});

/** Authored world surfaces and routes shared by the existing query scenarios. */
export const GEOMETRY_FORMATION_TEST_WORLD: Pick<
  IAutoMovieWorldDesign,
  "landmarks" | "surfaces" | "routes"
> = {
  landmarks: [],
  surfaces: [RISE, BOG],
  routes: [
    {
      id: "road",
      waypoints: [
        { x: 0, z: -10 },
        { x: 0, z: 30 },
      ],
      allowedFormationWidth: 10,
    },
  ],
};
