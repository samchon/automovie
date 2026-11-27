import { AutoMovieEnvironment } from "@automovie/archetypes/environments";
import type { IAutoMovieEnvironment } from "@automovie/interface";

import { environmentLiftSchedule } from "./environmentLiftSchedule";

/** Two-level authored lift whose live support reads the ordinary object clip. */
export function environmentLiftFixture(upper: number = 3.4): {
  id: string;
  lift: AutoMovieEnvironment.IAutoMovieEnvironmentLiftDefinition;
  schedule: readonly AutoMovieEnvironment.IAutoMovieEnvironmentLiftKey[];
  environment: IAutoMovieEnvironment;
} {
  const id: string = "estate/lift";
  const schedule: readonly AutoMovieEnvironment.IAutoMovieEnvironmentLiftKey[] =
    environmentLiftSchedule;
  const lift: AutoMovieEnvironment.IAutoMovieEnvironmentLiftDefinition =
    AutoMovieEnvironment.lift({
      stops: { ground: 0, upper },
      gap: 0.055,
      landingDepth: 1.2,
      car: { callHeight: 1.18 },
      schedule,
    });
  const environment: IAutoMovieEnvironment = AutoMovieEnvironment.create({
    id: "estate",
    items: { lift: { use: lift } },
  });
  return { id, lift, schedule, environment };
}
