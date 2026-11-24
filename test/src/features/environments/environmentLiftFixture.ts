import {
  createEnvironment,
  createLift,
} from "@automovie/archetypes/environments";
import type { IAutoMovieEnvironment } from "@automovie/interface";

import { environmentLiftSchedule } from "./environmentLiftSchedule";

/** Two-level authored lift whose live support reads the ordinary object clip. */
export function environmentLiftFixture(upper: number = 3.4): {
  id: string;
  lift: ReturnType<typeof createLift>;
  schedule: readonly createLift.IKey[];
  environment: IAutoMovieEnvironment;
} {
  const id: string = "estate/lift";
  const schedule: readonly createLift.IKey[] = environmentLiftSchedule;
  const lift: ReturnType<typeof createLift> = createLift({
    stops: { ground: 0, upper },
    gap: 0.055,
    landingDepth: 1.2,
    car: { callHeight: 1.18 },
    schedule,
  });
  const environment: IAutoMovieEnvironment = createEnvironment({
    id: "estate",
    items: { lift: { use: lift } },
  });
  return { id, lift, schedule, environment };
}
