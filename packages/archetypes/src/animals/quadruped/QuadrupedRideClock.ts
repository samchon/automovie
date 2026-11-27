import type { AutoMovieArchetypeCourse } from "../../core";
import { AutoMovieArchetypeQuadrupedGait } from "../AutoMovieArchetypeQuadrupedGait";
import type { QuadrupedChange } from "./QuadrupedChange";
import { QuadrupedRideAdmission } from "./QuadrupedRideAdmission";
import type { AutoMovieArchetypeQuadruped } from "../AutoMovieArchetypeQuadruped";

/**
 * Clock continuation for strides already selected by the shared quadruped ride.
 * Requested speeds remain the ride's strict admission responsibility. This
 * owner distinguishes a virtual foot landing from a new locomotion request.
 */
export namespace QuadrupedRideClock {
  /** The active course interval and a reader for an already committed gait. */
  export interface IClock {
    /** Course start, film seconds, including its authored cue offset. */
    start: number;
    /** Course end, film seconds. */
    end: number;
    /** The course end on the hoof clock after removing stationary intervals. */
    movingEnd: number;
    /** Remove elapsed stopped time from the film second. */
    movingAt: (second: number) => number;
    /** Read the first film second at which the moving clock reaches a value. */
    filmAt: (second: number) => number;
    /**
     * Read timing context at a film second, holding the nearest course
     * boundary. Spatial placement still reads the original plan at its original
     * second.
     */
    at: (seconds: number) => AutoMovieArchetypeCourse.IState;
    /**
     * Read an already committed gait's clock at a film second. Unsupported gaps
     * and speed-availability handover gaps remain refusals.
     */
    timing: (
      gait: AutoMovieArchetypeQuadrupedGait.Gait,
      seconds: number,
    ) => AutoMovieArchetypeQuadrupedGait.ITiming;
  }

  /**
   * Prepare temporal boundary sampling and declared legacy clock continuation.
   *
   * A virtual previous/next landing can lie outside the course. Only its clock
   * context uses the boundary state; its held spatial distance is still read
   * from the unmodified plan at the original landing second by the ride. A
   * selected stride may finish while the legacy Froude/mass/overlap law holds
   * it outside its own measured range. Its endpoint clock continues only while
   * the speed is supported by the immediately neighbouring gait across that
   * legacy edge. Declared speed-availability edges do not grant this rule.
   * Genuine zero-speed ramps keep the existing vMin²/(2a) distance bridge.
   *
   * @param species The ride's private selected table and species identity.
   * @param course The authored rates used only for genuine zero-speed ramps.
   * @param plan The already admitted path and clock interval.
   * @param tempo The animal's normalized declared timing-spread coordinate.
   * @param withers The animal's withers height, metres.
   * @param holds Explicit hoof-clock holds, such as a jump's flight and its
   *   approach's stride adjustment, merged with the route pauses.
   * @returns A prepared continuation reader; requested-speed admission is
   *   unchanged.
   * @throws {AutoMovieArchetypeRefusal} Through strict timing when no declared
   *   continuation supports the speed, or timing inputs are malformed.
   */
  export function create(
    species: AutoMovieArchetypeQuadruped.ISpecies,
    course: AutoMovieArchetypeQuadruped.IRideCourse,
    plan: AutoMovieArchetypeCourse.IPlan,
    tempo: number,
    withers: number,
    holds: readonly IHold[] = [],
  ): IClock {
    const start: number = plan.when(0);
    const end: number = plan.when(plan.length);

    /**
     * Finite stopped windows paired by their original course leg, then the
     * explicit hoof-clock holds.
     */
    const paused: IPause[] = [];
    if (
      course.legs.some(
        (leg: AutoMovieArchetypeCourse.Leg): boolean => leg.pause !== undefined,
      )
    ) {
      const markers: ReadonlyMap<string, number> = new Map(
        plan.instants.map(
          (event: { label: string; seconds: number }): [string, number] => [
            event.label,
            event.seconds,
          ],
        ),
      );
      course.legs.forEach(
        (leg: AutoMovieArchetypeCourse.Leg, index: number): void => {
          if (leg.pause === undefined) return;
          const arrival: number | undefined = markers.get(`stop${index + 1}`);
          const departure: number | undefined = markers.get(
            `depart${index + 1}`,
          );
          if (
            arrival === undefined ||
            departure === undefined ||
            !(departure > arrival)
          )
            throw new RangeError(
              "A quadruped pause requires admitted stop and departure events",
            );
          paused.push({
            start: arrival,
            duration: departure - arrival,
            over: departure - arrival,
            moving: 0,
          });
        },
      );
    }
    for (const hold of holds) {
      const over: number = hold.over ?? hold.duration;
      if (
        !(
          over > 0 &&
          (hold.over === undefined
            ? hold.duration > 0
            : hold.duration !== 0 && hold.duration < over)
        )
      )
        throw new RangeError(
          "A hoof-clock hold needs a finite positive span, and a spread hold a clock that still runs",
        );
      paused.push({
        start: hold.start,
        duration: hold.duration,
        over,
        moving: 0,
      });
    }
    paused.sort((a: IPause, b: IPause): number => a.start - b.start);
    let held: number = 0;
    for (const pause of paused) {
      pause.moving = pause.start - held;
      held += pause.duration;
    }
    const order: readonly AutoMovieArchetypeQuadrupedGait.Gait[] =
      species.table.order;
    const ranges: readonly { minimum: number; maximum: number }[] = order.map(
      (
        gait: AutoMovieArchetypeQuadrupedGait.Gait,
      ): { minimum: number; maximum: number } =>
        AutoMovieArchetypeQuadrupedGait.range(species, gait, withers),
    );
    const boundaries: (pattern: RegExp) => number[] = (
      pattern: RegExp,
    ): number[] =>
      plan.instants
        .filter(
          (instant: { seconds: number; label: string }): boolean =>
            pattern.test(instant.label) && plan.at(instant.seconds).speed === 0,
        )
        .map(
          (instant: { seconds: number }): number =>
            plan.at(instant.seconds).distance,
        );
    const departures: number[] = boundaries(/^depart\d*$/);
    const arrivals: number[] = boundaries(/^stop\d*$/);
    const at: (seconds: number) => AutoMovieArchetypeCourse.IState = (
      seconds: number,
    ): AutoMovieArchetypeCourse.IState =>
      plan.at(Math.max(start, Math.min(end, seconds)));
    return {
      start,
      end,
      movingEnd: end - held,
      movingAt: (second: number): number => {
        let elapsed: number = 0;
        for (const pause of paused) {
          if (second <= pause.start) break;
          elapsed +=
            pause.duration * Math.min(1, (second - pause.start) / pause.over);
        }
        return second - elapsed;
      },
      filmAt: (second: number): number => {
        let elapsed: number = 0;
        for (const pause of paused) {
          if (second <= pause.moving) break;
          // Inside a spread hold the hoof clock still runs, at (over ??duration) / over of the film's rate.
          const running: number = pause.over - pause.duration;
          if (second < pause.moving + running)
            return (
              second +
              elapsed +
              ((second - pause.moving) * pause.duration) / running
            );
          elapsed += pause.duration;
        }
        return second + elapsed;
      },
      at,
      timing: (
        gait: AutoMovieArchetypeQuadrupedGait.Gait,
        seconds: number,
      ): AutoMovieArchetypeQuadrupedGait.ITiming => {
        const state: AutoMovieArchetypeCourse.IState = at(seconds);
        const index: number = order.indexOf(gait);

        // Keep unsupported-gait refusals owned by the strict table reader.
        if (index < 0 && species.table.gaits[gait] === undefined)
          return AutoMovieArchetypeQuadrupedGait.timing(
            species,
            gait,
            state.speed,
            tempo,
            withers,
          );

        // A collected gait entered from its parent's speeds holds its fastest declared clock.
        if (index < 0)
          return AutoMovieArchetypeQuadrupedGait.timing(
            species,
            gait,
            collectedSpeed(species, gait, state.speed, withers),
            tempo,
            withers,
          );
        const limits: { minimum: number; maximum: number } =
          ranges[index] ??
          AutoMovieArchetypeQuadrupedGait.range(species, gait, withers);
        let speed: number = state.speed;
        if (speed < limits.minimum) {
          const departing: boolean =
            course.acceleration !== undefined &&
            departures.some(
              (distance: number): boolean =>
                state.distance >= distance &&
                state.distance - distance <=
                  limits.minimum ** 2 / (2 * course.acceleration!),
            );
          const stopping: boolean =
            course.deceleration !== undefined &&
            arrivals.some(
              (distance: number): boolean =>
                state.distance <= distance &&
                distance - state.distance <=
                  limits.minimum ** 2 / (2 * course.deceleration!),
            );
          if (departing || stopping) speed = limits.minimum;
          // Below the slowest gait's slowest measured row and above zero, a horse still walks: the slowest gait keeps that row's cadence and shortens its stride, as the halt bridge above does, extended to any slow stretch (provisional; real horses walk slower than the measured rows). A stride caught in a faster gait when the speed falls below every gait's floor bridges to its own boundary, and its next footfall takes the slowest gait.
          const floor: number = ranges[0]?.minimum ?? limits.minimum;
          const named: boolean =
            course.legs[QuadrupedRideAdmission.legIndex(plan, state.distance)]
              ?.gait !== undefined;
          if (speed > 0 && speed < floor && (index === 0 || !named))
            speed = limits.minimum;
        }
        if (index >= 0 && (speed < limits.minimum || speed > limits.maximum)) {
          const adjacent: number =
            speed < limits.minimum ? index - 1 : index + 1;
          // A stride keeps its gait to its next footfall: a speed that leaves the gait toward any gait beyond, even past the adjacent one within the stride, holds the gait's boundary clock until the next stride takes the gait the speed calls for.
          const beyond: readonly { minimum: number; maximum: number }[] =
            speed < limits.minimum
              ? ranges.slice(0, index)
              : ranges.slice(index + 1);
          const neighbour: { minimum: number; maximum: number } | undefined =
            ranges[adjacent] === undefined
              ? undefined
              : beyond.find(
                  (range: { minimum: number; maximum: number }): boolean =>
                    speed >= range.minimum && speed <= range.maximum,
                );
          const high: AutoMovieArchetypeQuadrupedGait.Gait | undefined =
            order[Math.max(index, adjacent)];
          const change: QuadrupedChange.Rule | undefined =
            high === undefined
              ? undefined
              : AutoMovieArchetypeQuadrupedGait.of(species, high).change;
          if (
            neighbour !== undefined &&
            change !== undefined &&
            change.kind !== "speed" &&
            speed >= neighbour.minimum &&
            speed <= neighbour.maximum
          )
            speed = speed < limits.minimum ? limits.minimum : limits.maximum;
        }
        return AutoMovieArchetypeQuadrupedGait.timing(
          species,
          gait,
          speed,
          tempo,
          withers,
        );
      },
    };
  }

  /**
   * The speed a collected explicit gait's clock is read at: the speed inside
   * its declared domain, and its fastest row while the horse is still above it
   * but inside the parent gait's domain it is being collected out of.
   *
   * @param species The ride's species and selected table.
   * @param gait The committed gait.
   * @param speed The course speed, metres per second.
   * @param withers The animal's withers height, metres.
   * @returns The speed to read the strict table at; unchanged when no
   *   collection rule applies, so the strict reader still refuses.
   */
  export function collectedSpeed(
    species: AutoMovieArchetypeQuadruped.ISpecies,
    gait: AutoMovieArchetypeQuadrupedGait.Gait,
    speed: number,
    withers: number,
  ): number {
    const parent: AutoMovieArchetypeQuadrupedGait.Gait | undefined =
      species.table.collected?.[gait];
    if (parent === undefined) return speed;
    const own: { minimum: number; maximum: number } =
      AutoMovieArchetypeQuadrupedGait.range(species, gait, withers);
    const from: { minimum: number; maximum: number } =
      AutoMovieArchetypeQuadrupedGait.range(species, parent, withers);
    return speed > own.maximum && speed <= from.maximum ? own.maximum : speed;
  }

  /**
   * An explicit interval in which the hoof clock stands still, or runs slower
   * or faster, while the course keeps moving: a jump's flight, or an approach
   * whose strides lengthen or shorten to meet its takeoff.
   */
  export interface IHold {
    /** Film second the hoof clock stops, or starts to run at its changed rate. */
    start: number;

    /**
     * Seconds the hoof clock falls behind the film over the hold; negative only
     * with `over`, where it runs ahead.
     */
    duration: number;

    /**
     * Film seconds the hold is spread over, the hoof clock running at (over
     * ??duration) / over of the film's rate; a full stop of `duration` when
     * absent.
     */
    over?: number;
  }

  /** One admitted hoof-clock window and its start on the moving clock. */
  interface IPause {
    /** Film second the window starts. */
    start: number;
    /** Seconds the hoof clock falls behind over it. */
    duration: number;
    /** Film seconds it lasts. */
    over: number;
    /** Its start on the moving clock. */
    moving: number;
  }
}
