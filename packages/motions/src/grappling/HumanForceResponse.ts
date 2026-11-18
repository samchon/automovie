import {
  AutoMovieGravity,
  Vector3,
  minimumJerk,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanForce,
  IAutoMovieMotionHumanForceResponse,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSustainedForce,
  IAutoMovieResolveBalanceOutcome,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanForce } from "../perform/HumanForce";
import { HumanArmTrajectoryTerms } from "../posture/HumanArmTrajectoryTerms";
import { HumanFoot } from "../posture/HumanFoot";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { GymnasticsFlight } from "../sport/GymnasticsFlight";
import { HumanForceDrawn } from "./HumanForceDrawn";
import { HumanForceExchange } from "./HumanForceExchange";
import { HumanForceThrow } from "./HumanForceThrow";

/**
 * A partner's response to a pull through grips (#3439), the outcomes of
 * `perturb` a sustained force decides: `resist`, `yield` and `thrown`.
 *
 * The pull is the horizontal sum of the sustained forces on the performer
 * open at the action's start (`IHumanActionContext.forces`), lasting until
 * the first of them ends; when none is open at the start, the first to open
 * within the action is answered from its onset, the body standing until
 * then, as a pull through grips begins only once they close (the grip,
 * kumikata, comes before kuzushi, tsukuri and kake: Kano, Kodokan Judo,
 * Kodansha 1986). Its mechanics are `HumanForceExchange`'s:
 *
 * - **resist**: the body leans away from the pull about the ankles until
 *   its centre has moved back by the moment balance's shift, over the
 *   body's own time constant `1 / ω` on a minimum-jerk profile, and holds
 *   for the pull. A pull whose shift passes the base behind is refused with
 *   the force range that can be resisted.
 * - **yield**: the body tips along the pull about the ankles as its centre
 *   travels by the linear inverted pendulum under the pull, until its
 *   extrapolated centre leaves the base (`kuzushi`, the plan's end). A pull
 *   that ends first is refused with the force that breaks the base within it.
 * - **thrown**: the yield to `kuzushi`, then the body, frozen in that pose,
 *   turns about the thrower's fulcrum (`fulcrum`, a region of `by`) by the
 *   swing's law from the momentum the pull left, leaves it at `release`
 *   where its centre comes level with the fulcrum, and flies, its centre on
 *   the parabola from the release and its orientation from the conserved
 *   angular momentum (#3426, `integrateAirborneRotation`), until its lowest
 *   joint reaches the floor (`land`). A throw with no fulcrum, or whose
 *   swing stops before the vertical, is refused. The composition cuts into
 *   the fall or the breakfall at `land`.
 *
 * The centre moves as standing balance moves it with the feet side by side
 * (Winter 1995): along the facing by the whole body's tip about the ankles,
 * across it by the pelvis carried sideways over the planted legs.
 *
 * First pass: the grip sites are not held to the puller's hands by a root
 * solve while the body tips, and the body is rigid through the swing and
 * the flight.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the pull is read, each outcome's motion with its law, the events, the refusals and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation The outcome is the author's, the geometry the forces': a closed union of three responses over one force input.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The parameters and the plan; the mechanics are `HumanForceExchange`'s, the flight the engine's.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No outcome is reached by a scripted angle: each refuses when the forces cannot produce it.
 */
export namespace HumanForceResponse {
  /**
   * Plan the response.
   *
   * @param context The action's context, `perturb`'s.
   * @param chosen The author's outcome.
   * @param outcome The engine's balance outcome of the impulses at the start, which `perturb` computed.
   * @returns The plan.
   * @throws {HumanRefusal} A `parameter` refusal on `outcome` when an impulse at the start already fells the body that is asked to resist, when no pull acts at the start, when a resisted pull passes the base, or when the pull ends before the base breaks, each with its feasible force; a `participant` refusal on `fulcrum` for a throw with no thrower, fulcrum or placed thrower posture; a `parameter` refusal on `outcome` when the swing stops before the vertical.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and every refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The pull is read from the force input at the start, or at its onset when it opens later, the response then shifted by the onset over a standing base; the centre, the base and its extent along the pull give the instant the base breaks by the pendulum law; a throw reads the thrower's placed posture at that instant for the fulcrum, swings, and flies under conserved momentum.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the pull, then one of three motions built from one tip function.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every infeasible original force/outcome is refused with its feasible input. Both sensitivity trials, the existing asin domain guard, current-posture pivot/heading mathematics and documented rigid-throw limitation remain; no force, target, mass or success bound is changed.
   * @evidence contracts/development/implementation.md#efficient-algorithms One mass model, one base and, for a throw, one swing and one flight integration at plan time; constant work per evaluated second besides the flight's read.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The base, centre, integrators, mass model and inertia are their owners'. Both sensitivity trials borrow one exact FK workspace and genuine unchanged-body ROM metadata without skipping either full posture solve, joint admission or clamp. The fixed mass/frequency/force coefficient is prepared once; yielding requests offset only, and the throw consumes one paired break-state offset/speed without repeating the analytic clock. Entry-facing basis products are prepared once for the actual resist/yield branch; each changing posture still computes its actual inverse heading, pivot offset and fresh tip.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The sensitivity's FK reader and ROM projector are released with that synchronous calculation; no returned time evaluator captures it. The plan holds the swing's and flight's trajectories for its lifetime.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanForceResponse.IParams>,
    chosen: IAutoMovieMotionHumanForceResponse.Outcome,
    outcome: IAutoMovieResolveBalanceOutcome.IOutcome,
  ): IAutoMovieMotionHumanActionPlan {
    // A pull that opens after the start, as one through grips that close
    // after it does, is answered from its onset: the body stands until then.
    const sustained = (f: IAutoMovieMotionHumanForce): f is IAutoMovieMotionHumanSustainedForce =>
      f.kind === "sustained";
    const onset: number =
      (context.forces?.(0, 0) ?? []).some(sustained)
        ? 0
        : Math.min(
            Number.POSITIVE_INFINITY,
            ...(context.forces?.(0, Number.POSITIVE_INFINITY) ?? [])
              .filter(sustained)
              .map((f: IAutoMovieMotionHumanSustainedForce): number => f.from - context.start),
          );
    if (!(onset > 0 && Number.isFinite(onset)))
      return respond(context, chosen, outcome);
    const answer: IAutoMovieMotionHumanActionPlan = respond(
      {
        ...context,
        start: context.start + onset,
        forces: (from: number, to: number): readonly IAutoMovieMotionHumanForce[] =>
          context.forces!(from + onset, to + onset),
      },
      chosen,
      outcome,
    );
    const standing: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(context, onset);
    const duration: number = onset + answer.duration;
    const later = (share: number): number => (onset + share * answer.duration) / duration;
    return {
      ...answer,
      duration,
      physicalWindow: {
        from: onset + (answer.physicalWindow?.from ?? 0),
        to: onset + (answer.physicalWindow?.to ?? answer.duration),
      },
      events: answer.events.map((e: IAutoMovieMotionEvent): IAutoMovieMotionEvent => ({ ...e, share: later(e.share) })),
      contacts: answer.contacts.map(
        (w: IAutoMovieMotionHumanContactWindow): IAutoMovieMotionHumanContactWindow => ({
          ...w,
          // A contact the answer holds from its start is held while the body stands.
          from: w.from === 0 ? 0 : later(w.from),
          to: later(w.to),
        }),
      ),
      ...(answer.still === undefined
        ? {}
        : { still: [answer.still[0] + onset, answer.still[1] + onset] as const }),
      ...(answer.legsStill === undefined
        ? {}
        : { legsStill: [answer.legsStill[0] + onset, answer.legsStill[1] + onset] as const }),
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

  /** The response to a pull open at the context's start (`plan`). */
  function respond(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanForceResponse.IParams>,
    chosen: IAutoMovieMotionHumanForceResponse.Outcome,
    outcome: IAutoMovieResolveBalanceOutcome.IOutcome,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const model: IAutoMovieResolveCenterOfMass.IModel =
      GymnasticsFlight.model(body);
    const w: number = resolveAutoMovieCenterOfMass.frequency(
      resolveAutoMovieCenterOfMass.pendulum(body.measure.hipHeight),
    );

    // The pull open at the start.
    const open: IAutoMovieMotionHumanSustainedForce[] = (context.forces?.(0, 0) ?? []).filter(
      (f: IAutoMovieMotionHumanForce): f is IAutoMovieMotionHumanSustainedForce =>
        f.kind === "sustained",
    );
    const sum: IAutoMovieVector3 = open.reduce(
      (s: IAutoMovieVector3, f: IAutoMovieMotionHumanSustainedForce): IAutoMovieVector3 =>
        Vector3.add(s, HumanForce.at(f, context.start)),
      { x: 0, y: 0, z: 0 },
    );
    const force: number = Math.hypot(sum.x, sum.z);
    if (open.length === 0 || !(force > 0))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "outcome",
        value: chosen,
        feasible: null,
        reason: `a ${chosen} answers a pull, and no sustained force acts on ${context.subject} at the start`,
        fix: "give the pull as a sustained force on the performer at the start",
      });
    const direction: IAutoMovieVector3 = {
      x: sum.x / force,
      y: 0,
      z: sum.z / force,
    };
    const span: number =
      Math.min(...open.map((f: IAutoMovieMotionHumanSustainedForce): number => f.to)) -
      context.start;

    // The centre, the planted base and the pivot at the ankles.
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      context.entry.pose,
    );
    const centre: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
      model,
      bones,
    );
    const base: IAutoMovieVector3[] = HumanFoot.base(body, bones);
    const feet = context.entry.feet;
    const pivot: IAutoMovieVector3 = Vector3.scale(
      Vector3.add(feet.left.ankle, feet.right.ankle),
      0.5,
    );
    const height: number = centre.y - pivot.y;
    const forward: IAutoMovieVector3 = {
      x: Math.sin((entry.yaw * Math.PI) / 180),
      y: 0,
      z: Math.cos((entry.yaw * Math.PI) / 180),
    };
    // The body's right: +X is its left when it faces +Z.
    const right: IAutoMovieVector3 = { x: -forward.z, y: 0, z: forward.x };

    // The whole body tipped forward about the ankles by an angle: the pull's
    // part along the facing pitches it, and its part across moves the root
    // (`drawn`). The pivot is read in the posture's own root frame, so no tip
    // is the posture itself and the root never jumps when the response
    // begins (`AutoMovieMotionHumanLean.about`).
    const tipped: (posture: IAutoMovieMotionHumanPosture, degrees: number) => IAutoMovieMotionHumanPosture = (
      posture: IAutoMovieMotionHumanPosture,
      degrees: number,
    ): IAutoMovieMotionHumanPosture =>
      AutoMovieMotionHumanLean.about(posture, pivot, { pitch: degrees, roll: 0 });
    const lean = (offset: number): number =>
      (Math.asin(Math.max(-1, Math.min(1, offset / height))) * 180) / Math.PI;

    // Standing with the feet side by side, the centre moves along the facing
    // by the ankles' tip of the whole body, and across it by the hips'
    // load and unload, the pelvis carried sideways over legs that keep their
    // feet (Winter 1995, "Human balance and posture control during standing
    // and walking", Gait Posture 3:193): so the pull's part along the facing
    // tips the body about the ankles, and its part across moves the root,
    // by the centre's own shift per shift of the root, read on the entry
    // posture with its legs solved. The centre is read through an iterative
    // leg fit, whose error is its place tolerance, not machine rounding: a
    // forward difference over a reading of relative error e takes a step of
    // about sqrt(e) of its scale (Nocedal and Wright, Numerical Optimization,
    // 2nd ed., section 8.1), here sqrt(tolerance / height) of the centre's
    // height.
    const across: number = (() => {
      const resolution: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution();
      const projection: ReturnType<typeof prepareHumanPostureProjection> = prepareHumanPostureProjection(body);
      const shown = (root: IAutoMovieVector3): IAutoMovieVector3 =>
        resolveAutoMovieCenterOfMass.place(
          model,
          poseBones(
            body,
            resolveHumanPosture.seeded(
              body,
              { ...entry, root },
              undefined,
              {},
              resolution, undefined, projection,
            ).pose,
            resolution(),
          ),
        );
      const h: number = Math.sqrt(
        (HumanArmTrajectoryTerms.TOLERANCE / 1000) * height,
      );
      return (
        Vector3.dot(
          Vector3.subtract(
            shown(Vector3.add(entry.root, Vector3.scale(right, h))),
            shown(entry.root),
          ),
          right,
        ) / h
      );
    })();
    const drawn: (along: IAutoMovieVector3) => (posture: IAutoMovieMotionHumanPosture, offset: number) => IAutoMovieMotionHumanPosture = (
      along: IAutoMovieVector3,
    ): ((posture: IAutoMovieMotionHumanPosture, offset: number) => IAutoMovieMotionHumanPosture) => {
      const alongForward: number = Vector3.dot(along, forward);
      const alongRight: number = Vector3.dot(along, right);
      return (posture: IAutoMovieMotionHumanPosture, offset: number): IAutoMovieMotionHumanPosture => {
        const tip: IAutoMovieMotionHumanPosture = tipped(posture, lean(offset * alongForward));
        return {
          ...tip,
          root: Vector3.add(tip.root, Vector3.scale(right, (offset * alongRight) / across)),
        };
      };
    };

    // The grips' mean height, where the pull acts.
    const sites: number[] = open.map(
      (f: IAutoMovieMotionHumanSustainedForce): number =>
        HumanForceThrow.site(body, bones, f.at).y,
    );
    const grip: number =
      sites.reduce((s: number, y: number): number => s + y, 0) / sites.length;

    if (chosen === "resist") {
      // An impulse at the start that already fells the body leaves nothing
      // to resist the pull with.
      if (outcome.outcome === "fall")
        throw new HumanRefusal({
          kind: "parameter",
          axis: "outcome",
          value: chosen,
          feasible: {
            kind: "range",
            minimum: 0,
            maximum: outcome.bounds.step,
            unit: "N s",
          },
          reason:
            "an impulse at the start fells the body, which cannot then resist the pull",
          fix: "give a smaller impulse, or let the body fall",
        });
      const back: IAutoMovieVector3 = Vector3.scale(direction, -1);
      const behind: number = HumanForceExchange.edge(centre, back, base);
      const shift: number | null = HumanForceExchange.resisted({
        mass: model.mass,
        force,
        height: grip,
        edge: behind,
      });
      if (shift === null)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "outcome",
          value: chosen,
          feasible: {
            kind: "range",
            minimum: 0,
            maximum: (model.mass * AutoMovieGravity.STANDARD * behind) / grip,
            unit: "N",
          },
          reason: `a pull of ${force.toFixed(0)} N at ${grip.toFixed(2)} m moves the centre of pressure past the base ${behind.toFixed(2)} m behind`,
          fix: "pull with less force, or let the body yield",
        });
      const duration: number = Math.max(span, 1 / w);
      const plan: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
        context,
        duration,
      );
      const drawBack: ReturnType<typeof drawn> = drawn(back);
      return {
        ...plan,
        events: [{ name: "braced", share: Math.min(1, 1 / w / duration) }],
        posture: (seconds: number): IAutoMovieMotionHumanPosture =>
          drawBack(
            plan.posture(seconds),
            shift * minimumJerk.share(Math.min(1, Math.max(0, seconds * w))),
          ),
      };
    }

    // The base breaks where the extrapolated centre leaves it.
    const edge: number = HumanForceExchange.edge(centre, direction, base);
    const broken: number = HumanForceExchange.broken({
      mass: model.mass,
      frequency: w,
      edge,
      force,
    });
    if (!(broken <= span))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "outcome",
        value: chosen,
        feasible: {
          kind: "range",
          minimum:
            span > 0
              ? HumanForceExchange.breaking({
                  mass: model.mass,
                  frequency: w,
                  edge: Math.max(edge, Number.MIN_VALUE),
                  seconds: span,
                })
              : null,
          maximum: null,
          unit: "N",
        },
        reason: `a pull of ${force.toFixed(0)} N for ${span.toFixed(2)} s breaks the base only after ${broken.toFixed(2)} s`,
        fix: "pull harder or for longer, or let the body resist",
      });
    const yielded: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
      context,
      broken,
    );
    const motion: HumanForceDrawn.IMotion = HumanForceDrawn.prepare({ mass: model.mass, frequency: w, force });
    const drawYield: ReturnType<typeof drawn> = drawn(direction);
    const yieldAt: (seconds: number) => IAutoMovieMotionHumanPosture = (seconds: number): IAutoMovieMotionHumanPosture =>
      drawYield(
        yielded.posture(Math.min(broken, seconds)),
        motion.offset(Math.min(broken, seconds)),
      );
    const plant = (
      part: "leftFoot" | "rightFoot",
      to: number,
    ): IAutoMovieMotionHumanContactWindow => ({
      part,
      kind: "plant",
      from: 0,
      to,
      support: { kind: "ground" },
    });
    if (chosen === "yield")
      return {
        ...yielded,
        events: [{ name: "kuzushi", share: 1 }],
        contacts: [plant("leftFoot", 1), plant("rightFoot", 1)],
        posture: yieldAt,
      };
    const postureAtBreak: IAutoMovieMotionHumanPosture = yielded.posture(broken);
    const motionAtBreak: HumanForceDrawn.IState = motion.sample(broken);
    const frozenAtBreak: IAutoMovieMotionHumanPosture = GymnasticsFlight.frozen(body, drawYield(postureAtBreak, motionAtBreak.offset));
    return HumanForceThrow.plan(context, {
      model,
      direction,
      broken,
      frozen: frozenAtBreak,
      speed: motionAtBreak.speed,
      force,
      grip,
      remaining: span - broken,
      yieldAt,
      plant,
    });
  }
}
