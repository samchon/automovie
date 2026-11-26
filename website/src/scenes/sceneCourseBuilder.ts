/** Native course constructors keyed by the placed producer. */
const BUILDERS = {
  createCar: "driveCar",
  createBicycle: "rideBicycle",
  createMotorcycle: "rideMotorcycle",
  createHorse: "rideQuadruped",
  createPony: "rideQuadruped",
  createCart: "AutoMovieArchetypeRide.along",
} as const;

/** Resolve the same course constructor for playback and its displayed code. */
export function sceneCourseBuilder(
  producer: string,
): (typeof BUILDERS)[keyof typeof BUILDERS] {
  if (!Object.hasOwn(BUILDERS, producer))
    throw new Error(`"${producer}" does not supply a vehicle course.`);
  return BUILDERS[producer as keyof typeof BUILDERS];
}
