import { AutoMovieStepPlanner as Planner } from "@automovie/engine";
import type { IAutoMovieFootfallPattern } from "@automovie/interface";

import { Foot } from "../rig/Foot";

/** The bout's two-foot declarations and coordinate vocabulary adapt the shared planner; no calendar or interpolation is reimplemented. */
export class BoutFootsteps {
  /** Shared schedule, also consumed by the physical-support bake. */
  public readonly planner: Planner;
  /** Film event vocabulary for the shared immutable schedule. */
  public readonly steps: readonly BoutFootsteps.Step[];
  public constructor(input: BoutFootsteps.Input) {
    const pattern: IAutoMovieFootfallPattern = {
      id: "orthodox-bout-placements",
      minimumSupports: input.physical ? 1 : 0,
      limbs: (["left", "right"] as const).map(
        (
          bone: BoutFootsteps.Side,
          index: number,
        ): IAutoMovieFootfallPattern["limbs"][number] => ({
          bone,
          chain: [bone],
          phase: bone === input.lead ? 0 : 0.5,
          duty: 0,
          offset: { forward: index === 0 ? 1 : -1, left: index === 0 ? 1 : -1 },
          stride: [{ speed: 0, length: 0.9 }],
        }),
      ),
    };
    this.planner = new Planner({
      pattern,
      start: input.start,
      end: input.end,
      rate: 120,
      desired: (seconds: number): Record<string, Planner.IPlacement> =>
        Object.fromEntries(
          Object.entries(input.desired(seconds)).map(
            ([side, placement]: [string, Foot.Placement]): [
              string,
              Planner.IPlacement,
            ] => [side, BoutFootsteps.encode(placement)],
          ),
        ),
      heading: input.heading,
      reservations: input.busy.map(
        (entry: BoutFootsteps.Busy): Planner.IReservation => ({
          bone: entry.side,
          start: entry.start,
          end: entry.end,
        }),
      ),
      duration: input.duration,
      threshold: input.threshold,
      height: input.height,
      peakPitch: Foot.SWING_PITCH,
      overlap: input.physical ? 0 : (input.overlap ?? -0.03),
      maximumStride: 0.9,
      swingRetargeting: input.physical
        ? "after-landing"
        : "from-scheduled-landing",
      reservationMargin: 0.04,
      margin: 0.03,
      yawLever: 0.12,
      pitchLever: 0.05,
      alternationWindow: 0.35,
    });
    this.steps = this.planner.steps.map(BoutFootsteps.step);
  }
  /** Read a shared phase in the film's existing foot-placement vocabulary. */
  public at(side: BoutFootsteps.Side, seconds: number): BoutFootsteps.State {
    const state: Planner.IState = this.planner.at(side, seconds);
    return {
      phase: state.phase === "reserved" ? "busy" : state.phase,
      placement: BoutFootsteps.decode(state.placement),
      progress: state.progress,
      ...(state.step ? { step: BoutFootsteps.step(state.step) } : {}),
    };
  }
}

/** Choreography declarations and transparent coordinate conversions. */
export namespace BoutFootsteps {
  /** Actor's own anatomical foot. */ export type Side = "left" | "right";
  /** Authored foot reservation; another motion owns its path. */
  export interface Busy {
    /** Own foot. */
    side: Side; /** First film second. */
    start: number; /** Return second. */
    end: number;
  }
  /** A film-facing observation of the shared schedule. */
  export interface Step extends Busy {
    /** Departure. */
    from: Foot.Placement; /** Landing. */
    to: Foot.Placement; /** Motion owner. */
    kind: "swing" | "busy";
  }
  /** Shared phase and optional active segment. */
  export interface State {
    /** Support phase. */
    phase: "planted" | "swing" | "busy"; /** Current placement. */
    placement: Foot.Placement; /** Unit time through the segment. */
    progress: number; /** Active segment only. */
    step?: Step;
  }
  /** Bout choreography retains the existing timing and travel declarations. */
  export interface Input {
    /** First film second. */
    start: number; /** Last film second. */
    end: number; /** Desired stance anchors. */
    desired: (
      seconds: number,
    ) => Record<Side, Foot.Placement>; /** Authored heading, radians. */
    heading: (seconds: number) => number; /** Kick/check exclusions. */
    busy: readonly Busy[]; /** Swing seconds. */
    duration: number; /** Drift trigger, metres. */
    threshold: number; /** Peak clearance, metres. */
    height: number; /** Lead foot. */
    lead: Side; /** Swing overlap, seconds. */
    overlap?: number; /** Require a planted support and finish each swing before retargeting. */
    physical?: boolean;
  }
  /** Film support placement to the shared planner. */
  export function encode(value: Foot.Placement): Planner.IPlacement {
    return {
      point: [...value.ball],
      yaw: value.yaw,
      pitch: value.heel,
      clearance: value.lift,
    };
  }
  /** Shared placement back to film-authored metres/radians. */
  export function decode(value: Planner.IPlacement): Foot.Placement {
    return {
      ball: [...value.point],
      yaw: value.yaw,
      heel: value.pitch,
      lift: value.clearance,
    };
  }
  /** Stable event representation; scheduling remains with Engine. */
  export function step(value: Planner.IStep): Step {
    return {
      side: value.bone as Side,
      start: value.start,
      end: value.end,
      kind: value.kind === "reserved" ? "busy" : "swing",
      from: decode(value.from),
      to: decode(value.to),
    };
  }
}
