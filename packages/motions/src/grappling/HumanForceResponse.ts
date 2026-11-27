import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanForce,
  IAutoMovieMotionHumanForceResponse,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSustainedForce,
  IAutoMovieResolveBalanceOutcome,
} from "@automovie/interface";

import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { humanForceRespond } from "./internal/humanForceRespond";

/**
 * A partner's response to a pull through grips, the outcomes of `perturb` a
 * sustained force decides: `resist`, `yield` and `thrown`.
 *
 * The pull is the horizontal sum of the sustained forces on the performer open
 * at the action's start (`IHumanActionContext.forces`), lasting until the first
 * of them ends; when none is open at the start, the first to open within the
 * action is answered from its onset, the body standing until then, as a pull
 * through grips begins only once they close (the grip, kumikata, comes before
 * kuzushi, tsukuri and kake: Kano, Kodokan Judo, Kodansha 1986). Its mechanics
 * are `HumanForceExchange`'s:
 *
 * - **resist**: the body leans away from the pull about the ankles until its
 *   centre has moved back by the moment balance's shift, over the body's own
 *   time constant `1 / ω` on a minimum-jerk profile, and holds for the pull. A
 *   pull whose shift passes the base behind is refused with the force range
 *   that can be resisted.
 * - **yield**: the body tips along the pull about the ankles as its centre
 *   travels by the linear inverted pendulum under the pull, until its
 *   extrapolated centre leaves the base (`kuzushi`, the plan's end). A pull
 *   that ends first is refused with the force that breaks the base within it.
 * - **thrown**: the yield to `kuzushi`, then the body, frozen in that pose, turns
 *   about the thrower's fulcrum (`fulcrum`, a region of `by`) by the swing's
 *   law from the momentum the pull left, leaves it at `release` where its
 *   centre comes level with the fulcrum, and flies, its centre on the parabola
 *   from the release and its orientation from the conserved angular momentum
 *   (`AutoMovieEngineMotionAirborneRotation`), until its lowest joint reaches the floor
 *   (`land`). A throw with no fulcrum, or whose swing stops before the
 *   vertical, is refused. The composition cuts into the fall or the breakfall
 *   at `land`.
 *
 * The centre moves as standing balance moves it with the feet side by side
 * (Winter 1995): along the facing by the whole body's tip about the ankles,
 * across it by the pelvis carried sideways over the planted legs.
 *
 * First pass: the grip sites are not held to the puller's hands by a root solve
 * while the body tips, and the body is rigid through the swing and the flight.
 */
export namespace HumanForceResponse {
  /**
   * Plan the response.
   *
   * @param context The action's context, `perturb`'s.
   * @param chosen The author's outcome.
   * @param outcome The engine's balance outcome of the impulses at the start,
   *   which `perturb` computed.
   * @returns The plan.
   * @throws {HumanRefusal} A `parameter` refusal on `outcome` when an impulse
   *   at the start already fells the body that is asked to resist, when no pull
   *   acts at the start, when a resisted pull passes the base, or when the pull
   *   ends before the base breaks, each with its feasible force; a
   *   `participant` refusal on `fulcrum` for a throw with no thrower, fulcrum
   *   or placed thrower posture; a `parameter` refusal on `outcome` when the
   *   swing stops before the vertical.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanForceResponse.IParams>,
    chosen: IAutoMovieMotionHumanForceResponse.Outcome,
    outcome: IAutoMovieResolveBalanceOutcome.IOutcome,
  ): IAutoMovieMotionHumanActionPlan {
    // A pull that opens after the start, as one through grips that close
    // after it does, is answered from its onset: the body stands until then.
    const sustained = (
      f: IAutoMovieMotionHumanForce,
    ): f is IAutoMovieMotionHumanSustainedForce => f.kind === "sustained";
    const onset: number = (context.forces?.(0, 0) ?? []).some(sustained)
      ? 0
      : Math.min(
          Number.POSITIVE_INFINITY,
          ...(context.forces?.(0, Number.POSITIVE_INFINITY) ?? [])
            .filter(sustained)
            .map(
              (f: IAutoMovieMotionHumanSustainedForce): number =>
                f.from - context.start,
            ),
        );
    if (!(onset > 0 && onset < Infinity))
      return humanForceRespond(context, chosen, outcome);
    const answer: IAutoMovieMotionHumanActionPlan = humanForceRespond(
      {
        ...context,
        start: context.start + onset,
        forces: (
          from: number,
          to: number,
        ): readonly IAutoMovieMotionHumanForce[] =>
          context.forces!(from + onset, to + onset),
      },
      chosen,
      outcome,
    );
    const standing: IAutoMovieMotionHumanActionPlan =
      AutoMovieMotionHumanBase.under(context, onset);
    const duration: number = onset + answer.duration;
    const later = (share: number): number =>
      (onset + share * answer.duration) / duration;
    return {
      ...answer,
      duration,
      physicalWindow:
        answer.physicalWindow === null
          ? null
          : {
              from: onset + (answer.physicalWindow?.from ?? 0),
              to: onset + (answer.physicalWindow?.to ?? answer.duration),
            },
      events: answer.events.map(
        (e: IAutoMovieMotionEvent): IAutoMovieMotionEvent => ({
          ...e,
          share: later(e.share),
        }),
      ),
      contacts: answer.contacts.map(
        (
          w: IAutoMovieMotionHumanContactWindow,
        ): IAutoMovieMotionHumanContactWindow => ({
          ...w,
          // A contact the answer holds from its start is held while the body stands.
          from: w.from === 0 ? 0 : later(w.from),
          to: later(w.to),
        }),
      ),
      ...(answer.still === undefined
        ? {}
        : {
            still: [answer.still[0] + onset, answer.still[1] + onset] as const,
          }),
      ...(answer.legsStill === undefined
        ? {}
        : {
            legsStill: [
              answer.legsStill[0] + onset,
              answer.legsStill[1] + onset,
            ] as const,
          }),
      posture: (
        seconds: number,
        channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture =>
        seconds < onset
          ? standing.posture(seconds, channels, resolution, projection)
          : answer.posture(seconds - onset, channels, resolution, projection),
    };
  }
}
