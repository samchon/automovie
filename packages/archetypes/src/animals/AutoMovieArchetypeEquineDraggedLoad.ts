import {
  AutoMovieEngineMotionSampling,
  AutoMovieEngineMotionTrajectory,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
} from "../core";
import type { AutoMovieArchetypeDragged } from "../vehicles/AutoMovieArchetypeDragged";
import { type AutoMovieArchetypeEquine } from "./AutoMovieArchetypeEquine";
import type { AutoMovieArchetypeQuadruped } from "./AutoMovieArchetypeQuadruped";
import { AutoMovieArchetypeQuadrupedFooting } from "./AutoMovieArchetypeQuadrupedFooting";
import { EquineHarness } from "./equine/EquineHarness";

/** Operations and parameter types for a load dragged by a harnessed equine. */
export namespace AutoMovieArchetypeEquineDraggedLoad {
  /**
   * A load dragged along the ground behind a harnessed horse: a plough cutting
   * its furrow, a harrow, a chained log or a sledge, its heading following the
   * trace line and its coupling kept a trace's length behind the horse's points
   * of draft.
   *
   * The pull point is the middle of the collar's two points of draft, carried by
   * the horse's course placement (the stride's bob and nod, millimetres, are left
   * to the laid traces). The load's coupling is held `length` metres behind it in
   * plan, moving only along the line to it, the pursuit curve a load on a fixed
   * trace traces (a tractrix on a turn), integrated once by the engine's
   * trajectory integrator from a start straight behind the horse. The load's
   * heading is that line, so it follows the trace; its body lies on the authored
   * ground plane under its coupling (`AutoMovieArchetypeQuadrupedFooting`, or
   * level Y=0), lowered by the plough's working `depth` so its share runs that
   * deep in the furrow. Over each headland interval in `lifts` the plough is
   * lifted out, its share raised to `lift` metres above the ground on
   * minimum-jerk transitions of `raise` seconds at each end. The traces are laid
   * from the points of draft to the whippletree's two ends on the coupling, as
   * far apart as the points of draft, and `lines` lays the driving lines from the
   * bit rings to the point a walking driver holds them at.
   *
   * Draught is declared, not simulated: a plough's draught grows linearly with
   * its depth (Davies, J. Agric. Sci.), and the author states the load's draught
   * and the horse's capacity; a load whose draught exceeds that capacity is
   * refused.
   *
   * @param ride The horse's ride.
   * @param horse The harnessed horse it rides.
   * @param load A load from `createDragged`.
   * @param params The trace length, depth, headland lifts, declared draught and
   *   capacity, and footing.
   * @returns The load's ride by film second.
   * @throws {AutoMovieArchetypeRefusal} For a horse without the harness's points
   *   of draft, nonpositive lengths, a negative depth, a draught over capacity,
   *   and a ground plane missing under the load.
   */
  export function create(
    ride: AutoMovieArchetypeRide.IRide<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
    >,
    horse: AutoMovieArchetype<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
    >,
    load: AutoMovieArchetype<
      AutoMovieArchetypeDragged.Affordance,
      AutoMovieArchetypeDragged.Dimension
    >,
    params: AutoMovieArchetypeEquineDraggedLoad.IParams,
  ): AutoMovieArchetypeEquineDraggedLoad.IRide {
    const refuse = (
      axis: string,
      value: unknown,
      reason: string,
      maximum: number | null = null,
    ): never => {
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: load.archetype,
        axis,
        value,
        feasible:
          maximum === null
            ? null
            : { kind: "range", minimum: 0, maximum, unit: "N" },
        reason,
        fix: "Declare a draught the horse can pull and a positive trace length.",
      });
    };
    const depth: number = params.depth ?? 0;
    const lift: number = params.lift ?? 0;
    const raise: number = params.raise ?? 1;
    if (!(params.length > 0))
      refuse("length", params.length, "the trace must be a positive length");
    if (!(depth >= 0) || !(lift >= 0) || !(raise > 0))
      refuse(
        "depth",
        depth,
        "depth and lift must be nonnegative and the raise positive",
      );
    if (!(params.draught >= 0 && params.capacity > 0))
      refuse(
        "draught",
        params.draught,
        "draught and capacity must be declared",
      );
    if (params.draught > params.capacity)
      refuse(
        "draught",
        params.draught,
        `the load's declared draught exceeds the horse's ${params.capacity} N capacity`,
        params.capacity,
      );
    const ends: IAutoMovieVector3[] = (["left", "right"] as const).map(
      (side: AutoMovieArchetypeEquineDraggedLoad.Side): IAutoMovieVector3 => {
        const part: IAutoMovieModelPart | undefined = horse.parts.find(
          (candidate: IAutoMovieModelPart): boolean =>
            candidate.id === EquineHarness.ENDS.draft[side],
        );
        return (
          part?.transform?.translation ??
          refuse("tack", horse.name, "the horse wears no breast collar")
        );
      },
    );
    const middle: IAutoMovieVector3 = Vector3.lerp(ends[0]!, ends[1]!, 0.5);
    const spread: number = ends[0]!.x;
    const footing: AutoMovieArchetypeQuadrupedFooting.IPlan | undefined =
      params.footing === undefined
        ? undefined
        : AutoMovieArchetypeQuadrupedFooting.prepare(
            load.archetype,
            params.footing,
            false,
          );
    const coupling: IAutoMovieVector3 =
      load.affordance("coupling").frame.translation;

    // The pull point in plan, from the horse's course placement.
    const pull = (seconds: number): IAutoMovieVector3 =>
      AutoMovieArchetypeFrame.point(ride.plan.at(seconds).placement, middle);
    const start: IAutoMovieVector3 = pull(0);
    const ahead: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
      ride.plan.at(0).placement,
      "z",
    );
    const forward: IAutoMovieVector3 = Vector3.normalize({
      x: ahead.x,
      y: 0,
      z: ahead.z,
    });
    const path: IAutoMovieIntegrateMotionTrajectory.ITrajectory =
      AutoMovieEngineMotionTrajectory.integrateMotionTrajectory({
        f: (
          t: number,
          x: readonly number[],
        ): IAutoMovieIntegrateMotionTrajectory.IRate => {
          const h: IAutoMovieVector3 = pull(t);
          const a: IAutoMovieVector3 = pull(t + HALF);
          const b: IAutoMovieVector3 = pull(t - HALF);
          const vx: number = (a.x - b.x) / (2 * HALF);
          const vz: number = (a.z - b.z) / (2 * HALF);
          const dx: number = h.x - x[0]!;
          const dz: number = h.z - x[1]!;
          const span: number = Math.hypot(dx, dz);
          const along: number = (vx * dx + vz * dz) / span;
          return { dx: [(along * dx) / span, (along * dz) / span] };
        },
        x0: [
          start.x - forward.x * params.length,
          start.z - forward.z * params.length,
        ],
        t0: 0,
        t1: Math.max(ride.duration, 1e-3),
      });

    return { duration: ride.duration, at, lines };

    /*
     * The load, its placement, the traces and the share's depth at a film second.
     */
    function at(seconds: number): AutoMovieArchetypeEquineDraggedLoad.ISample {
      const t: number = Math.min(Math.max(seconds, 0), ride.duration);
      const x: readonly number[] = path.at(t).x;
      const h: IAutoMovieVector3 = pull(t);
      const heading: number = Math.atan2(h.x - x[0]!, h.z - x[1]!);
      const plane: AutoMovieArchetypeQuadrupedFooting.ISurface =
        footing === undefined
          ? { point: { x: 0, y: 0, z: 0 }, normal: UP }
          : footing.landing(
              { x: x[0]!, y: 0, z: x[1]! },
              Quaternion.identity(),
            );
      const ground: number =
        plane.point.y -
        (plane.normal.x * (x[0]! - plane.point.x) +
          plane.normal.z * (x[1]! - plane.point.z)) /
          plane.normal.y;
      const sink: number = depth - (depth + lift) * lifted(seconds);
      const rotation: IAutoMovieQuaternion = Quaternion.multiply(
        turn(UP, plane.normal),
        Quaternion.fromAxisAngle(UP, (heading * 180) / Math.PI),
      );
      const target: IAutoMovieVector3 = {
        x: x[0]!,
        y: ground + coupling.y - sink,
        z: x[1]!,
      };
      const placement: IAutoMovieTransform = {
        translation: Vector3.subtract(
          target,
          Quaternion.rotateVector(rotation, coupling),
        ),
        rotation,
        scale: { ...AutoMovieArchetypeFrame.UNIT },
      };
      const horseSample: AutoMovieArchetypeRide.ISample<
        AutoMovieArchetypeEquine.Affordance,
        AutoMovieArchetypeEquine.Dimension
      > = ride.at(seconds);
      const traces: AutoMovieArchetypeRide.ILineState[] =
        EquineHarness.SIDES.map(
          ([
            side,
            sign,
          ]: (typeof EquineHarness.SIDES)[number]): AutoMovieArchetypeRide.ILineState => ({
            id: `trace-${side}`,
            radius: EquineHarness.ESTIMATES.strap,
            points: [
              AutoMovieArchetypeFrame.point(
                horseSample.placement,
                horseSample.archetype.parts.find(
                  (part: IAutoMovieModelPart): boolean =>
                    part.id === EquineHarness.ENDS.draft[side],
                )!.transform!.translation,
              ),
              AutoMovieArchetypeFrame.point(placement, {
                ...coupling,
                x: coupling.x + sign * spread,
              }),
            ],
          }),
        );
      return { archetype: load, placement, traces, depth: sink };
    }

    /*
     * The driving lines from each bit ring to a world point the driver holds them
     * at, such as a ploughman's shoulder.
     */
    function lines(
      seconds: number,
      held: IAutoMovieVector3,
    ): AutoMovieArchetypeRide.ILineState[] {
      const sample: AutoMovieArchetypeRide.ISample<
        AutoMovieArchetypeEquine.Affordance,
        AutoMovieArchetypeEquine.Dimension
      > = ride.at(seconds);
      return EquineHarness.SIDES.map(
        ([
          side,
        ]: (typeof EquineHarness.SIDES)[number]): AutoMovieArchetypeRide.ILineState => ({
          id: `line-${side}`,
          radius: EquineHarness.ESTIMATES.strap,
          points: [
            AutoMovieArchetypeFrame.point(
              sample.placement,
              sample.archetype.parts.find(
                (part: IAutoMovieModelPart): boolean =>
                  part.id === EquineHarness.ENDS.bit[side],
              )!.transform!.translation,
            ),
            { ...held },
          ],
        }),
      );
    }

    /*
     * The share of the lift at a film second: 1 out of the ground, 0 at work.
     */
    function lifted(seconds: number): number {
      let most: number = 0;
      for (const interval of params.lifts ?? []) {
        const up: number = AutoMovieEngineMotionSampling.minimumJerk(
          (seconds - interval.from) / raise,
        ).s;
        const down: number = AutoMovieEngineMotionSampling.minimumJerk(
          (interval.to - seconds) / raise,
        ).s;
        most = Math.max(most, Math.min(up, down));
      }
      return most;
    }
  }

  /** A side of the horse and the load. */
  export type Side = "left" | "right";

  /**
   * The horse's forward lean into its collar at its full declared capacity,
   * degrees nose-down: an authored estimate, no measured lean having been
   * read.
   */
  export const LEAN: number = 8;

  /**
   * The horse's forward lean under a declared draught, for its course's `lean`
   * (`AutoMovieArchetypeQuadruped.IRideCourse.lean`): `LEAN` degrees scaled by
   * the share of the horse's declared capacity the load's declared draught
   * takes, held through the take: the horse is under its load from the first
   * second.
   *
   * @param draught The load's declared draught, newtons.
   * @param capacity The horse's declared capacity, newtons, positive.
   * @returns The lean in degrees, positive nose-down, at each film second.
   */
  export function lean(
    draught: number,
    capacity: number,
  ): AutoMovieArchetypeQuadruped.RideLean {
    const share: number = Math.min(1, Math.max(0, draught / capacity));
    return (): number => LEAN * share;
  }

  /** A headland interval the plough is lifted over, film seconds. */
  export interface ILift {
    /** When the lift begins. */
    from: number;
    /** When the plough is back at work. */
    to: number;
  }

  /** The drag. */
  export interface IParams {
    /**
     * The trace's length in plan from the points of draft to the coupling,
     * metres.
     */
    length: number;
    /** The share's working depth below the ground, metres; 0 when absent. */
    depth?: number;
    /** Headland intervals the plough is lifted over. */
    lifts?: readonly ILift[];
    /** The share's height above the ground when lifted, metres; 0 when absent. */
    lift?: number;
    /** Seconds each lift and lowering takes; 1 when absent. */
    raise?: number;
    /** The load's declared draught, newtons. */
    draught: number;
    /** The horse's declared draught capacity, newtons. */
    capacity: number;
    /** The authored ground; level Y=0 when absent. */
    footing?: AutoMovieArchetypeQuadrupedFooting.IScene;
  }

  /** One second of the dragged load. */
  export interface ISample {
    /** The load. */
    archetype: AutoMovieArchetype<
      AutoMovieArchetypeDragged.Affordance,
      AutoMovieArchetypeDragged.Dimension
    >;
    /** Its world placement. */
    placement: IAutoMovieTransform;
    /** The traces, collar to whippletree. */
    traces: readonly AutoMovieArchetypeRide.ILineState[];
    /**
     * How far the load is lowered below lying on the ground, metres: the
     * working depth, negative while lifted.
     */
    depth: number;
  }

  /** The dragged load by film second. */
  export interface IRide {
    /** The horse ride's duration. */
    duration: number;
    /** The load at a film second, held at the ride's ends outside it. */
    at: (seconds: number) => ISample;
    /**
     * The horse's driving lines at a film second, from its bit rings to the
     * world point a walking driver holds them at, such as a ploughman's
     * shoulder they run over.
     */
    lines: (
      seconds: number,
      held: IAutoMovieVector3,
    ) => readonly AutoMovieArchetypeRide.ILineState[];
  }
}

/*
 * World up.
 */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/*
 * Half the central-difference interval of the pull point's velocity, seconds.
 */
const HALF: number = 5e-4;

/*
 * The rotation taking one unit direction to another.
 */
function turn(
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
): IAutoMovieQuaternion {
  const axis: IAutoMovieVector3 = Vector3.cross(from, to);
  return Quaternion.fromAxisAngle(
    axis,
    (Math.atan2(Vector3.length(axis), Vector3.dot(from, to)) * 180) / Math.PI,
  );
}
