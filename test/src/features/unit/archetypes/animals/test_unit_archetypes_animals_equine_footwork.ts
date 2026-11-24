import {
  AutoMovieArchetypeQuadrupedBody,
  createHorse,
  rideHorse,
  type rideQuadruped,
} from "@automovie/archetypes";
import type { IAutoMovieModelPart } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { animalTerminalSole } from "../../../internal/animalTerminalSole";
import { archetypeHorseRide } from "../../../internal/archetypeHorseRide";

/**
 * The equine ride distinguishes diagonal backing and an authored two-hindhoof
 * slide from ordinary forward or reversed walking.
 *
 * Scenarios:
 * 1. Pair the hooves on two alternating diagonals during an explicit rein-back.
 *    Observe actual ground clearance and continuity into the stop and restart.
 * 2. On a separate authored terminal slide traverse the declared floor
 *    distance with the two hind hooves in contact until rest.
 * 3. A slide interval outside the terminal slowing phase fails admission.
 */
export function test_unit_archetypes_animals_equine_footwork(): void {
  const horse: ReturnType<typeof createHorse> = createHorse({ tempo: 0 }, 7);
  const backing: ReturnType<typeof rideHorse> = rideHorse(
    horse,
    {
      start: { x: 0, z: 0, heading: 0 },
      cruise: 1.6,
      acceleration: 1,
      deceleration: 1,
      speeds: [0, 0],
      legs: [
        {
          kind: "straight",
          reverse: true,
          length: 9,
          pause: 1.7,
          equineFootwork: { kind: "rein-back" },
        },
        { kind: "straight", length: 9 },
      ],
    },
    "walk",
  );
  const stopped: number = event(backing, "stop1");
  const resumed: number = event(backing, "depart1");
  const front: readonly number[] = archetypeHorseRide
    .footfalls(backing, "leftFore")
    .filter((t: number): boolean => t > 1.5 && t < stopped - 1.5);
  const opposite: readonly number[] = archetypeHorseRide.footfalls(
    backing,
    "rightHind",
  );
  const same: readonly number[] = archetypeHorseRide.footfalls(
    backing,
    "leftHind",
  );
  const failures: string[] = [];
  if (
    front.length < 3 ||
    front.some(
      (t: number): boolean => !opposite.includes(t) || same.includes(t),
    )
  )
    failures.push("rein-back must alternate paired opposite hooves");
  for (let time: number = 2; time < stopped - 1.5; time += 0.15) {
    const supported: number = AutoMovieArchetypeQuadrupedBody.LIMBS.filter(
      (limb: AutoMovieArchetypeQuadrupedBody.Limb): boolean =>
        Math.abs(sole(backing, limb, time)) < 1e-9,
    ).length;
    if (supported < 2)
      failures.push("rein-back must retain a grounded diagonal");
  }
  for (const boundary of [stopped, resumed]) {
    for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
      const a: ReturnType<typeof archetypeHorseRide.hoof> =
        archetypeHorseRide.hoof(backing, limb, boundary - 1e-6);
      const b: ReturnType<typeof archetypeHorseRide.hoof> =
        archetypeHorseRide.hoof(backing, limb, boundary + 1e-6);
      if (Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z) > 1e-5)
        failures.push(`discontinuous ${limb} at a rest boundary`);
    }
  }

  const course: rideQuadruped.ICourse = {
    start: { x: 0, z: 0, heading: 0 },
    startSpeed: 5,
    endSpeed: 0,
    cruise: 5,
    acceleration: 1,
    deceleration: 3,
    legs: [
      {
        kind: "straight",
        length: 18,
        equineFootwork: {
          kind: "slide-stop",
          seconds: 1,
          entry: 0.2,
          advance: 0.12,
        },
      },
    ],
  };
  const slide: ReturnType<typeof rideHorse> = rideHorse(
    horse,
    course,
    "canter",
  );
  const first: number = event(slide, "slideStopContact");
  const end: number = event(slide, "slideStopEnd");
  const displacement: number =
    slide.at(end).placement.translation.z -
    slide.at(first).placement.translation.z;
  for (const limb of ["leftHind", "rightHind"] as const) {
    const initially: number = archetypeHorseRide.hoof(slide, limb, first).z;
    const lastPosition: number = archetypeHorseRide.hoof(slide, limb, end).z;
    if (
      !(displacement > 0.2) ||
      Math.abs(lastPosition - initially - displacement) > 1e-8
    )
      failures.push(`incorrect ${limb} world slide`);
    for (const time of [first, (first + end) / 2, end, end + 0.5])
      if (Math.abs(sole(slide, limb, time)) > 1e-9)
        failures.push(`${limb} loses authored sliding ground contact`);
    const landings: readonly number[] = archetypeHorseRide.footfalls(
      slide,
      limb,
    );
    if (
      !landings.includes(first) ||
      landings.some((t: number): boolean => t > first)
    )
      failures.push(`${limb} emits an extra landing while sliding`);
  }
  TestValidator.equals(
    "authored equine footwork uses actual support",
    failures,
    [],
  );
  TestValidator.error("slide must fit inside the terminal deceleration", () =>
    rideHorse(
      horse,
      {
        ...course,
        legs: [
          {
            kind: "straight",
            length: 18,
            equineFootwork: {
              kind: "slide-stop",
              seconds: 4,
              entry: 0.2,
              advance: 0.12,
            },
          },
        ],
      },
      "canter",
    ),
  );

  /** This cue is part of the public accepted take. */
  function event(ride: ReturnType<typeof rideHorse>, label: string): number {
    return ride.instants.find(
      (item: { label: string }): boolean => item.label === label,
    )!.seconds;
  }

  /** Measure each actually emitted sole against the floor independently of the ride. */
  function sole(
    ride: ReturnType<typeof rideHorse>,
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
    time: number,
  ): number {
    const sample: ReturnType<typeof ride.at> = ride.at(time);
    const terminal: IAutoMovieModelPart = sample.archetype.parts.find(
      (part: IAutoMovieModelPart): boolean =>
        part.id === AutoMovieArchetypeQuadrupedBody.BONES[limb][3],
    )!;
    return animalTerminalSole(terminal, sample.placement);
  }
}
