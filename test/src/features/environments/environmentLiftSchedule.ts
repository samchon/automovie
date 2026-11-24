import type { createLift } from "@automovie/archetypes/environments";

/**
 * The lift schedule its rider's act fits (`environmentLiftActor`): the cab
 * leaves the ground once the rider has walked in and turned about to the
 * doors, the about-turn taking its step turns a footfall at a time, and
 * opens at the upper stop for the rider to step out.
 */
export const environmentLiftSchedule: readonly createLift.IKey[] = [
  { seconds: 0, stop: "ground", doors: "closed" },
  { seconds: 1, stop: "ground", doors: "open" },
  { seconds: 8.6, stop: "ground", doors: "open" },
  { seconds: 9.2, stop: "ground", doors: "closed" },
  { seconds: 11.2, stop: "upper", doors: "closed" },
  { seconds: 12, stop: "upper", doors: "open" },
  { seconds: 14.6, stop: "upper", doors: "open" },
];
