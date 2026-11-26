import { AutoMovieEnvironmentRide, AutoMovieEnvironment } from "@automovie/archetypes/environments";
import type {
  IAutoMovieEnvironment,
  IAutoMovieEnvironmentRecipe,
  IAutoMovieTrackCourse,
} from "@automovie/interface";

/** One nonplanar loop with a level station, a climb and authored banking through the far turn. */
export function locationTrackedRideFixture(
  additions: IAutoMovieEnvironmentRecipe["items"] = {},
): {
  environment: IAutoMovieEnvironment;
  course: IAutoMovieTrackCourse.IPrepared;
  carrier: string;
} {
  const course: IAutoMovieTrackCourse.IPrepared = AutoMovieEnvironmentRide.trackedCourse({
    points: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 5 },
      { x: 5, y: 2, z: 10 },
      { x: 12, y: 4, z: 5 },
      { x: 13, y: 3, z: -4 },
      { x: 7, y: 1, z: -10 },
      { x: 0, y: 0, z: -5 },
    ],
    banks: [0, 0, 34, 42, 15, 0, 0],
    closed: true,
  });
  return {
    carrier: "park/coaster/carrier",
    course,
    environment: AutoMovieEnvironment.create({
      id: "park",
      items: {
        ...additions,
        coaster: {
          at: { x: 4, y: 0, z: -7 },
          use: AutoMovieEnvironmentRide.trackedRide({
            course,
            car: AutoMovieEnvironmentRide.coasterCar(),
            boarding: "boarding",
            schedule: [
              { seconds: 0, distance: 0 },
              { seconds: 4, distance: 0 },
              { seconds: 13, distance: course.length },
              { seconds: 15, distance: course.length },
            ],
            stops: { departure: 0, arrival: course.length },
          }),
        },
      },
    }),
  };
}
