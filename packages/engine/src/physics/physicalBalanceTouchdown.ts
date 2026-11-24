import type {
  IAutoMoviePhysicalRecoveryState,
  IAutoMovieStepPlanner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import type { IAutoMoviePhysicalBalanceTrace } from "./IAutoMoviePhysicalBalanceTrace";
import type { physicalBalanceSense } from "./physicalBalanceSense";
import { physicalRecoverySwing } from "./physicalRecoverySwing";
import { physicalStanceBalance } from "./physicalStanceBalance";

/**
 * The balance controller's touchdown phase (`advancePhysicalBalance`): whether
 * each lifted swing foot lands, touches down early or times out.
 *
 * Landing is the contact event: the swinging limb lands when it bears on the
 * floor, at foot-strike or past the swing's end, whichever comes first (Coros,
 * Beaudoin and van de Panne 2010, Section 3.1; Yin, Loken and van de Panne
 * 2007, Section 3.1). A contact counts only after the minimum phase, so a scuff
 * early in the swing neither lands nor restarts it (Stephens 2011, Figure 4.6);
 * the limb lands where it bears. Before it, a lifted swing foot the floor
 * carries on two successive substeps, an aborted lift or an early touchdown,
 * joins the support again and the step is planned again
 * (`physicalStanceBalance.touchdown`), but only once it has cleared the floor
 * since its lift-off, no point of it left within the contact skin: until then
 * its load is the floor it never left, and a null step would land where it
 * stood (design-4017-verdicts, C17). Each foot of a diagonal pair lands by its
 * own contact, its own clearance and touchdown kept on the pair's record as the
 * swing's are on the state; the partner is taken first, so the swing's landing
 * can leave it the swing (Chen et al. 2022, Section 2.1, Example 1). A landing
 * past `landingTimeout` after the swing's end fails, and the failure withdraws
 * the support rather than inventing a success.
 *
 * @param input The recovery's state, the body's readings and the trace to
 *   record into, if any.
 * @returns The state after the touchdown, a new one; the input is never
 *   written.
 */
export function physicalBalanceTouchdown(input: {
  state: Readonly<IAutoMoviePhysicalRecoveryState>;
  sense: physicalBalanceSense.ISense;
  trace?: IAutoMoviePhysicalBalanceTrace[];
}): IAutoMoviePhysicalRecoveryState {
  const { sense } = input;

  // The phase's own copies: the state and the pair's record, whose clearance
  // and touchdown it writes.
  const state: IAutoMoviePhysicalRecoveryState = { ...input.state };
  if (state.pair) state.pair = { ...state.pair };
  for (const { step: swing, flags } of [
    ...(state.swing && state.pair
      ? [{ step: state.pair.step, flags: state.pair }]
      : []),
    ...(state.swing ? [{ step: state.swing, flags: state }] : []),
  ] as {
    step: IAutoMovieStepPlanner.IStep;
    flags: { cleared?: boolean; touchdown?: number };
  }[]) {
    if (!state.seating?.[swing.bone] && !sense.grounded(sense.limb(swing.bone)))
      flags.cleared = true;
    let early: boolean = false;
    if (
      !state.seating?.[swing.bone] &&
      sense.seconds - swing.start <
        physicalBalanceTouchdown.MINIMUM_PHASE * (swing.end - swing.start)
    ) {
      const touch: { since?: number; landed: boolean } =
        physicalStanceBalance.touchdown({
          load: sense.load(swing.bone),
          weight: sense.weight,
          cleared: flags.cleared === true,
          // Coming down: the foot's endpoint not rising (Stephens 2011,
          // Figure 4.6: a scuff while it rises is not a touchdown).
          descending:
            sense.segments
              .get(swing.bone)!
              .velocityAtPoint(sense.actual(swing.bone)).y <= 0,
          since: flags.touchdown,
          seconds: sense.seconds,
          dt: sense.dt,
        });
      if (touch.since === undefined) delete flags.touchdown;
      else flags.touchdown = touch.since;
      early = touch.landed;
    } else delete flags.touchdown;
    if (
      !early &&
      sense.seconds - swing.start <
        physicalBalanceTouchdown.MINIMUM_PHASE * (swing.end - swing.start)
    )
      continue;
    const bone: string = swing.bone;
    if (
      !state.failedLanding &&
      sense.supports.some(
        (support: (typeof sense.supports)[number]): boolean =>
          support.bone === bone && support.loaded,
      )
    ) {
      // The landed foot is seated with its outline at once, its contact
      // added with zero error at the pose it landed in; only its share of
      // the support ramps in (Feng et al. 2013, Section II-E; Herzog et al.
      // 2016, Section 5.3).
      physicalBalanceTouchdown.land({
        state,
        sense,
        bone,
        early,
        seat: { bearing: 0, load: 0, entry: 0 },
        ...(input.trace ? { trace: input.trace } : {}),
      });

      // The first foot of a pair to land leaves the other the swing.
      if (swing === state.pair?.step) delete state.pair;
      else if (state.pair) {
        state.swing = state.pair.step;
        if (state.pair.cleared === undefined) delete state.cleared;
        else state.cleared = state.pair.cleared;
        if (state.pair.touchdown === undefined) delete state.touchdown;
        else state.touchdown = state.pair.touchdown;
        delete state.pair;
      } else {
        delete state.cleared;
        state.swing = undefined;
      }
      state.outsideSince = undefined;
      state.revision = (state.revision ?? 0) + 1;
    } else if (physicalBalanceTouchdown.overdue(swing, sense)) {
      physicalBalanceTouchdown.fail({
        state,
        sense,
        ...(input.trace ? { trace: input.trace } : {}),
      });
      break;
    }
  }
  return state;
}

/** The touchdown phase's constants, its landing and its failure. */
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
   * resolved as failed, the swing and a pair's partner ended, and the failure
   * recorded.
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
    delete state.cleared;
    delete state.pair;
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
   *   whether it landed before its swing's minimum phase, the seat's initial
   *   bearing, load and entry shares, and the trace to record into, if any.
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

  /**
   * The share of a swing before which a contact is not a landing but, held on
   * two successive substeps, an early touchdown that joins the support and has
   * the step planned again (`physicalStanceBalance.touchdown`). A minimum-jerk
   * transfer moves fastest at mid-swing, so a foot accepted there strikes at
   * speed (Feng et al. 2015, Section III-A4); the clearance holds until the
   * last quarter, past which the foot is coming down (stated).
   */
  export const MINIMUM_PHASE: number = 0.8;
}
