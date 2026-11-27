import type { IAutoMovieMotionHumanBalance } from "@automovie/interface";

import type { HumanPhysics } from "./HumanPhysics";

/*
 * Fit the requested edge durations to a numeric window, preserving their ratio.
 */
export function HumanPhysicsAdmitWindow(
  active: HumanPhysics.IShift,
  from: number,
  to: number,
): HumanPhysics.Window {
  const span: number = to - from;
  const ramp: IAutoMovieMotionHumanBalance.IRamp = active.ramp;
  const longest: number = Math.max(ramp.in, ramp.out);
  if (span < 0 || (span === 0 && longest > 0)) return null;
  if (ramp.in + ramp.out <= span)
    return { by: active.by, from, to, weight: active.weight, ramp };

  // Normalize before adding so large finite durations retain their ratio.
  const incoming: number = ramp.in / longest;
  const outgoing: number = ramp.out / longest;
  const unit: number = span / (incoming + outgoing);
  return {
    by: active.by,
    from,
    to,
    weight: active.weight,
    ramp: { in: incoming * unit, out: outgoing * unit },
  };
}
