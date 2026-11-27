import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBend,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { HumanMinimumJerkSpline } from "../../posture/internal/HumanMinimumJerkSpline";
import { placeHumanHandSurface } from "../../posture/internal/placeHumanHandSurface";
import { useTool } from "./useTool";
import { useToolCycle } from "./useToolCycle";

/*
 * The hand's complete grip goal at a second: the work's cycle at its stroke
 * period between the ready and recovery instants and its half-phase edge
 * outside them, with the arm's bend on a via-point course.
 *
 * The bend is solved only at the cycle's knots, when the plan is made
 * (`AutoMovieMotionHumanBend.solve` on the entry's trunk). Between knots it
 * runs on the minimum-jerk path through them, the via-point solution of Flash
 * and Hogan 1985 (J Neurosci 5(7):1688-1703) in its periodic form
 * (`HumanMinimumJerkSpline.cyclic`): quintic segments whose jerk and snap are
 * continuous at every knot, the last joined to the first across the cycle. A
 * read evaluates the path; it solves nothing.
 * Parameter prepared: What the plan prepared for it.
 * Returns: The plan's `target`.
 */
export function useToolTarget(
  prepared: useToolTarget.IPrepared,
): (
  posture: IAutoMovieMotionHumanPosture,
  seconds: number,
) => IAutoMovieMotionHumanArmTarget.ITarget {
  const {
    cycle,
    ready,
    recover,
    edge,
    strokePeriod,
    body,
    side,
    gripOffset,
    entry,
  }: useToolTarget.IPrepared = prepared;

  // The bend at each knot, solved once on the entry's trunk.
  const trunk: ReturnType<typeof AutoMovieMotionHumanBend.prepare> =
    AutoMovieMotionHumanBend.prepare({ body, posture: entry, side });
  const solved: IAutoMovieVector3[] = Array.from(
    { length: useToolTarget.KNOTS },
    (_: unknown, j: number): IAutoMovieVector3 => {
      const at: ReturnType<useToolTarget.IPrepared["cycle"]> = cycle(
        j / useToolTarget.KNOTS,
      );
      const wrist: IAutoMovieMotionHumanBend.ISolve = {
        body,
        posture: entry,
        side,
        point: placeHumanHandSurface(gripOffset, at.grip, at.rotation).point,
        rotation: at.rotation,
        fallback: "hang",
      };
      return trunk.solve(wrist);
    },
  );
  const h: number = 1 / useToolTarget.KNOTS;
  const times: number[] = solved.map(
    (_: IAutoMovieVector3, j: number): number => j * h,
  );
  const x: number[][] = solved.map((p: IAutoMovieVector3): number[] => [
    p.x,
    p.y,
    p.z,
  ]);
  const path: HumanMinimumJerkSpline.IDerivatives =
    HumanMinimumJerkSpline.cyclic(times, x, 1);

  // The edge holds the half phase, a knot.
  const held: IAutoMovieVector3 = solved[useToolTarget.KNOTS / 2]!;
  return (
    _posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ): IAutoMovieMotionHumanArmTarget.ITarget => {
    const working: boolean = !(seconds <= ready || seconds >= recover);
    const phase: number = working
      ? ((seconds - ready) / strokePeriod + 0.5) % 1
      : 0.5;
    const at: ReturnType<useToolTarget.IPrepared["cycle"]> = working
      ? cycle(phase)
      : edge;
    return {
      surface: "grip",
      shape: "relaxed",
      point: at.grip,
      rotation: at.rotation,
      bend: working ? useToolTarget.course(x, path, h, phase) : { ...held },
    };
  };
}

/*
 * The `target` of `useTool.plan`, built from what that plan prepared.
 */
export namespace useToolTarget {
  /*
   * What `useTool.plan` prepared for its `target`.
   */
  export interface IPrepared {
    /*
     * The work's hand at a phase, 0 at a contact and periodic in 1.
     */
    cycle: (phase: number) => Pick<useTool.IWork, useToolCycle.PlanCycle>;

    /*
     * Seconds at which the work begins.
     */
    ready: number;

    /*
     * Seconds at which the recovery begins.
     */
    recover: number;

    /*
     * The hand at the cycle's half phase, held outside the work.
     */
    edge: ReturnType<IPrepared["cycle"]>;

    /*
     * Seconds of one stroke.
     */
    strokePeriod: number;

    /*
     * The body.
     */
    body: IAutoMovieMotionHumanBody;

    /*
     * The working arm's side.
     */
    side: AutoMovieHumanSide;

    /*
     * The grip's offset in the hand's frame.
     */
    gripOffset: IAutoMovieVector3;

    /*
     * The posture the work is entered in, whose trunk the bends are solved on.
     */
    entry: IAutoMovieMotionHumanPosture;
  }

  /*
   * The cycle's knots: the phases where its sinusoid is at an extreme or an
   * inflection, the quarter phases, at which the bend is solved once. These are
   * the sinusoid's analytic branch points, exact in closed form, so no adaptive
   * placement (`prepareHumanAdaptiveKnots`) has a knot to add between them.
   */
  export const KNOTS: number = 4;

  /*
   * The bend's course at a phase: the minimum-jerk segment between the two
   * knots around it (`HumanMinimumJerkSpline.quintic`), the wrap segment from
   * the last knot to the first.
   * Parameter x: The knots' places, world metres.
   * Parameter path: The knots' velocities and accelerations on the periodic path.
   * Parameter h: The phase between two knots.
   * Parameter phase: The phase, in [0, 1).
   * Returns: The elbow's place, world metres.
   */
  export function course(
    x: readonly (readonly number[])[],
    path: HumanMinimumJerkSpline.IDerivatives,
    h: number,
    phase: number,
  ): IAutoMovieVector3 {
    const k: number = Math.min(x.length - 1, Math.floor(phase / h));
    const next: number = (k + 1) % x.length;
    const p: number[] = HumanMinimumJerkSpline.quintic(
      x[k]!,
      x[next]!,
      path.velocities[k]!,
      path.velocities[next]!,
      path.accelerations[k]!,
      path.accelerations[next]!,
      h,
      (phase - k * h) / h,
    );
    return { x: p[0]!, y: p[1]!, z: p[2]! };
  }
}
