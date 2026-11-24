import {
  AutoMovieArchetypeQuadrupedBody,
  AutoMovieArchetypeRefusal,
  createHorse,
  rideHorse,
  type rideQuadruped,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeHorseRide } from "../../../internal/archetypeHorseRide";

/**
 * A canter on the right lead lands its feet in the left lead's order mirrored, a flying change switches the order within a stride, and a gait named beyond its range is refused.
 *
 * Scenarios, for a horse cantering at 5.5 m/s scaled to its height:
 * 1. On the left lead, each left fore landing is preceded within its stride by the right hind, then the right fore and left hind together, the left fore last (Robilliard et al. 2007, Table 1).
 * 2. On the right lead the order is mirrored: the left hind, then the left fore and right hind together, the right fore last.
 * 3. A course cantering on the left lead and then on the right names `lead:left-right` once, at a left fore landing, and two strides after it the right lead's order holds.
 * 4. A leg naming the walk at a canter's speed is refused with the walk's range.
 */
export function test_unit_archetypes_core_ride_horse_lead(): void {
  const findings: string[] = [];
  const horse: ReturnType<typeof createHorse> = createHorse({}, 2);
  const speed: number = 5.5 * Math.sqrt(horse.dimensions.withersHeight! / 1.38);
  const course = (legs: rideQuadruped.ILeg[]): rideQuadruped.ICourse => ({
    start: { x: 0, z: 0, heading: 0 },
    legs,
    cruise: speed,
    acceleration: 2,
    deceleration: 2,
  });

  // The landings of the stride ending at a left fore landing, in order.
  const order = (r: ReturnType<typeof rideHorse>, at: number): string => {
    const starts: number[] = archetypeHorseRide.footfalls(r, "leftFore");
    const k: number = starts.findIndex((s: number): boolean => s >= at);
    const from: number = starts[k]!;
    const to: number = starts[k + 1]!;
    return AutoMovieArchetypeQuadrupedBody.LIMBS.map(
      (limb: AutoMovieArchetypeQuadrupedBody.Limb): [string, number] => [
        limb,
        archetypeHorseRide
          .footfalls(r, limb)
          .find((s: number): boolean => s >= from - 1e-9 && s < to - 1e-9)! -
          from,
      ],
    )
      .sort(
        (a: [string, number], b: [string, number]): number =>
          a[1] - b[1] || a[0].localeCompare(b[0]),
      )
      .map((p: [string, number]): string => p[0])
      .join(" ");
  };
  const left: ReturnType<typeof rideHorse> = rideHorse(
    horse,
    course([{ kind: "straight", length: 120, gait: "canter" }]),
  );
  const right: ReturnType<typeof rideHorse> = rideHorse(
    horse,
    course([{ kind: "straight", length: 120, gait: "canter", lead: "right" }]),
  );
  // Within a stride from the left fore, ties named in alphabetical order: on the left lead the right hind, then the left hind with the right fore; on the right lead the right hind with the left fore, then the right fore, then the left hind.
  const leftOrder: string = order(left, left.duration / 2);
  const rightOrder: string = order(right, right.duration / 2);
  if (leftOrder !== "leftFore rightHind leftHind rightFore")
    findings.push(`left lead order ${leftOrder}`);
  if (rightOrder !== "leftFore rightHind rightFore leftHind")
    findings.push(`right lead order ${rightOrder}`);

  const change: ReturnType<typeof rideHorse> = rideHorse(
    horse,
    course([
      { kind: "straight", length: 60, gait: "canter" },
      { kind: "straight", length: 60, gait: "canter", lead: "right" },
    ]),
  );
  const changes: { seconds: number; label: string }[] = change.instants.filter(
    (i: { label: string }): boolean => i.label.startsWith("lead:"),
  );
  if (changes.length !== 1 || changes[0]!.label !== "lead:left-right")
    findings.push(`lead changes ${JSON.stringify(changes)}`);
  else if (
    !archetypeHorseRide
      .footfalls(change, "leftFore")
      .some((s: number): boolean => Math.abs(s - changes[0]!.seconds) < 1e-9)
  )
    findings.push("the flying change is at no left fore landing");
  else {
    const starts: number[] = archetypeHorseRide.footfalls(change, "leftFore");
    const after: number =
      starts[
        starts.findIndex(
          (s: number): boolean => s >= changes[0]!.seconds - 1e-9,
        ) + 2
      ]!;
    if (order(change, after) !== rightOrder)
      findings.push(`after the change the order is ${order(change, after)}`);
  }

  try {
    rideHorse(horse, course([{ kind: "straight", length: 60, gait: "walk" }]));
    findings.push("a walk at a canter's speed was admitted");
  } catch (error) {
    if (
      !(error instanceof AutoMovieArchetypeRefusal) ||
      error.feasible?.kind !== "range"
    )
      findings.push(`a fast walk failed otherwise: ${String(error)}`);
  }
  TestValidator.equals("the leads land in their order", findings, []);
}
