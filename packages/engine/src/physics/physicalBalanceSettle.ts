import type {
  IAutoMoviePhysicalBalance,
  IAutoMoviePhysicalBalanceBracing,
  IAutoMoviePhysicalBalanceExhaustion,
  IAutoMoviePhysicalRecoveryState,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { physicalBalanceBracing } from "./internal/physicalBalanceBracing";
import { physicalBalanceExhaustion } from "./internal/physicalBalanceExhaustion";
import type { AutoMovieEnginePhysicalBalanceTypes } from "./AutoMovieEnginePhysicalBalanceTypes";
import { physicalRecoveryLimbSwing } from "./internal/physicalRecoveryLimbSwing";

/**
 * The balance controller's settle phase (`advancePhysicalBalance`): the
 * endpoint goals of the limbs no step holds, and the root's tracking strength.
 *
 * A landed foot is held by the floor and its leg's joints alone: no endpoint
 * servo pulls it toward its goal outside the support solve, which already
 * holds it (Feng et al. 2013, Section III-D: no orientation tracking on a
 * loaded foot); its goal is its landed place. Once a landing has moved the
 * root, every other limb's goal is its authored endpoint moved by its own
 * offset. The root's tracking is withdrawn once unrecoverable support loss
 * has lasted its policy's duration (`physicalBalanceExhaustion`), or set by the
 * bracing policy where one is declared (`physicalBalanceBracing`).
 *
 * @param input The recovery's state after the swing phase, the body's
 *   readings, the goals the plan and swing phases set and the stance's
 *   assessment.
 * @returns The state with its loss timer advanced, a new one; every goal,
 *   those given first; and the root's strength and bracing shift. The input is
 *   never written.
 */
export function physicalBalanceSettle(input: {
  state: Readonly<IAutoMoviePhysicalRecoveryState>;
  sense: AutoMovieEnginePhysicalBalanceTypes.ISense;
  goals: Readonly<Record<string, IAutoMovieVector3>>;
  assessment: IAutoMoviePhysicalBalance.IResult;
}): physicalBalanceSettle.IResult {
  const { sense } = input;
  const goals: Record<string, IAutoMovieVector3> = Object.assign(
    Object.create(null) as Record<string, IAutoMovieVector3>,
    input.goals,
  );
  for (const [bone, offset] of Object.entries(input.state.offsets))
    if (!physicalRecoveryLimbSwing(input.state, bone))
      goals[bone] = Vector3.add(sense.authored(bone), offset);
  const exhaustion: IAutoMoviePhysicalBalanceExhaustion.IResult =
    physicalBalanceExhaustion({
      unrecoverable: input.state.last === "unrecoverable",
      lostSince: input.state.lostSince,
      failedLanding: input.state.failedLanding,
      seconds: sense.seconds,
      duration: sense.policy.duration,
    });
  const state: IAutoMoviePhysicalRecoveryState = {
    ...input.state,
    lostSince: exhaustion.lostSince,
  };
  if (state.rootOffset)
    for (const limb of sense.limbs)
      goals[limb.bone] ??= Vector3.add(
        sense.authored(limb.bone),
        state.offsets[limb.bone] ?? { x: 0, y: 0, z: 0 },
      );
  if (!sense.policy.bracing)
    return { state, goals, rootStrength: exhaustion.exhausted ? 0 : 1 };
  const effort: IAutoMoviePhysicalBalanceBracing.IResult =
    physicalBalanceBracing({
      assessment: input.assessment,
      center: sense.center,
      floor: sense.floor,
      ...sense.policy.bracing,
      exhausted: exhaustion.exhausted,
    });
  return {
    state,
    goals,
    rootStrength: effort.rootStrength,
    ...(effort.shift ? { rootShift: effort.shift } : {}),
  };
}

/** What {@link physicalBalanceSettle} settles. */
export namespace physicalBalanceSettle {
  /** The settle phase's result. */
  export interface IResult {
    /** The state after the settle phase. */
    state: IAutoMoviePhysicalRecoveryState;
    /** Every endpoint goal, world metres, by bone. */
    goals: Record<string, IAutoMovieVector3>;
    /** The root's tracking strength in [0, 1]. */
    rootStrength: number;
    /** The bracing policy's horizontal root-target shift, world metres, if any. */
    rootShift?: IAutoMovieVector3;
  }
}
