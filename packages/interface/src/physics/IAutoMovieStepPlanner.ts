import type { IAutoMovieFootfallPattern } from "./IAutoMovieFootfallPattern";

/**
 * Precomputed deterministic support schedule and random-access phase sampling.
 *
 * The schedule uses film seconds and world X/Z placements in metres with radian
 * yaw/pitch; reserved intervals and generated swings share one ordered history.
 * AutoMovieStepPlanner constructs and freezes its owned schedule, indexes steps
 * by bone and returns detached placements and step records from at. Sampling
 * accepts any finite time and a known bone, using initial/final planted poses
 * outside its schedule. This plan requests kinematic support movement and does
 * not observe physical landings.
 */
export interface IAutoMovieStepPlanner {
  /**
   * Borrowed recursively frozen schedule ordered by start time; includes
   * generated swings and authored reservations.
   */
  readonly steps: readonly IAutoMovieStepPlanner.IStep[];

  /**
   * Sample a declared bone at any finite film second. Returns detached
   * placement and optional step data; before/after the schedule the support is
   * planted at its initial/final location. Throws for unknown bone or nonfinite
   * time.
   */
  at(bone: string, seconds: number): IAutoMovieStepPlanner.IState;
}

/**
 * World support placements, authored reservations and deterministic stepping
 * policy/state.
 */
export namespace IAutoMovieStepPlanner {
  /**
   * Floor-plane support anchor, heading, pitch and vertical clearance.
   *
   * Point is [world X,world Z] metres, yaw about +Y and pitch about the support
   * lateral axis are radians, clearance is metres. AutoMovieStepPlanner copies
   * desired placements into its schedule and returns detached sampled
   * placements; the swing helper uses a sine clearance arc. Placement numbers
   * must be finite; swing admission checks them, while the constructor checks
   * desired placements as scheduling reaches them. A placement alone makes no
   * actual contact promise.
   */
  export interface IPlacement {
    /** Floor anchor as [world X, world Z] in metres. */
    point: [number, number];

    /** Finite heading about world +Y in radians. */
    yaw: number;

    /** Finite rotation about the support's lateral axis in radians. */
    pitch: number;

    /**
     * Vertical displacement above the planted location, metres; generated
     * swings use the declared nonnegative sine-arc height.
     */
    clearance: number;
  }

  /**
   * Authored interval during which one support is unavailable for automatically
   * scheduled stepping.
   *
   * Start and end are finite film seconds with end > start; bone must name a
   * declared support and same-bone reservations may not overlap.
   * AutoMovieStepPlanner copies reservation data into scheduled reserved steps
   * and samples the desired placement at their end. The constructor admits
   * identity and timing. A reservation governs scheduling rather than native
   * contact, and its endpoint may lie outside the overall construction window.
   */
  export interface IReservation {
    /** Endpoint bone id. */
    bone: string;

    /** Lift second. */
    start: number;

    /** Landing second. */
    end: number;
  }

  /**
   * A scheduled automatic swing or authored reservation with departure and
   * landing placements.
   *
   * Inherited times and bone identify the interval; kind selects either
   * interpolated swing sampling or a held reserved departure until end.
   * AutoMovieStepPlanner freezes schedule steps and returns structured clones
   * through at; standalone step records remain mutable unless their owner
   * freezes them. from/to are requested placements, not measured landings. A
   * reserved sample does not reconstruct the authored movement inside its
   * reserved interval.
   */
  export interface IStep extends IAutoMovieStepPlanner.IReservation {
    /** Movement owner. */
    kind: "swing" | "reserved";

    /** Departure. */
    from: IAutoMovieStepPlanner.IPlacement;

    /** Landing. */
    to: IAutoMovieStepPlanner.IPlacement;
  }

  /**
   * Requested support phase and placement at one sampled film second.
   *
   * Progress lies in [0,1], with zero before any step and one after a completed
   * step; step is absent while planted. AutoMovieStepPlanner.at returns
   * detached mutable placement and optional step data, preserving its frozen
   * schedule. For reserved phases placement stays at step.from until the end;
   * callers need their authored motion for the reserved trajectory. phase is a
   * plan state, not observed contact.
   */
  export interface IState {
    /** Contact phase. */
    phase: "planted" | "swing" | "reserved";

    /** Current support. */
    placement: IAutoMovieStepPlanner.IPlacement;

    /**
     * Fraction through the active interval in [0,1]; zero before all steps and
     * one after a completed step.
     */
    progress: number;

    /** Absent while planted. */
    step?: IAutoMovieStepPlanner.IStep;
  }

  /**
   * Footfall geometry, pure placement samplers and numerical policy for a
   * complete support schedule.
   *
   * Film times use seconds, rate ticks/s, distances metres and angles radians;
   * pattern supplies support identities, phase ordering and minimum remaining
   * support count. AutoMovieStepPlanner consumes callbacks synchronously during
   * construction and copies placements and reservations; it retains no callback
   * after construction and propagates callback errors. The constructor checks
   * interval, principal budgets, pattern and reservations. Callers supply
   * finite scheduling margins, overlap, lever factors, heading results and
   * complete desired placements; those auxiliary scalars are not all
   * independently admitted.
   */
  export interface IInput {
    /** Complete limb and footfall declaration. */
    pattern: IAutoMovieFootfallPattern;

    /**
     * Finite first construction film second; may equal end for an initial-only
     * schedule.
     */
    start: number;

    /**
     * Finite last construction film second, at or after start; a swing begun
     * before end may finish later.
     */
    end: number;

    /** Positive finite scheduling ticks per second. */
    rate: number;

    /**
     * Pure synchronous complete placement map keyed by support bone at film
     * seconds. Called at the initial time, candidate landings and reservation
     * ends, possibly beyond end; outputs are cloned. Exceptions abort
     * construction, and the callback is not retained.
     */
    desired: (
      seconds: number,
    ) => Record<string, IAutoMovieStepPlanner.IPlacement>;

    /**
     * Pure synchronous body heading about +Y in radians at film seconds, used
     * for leading-support ordering. Supply finite values; exceptions abort
     * construction and the callback is not retained.
     */
    heading: (seconds: number) => number;

    /**
     * Authored unavailable intervals; empty schedules no reservations.
     * Same-bone overlap and unknown bone ids are rejected.
     */
    reservations: IAutoMovieStepPlanner.IReservation[];

    /** Positive finite duration of an automatically scheduled swing, seconds. */
    duration: number;

    /**
     * Positive finite weighted placement-error trigger in metres; includes
     * yawLever and pitchLever contributions.
     */
    threshold: number;

    /** Finite nonnegative peak vertical swing clearance in metres. */
    height: number;

    /** Additional peak swing pitch, radians; defaults to zero. */
    peakPitch?: number;

    /**
     * Positive finite maximum horizontal step reach in metres, further limited
     * by the chosen limb's speed/stride table.
     */
    maximumStride: number;

    /** Seconds of allowed swing overlap; negative means double support. */
    overlap: number;

    /**
     * Default after-landing waits for an active swing to finish. The explicit
     * from-scheduled-landing policy lets zero-duty limbs supersede it from its
     * planned endpoint, retaining a kinematic discontinuity.
     */
    swingRetargeting?: "after-landing" | "from-scheduled-landing";

    /** Post-reservation clearance, seconds. */
    reservationMargin: number;

    /** Pre-reservation clearance, seconds. */
    margin: number;

    /** Yaw error lever, metres/radian. */
    yawLever: number;

    /** Pitch error lever, metres/radian. */
    pitchLever: number;

    /** Prefer another support within this many seconds of the last landing. */
    alternationWindow: number;
  }
}
