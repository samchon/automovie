import { ActionVariation } from "../core/ActionVariation";
import type { MotionAction } from "../core/MotionAction";

/**
 * Independently sampled step-and-follow phrases with explicit support transfer.
 *
 * @evidence contracts/common.md#implementation-and-ownership IBA p.36 supplies direction-foot-first order. Each immutable route owns its initial sole targets and local phrases; smooth support transfer precedes either swing. Optional yaw rotates the stance about its entry midpoint while only the unloaded foot changes its target and sole heading. Weighted foot centres supply a kinematic root request, not measured COM or force. No opponent route is read.
 * @evidence contracts/common.md#authoring-interface Positions and displacements are fixed actor-local metres; times are local seconds without a film-duration limit. Yaw is an explicit staging input, not a universal feasible human turning angle. The host must fit actual Human soles and inspect floor clearance, support residuals and balance. Constructor refuses overlapping phrases, crossed direction order and malformed durations or turns.
 */
export class FootworkMotion {
  /** Independent owner used by the laboratory and diagnostics. */
  public readonly actorId: string;
  /** Actual local endpoint after the fixed seeded phase variations, seconds. */
  public readonly duration: number;
  /** Caller-independent initial sole centres. */
  private readonly feet: Record<MotionAction.Side, MotionAction.Vec3>;
  /** Caller-independent chronological phrases. */
  private readonly steps: readonly FootworkMotion.Step[];
  /** One immutable absolute clock per resolved phrase; playback resolves no phases again. */
  private readonly clocks: readonly {
    firstStart: number;
    firstEnd: number;
    otherStart: number;
    otherEnd: number;
    end: number;
  }[];

  /** Retain only one actor's route and validate all foot phases together. */
  public constructor(
    actorId: string,
    feet: Record<MotionAction.Side, MotionAction.Vec3>,
    steps: readonly FootworkMotion.Step[],
  ) {
    if (
      !actorId.trim() ||
      ![...feet.left, ...feet.right].every(Number.isFinite) ||
      Math.hypot(feet.left[0] - feet.right[0], feet.left[2] - feet.right[2]) <=
        1e-10
    )
      throw new Error(
        "Footwork requires an actor and distinct finite initial sole centres",
      );
    const varied: FootworkMotion.Step[] = steps.map(
      (step: FootworkMotion.Step): FootworkMotion.Step => {
        if (step.displacement[1] !== 0)
          throw new Error("Footwork displacement must remain horizontal");
        const variation: ActionVariation.Values = ActionVariation.sample(
          step.variation,
        );
        return {
          ...structuredClone(step),
          variation: undefined,
          unload: step.unload * variation.timingScale,
          swing: step.swing * variation.timingScale,
          load: step.load * variation.timingScale,
          follow: step.follow * variation.timingScale,
          settle: step.settle * variation.timingScale,
          clearance: step.clearance * variation.amplitude,
          displacement: [
            step.displacement[0] * variation.amplitude + variation.aimOffset[0],
            0,
            step.displacement[2] * variation.amplitude + variation.aimOffset[2],
          ],
        };
      },
    );
    let previous: number = 0;
    let heading: number = 0;
    const clocks: {
      firstStart: number;
      firstEnd: number;
      otherStart: number;
      otherEnd: number;
      end: number;
    }[] = [];
    const stance: Record<MotionAction.Side, MotionAction.Vec3> =
      structuredClone(feet);
    for (const step of varied) {
      const durations: number[] = [
        step.unload,
        step.swing,
        step.load,
        step.follow,
        step.settle,
      ];
      const turn: number = step.turnRadians ?? 0;
      if (
        ![
          step.start,
          ...durations,
          ...step.displacement,
          step.clearance,
          turn,
        ].every(Number.isFinite) ||
        Math.abs(turn) > Math.PI ||
        step.start < previous ||
        durations.some((value: number): boolean => value <= 0) ||
        step.clearance <= 0 ||
        (step.first !== "left" && step.first !== "right")
      )
        throw new Error(
          "Footwork requires positive ordered phases, horizontal displacement and a finite turn in [-pi,pi]",
        );
      const x: number = feet.left[0] - feet.right[0];
      const z: number = feet.left[2] - feet.right[2];
      const direction: number =
        step.displacement[0] * (Math.cos(heading) * x + Math.sin(heading) * z) +
        step.displacement[2] * (-Math.sin(heading) * x + Math.cos(heading) * z);
      if (
        (Math.hypot(...step.displacement) === 0 && turn === 0) ||
        (direction > 1e-10 && step.first !== "left") ||
        (direction < -1e-10 && step.first !== "right")
      )
        throw new Error(
          "The foot nearest the movement direction must move first",
        );
      const endpoints: Record<MotionAction.Side, MotionAction.Vec3> =
        turnTargets(stance, step.displacement, turn);
      stance.left = endpoints.left;
      stance.right = endpoints.right;
      heading += turn;
      const clock: (typeof clocks)[number] = phaseBoundaries(step);
      clocks.push(clock);
      previous = clock.end;
      if (
        !Number.isFinite(previous) ||
        !Number.isFinite(heading) ||
        ![...stance.left, ...stance.right].every(Number.isFinite)
      )
        throw new Error(
          "Footwork time, heading and sole endpoints must remain finite",
        );
    }
    this.actorId = actorId;
    this.duration = previous;
    this.feet = structuredClone(feet);
    this.steps = varied;
    this.clocks = clocks;
  }

  /**
   * Resolve the original phrase's exact end using the same clock as route admission.
   *
   * @evidence contracts/common.md#implementation-and-ownership One ordered sum of the five positive resolved phase durations owns all boundaries. Seeded timing variation is applied once; the constructor clears the already-materialized variation before caching this same absolute clock. Callers chain complete ends directly as next starts and consume the same two landing instants for physical sampling and audio. Playback reads static clocks without resolving phases again.
   * @evidence contracts/common.md#authoring-interface Takes the original Step in route-local seconds and returns the selected absolute boundary in that route clock. Complete is the default; first-landing and second-landing name the direction foot and following foot respectively. Only phase timing and variation are validated here; constructing FootworkMotion still owns actor, foot, displacement, turn, order and no-op admission. No epsilon, phase ratio or playback-rate adjustment enters this mapping.
   */
  public static end(
    step: Readonly<FootworkMotion.Step>,
    boundary: "first-landing" | "second-landing" | "complete" = "complete",
  ): number {
    const clock: {
      firstStart: number;
      firstEnd: number;
      otherStart: number;
      otherEnd: number;
      end: number;
    } = phaseBoundaries(step);
    if (boundary === "first-landing") return clock.firstEnd;
    if (boundary === "second-landing") return clock.otherEnd;
    if (boundary !== "complete")
      throw new Error("Unknown footwork phase boundary");
    return clock.end;
  }

  /**
   * Sample without history, so arbitrary seeking cannot move a planted anchor.
   *
   * @evidence contracts/common.md#implementation-and-ownership Each phrase is constant work: unload, first swing, load acceptance, following swing, settle. Only one foot can be airborne; support intent is zero for it. Each sole's yaw changes only during its own swing. The body completes half the yaw during each swing and stays fixed during two-foot load transitions. Completed offsets and headings accumulate independently, with no paired root translation or retained sample state.
   * @evidence contracts/common.md#authoring-interface Negative local seconds return the initial stance. Output arrays are owned by this result. Each foot also publishes its directly accumulated displacement from its original target, with exact zero for an unmoved foot, so consumers can retain the original WORLD anchor while transforming displacement alone. Root offset follows the requested support centre; optional rotations are cumulative deltas after the initial fixed actor heading. Zero yaw omits the added fields and preserves the original translation-only result. Actual anatomy and feasibility remain with the public support solver and Viewer.
   */
  public sample(seconds: number): FootworkMotion.Sample {
    if (!Number.isFinite(seconds))
      throw new Error("Footwork sample requires finite local seconds");
    const feet: Record<MotionAction.Side, FootworkMotion.Foot> = {
      left: {
        target: [...this.feet.left],
        offset: [0, 0, 0],
        phase: "planted",
        load: 0.5,
      },
      right: {
        target: [...this.feet.right],
        offset: [0, 0, 0],
        phase: "planted",
        load: 0.5,
      },
    };
    let phase: FootworkMotion.Phase = "planted";
    let heading: number = 0;
    const soleHeadings: Record<MotionAction.Side, number> = {
      left: 0,
      right: 0,
    };
    for (let index: number = 0; index < this.steps.length; index++) {
      const step: FootworkMotion.Step = this.steps[index]!;
      const clock: {
        firstStart: number;
        firstEnd: number;
        otherStart: number;
        otherEnd: number;
        end: number;
      } = this.clocks[index]!;
      if (seconds < step.start) break;
      const first: MotionAction.Side = step.first;
      const other: MotionAction.Side = first === "left" ? "right" : "left";
      const firstProgress: number =
        seconds >= clock.firstEnd
          ? 1
          : ease((seconds - clock.firstStart) / step.swing);
      const otherProgress: number =
        seconds >= clock.otherEnd
          ? 1
          : ease((seconds - clock.otherStart) / step.follow);
      const turn: number = step.turnRadians ?? 0;
      const entry: Record<MotionAction.Side, MotionAction.Vec3> | undefined =
        turn !== 0
          ? { left: [...feet.left.target], right: [...feet.right.target] }
          : undefined;
      const endpoints:
        | Record<MotionAction.Side, MotionAction.Vec3>
        | undefined = entry
        ? turnTargets(entry, step.displacement, turn)
        : undefined;
      for (const axis of [0, 1, 2] as const) {
        const firstDelta: number =
          (turn === 0
            ? step.displacement[axis]
            : endpoints![first][axis] - entry![first][axis]) * firstProgress;
        const otherDelta: number =
          (turn === 0
            ? step.displacement[axis]
            : endpoints![other][axis] - entry![other][axis]) * otherProgress;
        feet[first].target[axis] += firstDelta;
        feet[other].target[axis] += otherDelta;
        feet[first].offset![axis] += firstDelta;
        feet[other].offset![axis] += otherDelta;
      }
      soleHeadings[first] += turn * firstProgress;
      soleHeadings[other] += turn * otherProgress;
      heading += (turn * (firstProgress + otherProgress)) / 2;
      let firstLoad: number;
      if (seconds < clock.firstStart) {
        phase = "unloading";
        firstLoad = 0.5 * (1 - ease((seconds - step.start) / step.unload));
      } else if (seconds < clock.firstEnd) {
        phase = "swing";
        firstLoad = 0;
        feet[first].phase = "swing";
        const height: number =
          lift((seconds - clock.firstStart) / step.swing) * step.clearance;
        feet[first].target[1] += height;
        feet[first].offset![1] += height;
      } else if (seconds < clock.otherStart) {
        phase = "loading";
        firstLoad = ease((seconds - clock.firstEnd) / step.load);
      } else if (seconds < clock.otherEnd) {
        phase = "follow";
        firstLoad = 1;
        feet[other].phase = "swing";
        const height: number =
          lift((seconds - clock.otherStart) / step.follow) * step.clearance;
        feet[other].target[1] += height;
        feet[other].offset![1] += height;
      } else if (seconds < clock.end) {
        phase = "settling";
        firstLoad = 1 - 0.5 * ease((seconds - clock.otherEnd) / step.settle);
      } else {
        phase = "planted";
        firstLoad = 0.5;
      }
      feet[first].load = firstLoad;
      feet[other].load = 1 - firstLoad;
    }
    const rootOffset: MotionAction.Vec3 = [0, 0, 0];
    for (const axis of [0, 2] as const)
      rootOffset[axis] =
        feet.left.target[axis] * feet.left.load +
        feet.right.target[axis] * feet.right.load -
        (this.feet.left[axis] + this.feet.right[axis]) / 2;
    for (const side of ["left", "right"] as const)
      if (soleHeadings[side] !== 0)
        feet[side].orientation = yaw(soleHeadings[side]);
    return {
      actorId: this.actorId,
      feet,
      rootOffset,
      ...(heading !== 0 ? { rootRotation: yaw(heading) } : {}),
      support: { left: feet.left.load, right: feet.right.load },
      phase,
    };
  }
}

/** Explicit local foot requests consumed by the Human fitting host. */
export namespace FootworkMotion {
  /**
   * Support transfer and swing phases, with no implied force measurement.
   *
   * @evidence contracts/common.md#implementation-and-ownership Ordered unload/swing/load/follow/settle states expose the separate support transition rather than inferring support from a moving root.
   * @evidence contracts/common.md#authoring-interface Planted means both feet are available; swing/follow name one airborne foot; unloading/loading/settling are positive-duration load transitions. Actual geometry still needs the host's support solution.
   */
  export type Phase =
    | "planted"
    | "unloading"
    | "swing"
    | "loading"
    | "follow"
    | "settling";
  /**
   * A directional step followed by restoration of the initial stagger.
   *
   * @evidence contracts/common.md#implementation-and-ownership Positive load intervals separate the foot swings. Exact caller durations and yaw are staging inputs; IBA p.36 establishes sequence rather than measured milliseconds or turning limits.
   * @evidence contracts/common.md#authoring-interface All durations are seconds and all distances fixed actor-local metres. The first foot must be nearest the current stance's horizontal displacement direction; perpendicular or in-place ties permit either side. Phrases cannot overlap. A pure turn is allowed, while zero displacement and zero turn together refuse.
   */
  export interface Step {
    /** Local phrase onset, nonnegative seconds. */ start: number;
    /** Transfer support to the stationary foot before lifting. */ unload: number;
    /** Direction-side airborne travel duration. */ swing: number;
    /** Land and accept support before the following foot lifts. */ load: number;
    /** Following foot's airborne duration. */ follow: number;
    /** Return from single support to the two-foot stance. */ settle: number;
    /** Anatomical direction-side foot. */ first: MotionAction.Side;
    /** Horizontal actor-local travel in metres; Y must be zero. */ displacement: MotionAction.Vec3;
    /** Optional signed yaw in [-pi,pi] radians about this phrase's entry stance midpoint; default zero. Physical consumers must select feasible small steps. */ turnRadians?: number;
    /** Positive sole-target clearance at swing midpoint, metres. */ clearance: number;
    /** Bounded seeded phase/step/clearance variation, fixed once at construction. */ variation?: MotionAction.Variation;
  }
  /**
   * One sole's independent target and requested support share.
   *
   * @evidence contracts/common.md#implementation-and-ownership A planted target is unchanged while the other foot travels; swing load is zero. The same trajectory increments build both target and displacement directly. The host retains its original WORLD plantar point and transforms displacement alone to preserve stationary anchors.
   * @evidence contracts/common.md#authoring-interface Actor-local metres and closed-unit load intent are not a physical admission or pressure measurement. Every sample from FootworkMotion includes offset; omission permits older target-only authored inputs.
   */
  export interface Foot {
    /** Sole-centre target in actor-local metres. */ target: MotionAction.Vec3;
    /** Optional directly accumulated fixed actor-local displacement from this foot's original route target, metres; an unmoved foot has exact [0,0,0]. */ offset?: MotionAction.Vec3;
    /** Whether this foot is available for ground support. */ phase:
      | "planted"
      | "swing";
    /** Requested support share in [0,1]. */ load: number;
    /** Optional cumulative actor-local yaw quaternion before the initial sole orientation; omission means identity. Changes only while this foot is unloaded and swinging. */ orientation?: NonNullable<
      MotionAction.Sample["rootRotation"]
    >;
  }
  /**
   * One route sample, independent of any other actor or previous call.
   *
   * @evidence contracts/common.md#implementation-and-ownership Contains only current owned foot targets and weighted-centre request. No browser resources or growing sample history are retained.
   * @evidence contracts/common.md#authoring-interface The consumer transforms these actor-local requests through its actual root frame and checks the resulting displayed geometry.
   */
  export interface Sample {
    /** Independent owning actor. */ actorId: string;
    /** Separately supported foot targets. */ feet: Record<
      MotionAction.Side,
      Foot
    >;
    /** Support-centre displacement from the initial midpoint, metres. */ rootOffset: MotionAction.Vec3;
    /** Optional cumulative root yaw after the initial fixed actor heading; omission means identity. */ rootRotation?: NonNullable<
      MotionAction.Sample["rootRotation"]
    >;
    /** Kinematic load intent, not force. */ support: MotionAction.Support;
    /** Current phrase phase. */ phase: Phase;
  }
}

/** Closed-unit cubic blend gives zero endpoint velocity. */
function ease(value: number): number {
  const clamped: number = Math.min(1, Math.max(0, value));
  return clamped * clamped * (3 - 2 * clamped);
}

/** A raised-cosine sole path has zero height and velocity at both plants. */
function lift(value: number): number {
  return 0.5 - 0.5 * Math.cos(2 * Math.PI * Math.min(1, Math.max(0, value)));
}

/** Resolve five ordered phase offsets once, then add the route onset exactly once per boundary. */
function phaseBoundaries(step: Readonly<FootworkMotion.Step>): {
  firstStart: number;
  firstEnd: number;
  otherStart: number;
  otherEnd: number;
  end: number;
} {
  const scale: number = ActionVariation.sample(step.variation).timingScale;
  const durations: number[] = [
    step.unload,
    step.swing,
    step.load,
    step.follow,
    step.settle,
  ].map((duration: number): number => duration * scale);
  if (
    !Number.isFinite(step.start) ||
    step.start < 0 ||
    durations.some(
      (duration: number): boolean =>
        !Number.isFinite(duration) || duration <= 0,
    )
  )
    throw new Error(
      "Footwork phrase clock requires a finite nonnegative start and positive phase durations",
    );
  let elapsed: number = 0;
  const boundaries: number[] = durations.map((duration: number): number => {
    elapsed += duration;
    return step.start + elapsed;
  });
  if (!boundaries.every(Number.isFinite))
    throw new Error("Footwork phase sum must remain finite");
  return {
    firstStart: boundaries[0]!,
    firstEnd: boundaries[1]!,
    otherStart: boundaries[2]!,
    otherEnd: boundaries[3]!,
    end: boundaries[4]!,
  };
}

/**
 * Rotate each entry sole about the common midpoint, then add fixed-frame travel.
 * The right-handed planar Y rotation changes only horizontal coordinates, retaining each supplied sole height. Exactly two independently owned targets are returned; no actor, actual fitted target or history participates.
 * All coordinates use the route's fixed actor-local metres and turn uses admitted radians. This constructs requested endpoints, not physical clearance or support admission.
 */
function turnTargets(
  feet: Record<MotionAction.Side, MotionAction.Vec3>,
  displacement: MotionAction.Vec3,
  turn: number,
): Record<MotionAction.Side, MotionAction.Vec3> {
  const midpoint: MotionAction.Vec3 = feet.left.map(
    (value: number, axis: number): number => (value + feet.right[axis]!) / 2,
  ) as MotionAction.Vec3;
  const cosine: number = Math.cos(turn);
  const sine: number = Math.sin(turn);
  const target: (side: MotionAction.Side) => MotionAction.Vec3 = (
    side: MotionAction.Side,
  ): MotionAction.Vec3 => {
    if (turn === 0)
      return feet[side].map(
        (value: number, axis: number): number => value + displacement[axis]!,
      ) as MotionAction.Vec3;
    const x: number = feet[side][0] - midpoint[0];
    const z: number = feet[side][2] - midpoint[2];
    return [
      midpoint[0] + displacement[0] + cosine * x + sine * z,
      feet[side][1],
      midpoint[2] + displacement[2] - sine * x + cosine * z,
    ];
  };
  return { left: target("left"), right: target("right") };
}

/**
 * The fixed actor frame composes this unit quaternion after its initial heading.
 * The standard axis-angle quaternion represents a pure positive Y yaw with x/y/z/w storage and a unit norm. It retains no state or borrowed resource.
 * Radians are finite cumulative route yaw, not a clinical joint angle or proof of feasible foot placement.
 */
function yaw(
  radians: number,
): NonNullable<MotionAction.Sample["rootRotation"]> {
  return [0, Math.sin(radians / 2), 0, Math.cos(radians / 2)];
}
