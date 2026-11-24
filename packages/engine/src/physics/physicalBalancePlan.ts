import type {
  IAutoMoviePhysicalBalance,
  IAutoMoviePhysicalRecoveryState,
  IAutoMovieStepPlanner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMoviePhysicalBalance as Balance } from "./AutoMoviePhysicalBalance";
import type { IAutoMoviePhysicalBalanceTrace } from "./IAutoMoviePhysicalBalanceTrace";
import type { physicalBalanceSense } from "./physicalBalanceSense";
import type { physicalBalanceStance } from "./physicalBalanceStance";
import { physicalCaptureBand } from "./physicalCaptureBand";
import { physicalRecoverySwing } from "./physicalRecoverySwing";
import { physicalStanceBalance } from "./physicalStanceBalance";

/**
 * The balance controller's plan phase (`advancePhysicalBalance`): the stance's
 * assessment, the decision whether a step is due, and the step's request,
 * planned again each frame until its limb lifts.
 *
 * - A step is due once the capture point is past the support itself by more
 *   than the margin and the hip strategy's reach toward it, and not shrinking
 *   against the previous step's measured excess (`physicalStanceBalance`
 *   `.exceeds`, `hip`, `hipReach`; Koolen et al., Corollary 3; Stephens 2011,
 *   Table 4.1: ankle, then hip, then step; design-4017-edge, E3). The reach
 *   is taken with the trunk's angle left, so a trunk that has spent its range
 *   leaves the support's edge alone. A capture point parked past the shrunken
 *   support, neither captured nor past the support itself, steps once it has
 *   not shrunk over 1 / omega and the step it would take captures
 *   (`physicalCaptureBand`); so does a trunk tilting past its range
 *   (`physicalBalanceStance`).
 * - The capture point must stay outside for `DWELL`, after any landed foot is
 *   in, so one step's excursion does not start a swing; while a landed foot
 *   ramps in, the excursion is the landing's transient and is not counted.
 * - A request is planned again each frame until its limb lifts: its place and
 *   time follow the capture point, it moves to another limb only when that
 *   one's step captures and its own does not and its own has not begun
 *   unloading (`Balance.retarget`), and it is withdrawn once the capture point
 *   is back inside (Feng et al. 2015, Figure 2: lift-off delayed, double
 *   support kept). A diagonal pair is planned again as that pair, and kept as
 *   it is while its feet unload when the best step is another.
 *
 * @param input The recovery's state after the lift phase, the body's readings,
 *   the stance read from that state and the trace to record into, if any.
 * @returns The state after the plan, a new one; the goals that hold a request
 *   not yet lifted where its limbs stand; and the assessment. The input is
 *   never written.
 */
export function physicalBalancePlan(input: {
  state: Readonly<IAutoMoviePhysicalRecoveryState>;
  sense: physicalBalanceSense.ISense;
  stance: physicalBalanceStance.IStance;
  trace?: IAutoMoviePhysicalBalanceTrace[];
}): physicalBalancePlan.IResult {
  const { sense, stance } = input;
  const state: IAutoMoviePhysicalRecoveryState = { ...input.state };

  // A limb asked to step stays a candidate until it lifts, so its request is
  // planned again each frame; a lifted one is no longer support.
  const assessment: IAutoMoviePhysicalBalance.IResult = stance.ask(
    stance.planted,
    [...(sense.unavailable ?? []), ...stance.lifted],
    stance.tipping,
    stance.timing,
  );
  const standing: physicalBalanceSense.ILimb[] = sense.limbs.filter(
    (limb: physicalBalanceSense.ILimb): boolean =>
      !stance.lifted.includes(limb.bone),
  );
  const past: boolean =
    assessment.state !== "supported" &&
    physicalStanceBalance.exceeds({
      support: assessment.polygon,
      capture: assessment.capturePoint,
      spin: stance.spin,
      margin: sense.policy.margin,
      reach: (direction: IAutoMovieVector3): number => {
        const strategy = physicalStanceBalance.hip({
          profile: sense.profile,
          segments: sense.segments,
          limbs: sense.limbs,
          stance: standing,
          direction,
          intended: sense.targets[sense.root.segment.bone]!.rotation,
        });
        return strategy
          ? physicalStanceBalance.hipReach({
              ...strategy,
              mass: sense.profile.mass,
              gravity: sense.gravity,
              omega: stance.omega,
            })
          : 0;
      },
      ...(state.excess !== undefined ? { previous: state.excess } : {}),
    });
  if (Number.isFinite(assessment.outside)) state.excess = assessment.outside;
  else delete state.excess;
  const band: ReturnType<typeof physicalCaptureBand> = state.swing
    ? { due: false }
    : physicalCaptureBand({
        ...(state.band ? { band: state.band } : {}),
        excess:
          assessment.beyond !== undefined && Number.isFinite(assessment.beyond)
            ? assessment.beyond
            : 0,
        margin: sense.policy.margin,
        seconds: sense.seconds,
        omega: stance.omega,
        viable: assessment.step?.viable === true,
      });
  if (band.band) state.band = band.band;
  else delete state.band;
  const holding: boolean =
    assessment.state === "supported" ||
    (state.outsideSince === undefined && !stance.tipping && !past && !band.due);
  if (holding && !state.swing) state.failedLanding = undefined;
  state.last = state.failedLanding
    ? "unrecoverable"
    : state.swing
      ? "recovery"
      : holding
        ? "supported"
        : assessment.state;
  if (holding || stance.landing !== undefined) state.outsideSince = undefined;
  else state.outsideSince ??= sense.seconds;

  // Ask for a step: the swing request of its limb, and of a diagonal pair's
  // partner, each from where the limb's endpoint stands now, timed from now
  // over the step's time, aimed at its target less the planted footprint's
  // middle's offset from the endpoint. Its start keeps moving while the
  // limbs unload; each is recorded at lift-off (`physicalBalanceLift`).
  const request = (
    step: NonNullable<IAutoMoviePhysicalBalance.IResult["step"]>,
  ): void => {
    const plan = (
      bone: string,
      target: IAutoMovieVector3,
    ): IAutoMovieStepPlanner.IStep => {
      const from: IAutoMovieVector3 = sense.actual(bone);
      const shift: IAutoMovieVector3 = sense.inset(bone, state.offsets);
      return {
        bone,
        kind: "swing",
        start: sense.seconds,
        end: sense.seconds + (step.seconds ?? sense.policy.duration),
        from: { point: [from.x, from.z], yaw: 0, pitch: 0, clearance: 0 },
        to: {
          point: [target.x - shift.x, target.z - shift.z],
          yaw: 0,
          pitch: 0,
          clearance: 0,
        },
      };
    };
    state.swing = plan(step.bone, step.target);
    if (step.pair)
      state.pair = { step: plan(step.pair.bone, step.pair.target) };
    else delete state.pair;
  };

  // Time a request not yet lifted from now again, a pair's both steps alike.
  const retime = (): void => {
    state.swing = physicalRecoverySwing.retime(state.swing!, sense.seconds);
    if (state.pair)
      state.pair = {
        ...state.pair,
        step: physicalRecoverySwing.retime(state.pair.step, sense.seconds),
      };
  };

  const retry: boolean =
    !!sense.policy.bracing &&
    sense.center.y - sense.floor >= sense.policy.bracing.minimumCenterHeight;
  if (
    (!state.failedLanding || retry) &&
    !state.swing &&
    assessment.step &&
    physicalStanceBalance.ready({
      ...(stance.landing !== undefined ? { landing: stance.landing } : {}),
      outside: state.outsideSince,
      seconds: sense.seconds,
    }) &&
    sense.seconds - state.outsideSince! >= (sense.policy.reactionSeconds ?? 0)
  ) {
    request(assessment.step);
    input.trace?.push({
      kind: "trigger",
      seconds: sense.seconds,
      bone: assessment.step.bone,
      ...(assessment.step.pair ? { pair: assessment.step.pair.bone } : {}),
      capture: { x: assessment.capturePoint.x, z: assessment.capturePoint.z },
      ...(assessment.beyond !== undefined ? { beyond: assessment.beyond } : {}),
      ...(state.outsideSince !== undefined
        ? { since: state.outsideSince }
        : {}),
      target: { x: assessment.step.target.x, z: assessment.step.target.z },
      ...(assessment.step.seconds !== undefined
        ? { duration: assessment.step.seconds }
        : {}),
      viable: assessment.step.viable === true,
      tipping: stance.tipping,
      ...(stance.command ? { pressure: { ...stance.command } } : {}),
    });
    state.failedLanding = undefined;
    state.revision = (state.revision ?? 0) + 1;
  } else if (state.swing && stance.lifted.length === 0) {
    const bone: string = state.swing.bone;
    const partner: string | undefined = state.pair?.step.bone;
    const same = (
      step: NonNullable<IAutoMoviePhysicalBalance.IResult["step"]>,
    ): boolean => step.bone === bone && step.pair?.bone === partner;
    if (assessment.state === "supported") {
      input.trace?.push({ kind: "withdraw", seconds: sense.seconds, bone });
      state.swing = undefined;
      delete state.pair;
      state.revision = (state.revision ?? 0) + 1;
    } else if (!assessment.step) retime();
    else {
      const own: IAutoMoviePhysicalBalance.IResult["step"] = same(
        assessment.step,
      )
        ? assessment.step
        : partner === undefined
          ? stance.ask(
              stance.planted,
              [
                ...(sense.unavailable ?? []),
                ...sense.limbs
                  .map((limb: physicalBalanceSense.ILimb): string => limb.bone)
                  .filter((other: string): boolean => other !== bone),
              ],
              true,
              stance.timing,
            ).step
          : undefined;
      const chosen: IAutoMoviePhysicalBalance.IResult["step"] =
        Balance.retarget({
          unloading: physicalRecoverySwing(state).some(
            (step: IAutoMovieStepPlanner.IStep): boolean =>
              (state.seating?.[step.bone]?.bearing ?? 1) < 1,
          ),
          ...(own ? { own } : {}),
          best: assessment.step,
        });
      if (chosen === undefined) retime();
      else {
        if (!same(chosen)) {
          input.trace?.push({
            kind: "switch",
            seconds: sense.seconds,
            from: bone,
            to: chosen.bone,
            ...(chosen.pair ? { pair: chosen.pair.bone } : {}),
          });
          state.revision = (state.revision ?? 0) + 1;
        }
        request(chosen);
      }
    }
  }
  input.trace?.push({
    kind: "assess",
    seconds: sense.seconds,
    capture: { x: assessment.capturePoint.x, z: assessment.capturePoint.z },
    spin: { x: stance.spin.x, z: stance.spin.z },
    ...(assessment.beyond !== undefined ? { beyond: assessment.beyond } : {}),
    outside: assessment.outside,
    past,
    state: assessment.state,
    ...(state.outsideSince !== undefined ? { since: state.outsideSince } : {}),
    tipping: stance.tipping,
    tilt: stance.tilt,
    ...(stance.landing !== undefined ? { landing: stance.landing } : {}),
    ...(assessment.step
      ? {
          step: {
            bone: assessment.step.bone,
            viable: assessment.step.viable === true,
          },
        }
      : {}),
  });

  // A request not yet lifted holds its limbs where they stand.
  const goals: Record<string, IAutoMovieVector3> = Object.create(null);
  if (state.swing && stance.lifted.length === 0)
    for (const step of physicalRecoverySwing(state))
      goals[step.bone] = sense.actual(step.bone);
  return { state, goals, assessment };
}

/** What {@link physicalBalancePlan} decides. */
export namespace physicalBalancePlan {
  /** The plan's result. */
  export interface IResult {
    /** The state after the plan. */
    state: IAutoMoviePhysicalRecoveryState;
    /** The endpoint goals that hold a request not yet lifted, world metres, by bone. */
    goals: Record<string, IAutoMovieVector3>;
    /** The stance's assessment. */
    assessment: IAutoMoviePhysicalBalance.IResult;
  }
}
