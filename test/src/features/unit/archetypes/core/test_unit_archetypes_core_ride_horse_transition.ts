import {
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeEquine,
  AutoMovieArchetypeQuadrupedGait,
  createHorse,
  createQuadruped,
  rideHorse,
} from "@automovie/archetypes";
import { AutoMovieGravity } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { archetypeHorseRide } from "../../../internal/archetypeHorseRide";

/** The horse's species, whose gait table the expectations read. */
const HORSE: createQuadruped.ISpecies = createQuadruped.SPECIES.horse;

/**
 * A horse left to choose its gait walks, trots, canters and comes back down as the speed rises and falls, each change at a footfall with every planted hoof held.
 *
 * Scenarios, for a horse at two seeds on a straight course from rest to 1.6 times its walk-to-trot change point, then halfway from its trot-to-canter change point to its canter-to-gallop one, back to 1.6 times the first and to rest; the walk-to-trot change point where its Froude number, speed squared over gravity times its hip joint's height, is 0.35 (Griffin et al. 2004), the trot-to-canter one Heglund and Taylor's trot-gallop speed, 5 m/s at 170 kg rising with mass to the power 0.216, and the canter-to-gallop one the middle of the two gaits' measured ranges (Robilliard et al. 2007) at its height:
 * 1. The ride names `gait:walk-trot`, `gait:trot-canter`, `gait:canter-trot` and `gait:trot-walk`, in that order and no other change.
 * 2. Each change falls at a left fore landing, the stride's start.
 * 3. No hoof slides more than 1 mm along the ground through the first fifth of the time to its next landing, across every change.
 * 4. A ride given its gait names no change of gait or lead.
 * 5. The trot-to-canter change point lies inside both the trot's and the canter's measured ranges at the horse's height.
 */
export function test_unit_archetypes_core_ride_horse_transition(): void {
  const findings: string[] = [];
  for (const seed of [1, 4]) {
    const horse: ReturnType<typeof createHorse> = createHorse({}, seed);
    const withers: number = horse.dimensions.withersHeight!;
    const middle = (
      a: AutoMovieArchetypeQuadrupedGait.Gait,
      b: AutoMovieArchetypeQuadrupedGait.Gait,
    ): number => {
      const p: { minimum: number; maximum: number } =
        AutoMovieArchetypeQuadrupedGait.range(HORSE, a, withers);
      const q: { minimum: number; maximum: number } =
        AutoMovieArchetypeQuadrupedGait.range(HORSE, b, withers);
      return (
        (Math.max(p.minimum, q.minimum) + Math.min(p.maximum, q.maximum)) / 2
      );
    };
    const hip: number = AutoMovieArchetypeEquine.rig(horse.dimensions).limbs
      .leftHind[0]!.y;
    const trot: number =
      1.6 * Math.sqrt(0.35 * AutoMovieGravity.STANDARD * hip);
    const gallop: number = 5 * (horse.dimensions.mass! / 170) ** 0.216;
    const canter: number = (gallop + middle("canter", "gallop")) / 2;
    for (const which of ["trot", "canter"] as const) {
      const range: { minimum: number; maximum: number } =
        AutoMovieArchetypeQuadrupedGait.range(HORSE, which, withers);
      if (!(gallop > range.minimum && gallop < range.maximum))
        findings.push(
          `seed ${seed}: the trot-to-canter point ${gallop} m/s is outside the measured ${which}`,
        );
    }
    const course: AutoMovieArchetypeCourse.ICourse = {
      start: { x: 0, z: 0, heading: 0 },
      legs: [
        { kind: "straight", length: 40 },
        { kind: "straight", length: 80 },
        { kind: "straight", length: 80 },
        { kind: "straight", length: 40 },
      ],
      speeds: [trot, canter, trot, 0],
      cruise: canter,
      acceleration: 1,
      deceleration: 1,
    };
    const ride: ReturnType<typeof rideHorse> = rideHorse(horse, course);
    const changes: { seconds: number; label: string }[] = ride.instants.filter(
      (i: { label: string }): boolean => i.label.startsWith("gait:"),
    );
    const labels: string = changes
      .map((i: { label: string }): string => i.label)
      .join(", ");
    if (
      labels !==
      "gait:walk-trot, gait:trot-canter, gait:canter-trot, gait:trot-walk"
    )
      findings.push(`seed ${seed}: changes ${labels}`);
    const starts: number[] = archetypeHorseRide.footfalls(ride, "leftFore");
    for (const change of changes)
      if (
        !starts.some(
          (s: number): boolean => Math.abs(s - change.seconds) < 1e-9,
        )
      )
        findings.push(
          `seed ${seed}: ${change.label} at ${change.seconds} s is at no left fore landing`,
        );
    const slid: { worst: number; at: string } = archetypeHorseRide.slide(ride);
    if (!(slid.worst < 1e-3))
      findings.push(`seed ${seed}: a hoof slid ${slid.worst} m (${slid.at})`);

    // A fixed gait is unchanged.
    const steady: AutoMovieArchetypeCourse.ICourse = {
      start: { x: 0, z: 0, heading: 0 },
      legs: [{ kind: "straight", length: 40 }],
      cruise: 4,
      acceleration: 2,
      deceleration: 2,
    };
    const fixed: ReturnType<typeof rideHorse> = rideHorse(
      horse,
      steady,
      "trot",
    );
    if (
      fixed.instants.some((i: { label: string }): boolean =>
        i.label.includes(":"),
      )
    )
      findings.push(`seed ${seed}: a fixed trot names a change`);
  }
  TestValidator.equals(
    "the gaits change with the speed at footfalls",
    findings,
    [],
  );
}
