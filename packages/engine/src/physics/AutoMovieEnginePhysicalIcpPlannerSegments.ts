// Ported from IHMC Open Robotics Software (Apache-2.0), 201903_Stable:
// ihmc-common-walking-control-modules/src/main/java/us/ihmc/
// commonWalkingControlModules/capturePoint/
// ICPPlannerSegmentedTrajectoryGenerator.java constructor l.100-132,
// setReferenceFrames l.167-171, setTrajectoryTime l.173-178, initialize
// l.214-289, compute l.305-336, computeFirstSegment l.338-350,
// computeSecondSegment l.358-365, initializeSpline l.376-381,
// computeThirdSegment l.383-395, updateSplineBoundaries l.404-418 and the
// frame interpolations l.423-446.
import { AutoMovieEnginePhysicalIcpPlannerTools as Tools } from "./AutoMovieEnginePhysicalIcpPlannerTools";
import type { AutoMovieEnginePhysicalPlanarPolygon as Polygon } from "./AutoMovieEnginePhysicalPlanarPolygon";

/**
 * IHMC's 201903 single-support capture-point trajectory with two pivots
 * (`ICPPlannerSegmentedTrajectoryGenerator`): the capture point diverges from
 * the entry pivot, a velocity-constrained cubic carries it across the pivot
 * switch, and it diverges from the exit pivot after.
 *
 * Each boundary point is held twice (l.54-80, l.214-228): attached to the
 * support sole's frame, in its coordinates, and in the world. Every update
 * carries the sole copies to where the sole now is and blends the two copies by
 * the progression through single support, the sole copy at its start and the
 * world copy at its end (l.338-395, l.404-446), so a support sole that slips
 * stretches the plan. Points are world floor points, metres; times seconds.
 * @see https://github.com/ihmcrobotics/ihmc-open-robotics-software/blob/201903_Stable/ihmc-common-walking-control-modules/src/main/java/us/ihmc/commonWalkingControlModules/capturePoint/ICPPlannerSegmentedTrajectoryGenerator.java
 */
export namespace AutoMovieEnginePhysicalIcpPlannerSegments {
  /** The trajectory's boundary points in one frame's coordinates. */
  export interface ICopies<Point, State> {
    /** The capture point at the start of single support. */
    initialIcp: Point;

    /** The entry pivot. */
    initialCmp: Point;

    /** The exit pivot. */
    finalCmp: Point;

    /** The cubic's start state. */
    start: State;

    /** The cubic's end state. */
    end: State;
  }

  /** The initialized trajectory. */
  export interface ISegments {
    /** The pendulum's rate, per second. */
    omega: number;

    /** The single support's duration, seconds. */
    total: number;

    /** When the cubic starts, seconds into single support. */
    startOfSpline: number;

    /** When it ends. */
    endOfSpline: number;

    /** The boundary points in the support sole's coordinates. */
    sole: ICopies<Polygon.IPoint, Tools.IAttached>;

    /** The boundary points on the floor. */
    world: ICopies<Tools.IFloor, Tools.IState>;
  }

  /**
   * The shortest cubic when a minimum time on the exit pivot is kept
   * (constructor l.111), seconds.
   */
  export const MINIMUM_SPLINE_DURATION: number = 0.1;

  /**
   * The trajectory initialized (l.214-289): the cubic centred on the pivot
   * switch at half the maximum spline duration each way, starting no earlier
   * than single support; it ends no later than single support, or, with a
   * minimum time on the exit pivot, that time before its end. The cubic's ends
   * are the divergence from the initial capture point over the entry pivot at
   * its start, and from the exit corner point over the exit pivot at its end.
   * Each point is also held in the support sole's coordinates (l.216-221).
   *
   * @param input The pendulum's rate; the times on the entry and exit pivots,
   *   seconds; the maximum spline duration and the minimum time on the exit
   *   pivot, seconds; the initial capture point, the exit corner point, and the
   *   entry and exit pivots; and the support sole's frame as the plan is made.
   * @returns The trajectory.
   */
  export function initialize(input: {
    omega: number;
    onInitial: number;
    onFinal: number;
    maximumSplineDuration: number;
    minimumTimeOnFinal: number;
    initialIcp: Tools.IFloor;
    finalCorner: Tools.IFloor;
    initialCmp: Tools.IFloor;
    finalCmp: Tools.IFloor;
    sole: Polygon.IFrame;
  }): ISegments {
    const total: number = input.onInitial + input.onFinal;
    const alpha: number = 0.5;
    let start: number = Math.max(
      input.onInitial - alpha * input.maximumSplineDuration,
      0.0,
    );
    let end: number =
      input.onInitial + (1.0 - alpha) * input.maximumSplineDuration;
    if (input.minimumTimeOnFinal <= 1.0e-5) end = Math.min(end, total);
    else {
      const minimum: number = Math.min(
        input.minimumTimeOnFinal,
        input.onFinal - alpha * MINIMUM_SPLINE_DURATION,
      );
      end = Math.min(end, total - minimum);
      if (end > total - minimum) {
        end = total - minimum;
        start = Math.min(input.onInitial - (end - input.onInitial), 0.0);
      }
    }
    const world: ICopies<Tools.IFloor, Tools.IState> = {
      initialIcp: { ...input.initialIcp },
      initialCmp: { ...input.initialCmp },
      finalCmp: { ...input.finalCmp },
      start: Tools.capturePoint(
        input.omega,
        start,
        input.initialIcp,
        input.initialCmp,
      ),
      end: Tools.capturePoint(
        input.omega,
        end - input.onInitial,
        input.finalCorner,
        input.finalCmp,
      ),
    };
    const point = (p: Tools.IFloor): Polygon.IPoint =>
      Tools.attach(input.sole, { position: p, velocity: { x: 0, z: 0 } })
        .position;
    return {
      omega: input.omega,
      total,
      startOfSpline: start,
      endOfSpline: end,
      sole: {
        initialIcp: point(world.initialIcp),
        initialCmp: point(world.initialCmp),
        finalCmp: point(world.finalCmp),
        start: Tools.attach(input.sole, world.start),
        end: Tools.attach(input.sole, world.end),
      },
      world,
    };
  }

  /**
   * The capture point and its rate a time into single support, the time clamped
   * to it (l.305-336): diverging from the entry pivot up to the cubic's start,
   * the cubic until its end, then diverging from the cubic's end over the exit
   * pivot (l.338-395). The sole copies are carried to the support sole's frame
   * as it is now; outside the cubic both copies diverge and blend by the
   * progression, and the cubic runs between its ends blended by their own
   * progressions (l.404-418). The divergence commutes with the sole's rigid
   * motion, so diverging the carried copies equals diverging in the sole's
   * frame and carrying the result.
   *
   * @param segments The trajectory.
   * @param time The time into single support, seconds.
   * @param sole The support sole's frame now.
   * @returns The capture point and its rate.
   */
  export function compute(
    segments: ISegments,
    time: number,
    sole: Polygon.IFrame,
  ): Tools.IState {
    const t: number = Math.min(Math.max(time, 0.0), segments.total);
    const progression: number =
      segments.total <= 1.0e-7 ? 1.0 : t / segments.total;
    const w: ICopies<Tools.IFloor, Tools.IState> = segments.world;
    const s: ICopies<Tools.IFloor, Tools.IState> = carry(segments.sole, sole);
    if (t <= segments.startOfSpline)
      return Tools.blend(
        Tools.capturePoint(segments.omega, t, s.initialIcp, s.initialCmp),
        Tools.capturePoint(segments.omega, t, w.initialIcp, w.initialCmp),
        progression,
      );
    if (t >= segments.endOfSpline) {
      const after: number = t - segments.endOfSpline;
      return Tools.blend(
        Tools.capturePoint(segments.omega, after, s.end.position, s.finalCmp),
        Tools.capturePoint(segments.omega, after, w.end.position, w.finalCmp),
        progression,
      );
    }
    const from: Tools.IState = Tools.blend(
      s.start,
      w.start,
      segments.startOfSpline / segments.total,
    );
    const to: Tools.IState = Tools.blend(
      s.end,
      w.end,
      segments.endOfSpline / segments.total,
    );
    return Tools.cubic(
      {
        duration: segments.endOfSpline - segments.startOfSpline,
        initial: from.position,
        initialVelocity: from.velocity,
        final: to.position,
        finalVelocity: to.velocity,
      },
      t - segments.startOfSpline,
    );
  }
}

/** The sole copies carried to the floor where the sole now is. */
function carry(
  copies: AutoMovieEnginePhysicalIcpPlannerSegments.ICopies<Polygon.IPoint, Tools.IAttached>,
  sole: Polygon.IFrame,
): AutoMovieEnginePhysicalIcpPlannerSegments.ICopies<Tools.IFloor, Tools.IState> {
  const point = (p: Polygon.IPoint): Tools.IFloor =>
    Tools.detach(sole, { position: p, velocity: { x: 0, y: 0 } }).position;
  return {
    initialIcp: point(copies.initialIcp),
    initialCmp: point(copies.initialCmp),
    finalCmp: point(copies.finalCmp),
    start: Tools.detach(sole, copies.start),
    end: Tools.detach(sole, copies.end),
  };
}
