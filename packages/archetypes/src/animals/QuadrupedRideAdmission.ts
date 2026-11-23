import {
  type AutoMovieArchetypeCourse,
  AutoMovieArchetypeRefusal,
} from "../core";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import type { AutoMovieArchetypeQuadrupedJoints } from "./AutoMovieArchetypeQuadrupedJoints";
import { QuadrupedChange } from "./QuadrupedChange";
import { QuadrupedRideClock } from "./QuadrupedRideClock";
import type { createQuadruped } from "./createQuadruped";
import type { rideQuadruped } from "./rideQuadruped";

/**
 * Admission of a quadruped ride's requested gaits and speeds before any stride
 * is planned.
 */
export namespace QuadrupedRideAdmission {
  /** One gait's declared speed domain for the ride's animal. */
  export interface IDomain {
    /** The gait. */
    gait: AutoMovieArchetypeQuadrupedGait.Gait;
    /** Least declared speed, metres per second. */
    minimum: number;
    /** Greatest declared speed, metres per second. */
    maximum: number;
  }

  /**
   * Refuse a requested gait or speed that no declared table row covers.
   *
   * @param species The ride's species and selected table.
   * @param course The authored course.
   * @param plan Its admitted plan.
   * @param gait The ride's fixed gait, if any.
   * @param tempo The animal's timing-spread coordinate.
   * @param withers The animal's withers height, metres.
   * @param rig The limb chains, whose hip height sets the change points.
   * @param dimensions The animal's dimensions, for mass-scaled change points.
   * @throws {AutoMovieArchetypeRefusal} When a named gait is absent, a
   *   requested speed lies outside every applicable declared domain, or a
   *   yielding footing sinks a hoof as deep as its carpus or hock stands.
   */
  export function admit(
    species: createQuadruped.ISpecies,
    course: rideQuadruped.ICourse,
    plan: AutoMovieArchetypeCourse.IPlan,
    gait: AutoMovieArchetypeQuadrupedGait.Gait | undefined,
    tempo: number,
    withers: number,
    rig: ReturnType<typeof AutoMovieArchetypeQuadrupedJoints.read>,
    dimensions: Readonly<Partial<Record<string, number>>>,
  ): void {
    const domains: readonly IDomain[] = species.table.order.map(
      (which: AutoMovieArchetypeQuadrupedGait.Gait): IDomain => ({
        gait: which,
        ...AutoMovieArchetypeQuadrupedGait.range(species, which, withers),
      }),
    );
    if (gait !== undefined)
      AutoMovieArchetypeQuadrupedGait.timing(
        species,
        gait,
        course.cruise,
        tempo,
        withers,
      );
    if (
      gait === undefined &&
      course.legs.some(
        (leg: rideQuadruped.ILeg): boolean => leg.gait === undefined,
      )
    )
      speed(undefined, course.cruise);
    course.legs.forEach((leg: rideQuadruped.ILeg, k: number): void => {
      const fastest: number = plan.legSpans[k]!.fastest;
      const which: AutoMovieArchetypeQuadrupedGait.Gait =
        leg.gait ??
        gait ??
        QuadrupedChange.called(
          species,
          fastest,
          species.table.order[0]!,
          dimensions,
          rig.limbs.leftHind[0]!.y,
        );
      if (
        fastest >=
        AutoMovieArchetypeQuadrupedGait.range(species, which, withers).minimum
      )
        speed(leg.gait ?? gait, fastest);
    });
    course.speeds?.forEach((value: number, index: number): void => {
      if (value > 0) speed(course.legs[index]!.gait ?? gait, value);
    });
    for (const [value, distance] of [
      [course.startSpeed ?? 0, 0],
      [course.endSpeed ?? 0, plan.length],
    ] as const)
      if (value > 0)
        speed(course.legs[legIndex(plan, distance)]!.gait ?? gait, value);

    // A hoof sunk deeper than its carpus or hock stands above it cannot be lifted clear of the footing.
    const clear: number = Math.min(
      ...AutoMovieArchetypeQuadrupedBody.LIMBS.map(
        (limb: AutoMovieArchetypeQuadrupedBody.Limb): number =>
          rig.limbs[limb][2]!.y - rig.limbs[limb][4]!.y,
      ),
    );
    for (const plane of course.footing?.planes ?? [])
      if ((plane.yield?.depth ?? 0) >= clear)
        throw new AutoMovieArchetypeRefusal({
          kind: "parameter",
          archetype: species.archetype,
          axis: "footing",
          value: plane.yield!.depth,
          feasible: { kind: "range", minimum: 0, maximum: clear, unit: "m" },
          reason: `the ${plane.id} footing sinks a hoof ${plane.yield!.depth} m, not below the ${clear} m its carpus or hock stands above it, so the hoof cannot be lifted clear`,
          fix: "Declare a shallower yield, or plan the passage as a plunge or a stuck interval.",
        });

    /**
     * Requested named gaits are strict; automatic requests need declared
     * coverage.
     */
    function speed(
      which: AutoMovieArchetypeQuadrupedGait.Gait | undefined,
      value: number,
    ): void {
      // Below the slowest gait's floor and above zero the slowest gait walks on at its slowest clock (`QuadrupedRideClock`).
      if (
        (which === undefined || which === domains[0]!.gait) &&
        value > 0 &&
        value < domains[0]!.minimum
      )
        return;
      if (which !== undefined) {
        AutoMovieArchetypeQuadrupedGait.timing(
          species,
          which,
          QuadrupedRideClock.collectedSpeed(species, which, value, withers),
          tempo,
          withers,
        );
        return;
      }
      if (
        domains.some(
          (domain: IDomain): boolean =>
            value >= domain.minimum && value <= domain.maximum,
        )
      )
        return;
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: species.archetype,
        axis: "speed",
        value,
        feasible: null,
        reason: `no declared gait covers ${value} m/s; available domains: ${domains.map((domain: IDomain): string => `${domain.gait} [${domain.minimum}, ${domain.maximum}]`).join(", ")}`,
        fix: "Choose a covered speed or supply explicitly authored gait clocks covering it.",
      });
    }
  }

  /**
   * The planned leg that owns a distance along the course.
   *
   * @param plan The admitted plan.
   * @param distance Metres along the path.
   * @returns The zero-based leg index; the last leg past the end.
   */
  export function legIndex(
    plan: AutoMovieArchetypeCourse.IPlan,
    distance: number,
  ): number {
    let k: number = 0;
    while (
      k < plan.legSpans.length - 1 &&
      distance >= plan.legSpans[k]!.from + plan.legSpans[k]!.span
    )
      k++;
    return k;
  }
}
