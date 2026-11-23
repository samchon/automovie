import {
  createEnvironment,
  createLift,
} from "@automovie/archetypes/environments";
import type { IAutoMovieEnvironment } from "@automovie/interface";

/** Two-level authored lift whose live support reads the ordinary object clip. */
export function environmentLiftFixture(upper: number = 3.4): {
  id: string;
  lift: ReturnType<typeof createLift>;
  environment: IAutoMovieEnvironment;
} {
  const id: string = "estate/lift";
  const lift: ReturnType<typeof createLift> = createLift({
    stops: { ground: 0, upper },
    gap: 0.055,
    landingDepth: 1.2,
    car: { callHeight: 1.18 },
    // The cab leaves once its rider has walked in and turned about to the
    // doors: the about-turn takes its step turns a footfall at a time.
    schedule: [
      { seconds: 0, stop: "ground", doors: "closed" },
      { seconds: 1, stop: "ground", doors: "open" },
      { seconds: 8.6, stop: "ground", doors: "open" },
      { seconds: 9.2, stop: "ground", doors: "closed" },
      { seconds: 11.2, stop: "upper", doors: "closed" },
      { seconds: 12, stop: "upper", doors: "open" },
      { seconds: 14.6, stop: "upper", doors: "open" },
    ],
  });
  const environment: IAutoMovieEnvironment = createEnvironment({
    id: "estate",
    items: { lift: { use: lift } },
  });
  return { id, lift, environment };
}
