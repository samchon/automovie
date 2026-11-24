import type {
  IAutoMoviePhysicalRecoveryState,
  IAutoMovieStepPlanner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import type { IAutoMoviePhysicalBalanceTrace } from "./IAutoMoviePhysicalBalanceTrace";
import type { physicalBalanceSense } from "./physicalBalanceSense";
import { physicalRecoverySwing } from "./physicalRecoverySwing";

/**
 * The landing, timeout and failure writes the biped's and the quadruped's
 * touchdown phases share (`physicalBipedTouchdown`, `physicalQuadTouchdown`).
 */
export namespace physicalBalanceTouchdown {
  /**
   * Whether a swing's landing is overdue: past its end by the policy's landing
   * timeout, the policy's duration without one.
   *
   * @param swing The swing.
   * @param sense The body's readings.
   * @returns Whether it is overdue.
   */
  export function overdue(
    swing: IAutoMovieStepPlanner.IStep,
    sense: physicalBalanceSense.ISense,
  ): boolean {
    return (
      sense.seconds >
      swing.end + (sense.policy.landingTimeout ?? sense.policy.duration)
    );
  }

  /**
   * An overdue landing written onto a state the caller owns as a failure, which
   * withdraws the support rather than inventing a success: every step under way
   * resolved as failed and ended, and the failure recorded.
   *
   * @param input The state to write, the body's readings and the trace to
   *   record into, if any.
   */
  export function fail(input: {
    state: IAutoMoviePhysicalRecoveryState;
    sense: physicalBalanceSense.ISense;
    trace?: IAutoMoviePhysicalBalanceTrace[];
  }): void {
    const { state, sense } = input;
    const ending: IAutoMovieStepPlanner.IStep[] = physicalRecoverySwing(state);
    for (const step of ending)
      state.steps = physicalRecoverySwing.resolve(state.steps, step.bone, {
        seconds: sense.seconds,
        status: "failed",
      });
    input.trace?.push({
      kind: "failed",
      seconds: sense.seconds,
      bones: ending.map(
        (step: IAutoMovieStepPlanner.IStep): string => step.bone,
      ),
    });
    delete state.swings;
    state.failedLanding = true;
    state.swing = undefined;
    state.outsideSince = sense.seconds;
    state.revision = (state.revision ?? 0) + 1;
  }

  /**
   * A swing foot's landing written onto a state the caller owns: its horizontal
   * offset from its authored endpoint, the root's offset, the landing's record,
   * the foot seated where it landed with the given shares, and its step
   * resolved as landed. The standing feet keep what they latched when their own
   * stance began: the legs' posture is the authored pose refit to the present
   * footholds (`physicalStanceJointTarget`), so no landing re-latches another
   * foot's joints.
   *
   * @param input The state to write, the body's readings, the landed bone,
   *   whether it landed before its swing's end, the seat's initial bearing, load
   *   and entry shares, and the trace to record into, if any.
   */
  export function land(input: {
    state: IAutoMoviePhysicalRecoveryState;
    sense: physicalBalanceSense.ISense;
    bone: string;
    early: boolean;
    seat: { bearing: number; load: number; entry: number };
    trace?: IAutoMoviePhysicalBalanceTrace[];
  }): void {
    const { state, sense, bone } = input;
    const position: IAutoMovieVector3 = sense.actual(bone);
    const intended: IAutoMovieVector3 = sense.authored(bone);

    // The offsets keep the null prototype the state starts them with.
    state.offsets = Object.assign(
      Object.create(null) as Record<string, IAutoMovieVector3>,
      state.offsets,
      {
        [bone]: Vector3.subtract(
          { x: position.x, y: intended.y, z: position.z },
          intended,
        ),
      },
    );
    const rootPosition: IAutoMovieVector3 = sense.root.body.translation();
    state.rootOffset = {
      x: rootPosition.x - sense.targets[sense.root.segment.bone]!.position.x,
      y: 0,
      z: rootPosition.z - sense.targets[sense.root.segment.bone]!.position.z,
    };
    state.landings = [
      ...(state.landings ?? []),
      {
        bone,
        seconds: sense.seconds,
        position: { ...position },
        offset: { ...state.offsets[bone]! },
        rootOffset: { ...state.rootOffset },
      },
    ];
    state.seating = {
      ...state.seating,
      [bone]: {
        seated: true,
        since: sense.seconds,
        bearing: input.seat.bearing,
        flat: 1,
        load: input.seat.load,
        entry: input.seat.entry,
        relief: sense.spread(bone),
        anchor: sense.latch(sense.limb(bone)),
      },
    };
    state.steps = physicalRecoverySwing.resolve(state.steps, bone, {
      seconds: sense.seconds,
      status: "landed",
    });
    input.trace?.push({
      kind: "landed",
      seconds: sense.seconds,
      bone,
      early: input.early,
      position: { ...position },
    });
  }
}
