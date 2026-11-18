import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanFlightTurns,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPerformanceFlightRotation } from "./HumanPerformanceFlightRotation";

interface IStagedFlight
  extends Omit<Parameters<typeof HumanPerformanceFlightRotation>[0], "orientation"> {
  readonly turns: IAutoMovieMotionHumanFlightTurns;
  readonly turnedLanding: boolean;
}

/**
 * Author a flight's requested turns about its unchanged composed centre.
 *
 * Somersault and twist are signed revolutions in the requested root-frame
 * axes. Their angles advance linearly over the declared flight, without
 * reducing whole turns modulo one or slerping an endpoint orientation.
 * The current unturned root supplies heading; its articulation and centre
 * path remain those of the law and the ordinary displayed-pose pipeline.
 * This staged curve states no torque, impulse or momentum conservation.
 * The law's landing phase owns touchdown. Whole turns return to its unturned
 * stance. A native jump with a planned turned stance checks the returned
 * touchdown orientation before using the same staged rotation curve.
 *
 * @param props Numeric playback data, film/action seconds and authored turns.
 * @returns The action-local rigid turn about the sampled world centre.
 * @throws {HumanRefusal} For a nonfinite/nonpositive span, nonfinite turn angles, an invalid reference frame or a turn that does not close onto the law's landing orientation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States film/action seconds, signed unwrapped revolutions, linear phase, current heading, centre/articulation preservation and absence of a physical-conservation claim. Invalid numeric spans, angles and frames refuse. The native jump can supply a checked turned stance. Other laws admit only whole turns.
 * @evidence contracts/development/implementation.md#principled-implementation The root-local curve is F Rx(360*s*u) Ry(360*t*u) F^-1 for the declared axis frame F and flight share u. Left multiplication by the current unturned root expresses the requested local attitude in world coordinates; the shared playback owner returns its relative rigid turn about the same COM. Rx(a)Ry(b) is identity in SO(3) exactly when both requested revolution counts are integers, so ordinary laws require complete cycles. A native turned landing checks the full returned rotation against its actual ground stance.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Capture each requested count and frame coordinate once, admit those exact finite scalars and phase closure, construct the analytic orientation reader from the same captures, then delegate numeric centre/root interpolation to the existing playback owner.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts This is an explicit staged authoring policy, not a physical flight or a fabricated momentum result. Count/coordinate getters cannot supply one value for admission and another for the actual curve: all validation and construction consume the same owned scalar snapshot. It creates no history, inertia solve, take-off search, controller or conservation verdict, and preserves every requested winding without clipping or nearest-angle substitution.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant setup plus constant quaternion work per playback query. The existing numeric table owns centre/root lookup; authored angle evaluation has no integration grid, iterations or state-dependent search.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the actual numeric centre/root playback implementation with physical flights. Copied frame/turn/time scalars fix only this authored curve, with no pose, time-result cache, callback probing or cross-performance reuse.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned playback owns numeric table data and a constant-size closure of copied frame, span and angle scalars. No performance, body, plan, shape callback, mass model or physical history survives in it.
 */
export function HumanPerformanceStagedFlightRotation(
  props: IStagedFlight,
): ReturnType<typeof HumanPerformanceFlightRotation> {
  const from: number = props.t0;
  const to: number = props.t1;
  const request: IAutoMovieMotionHumanFlightTurns = props.turns;
  const somersaultTurns: number = request.somersault;
  const somersault: number = somersaultTurns * 360;
  const twistTurns: number = request.twist;
  const twist: number = twistTurns * 360;
  const supplied: IAutoMovieQuaternion = request.frame ?? Quaternion.identity();
  const start: number = props.start;
  const frame: IAutoMovieQuaternion = { x: supplied.x, y: supplied.y, z: supplied.z, w: supplied.w };
  if (![start, from, to, to - from, somersault, twist, frame.x, frame.y, frame.z, frame.w].every(Number.isFinite) ||
    !(to > from) || !(Math.hypot(frame.x, frame.y, frame.z, frame.w) > 0))
    throw new HumanRefusal({
      kind: "parameter", axis: "turns", value: { somersault: somersaultTurns, twist: twistTurns },
      reason: "staged flight needs finite turns, a positive finite span and a nonzero finite axis frame",
      fix: "give finite turn counts and a valid flight interval and frame",
    });
  if (
    !props.turnedLanding &&
    (!Number.isInteger(somersaultTurns) || !Number.isInteger(twistTurns))
  )
    throw new HumanRefusal({
      kind: "parameter", axis: "turns", value: { somersault: somersaultTurns, twist: twistTurns },
      reason: "the staged flight must close onto the law's existing landing orientation; nonclosing fractional turns need a compatible landing outcome",
      fix: "author complete revolutions until a compatible fractional landing outcome is available; physical mode does not repair that landing limitation",
    });
  const axes: IAutoMovieQuaternion = Quaternion.normalize(frame);
  const back: IAutoMovieQuaternion = Quaternion.inverse(axes);
  const orientation: Parameters<typeof HumanPerformanceFlightRotation>[0]["orientation"] = (
    seconds: number,
    root: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion => {
    const u: number = (seconds - from) / (to - from);
    const turn: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, somersault * u),
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, twist * u),
    );
    return Quaternion.normalize(Quaternion.multiply(root,
      Quaternion.multiply(Quaternion.multiply(axes, turn), back)));
  };
  return HumanPerformanceFlightRotation({
    start, t0: from, t1: to, step: props.step,
    times: props.times, table: props.table, orientation,
  });
}
