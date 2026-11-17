import {
  type IAutoMovieResolvedBone,
  Vector3,
  resolveAutoMovieBalanceOutcome,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  AutoMovieMotionTarget,
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanForceResponse } from "../grappling/HumanForceResponse";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { IHumanEntryState } from "../law/IHumanEntryState";
import type { HumanForce } from "../perform/HumanForce";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { StrikingStance } from "../striking/StrikingStance";
import { StrikingTarget } from "../striking/StrikingTarget";
import { knockdown } from "./knockdown";
import { stagger } from "./stagger";
import { staggerBounds } from "./staggerBounds";

/**
 * One perturbation law whose response follows from the forces on its
 * performer (#3430): the body absorbs an impulse within its base, catches
 * it with capture steps, or falls, as the engine's balance outcome decides
 * from the impulse, the body's mass and its support
 * (`resolveAutoMovieBalanceOutcome`), or as the author fixes the outcome.
 *
 * The impulse is the sum of the impulses on the performer
 * (`IHumanActionContext.forces`) from one pendulum time constant `1 / ω0`
 * before the action's start, the span within which the body has not yet
 * moved by more than its own response, to the start. Its outcome:
 *
 * - **absorb**: the hips travel along the push and come back over the feet
 *   as a critically damped pendulum at the body's own frequency, `x(t) = v
 *   t exp(-ω0 t)` with `v` the centre's speed after the impulse, its peak
 *   `v / (e ω0)` at `t = 1 / ω0`; the feet stay planted.
 * - **step**: `stagger`'s capture step at the centre's speed after the
 *   impulse, from the side the impulse comes from (Hof, Gazendam and Sinke
 *   2005; the step's landing from Maki and McIlroy 1997, as `stagger`
 *   cites).
 * - **fall**: `knockdown` from the side the impulse comes from.
 *
 * An author's outcome the impulse cannot produce is refused with the
 * impulse range that would produce it, never clamped; with no impulse on
 * the performer the outcome is an absorb of nothing, a still stance.
 *
 * First pass: the step outcome lays one capture step, `stagger`'s; the
 * engine's outcome may ask for more, which this law refuses naming the fall
 * instead until the multi-step plan lands (A folds `stagger` into this
 * law's step). The absorb shows no trunk motion beyond the hips' travel;
 * the ankle and hip strategies (Horak and Nashner 1986) are not yet split.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which forces are read and over which span, each outcome's motion with its source, the refusal and the first pass's limits.
 * @evidence contracts/development/design.md#principled-representation A law record: name, cancel table, acceptance, parameters and a plan; the outcome is a closed union with `auto`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The outcome the author may fix and the plan; the balance mechanics are the engine's and the step and the fall are `stagger`'s and `knockdown`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No threshold of its own decides the outcome: the engine's capture bounds do.
 */
export namespace perturb {
  /** The action's name. */
  export const name: HumanActionName = "perturb";

  /** Cancel table: a perturbation flows into a guard or a knockdown, as a stagger does. */
  export const interrupts: IHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      guard: ["fromStroke", "smooth"],
      knockdown: ["anytime", "quick"],
    });

  /** A reaction interrupts whatever the body was doing, at any instant, as a reflex. */
  export const accepts: IHumanActionLaw["accepts"] = {
    any: [AutoMovieMotionHumanInterrupt.row("anytime", "reflex")],
  };

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the outcome's meaning and default.
   * @evidence contracts/development/design.md#principled-representation The outcome as a closed union, `auto` leaving it to the impulse.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The one value the plan reads besides the forces.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The impulse is not a parameter: it is the performance's force input.
   */
  export interface IParams {
    /** The outcome: decided by the impulse (`auto`), or fixed by the author and refused when the impulse cannot produce it; `auto` when absent. */
    outcome?:
      | "auto"
      | "absorb"
      | "step"
      | "fall"
      | "resist"
      | "yield"
      | "thrown";

    /** The thrower's subject, for a `thrown` outcome (#3439). */
    by?: string;

    /** The thrower's region the body turns over, for a `thrown` outcome (#3439). */
    fulcrum?: AutoMovieHumanoidRegion;

    /** The thrown body's region on the fulcrum, for a `thrown` outcome; the abdomen when absent (#3439). */
    on?: AutoMovieHumanoidRegion;
  }

  /**
   * Plan a perturbation.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the author's outcome is not what the impulse can produce, or the impulse needs more than one capture step.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The impulse changes the centre's velocity by `J / m`; the engine's balance outcome reads it against the planted feet's base, its first capture step landing when the step `stagger` lays for this push lands (a push `stagger` cannot catch is a fall); the absorb is the critically damped linear inverted pendulum at the body's own frequency, and the step and the fall are the shipped laws at the impulse's speed and side.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the impulse, decide the outcome, then plan one of three motions.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An outcome the impulse cannot give is refused with the feasible range; no impulse is scaled to fit.
   * @evidence contracts/development/implementation.md#efficient-algorithms Uses the body's prepared mass model and fixed profile/both-foot socket ancestry after complete entry admission. The actual centre is measured before planted-foot state is read. One base serves both outcome decisions and one stagger plan serves step. Absorb stays closed form and prepares fixed authored foot hints/contacts once; every current native fit remains and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Canonical body metadata fixes mass/profile/both-foot socket demand without observing entry feet early. After the original pose admission and centre read, actual bearing sides select the base shared by both decisions. Absorb's authored foot placements fix only knee/contact geometry and both callbacks receive fresh goals. Step/fall retain their shipped owners without pose or fit-answer reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Absorb owns fixed body/entry-foot geometry and its two-foot authored producer until plan release, issuing fresh independent goals per read without an FK/ROM loan or queried-pose history. Other outcomes retain their delegated plans' resource ownership; this function adds no global model/answer cache.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const entry: IHumanEntryState = context.entry;
    const model: resolveAutoMovieCenterOfMass.IModel =
      body.massModel;
    const length: number = resolveAutoMovieCenterOfMass.pendulum(
      body.measure.hipHeight,
    );
    const w0: number = resolveAutoMovieCenterOfMass.frequency(length);

    // The impulses within one pendulum time constant before the start.
    const impulses: HumanForce.IImpulse[] = (
      context.forces?.(-1 / w0, 0) ?? []
    ).filter(
      (f: HumanForce.IForce): f is HumanForce.IImpulse => f.kind === "impulse",
    );
    const impulse: IAutoMovieVector3 = impulses.reduce(
      (sum: IAutoMovieVector3, f: HumanForce.IImpulse): IAutoMovieVector3 =>
        Vector3.add(sum, f.impulse),
      { x: 0, y: 0, z: 0 },
    );
    const requestedBones: Set<AutoMovieHumanoidBone> = new Set(HumanColliders.bones(body));

    // Prepare both sides' fixed socket demand without observing planted
    // state before the original pose admission and centre measurement.
    for (const side of ["left", "right"] as const) {
      const suffix: "Left" | "Right" = side === "left" ? "Left" : "Right";
      for (const socket of ["heel", "ball", "toe"] as const)
        requestedBones.add(body.surfaces.sockets[`${socket}${suffix}`].bone);
    }
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      entry.pose,
      undefined,
      requestedBones,
    );
    const centre: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(model, bones);
    const planted: ("left" | "right")[] = (["left", "right"] as const).filter(
      (side: "left" | "right"): boolean => entry.feet[side].planted,
    );
    const bearing: readonly ("left" | "right")[] = planted.length === 0 ? ["left", "right"] : planted;
    const support: IAutoMovieVector3[] = HumanFoot.base(
      body,
      bones,
      bearing,
    );
    // The steps' times are `stagger`'s: each later one after the swing of a
    // recovery step in the push's direction from the heading, the first at
    // the landing of the step `stagger` itself takes, read from its plan.
    const facing: IAutoMovieVector3 = {
      x: Math.sin((entry.posture.yaw * Math.PI) / 180),
      y: 0,
      z: Math.cos((entry.posture.yaw * Math.PI) / 180),
    };
    const pushedAt: number = Math.hypot(impulse.x, impulse.z);
    const ahead: number =
      pushedAt > 0
        ? (impulse.x * facing.x + impulse.z * facing.z) / pushedAt
        : 1;
    const swing: number =
      staggerBounds.STEP_TIME[
        ahead >= Math.SQRT1_2
          ? "forward"
          : ahead <= -Math.SQRT1_2
            ? "backward"
            : "side"
      ];
    const decide: (first: number) => resolveAutoMovieBalanceOutcome.IOutcome = (first: number): resolveAutoMovieBalanceOutcome.IOutcome =>
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
    const balanced: resolveAutoMovieBalanceOutcome.IOutcome = decide(
      AutoMovieMotionHumanTiming.seconds(stagger.LANDING),
    );
    const magnitude: number = Math.hypot(impulse.x, impulse.z);
    const speed: number = Math.hypot(balanced.velocity.x, balanced.velocity.z);
    const push: IAutoMovieVector3 =
      magnitude > 0
        ? { x: impulse.x / magnitude, y: 0, z: impulse.z / magnitude }
        : { x: 0, y: 0, z: 0 };
    // The side the impulse comes from: a point behind the push.
    const from: AutoMovieMotionTarget = {
      kind: "point",
      at: Vector3.subtract(entry.posture.root, push),
      frame: "world",
    };
    let caught: IHumanActionPlan | null = null;
    if (balanced.outcome !== "absorb")
      try {
        caught = stagger.plan({
          ...context,
          params: { from, speed: Math.max(speed, Number.MIN_VALUE) },
        });
      } catch (error) {
        if (!(error instanceof HumanRefusal)) throw error;
      }
    const landing: IAutoMovieMotionEvent | undefined = caught?.events.find(
      (e: IAutoMovieMotionEvent): boolean => e.name === "caught",
    );
    const outcome: resolveAutoMovieBalanceOutcome.IOutcome =
      balanced.outcome === "absorb"
        ? balanced
        : caught === null || landing === undefined
          ? { ...balanced, outcome: "fall" }
          : decide(landing.share * caught.duration);
    const requested: NonNullable<IParams["outcome"]> =
      context.params.outcome ?? "auto";

    // The two-body outcomes are the two-body response's (#3439), which
    // answers them before this law plans its own.
    if (
      requested === "resist" ||
      requested === "yield" ||
      requested === "thrown"
    )
      return HumanForceResponse.plan(context, requested, outcome);
    const asked: "auto" | "absorb" | "step" | "fall" = requested;
    const chosen: "absorb" | "step" | "fall" =
      asked === "auto" ? outcome.outcome : asked;
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
    if (chosen === "fall")
      return knockdown.plan({ ...context, params: { from } });
    return absorb(context, outcome, push);
  }

  /**
   * The absorb: the hips carried along the push and back over the feet by
   * the critically damped pendulum at the body's frequency, the feet planted.
   *
   * @param context The action's context.
   * @param outcome The engine's outcome, for the centre's velocity after the impulse.
   * @param push The push's horizontal direction, world.
   * @returns The plan.
   */
  function absorb(
    context: IHumanActionContext<IParams>,
    outcome: resolveAutoMovieBalanceOutcome.IOutcome,
    push: IAutoMovieVector3,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const entry: IHumanPosture = context.entry.posture;
    const w0: number = resolveAutoMovieCenterOfMass.frequency(
      resolveAutoMovieCenterOfMass.pendulum(body.measure.hipHeight),
    );
    const speed: number = Vector3.dot(outcome.velocity, push);

    // Settled to within e^-4 (under 2 %) of the peak's own scale by 6 / ω0.
    const duration: number = 6 / w0;
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(
      duration,
      [{ name: "peak", seconds: 1 / w0 }],
    );
    const local: IAutoMovieVector3 = HumanFrame.local(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
      push,
    );
    const feet: Record<"left" | "right", HumanFoot.IPlacement> =
      StrikingTarget.feet(context.entry);
    const legsAt: ReturnType<typeof StrikingStance.prepareLegs> = StrikingStance.prepareLegs(body, feet);
    const composed: IHumanActionPlan = composeAutoMovieMotionHumanAction({
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
          angles: (): AutoMovieMotionHumanLean.IAngles => ({
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
          write: (posture: IHumanPosture): IHumanPosture => ({
            ...posture,
            limbs: { ...posture.limbs, ...legsAt() },
          }),
        },
      ],
    });

    // Both feet stay planted through the absorb.
    const plant: (part: "leftFoot" | "rightFoot") => IHumanContactWindow = (part: "leftFoot" | "rightFoot"): IHumanContactWindow => ({
      part,
      kind: "plant",
      from: 0,
      to: 1,
      support: { kind: "ground" },
    });
    return { ...composed, contacts: [plant("leftFoot"), plant("rightFoot")] };
  }
}
