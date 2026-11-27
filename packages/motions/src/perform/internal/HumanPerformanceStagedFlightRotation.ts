import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanFlightTurns,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanPerformanceFlightRotation } from "./HumanPerformanceFlightRotation";

interface IStagedFlight extends Omit<
  Parameters<typeof HumanPerformanceFlightRotation>[0],
  "orientation"
> {
  readonly turns: IAutoMovieMotionHumanFlightTurns;
  readonly turnedLanding: boolean;
}

/**
 * Author a flight's requested turns about its unchanged composed centre.
 *
 * Somersault and twist are signed revolutions in the requested root-frame axes.
 * Their angles advance linearly over the declared flight, without reducing
 * whole turns modulo one or slerping an endpoint orientation. The current
 * unturned root supplies heading; its articulation and centre path remain those
 * of the law and the ordinary displayed-pose pipeline. This staged curve states
 * no torque, impulse or momentum conservation. The law's landing phase owns
 * touchdown. Whole turns return to its unturned stance. A native jump with a
 * planned turned stance checks the returned touchdown orientation before using
 * the same staged rotation curve.
 *
 * @param props Numeric playback data, film/action seconds and authored turns.
 * @returns The action-local rigid turn about the sampled world centre.
 * @throws {HumanRefusal} For a nonfinite/nonpositive span, nonfinite turn
 *   angles, an invalid reference frame or a turn that does not close onto the
 *   law's landing orientation.
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
  const frame: IAutoMovieQuaternion = {
    x: supplied.x,
    y: supplied.y,
    z: supplied.z,
    w: supplied.w,
  };
  if (
    !(to > from) ||
    !(Math.hypot(frame.x, frame.y, frame.z, frame.w) > 0)
  )
    throw new HumanRefusal({
      kind: "parameter",
      axis: "turns",
      value: { somersault: somersaultTurns, twist: twistTurns },
      reason:
        "staged flight needs finite turns, a positive finite span and a nonzero finite axis frame",
      fix: "give finite turn counts and a valid flight interval and frame",
    });
  // The whole flight's turn must close onto the landing's orientation: a
  // rotation of angle zero, whose quaternion's scalar part is plus or minus one.
  const closing: IAutoMovieQuaternion = Quaternion.multiply(
    Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, somersault),
    Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, twist),
  );
  if (!props.turnedLanding && Math.abs(closing.w) < 1 - CLOSED)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "turns",
      value: { somersault: somersaultTurns, twist: twistTurns },
      reason:
        "the staged flight must close onto the law's existing landing orientation; nonclosing fractional turns need a compatible landing outcome",
      fix: "author complete revolutions until a compatible fractional landing outcome is available; physical mode does not repair that landing limitation",
    });
  const axes: IAutoMovieQuaternion = Quaternion.normalize(frame);
  const back: IAutoMovieQuaternion = Quaternion.inverse(axes);
  const orientation: Parameters<
    typeof HumanPerformanceFlightRotation
  >[0]["orientation"] = (
    seconds: number,
    root: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion => {
    const u: number = (seconds - from) / (to - from);
    const turn: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, somersault * u),
      Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, twist * u),
    );
    return Quaternion.normalize(
      Quaternion.multiply(
        root,
        Quaternion.multiply(Quaternion.multiply(axes, turn), back),
      ),
    );
  };
  return HumanPerformanceFlightRotation({
    start,
    t0: from,
    t1: to,
    step: props.step,
    times: props.times,
    table: props.table,
    orientation,
  });
}

/**
 * How far below one the closing turn's scalar part may fall and still read as
 * closed: the rounding of a quaternion of whole revolutions.
 */
const CLOSED: number = 1e-9;
