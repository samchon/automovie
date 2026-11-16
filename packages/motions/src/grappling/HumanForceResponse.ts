import {
  AutoMovieGravity,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  minimumJerk,
  resolveAutoMovieBalanceOutcome,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanForce } from "../perform/HumanForce";
import { HumanFoot } from "../posture/HumanFoot";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { GymnasticsFlight } from "../sport/GymnasticsFlight";
import { HumanForceExchange } from "./HumanForceExchange";
import { HumanForceThrow } from "./HumanForceThrow";

/**
 * A partner's response to a pull through grips (#3439), the outcomes of
 * `perturb` a sustained force decides: `resist`, `yield` and `thrown`.
 *
 * The pull is the horizontal sum of the sustained forces on the performer
 * open at the action's start (`IHumanActionContext.forces`), lasting until
 * the first of them ends. Its mechanics are `HumanForceExchange`'s:
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
   * The authored response to the sustained pull: counter-lean within the
   * base, yield until the base breaks, or yield then swing and release.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines resist, yield and thrown as requested physical responses; plan refuses a response the actual force, base or fulcrum cannot produce.
   * @evidence contracts/development/design.md#principled-representation A closed string union names the three existing response laws while actual forces and body geometry determine their motion and feasibility.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The perturb law selects one outcome; force input, thrower and fulcrum remain with their existing owners rather than entering this label.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A label requests a branch, never certifies success or supplies scripted motion; plan retains all physical refusals and documented rigid-body limitations.
   */
  export type Outcome = "resist" | "yield" | "thrown";

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The author's outcome and, for a throw, the thrower and the fulcrum region it turns over.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members; the outcome is the author's through `perturb`, and the pull is the force input, never a parameter.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A throw's fulcrum is named, not guessed from the bodies.
   */
  export interface IParams {
    /** The thrower's subject id, for `thrown`. */
    by?: string;

    /** The thrower's region the body turns over (a hip, a shoulder), for `thrown`. */
    fulcrum?: AutoMovieHumanoidRegion;

    /** The thrown body's region that lies on the fulcrum; `abdomen` when absent, a hip throw's front over the thrower's hip. */
    on?: AutoMovieHumanoidRegion;
  }

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
   * @evidence contracts/development/implementation.md#principled-implementation The pull is read from the force input at the start; the centre, the base and its extent along the pull give the instant the base breaks by the pendulum law; a throw reads the thrower's placed posture at that instant for the fulcrum, swings, and flies under conserved momentum.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the pull, then one of three motions built from one tip function.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every outcome the forces cannot produce is refused with what would produce it; nothing is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms One mass model, one base and, for a throw, one swing and one flight integration at plan time; constant work per evaluated second besides the flight's read.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The base, centre, integrators, mass model and inertia are their owners'. Both sensitivity trials borrow one exact FK workspace without skipping either posture solve.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The sensitivity's lazy FK reader is released with that synchronous calculation; no returned time evaluator captures it. The plan holds the swing's and flight's trajectories for its lifetime.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
    chosen: Outcome,
    outcome: resolveAutoMovieBalanceOutcome.IOutcome,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const model: resolveAutoMovieCenterOfMass.IModel =
      GymnasticsFlight.model(body);
    const w: number = resolveAutoMovieCenterOfMass.frequency(
      resolveAutoMovieCenterOfMass.pendulum(body.measure.hipHeight),
    );

    // The pull open at the start.
    const open: HumanForce.ISustained[] = (context.forces?.(0, 0) ?? []).filter(
      (f: HumanForce.IForce): f is HumanForce.ISustained =>
        f.kind === "sustained",
    );
    const sum: IAutoMovieVector3 = open.reduce(
      (s: IAutoMovieVector3, f: HumanForce.ISustained): IAutoMovieVector3 =>
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
      Math.min(...open.map((f: HumanForce.ISustained): number => f.to)) -
      context.start;

    // The centre, the planted base and the pivot at the ankles.
    const entry: IHumanPosture = context.entry.posture;
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

    // The whole body tipped about the ankles by an angle along a direction,
    // split into the posture's forward pitch and rightward roll. The pivot
    // is read in the posture's own root frame, so no tip is the posture
    // itself and the root never jumps when the response begins.
    const tipped = (
      posture: IHumanPosture,
      along: IAutoMovieVector3,
      degrees: number,
    ): IHumanPosture => {
      const own: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(resolveHumanPosture.heading(posture)),
        Vector3.subtract(pivot, posture.root),
      );
      const turned: IHumanPosture = {
        ...posture,
        pitch: posture.pitch + degrees * Vector3.dot(along, forward),
        roll: posture.roll + degrees * Vector3.dot(along, right),
      };
      return {
        ...turned,
        root: Vector3.subtract(
          pivot,
          Quaternion.rotateVector(resolveHumanPosture.heading(turned), own),
        ),
      };
    };
    const lean = (offset: number): number =>
      (Math.asin(Math.max(-1, Math.min(1, offset / height))) * 180) / Math.PI;

    // Standing with the feet side by side, the centre moves along the facing
    // by the ankles' tip of the whole body, and across it by the hips'
    // load and unload, the pelvis carried sideways over legs that keep their
    // feet (Winter 1995, "Human balance and posture control during standing
    // and walking", Gait Posture 3:193): so the pull's part along the facing
    // tips the body about the ankles, and its part across moves the root,
    // by the centre's own shift per shift of the root, read on the entry
    // posture with its legs solved at a shift of the square root of machine
    // epsilon of the centre's height.
    const across: number = (() => {
      const resolution: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution();
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
              resolution,
            ).pose,
            resolution(),
          ),
        );
      const h: number = height * Number.EPSILON ** 0.5;
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
    const drawn = (
      posture: IHumanPosture,
      along: IAutoMovieVector3,
      offset: number,
    ): IHumanPosture => {
      const tip: IHumanPosture = tipped(
        posture,
        forward,
        lean(offset * Vector3.dot(along, forward)),
      );
      return {
        ...tip,
        root: Vector3.add(
          tip.root,
          Vector3.scale(right, (offset * Vector3.dot(along, right)) / across),
        ),
      };
    };

    // The grips' mean height, where the pull acts.
    const sites: number[] = open.map(
      (f: HumanForce.ISustained): number =>
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
      const plan: IHumanActionPlan = AutoMovieMotionHumanBase.under(
        context,
        duration,
      );
      return {
        ...plan,
        events: [{ name: "braced", share: Math.min(1, 1 / w / duration) }],
        posture: (seconds: number): IHumanPosture =>
          drawn(
            plan.posture(seconds),
            back,
            shift * minimumJerk(Math.min(1, Math.max(0, seconds * w))).s,
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
    const yielded: IHumanActionPlan = AutoMovieMotionHumanBase.under(
      context,
      broken,
    );
    const yieldAt = (seconds: number): IHumanPosture =>
      drawn(
        yielded.posture(Math.min(broken, seconds)),
        direction,
        HumanForceExchange.drawn({
          mass: model.mass,
          frequency: w,
          force,
          seconds: Math.min(broken, seconds),
        }).offset,
      );
    const plant = (
      part: "leftFoot" | "rightFoot",
      to: number,
    ): IHumanContactWindow => ({
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
    return HumanForceThrow.plan(context, {
      model,
      direction,
      broken,
      frozen: GymnasticsFlight.frozen(body, yieldAt(broken)),
      speed: HumanForceExchange.drawn({
        mass: model.mass,
        frequency: w,
        force,
        seconds: broken,
      }).speed,
      force,
      grip,
      remaining: span - broken,
      yieldAt,
      plant,
    });
  }
}
