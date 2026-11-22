import type { AutoMovieArchetypeCourse } from "../core";
import { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import type { QuadrupedChange } from "./QuadrupedChange";
import { QuadrupedRideAdmission } from "./QuadrupedRideAdmission";
import type { createQuadruped } from "./createQuadruped";
import type { rideQuadruped } from "./rideQuadruped";

/**
 * Clock continuation for strides already selected by the shared quadruped ride.
 * Requested speeds remain the ride's strict admission responsibility. This
 * owner distinguishes a virtual foot landing from a new locomotion request.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Separates admitted requests, boundary support clocks and committed legacy handovers, and states which spatial samples remain untouched.
 * @evidence contracts/development/design.md#principled-representation A clock reads the course's temporal domain and declared neighbouring gait domains; neither a held path nor a retained gait invents a new observed speed row.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Internal to rideQuadruped; table interpolation and transition selection remain with AutoMovieArchetypeQuadrupedGait and QuadrupedChange.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No species case, arbitrary tolerance, global speed clamp, mutable registry or scene-specific exception decides a continuation.
 */
export namespace QuadrupedRideClock {
  /**
   * The active course interval and a reader for an already committed gait.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives seconds for interval bounds and distinguishes temporal clock sampling from the unmodified spatial course plan.
   * @evidence contracts/development/design.md#principled-representation The interval comes from plan.when at distances zero and length, preserving authored cue offsets and flying boundary speeds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One prepared clock per ride, without exposing a mutable timing cache or another gait table.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A continuation reader cannot admit a requested speed; ride input admission still calls the strict table operation.
   */
  export interface IClock {
    /** Course start, film seconds, including its authored cue offset. */
    start: number;
    /** Course end, film seconds. */
    end: number;
    /** The course end on the hoof clock after removing stationary intervals. */
    movingEnd: number;
    /**
     * Remove elapsed stopped time from the film second.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines film-to-moving seconds and a held hoof clock throughout a stop.
     * @evidence contracts/development/implementation.md#principled-implementation Subtract the elapsed share of every hold's seconds, all of a stop's and the film-proportional part of a spread one's.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered pass of the admitted stops.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Running seconds and the requested path remain unchanged.
     * @evidence contracts/development/implementation.md#efficient-algorithms O(P) for P authored pauses, with constant work when none are authored.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the stops from the admitted course with the inverse reader.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the fixed stop table survives preparation.
     */
    movingAt: (second: number) => number;
    /**
     * Read the first film second at which the moving clock reaches a value.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines moving-to-film seconds, returning a stop's arrival at its held clock value.
     * @evidence contracts/development/implementation.md#principled-implementation Add the full earlier holds before mapping back to the authored timeline, and inside a spread hold its share at the hoof clock's changed rate.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered pass of the admitted stops.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A held clock value can emit one event at arrival and cannot emit a new event inside the pause.
     * @evidence contracts/development/implementation.md#efficient-algorithms O(P) for P authored pauses, with constant work when none are authored.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the same admitted stop intervals as movingAt.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the fixed stop table survives preparation.
     */
    filmAt: (second: number) => number;
    /**
     * Read timing context at a film second, holding the nearest course boundary.
     * Spatial placement still reads the original plan at its original second.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines film seconds, cue-aware boundaries and the separation from unmodified spatial sampling.
     * @evidence contracts/development/implementation.md#principled-implementation The prepared reader bounds only its time argument to start/end and delegates state construction to the admitted course plan.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar time bound precedes one existing plan-state read.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No distance, path, requested speed or source state is edited to create the boundary context.
     * @evidence contracts/development/implementation.md#efficient-algorithms Adds constant scalar work to the existing plan sampler's input-dependent cost.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Every phase, support and nod clock reads the same prepared temporal domain and existing plan.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure retains the already owned plan and two scalar bounds; returned states are not cached and no external resource is acquired.
     */
    at: (seconds: number) => AutoMovieArchetypeCourse.IState;
    /**
     * Read an already committed gait's clock at a film second.
     * Unsupported gaps and speed-availability handover gaps remain refusals.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Distinguishes committed-clock continuation from strict requested-speed admission and names its film-second input and declared gait output.
     * @evidence contracts/development/implementation.md#principled-implementation Read boundary-aware course context, retain raw timing in range, and hold an endpoint only for the declared zero-speed bridge or an adjacent supported legacy handover.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure The prepared reader finds the selected range, evaluates the two permitted continuation reasons and delegates interpolation or refusal to strict timing.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Authored speed edges and undeclared domain gaps cannot acquire continuation; no tolerance, scene exception or source-table mutation supplies missing measurements.
     * @evidence contracts/development/implementation.md#efficient-algorithms Reads one plan state, searches G gait ids, conditionally scans C boundary distances, inspects one adjacent range and delegates the selected R-row interpolation.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the prepared ranges/boundaries, the shared temporal reader and the existing table interpolation rather than rebuilding a plan or gait.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only the prepared plan/table references and bounded G/C context; timings are fresh results with no growing cache, frame history or external handle.
     */
    timing: (
      gait: AutoMovieArchetypeQuadrupedGait.Gait,
      seconds: number,
    ) => AutoMovieArchetypeQuadrupedGait.ITiming;
  }

  /**
   * Prepare temporal boundary sampling and declared legacy clock continuation.
   *
   * A virtual previous/next landing can lie outside the course. Only its
   * clock context uses the boundary state; its held spatial distance is still
   * read from the unmodified plan at the original landing second by the ride.
   * A selected stride may finish while the legacy Froude/mass/overlap law holds
   * it outside its own measured range. Its endpoint clock continues only while
   * the speed is supported by the immediately neighbouring gait across
   * that legacy edge. Declared speed-availability edges do not grant this rule.
   * Genuine zero-speed ramps keep the existing vMin²/(2a) distance bridge.
   *
   * @param species The ride's private selected table and species identity.
   * @param course The authored rates used only for genuine zero-speed ramps.
   * @param plan The already admitted path and clock interval.
   * @param tempo The animal's normalized declared timing-spread coordinate.
   * @param withers The animal's withers height, metres.
   * @param holds Explicit hoof-clock holds, such as a jump's flight and its approach's stride adjustment, merged with the route pauses.
   * @returns A prepared continuation reader; requested-speed admission is unchanged.
   * @throws {AutoMovieArchetypeRefusal} Through strict timing when no declared continuation supports the speed, or timing inputs are malformed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States units, boundary-only temporal sampling, spatial preservation, legacy adjacent-domain continuation and the separately retained genuine-zero ramp bridge.
   * @evidence contracts/development/implementation.md#principled-implementation Clamp clock query time to the profile interval, then read raw timing in range. Outside it, retain an endpoint only for a declared zero-speed ramp or an already committed gait with adjacent-domain support across a non-speed transition.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare interval bounds, gait ranges and zero-speed boundary distances once; each read applies the two explicit continuation reasons before delegating to strict table timing.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Never clamp a requested speed, bridge an unobserved domain, mutate path distances or substitute an authored speed-availability edge for a measured legacy transition law.
   * @evidence contracts/development/implementation.md#efficient-algorithms Prepares G declared gait ranges and C course boundary records once; each read locates the gait among G entries, inspects its own and one adjacent range, scans zero-speed boundaries only for a subminimum ramp, and delegates the selected gait's R-row timing interpolation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the admitted plan, existing range scaling and strict timing implementation; the same reader owns phase, stance and nod clock context.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only the ride's plan/table references, G ranges and at most C zero-speed boundary distances; no frame samples, external handles or growing cache survive.
   */
  export function create(
    species: createQuadruped.ISpecies,
    course: rideQuadruped.ICourse,
    plan: AutoMovieArchetypeCourse.IPlan,
    tempo: number,
    withers: number,
    holds: readonly IHold[] = [],
  ): IClock {
    const start: number = plan.when(0);
    const end: number = plan.when(plan.length);

    /** Finite stopped windows paired by their original course leg, then the explicit hoof-clock holds. */
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
          Number.isFinite(hold.start) &&
          Number.isFinite(hold.duration) &&
          Number.isFinite(over) &&
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
   * The speed a collected explicit gait's clock is read at: the speed inside its declared domain, and its fastest row while the horse is still above it but inside the parent gait's domain it is being collected out of.
   *
   * @param species The ride's species and selected table.
   * @param gait The committed gait.
   * @param speed The course speed, metres per second.
   * @param withers The animal's withers height, metres.
   * @returns The speed to read the strict table at; unchanged when no collection rule applies, so the strict reader still refuses.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the units, the held endpoint and when the input passes through unchanged.
   * @evidence contracts/development/implementation.md#principled-implementation A collected gait (`ITable.collected`) is entered by decelerating out of its parent; over that interval the stride keeps the collected cadence, which is the fastest declared collected row, while the stride length absorbs the remaining speed.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two range reads and one comparison.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A speed above the parent's domain, or a gait without a declared parent, is passed through for the strict refusal.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work over the two ranges' end rows.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieArchetypeQuadrupedGait.range` for both domains.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function collectedSpeed(
    species: createQuadruped.ISpecies,
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
   * An explicit interval in which the hoof clock stands still, or runs slower or faster, while the course keeps moving: a jump's flight, or an approach whose strides lengthen or shorten to meet its takeoff.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the film-second start, the seconds the hoof clock falls behind and the optional spread.
   * @evidence contracts/development/design.md#principled-representation A start and held seconds in film seconds, the same shape as a route pause, and the film seconds a spread hold covers.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Supplied by the ride's technique planners and merged with the route pauses here.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Finiteness, a positive stop and a still-running spread clock are admitted at `create`.
   */
  export interface IHold {
    /** Film second the hoof clock stops, or starts to run at its changed rate. */
    start: number;

    /** Seconds the hoof clock falls behind the film over the hold; negative only with `over`, where it runs ahead. */
    duration: number;

    /** Film seconds the hold is spread over, the hoof clock running at (over ??duration) / over of the film's rate; a full stop of `duration` when absent. */
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
