import type { IAutoMoviePhysicalRecoveryState } from "@automovie/interface";

import type { physicalBalanceSense } from "./physicalBalanceSense";
import { physicalRecoverySwing } from "./physicalRecoverySwing";
import { physicalStanceSeat } from "./physicalStanceSeat";

/**
 * The balance controller's landing-ramp phase (`advancePhysicalBalance`): each
 * stance foot's seating advanced by one substep (`physicalStanceSeat`), its
 * sole's seating, its low-passed measured load, which decides lift-off and
 * touchdown, and its bearing, flatness and entry shares by geometry, each
 * ramping over `physicalStanceBalance.FADE`; a landed foot starts full, as
 * both of IHMC 201903's controllers seat it at touchdown,
 * and a foot seated anew otherwise ramps in from nothing here. A first stance
 * starts borne and flat. A foot's world
 * orientation is latched where it actually stands when its stance begins, at
 * the first step or on landing, its planted-foot hold
 * (`physicalStanceJointTarget`), and latched again when it touches again after
 * leaving the holds, added with zero error where it stands as a landed foot is
 * (design-4017-qp3, Section 3, rules 2 and 3).
 *
 * The sole's spread is how far the highest of the main foot carrier's sole
 * vertices stands above the lowest, actual heights only, the toes (a jointed
 * segment of their own) left out: a flat foot's sole lies level, an edge
 * lifting raises the spread (Coros, Beaudoin and van de Panne 2010, Section
 * 3.3). The plant only names which vertices form the sole.
 *
 * @param input The recovery's state and the body's readings.
 * @returns The state with every limb not asked to step seated, a new one, or
 *   the input itself when every limb is asked to step; the input is never
 *   written.
 */
export function physicalBalanceRamp(input: {
  state: Readonly<IAutoMoviePhysicalRecoveryState>;
  sense: physicalBalanceSense.ISense;
}): IAutoMoviePhysicalRecoveryState {
  const { state, sense } = input;
  const first: boolean = state.seating === undefined;
  let seating: IAutoMoviePhysicalRecoveryState["seating"] = state.seating;
  for (const limb of sense.limbs) {
    if (physicalRecoverySwing.of(state, limb.bone)) continue;
    const spread: number = sense.spread(limb.bone);
    const existing: physicalStanceSeat.ISeat | undefined =
      seating?.[limb.bone];
    const seat: physicalStanceSeat.ISeat = existing
      ? { ...existing }
      : {
          seated: first,
          since: sense.seconds,
          bearing: first ? 1 : 0,
          flat: first ? 1 : 0,
          load: first ? sense.weight / sense.limbs.length : 0,
          entry: first ? 1 : 0,
          relief: spread,
          anchor: sense.latch(limb),
        };
    if (
      physicalStanceSeat({
        seat,
        spread,
        load: sense.load(limb.bone),
        grounded: sense.grounded(limb),
        touching: sense.touching(limb.bone),
        weight: sense.weight,
        seconds: sense.seconds,
        dt: sense.dt,
      })
    )
      seat.anchor = sense.latch(limb);
    seating = { ...seating, [limb.bone]: seat };
  }
  return seating === state.seating ? state : { ...state, seating };
}
