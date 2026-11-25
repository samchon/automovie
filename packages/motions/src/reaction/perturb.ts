import {
  Vector3,
  resolveAutoMovieBalanceOutcome,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanForce,
  IAutoMovieMotionHumanImpulse,
  IAutoMovieMotionHumanLean,
  IAutoMovieMotionHumanPerturb,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStagger,
  IAutoMovieMotionTarget,
  IAutoMovieResolveBalanceOutcome,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanForceResponse } from "../grappling/HumanForceResponse";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { StrikingStance } from "../striking/StrikingStance";
import { StrikingTarget } from "../striking/StrikingTarget";
import { collapse } from "./collapse";
import { knockdown } from "./knockdown";
import { stagger } from "./stagger";
import { staggerBounds } from "./staggerBounds";
import { staggerRecovery } from "./staggerRecovery";

/** The alternatives of `AbsorbPlantPart2`'s site. */
type AbsorbPlantPart2 = "leftFoot" | "rightFoot";

/** The alternatives of `AbsorbPlantPart`'s site. */
type AbsorbPlantPart = "leftFoot" | "rightFoot";

/** The alternatives of `PlanChosen`'s site. */
type PlanChosen = "absorb" | "step" | "fall";

/** The alternatives of `PlanAsked`'s site. */
type PlanAsked = "auto" | "absorb" | "step" | "fall";

/** The alternatives of `PlanSuffix`'s site. */
type PlanSuffix = "Left" | "Right";

/**
 * One perturbation law whose response follows from the forces on its performer:
 * the body absorbs an impulse within its base, catches it with capture steps,
 * or falls, as the engine's balance outcome decides from the impulse, the
 * body's mass and its support (`resolveAutoMovieBalanceOutcome`), or as the
 * author fixes the outcome.
 *
 * The impulse is the sum of the impulses on the performer
 * (`IHumanActionContext.forces`) from one pendulum time constant `1 / ω0`
 * before the action's start, the span within which the body has not yet moved
 * by more than its own response, to the start. Its outcome:
 *
 * - **absorb**: the hips travel along the push and come back over the feet as a
 *   critically damped pendulum at the body's own frequency, `x(t) = v t exp(-ω0
 *   t)` with `v` the centre's speed after the impulse, its peak `v / (e ω0)` at
 *   `t = 1 / ω0`; the feet stay planted.
 * - **step**: `stagger`'s capture step at the centre's speed after the impulse,
 *   from the side the impulse comes from (Hof, Gazendam and Sinke 2005; the
 *   step's landing from Maki and McIlroy 1997, as `stagger` cites).
 * - **fall**: the way the impulse pushes in the body's frame: a push from behind
 *   a forward `collapse`, one from a side a sideways `collapse` away from it,
 *   and one from ahead the `knockdown`, from the side it comes from.
 *
 * An author's outcome the impulse cannot produce is refused with the impulse
 * range that would produce it, never clamped; with no impulse on the performer
 * the outcome is an absorb of nothing, a still stance.
 *
 * First pass: the step outcome lays one capture step, `stagger`'s; the engine's
 * outcome may ask for more, which this law refuses naming the fall instead
 * until the multi-step plan lands (A folds `stagger` into this law's step). The
 * absorb shows no trunk motion beyond the hips' travel; the ankle and hip
 * strategies (Horak and Nashner 1986) are not yet split.
 */
export namespace perturb {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "perturb";

  /**
   * A perturbation's content is the body's physical answer to a force (a shove,
   * a pull, a throw), so its balance is judged
   * (`IAutoMovieMotionHumanActionLaw.physical`).
   */
  export const physical: boolean = true;

  /**
   * Cancel table: a perturbation flows into a guard or a knockdown, as a
   * stagger does.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      guard: ["fromStroke", "smooth"],
      knockdown: ["anytime", "quick"],
    });

  /**
   * A reaction interrupts whatever the body was doing, at any instant, as a
   * reflex.
   */
  export const accepts: IAutoMovieMotionHumanActionLaw["accepts"] = {
    any: [AutoMovieMotionHumanInterrupt.row("anytime", "reflex")],
  };

  /**
   * The recovery step's swing time for a push: `stagger`'s step time for a step
   * forward when the push lies within 45 degrees of the heading, backward when
   * within 45 degrees of behind, and to the side otherwise; a push of no level
   * size steps forward.
   *
   * @param impulse The push's impulse, N s.
   * @param yaw The body's heading, degrees.
   * @returns The swing's seconds.
   */
  export function stepTime(impulse: IAutoMovieVector3, yaw: number): number {
    const facing: IAutoMovieVector3 = {
      x: Math.sin((yaw * Math.PI) / 180),
      y: 0,
      z: Math.cos((yaw * Math.PI) / 180),
    };
    const pushedAt: number = Math.hypot(impulse.x, impulse.z);
    const ahead: number =
      pushedAt > 0
        ? (impulse.x * facing.x + impulse.z * facing.z) / pushedAt
        : 1;
    return staggerBounds.STEP_TIME[
      ahead >= Math.SQRT1_2
        ? "forward"
        : ahead <= -Math.SQRT1_2
          ? "backward"
          : "side"
    ];
  }
  /**
   * Plan a perturbation.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the author's outcome is not what the impulse
   *   can produce, or the impulse needs more than one capture step.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPerturb.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const entry: IAutoMovieMotionHumanEntryState = context.entry;
    const model: IAutoMovieResolveCenterOfMass.IModel = body.massModel;
    const length: number = resolveAutoMovieCenterOfMass.pendulum(
      body.measure.hipHeight,
    );
    const w0: number = resolveAutoMovieCenterOfMass.frequency(length);

    // The impulses within one pendulum time constant before the start.
    const impulses: IAutoMovieMotionHumanImpulse[] = (
      context.forces?.(-1 / w0, 0) ?? []
    ).filter(
      (f: IAutoMovieMotionHumanForce): f is IAutoMovieMotionHumanImpulse =>
        f.kind === "impulse",
    );
    const impulse: IAutoMovieVector3 = impulses.reduce(
      (
        sum: IAutoMovieVector3,
        f: IAutoMovieMotionHumanImpulse,
      ): IAutoMovieVector3 => Vector3.add(sum, f.impulse),
      { x: 0, y: 0, z: 0 },
    );
    const requestedBones: Set<AutoMovieHumanoidBone> = new Set(
      HumanColliders.bones(body),
    );

    // Prepare both sides' fixed socket demand without observing planted
    // state before the original pose admission and centre measurement.
    for (const side of ["left", "right"] as const) {
      const suffix: PlanSuffix = side === "left" ? "Left" : "Right";
      for (const socket of ["heel", "ball", "toe"] as const)
        requestedBones.add(body.surfaces.sockets[`${socket}${suffix}`].bone);
    }
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      entry.pose,
      undefined,
      requestedBones,
    );
    const centre: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
      model,
      bones,
    );
    const planted: AutoMovieHumanSide[] = (["left", "right"] as const).filter(
      (side: AutoMovieHumanSide): boolean => entry.feet[side].planted,
    );
    const bearing: readonly AutoMovieHumanSide[] =
      planted.length === 0 ? ["left", "right"] : planted;
    const support: IAutoMovieVector3[] = HumanFoot.base(body, bones, bearing);
    // The steps' times are `stagger`'s: each later one after the swing of a
    // recovery step in the push's direction from the heading, the first at
    // the landing of the step `stagger` itself takes, read from its plan.
    const swing: number = stepTime(impulse, entry.posture.yaw);

    const decide: (
      first: number,
    ) => IAutoMovieResolveBalanceOutcome.IOutcome = (
      first: number,
    ): IAutoMovieResolveBalanceOutcome.IOutcome =>
      resolveAutoMovieBalanceOutcome({
        centre,
        velocity: entry.velocity.linear,
        mass: model.mass,
        impulse,
        length,
        support,
        reach: body.measure.thigh + body.measure.shank,
        margin: body.measure.footLength / 2,
        step: swing,
        first,
      });

    // The absorb's bound and the velocity after the impulse do not depend on
    // the step's landing; past the absorb, the landing is the one `stagger`
    // lays for this push, and a push it cannot catch is a fall.
    const balanced: IAutoMovieResolveBalanceOutcome.IOutcome = decide(
      AutoMovieMotionHumanTiming.seconds(stagger.LANDING),
    );
    const magnitude: number = Math.hypot(impulse.x, impulse.z);
    const speed: number = Math.hypot(balanced.velocity.x, balanced.velocity.z);
    const push: IAutoMovieVector3 =
      magnitude > 0
        ? { x: impulse.x / magnitude, y: 0, z: impulse.z / magnitude }
        : { x: 0, y: 0, z: 0 };
    // The side the impulse comes from: a point behind the push.
    const from: IAutoMovieMotionTarget = {
      kind: "point",
      at: Vector3.subtract(entry.posture.root, push),
      frame: "world",
    };
    // Past the absorb, the stagger's own admission decides whether its
    // recovery steps catch this push (`staggerRecovery`); a push they do not
    // catch is a fall, and any other refusal of the stagger is this law's.
    const staggered: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStagger.IParams> =
      {
        ...context,
        params: { target: from, speed: Math.max(speed, Number.MIN_VALUE) },
      };
    const admitted: staggerRecovery.IAdmitted | null =
      balanced.outcome === "absorb" ? null : staggerRecovery(staggered);
    const caught: IAutoMovieMotionHumanActionPlan | null =
      admitted === null || admitted.recovery === null
        ? null
        : stagger.recovered(staggered, admitted.recovery, admitted.fixed);
    const landing: IAutoMovieMotionEvent | undefined = caught?.events.find(
      (e: IAutoMovieMotionEvent): boolean => e.name === "caught",
    );
    const outcome: IAutoMovieResolveBalanceOutcome.IOutcome =
      balanced.outcome === "absorb"
        ? balanced
        : caught === null || landing === undefined
          ? { ...balanced, outcome: "fall" }
          : decide(landing.share * caught.duration);
    const requested: NonNullable<
      IAutoMovieMotionHumanPerturb.IParams["outcome"]
    > = context.params.outcome ?? "auto";

    // The two-body outcomes are the two-body response's, which
    // answers them before this law plans its own.
    if (
      requested === "resist" ||
      requested === "yield" ||
      requested === "thrown"
    )
      return HumanForceResponse.plan(context, requested, outcome);
    const asked: PlanAsked = requested;
    const chosen: PlanChosen = asked === "auto" ? outcome.outcome : asked;
    if (asked !== "auto" && asked !== outcome.outcome)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "outcome",
        value: asked,
        feasible: {
          kind: "range",
          minimum:
            asked === "absorb"
              ? 0
              : asked === "step"
                ? outcome.bounds.absorb
                : outcome.bounds.step,
          maximum:
            asked === "absorb"
              ? outcome.bounds.absorb
              : asked === "step"
                ? outcome.bounds.step
                : null,
          unit: "N s",
        },
        reason: `an impulse of ${magnitude.toFixed(1)} N s on ${model.mass.toFixed(1)} kg ends in ${outcome.outcome}, not ${asked}`,
        fix: `give an impulse in the feasible range, or the outcome ${outcome.outcome}`,
      });

    if (chosen === "step") {
      if (outcome.steps.length > 1)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "outcome",
          value: "step",
          feasible: null,
          reason: `the impulse needs ${outcome.steps.length} capture steps; this first pass lays one`,
          fix: "give a smaller impulse, or the outcome fall",
        });
      return caught!;
    }
    // A fall goes the way the push goes in the body's frame: a push from
    // behind pitches it forward, one from the side topples it to the other
    // side, and one from ahead knocks it down backward as before.
    if (chosen === "fall") {
      const local: IAutoMovieVector3 = HumanFrame.local(
        { origin: { x: 0, y: 0, z: 0 }, yaw: entry.posture.yaw },
        push,
      );
      if (local.z >= -Math.abs(local.x) && Math.hypot(local.x, local.z) > 0)
        return collapse.plan({
          ...context,
          params: {
            direction: local.z >= Math.abs(local.x) ? "forward" : "sideways",
            side: local.x >= 0 ? "left" : "right",
            target: from,
          },
        });
      return knockdown.plan({ ...context, params: { target: from } });
    }
    return absorb(context, outcome, push);
  }

  /**
   * The absorb: the hips carried along the push and back over the feet by the
   * critically damped pendulum at the body's frequency, the feet planted.
   *
   * @param context The action's context.
   * @param outcome The engine's outcome, for the centre's velocity after the
   *   impulse.
   * @param push The push's horizontal direction, world.
   * @returns The plan.
   */
  function absorb(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPerturb.IParams>,
    outcome: IAutoMovieResolveBalanceOutcome.IOutcome,
    push: IAutoMovieVector3,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const w0: number = resolveAutoMovieCenterOfMass.frequency(
      resolveAutoMovieCenterOfMass.pendulum(body.measure.hipHeight),
    );
    const speed: number = Vector3.dot(outcome.velocity, push);

    // Settled to within e^-4 (under 2 %) of the peak: x(t) / x(1 / ω0) =
    // τ e^(1 - τ) at τ = ω0 t, which falls to e^-4 where τ - ln τ = 5.
    const duration: number = SETTLED / w0;
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock(duration, [
      { name: "peak", seconds: 1 / w0 },
    ]);
    const local: IAutoMovieVector3 = HumanFrame.local(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
      push,
    );
    const feet: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    > = StrikingTarget.feet(context.entry);
    const legsAt: ReturnType<typeof StrikingStance.prepareLegs> =
      StrikingStance.prepareLegs(body, feet);
    const composed: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base: AutoMovieMotionHumanBase.still(duration, {
          root: entry.root,
          yaw: entry.yaw,
          pitch: entry.pitch,
          roll: entry.roll,
          joints: entry.joints,
          limbs: {},
        }),
        clock,
        primitives: [
          AutoMovieMotionHumanLean.sway({
            body,
            from: 0,
            to: duration,
            angles: (): IAutoMovieMotionHumanLean.IAngles => ({
              pitch: 0,
              roll: 0,
            }),
            shift: (seconds: number): IAutoMovieVector3 =>
              Vector3.scale(local, speed * seconds * Math.exp(-w0 * seconds)),
            legs: legsAt,
          }),

          // The sway reads the legs for the hips' height only; the legs stand
          // on the entry's feet through their own channels.
          {
            channels: ["leftLeg", "rightLeg"],
            from: 0,
            to: duration,
            write: (
              posture: IAutoMovieMotionHumanPosture,
            ): IAutoMovieMotionHumanPosture => ({
              ...posture,
              limbs: { ...posture.limbs, ...legsAt() },
            }),
          },
        ],
      });

    // Both feet stay planted through the absorb.
    const plant: (
      part: AbsorbPlantPart,
    ) => IAutoMovieMotionHumanContactWindow = (
      part: AbsorbPlantPart2,
    ): IAutoMovieMotionHumanContactWindow => ({
      part,
      kind: "plant",
      from: 0,
      to: 1,
      support: { kind: "ground" },
    });
    return {
      ...composed,
      contacts: [plant("leftFoot"), plant("rightFoot")],
      physicalWindow: speed === 0 ? null : { from: 0, to: duration },
    };
  }

  /**
   * The absorb's settling time in pendulum time constants: the root of τ - ln τ
   * = 5 past the peak at τ = 1, where the critically damped travel τ e^(1 - τ)
   * of the peak has fallen to e^-4. Newton's method on the convex g(τ) = τ - ln
   * τ - 5 from τ = 7, right of the root, decreases monotonically onto it; eight
   * steps reach the double's precision.
   */
  const SETTLED: number = ((): number => {
    let tau: number = 7;
    for (let i: number = 0; i < 8; i++)
      tau -= (tau - Math.log(tau) - 5) / (1 - 1 / tau);
    return tau;
  })();
}
