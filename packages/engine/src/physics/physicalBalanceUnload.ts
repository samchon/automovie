import type { IAutoMoviePhysicalRecoveryState } from "@automovie/interface";

import type { physicalBalanceSense } from "./physicalBalanceSense";
import { physicalRecoverySwing } from "./physicalRecoverySwing";
import { physicalStanceBalance } from "./physicalStanceBalance";
import { physicalStanceSeat } from "./physicalStanceSeat";

/**
 * The balance controller's unloading phase (`advancePhysicalBalance`): a limb
 * asked to step gives up its share of the stance over the fade window,
 * `physicalStanceBalance.FADE`, its force bound ramping to zero with it
 * (`trackPhysicalRoot`), and its measured load is low-passed, which decides
 * when it lifts (`physicalBalanceLift`). Until it lifts, the request is
 * planned again each frame (Pratt et al., M2V2, Section VII-A; Herzog et al.
 * 2016, Section 5.3; Feng et al. 2015, Figure 2).
 *
 * @param input The recovery's state and the body's readings.
 * @returns The state with the asked limbs' seats unloaded by one substep, a
 *   new one, or the input itself when no seated limb is asked to step; the
 *   input is never written.
 */
export function physicalBalanceUnload(input: {
  state: Readonly<IAutoMoviePhysicalRecoveryState>;
  sense: physicalBalanceSense.ISense;
}): IAutoMoviePhysicalRecoveryState {
  const { state, sense } = input;
  let seating: IAutoMoviePhysicalRecoveryState["seating"] = state.seating;
  for (const limb of sense.limbs) {
    if (!physicalRecoverySwing.of(state, limb.bone)) continue;
    const seat: physicalStanceSeat.ISeat | undefined = state.seating?.[limb.bone];
    if (!seat) continue;
    seating = {
      ...seating,
      [limb.bone]: {
        ...seat,
        bearing: Math.max(
          0,
          (seat.bearing ?? 1) - sense.dt / physicalStanceBalance.FADE,
        ),
        load: physicalStanceSeat.lowPass(
          seat.load ?? 0,
          sense.load(limb.bone),
          sense.dt,
        ),
      },
    };
  }
  return seating === state.seating ? state : { ...state, seating };
}
