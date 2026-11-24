import { StrikingLimb } from "./StrikingLimb";
import type { StrikingVerdicts } from "./StrikingVerdicts";

/**
 * The limb's gap to the other body at a film second; infinite when there is no
 * other body.
 */
export function StrikingVerdictsGap(
  strike: StrikingVerdicts.IStrike,
  seconds: number,
): StrikingLimb.IGap {
  if (strike.other === undefined)
    return { distance: Infinity, bone: undefined, part: "nothing" };
  return StrikingLimb.gap(
    strike.body,
    strike.performance.bones(strike.id, seconds),
    strike.limb,
    strike.other.body,
    strike.performance.bones(strike.other.id, seconds),
  );
}
