import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanHeldWork,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionPropDrive,
  IAutoMovieMotionPropHold,
  IAutoMovieMotionPropMount,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanArmTrajectoryTerms } from "../posture/HumanArmTrajectoryTerms";
import { HumanHand } from "../posture/HumanHand";
import { pickUp } from "./pickUp";

/**
 * A hand's breadth across the knuckles as a share of its length: 0.45,
 * the adult ratio of hand breadth to hand length, men and women alike
 * (https://pmc.ncbi.nlm.nih.gov/articles/PMC9225906/, the ratio the
 * dining specs' `everydayTake.BREADTH` reads).
 */
const HAND_BREADTH: number = 0.45;

/**
 * The parts a held tool's work shares between `write` and `workHeld`: a
 * surface the other hand holds still, the reach refusal of a working point,
 * the other hand's tool kept on the work, the fingers' drives of the tool's
 * articulations and the props a tool takes or leaves at the work's end.
 *
 * A held tool rides its hand rigidly, so its working point lies at a fixed
 * lever from the wrist for the whole work: the wrist goal is the point less
 * that lever, as `write` aims it, and a point is within reach exactly when
 * that wrist is (`pickUp.reachable`). A drive moves an articulation from
 * where the performance has it at the work's start to its target across the
 * work's span, on the clock's stroke progress. A mount sets its prop on the
 * socket at the instant the work ends, so the prop rides from where it lies
 * then (`IAutoMovieMotionPropMount`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the five shared parts, the lever premise and when drives and mounts act.
 * @evidence contracts/development/design.md#principled-representation World metres, articulation travel in its own unit and action shares, as the plan's records take them.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What `write` and `workHeld` both read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Props are read through their declared affordances; no tool kind is named.
 */
export namespace writeWith {
  /**
   * Whether a surface prop is stationary for a stroke: fixed in the scene,
   * or held at entry by the hand that does not stroke, which holds still.
   *
   * @param context The action's context.
   * @param on The surface prop's subject.
   * @param side The stroking hand.
   * @returns Whether the surface may carry the stroke.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both stationary cases.
   * @evidence contracts/development/implementation.md#principled-implementation A hold persists still while the active action does not drive that hand, so a held surface keeps its entry frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One read of the prop and of the entry holds.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A moving or articulated surface is not stationary.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work No equivalent predicate exists.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function stationary(
    context: IAutoMovieMotionHumanActionContext<object>,
    on: string,
    side: AutoMovieHumanSide,
  ): boolean {
    const support: IAutoMovieMotionHumanPropReader = context.prop(on);
    const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
    return (
      (support.prop.fixed === true || context.entry.holds[other] === on) &&
      context.entry.holds[side] !== on &&
      support.prop.motion === undefined &&
      !(support.prop.hasArticulations ?? support.prop.articulate !== undefined)
    );
  }

  /**
   * Refuse a working point whose wrist lies beyond the arm.
   *
   * @param context The action's context.
   * @param side The working hand.
   * @param points The working point's targets, world metres.
   * @param lever The working point from the wrist, world-turned, metres.
   * @throws {HumanRefusal} With the distance, when any wrist lies beyond the straight arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the wrist premise and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The pick up's reach owner refuses each wrist goal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One check per point.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Refused, never clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the points.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `pickUp.reachable`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function reach(
    context: IAutoMovieMotionHumanActionContext<object>,
    side: AutoMovieHumanSide,
    points: readonly IAutoMovieVector3[],
    lever: IAutoMovieVector3,
  ): void {
    for (const point of points)
      pickUp.reachable(context, side, Vector3.subtract(point, lever));
  }

  /**
   * The other hand's held tool kept on one point of the work through the
   * stroke: its arm primitive, its grip contact, its kept hold and fingers.
   *
   * @param context The action's context.
   * @param steady The steadying tool and its point.
   * @param side The stroking hand; the other one steadies.
   * @param origin The surface's origin, world metres.
   * @param facing The surface's attitude, world.
   * @param clock The stroke's clock.
   * @returns The steadying hand's parts.
   * @throws {HumanRefusal} When the other hand does not hold the tool, the tool has no such point, or the point is beyond the arm.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the steadying hand contributes and its refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The same held lever `write` aims by, held at one point under the stroke's envelope.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the held tool, its lever and target, then build the carried arm.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The held owner refuses a hand that does not hold the tool; the reach owner a point beyond the arm.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the held, hand-offset and carried-arm owners `write` uses.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The goal closes over its fixed point and lever only.
   */
  export function steady(
    context: IAutoMovieMotionHumanActionContext<object>,
    steady: IAutoMovieMotionHumanHeldWork.ISteady,
    side: AutoMovieHumanSide,
    origin: IAutoMovieVector3,
    facing: IAutoMovieQuaternion,
    clock: IAutoMovieMotionClock,
    turn: IAutoMovieQuaternion = Quaternion.identity(),
  ): writeWith.ISteadied {
    const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
    const aim: writeWith.IAim = steadyAim(context, steady, side, origin, facing);
    const held: IAutoMovieMotionHumanHeld.IHeld = aim.held;
    const rotation: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(turn, aim.rotation),
    );
    const contact: IAutoMovieVector3 = aim.contact;
    const lever: IAutoMovieVector3 = Quaternion.rotateVector(rotation, contact);
    // The steadying tip presses over the radius it declares; none, a point.
    const radius: number =
      held.affordances.find(
        (affordance: IAutoMovieAffordance): boolean =>
          affordance.id === steady.tip,
      )?.radius ?? 0;
    const target: IAutoMovieVector3 = aim.target;
    reach(context, other, [target], lever);
    const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
      context.body,
      context.entry.posture,
      other,
    );
    const kept: IAutoMovieMotionPropHold = AutoMovieMotionHumanHeld.hold(
      context,
      held,
    );
    return {
      primitive: AutoMovieMotionHumanArm.carried({
        body: context.body,
        side: other,
        from: 0,
        to: clock.duration,
        span: {
          start: 0,
          ready: clock.at("strokeStart"),
          relax: clock.at("strokeEnd"),
          end: clock.duration,
        },
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, other),
        disc: radius,
        weight: (seconds: number): number =>
          clock.envelope(["start", "ready"], ["relax", "end"], seconds),
        goal: (
          _posture: IAutoMovieMotionHumanPosture,
          _seconds: number,
        ): IAutoMovieHumanLimbGoal => ({
          point: Vector3.subtract(target, lever),
          rotation,
          contact,
          bend,
        }),
      }),
      contact: AutoMovieMotionHumanHeld.grip(held),
      hold: kept,
    };
  }

  /**
   * The steadying tool's aim: the tool as the other hand holds it, its
   * attitude at the entry, its working point from the wrist and the
   * surface point it presses.
   *
   * @param context The action's context.
   * @param steady The steadying tool and its point.
   * @param side The stroking hand; the other one steadies.
   * @param origin The surface's origin, world metres.
   * @param facing The surface's attitude, world.
   * @returns The aim.
   * @throws {HumanRefusal} When the other hand does not hold the tool or the tool has no such point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the aim holds.
   * @evidence contracts/development/implementation.md#principled-implementation The held lever `write` aims by, read once per plan.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the held tool, its attitude, its lever and its target.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The held owner refuses a hand that does not hold the tool.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by `steady` and `write`'s splay.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh records.
   */
  export function steadyAim(
    context: IAutoMovieMotionHumanActionContext<object>,
    steady: IAutoMovieMotionHumanHeldWork.ISteady,
    side: AutoMovieHumanSide,
    origin: IAutoMovieVector3,
    facing: IAutoMovieQuaternion,
  ): writeWith.IAim {
    const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
    const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
      context,
      other,
      steady.tool,
    );
    const frame: IAutoMovieRigidTransform = context
      .prop(steady.tool)
      .frame(context.entry.seconds);
    return {
      held,
      rotation: Quaternion.normalize(
        Quaternion.multiply(
          frame.rotation,
          Quaternion.inverse(held.frame.rotation),
        ),
      ),
      contact: Vector3.add(
        HumanHand.offset(context.body, other, "grip").point,
        AutoMovieMotionHumanHeld.point(held, steady.tip).point,
      ),
      target: Vector3.add(
        origin,
        Quaternion.rotateVector(facing, {
          x: steady.at[0],
          y: 0,
          z: steady.at[1],
        }),
      ),
    };
  }

  /**
   * The turns about the surface's normal that set two held tools' grips a
   * hand apart: the stroking tool's and the steadying one's, each through
   * its working point, its handle swung toward its own hand's side.
   *
   * Two tools taken up as they lay (a knife and a fork side by side) point
   * the same way, so with their working points a short way apart on the
   * food the two hands holding them meet. Held as diners hold them, each
   * handle leaves the plate toward its own hand. The grips are the working
   * points less the levers, so turning each lever about the normal through
   * its point moves its grip on a circle; the least equal turn of both that
   * puts the grips' centres a hand's breadth (`HAND_BREADTH` of the hand's
   * length) and the arm planner's clearance (`HumanArmTrajectoryTerms.DEPTH`
   * for each hand) apart is found by bisection on that separation, which
   * grows with the turn up to a right angle. Grips already that far apart
   * are left as held.
   *
   * @param body The body.
   * @param facing The surface's attitude, world.
   * @param stroke The stroking tool's working point and lever, world metres.
   * @param steady The steadying tool's working point and lever, world metres.
   * @returns The stroking tool's turn and the steadying tool's, world.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the premise, the rule, the bound and when nothing turns.
   * @evidence contracts/development/implementation.md#principled-implementation A grip is its working point less its lever, so a turn of the lever about the normal through the point moves the grip on a circle of the lever's flat length; the separation is monotone in an equal outward turn on [0, 90] degrees, so bisection finds its least sufficient turn.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Flatten, choose each outward sense, bisect one angle.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The bound is the hand's own breadth and the planner's own clearance; a separation the right angle cannot reach turns to the right angle.
   * @evidence contracts/development/implementation.md#efficient-algorithms A fixed number of bisection steps, once per plan.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work No equivalent owner exists.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns two fresh turns.
   */
  export function splay(
    body: IAutoMovieMotionHumanActionContext<object>["body"],
    facing: IAutoMovieQuaternion,
    stroke: writeWith.ILever,
    steady: writeWith.ILever,
  ): writeWith.ISplay {
    const up: IAutoMovieVector3 = Quaternion.rotateVector(facing, {
      x: 0,
      y: 1,
      z: 0,
    });
    const flat = (v: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.subtract(v, Vector3.scale(up, Vector3.dot(v, up)));
    const need: number =
      HAND_BREADTH * body.measure.hand + 2 * HumanArmTrajectoryTerms.DEPTH;
    const grip = (l: writeWith.ILever, q: IAutoMovieQuaternion): IAutoMovieVector3 =>
      Vector3.subtract(l.point, Quaternion.rotateVector(q, l.lever));
    const apart = (a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number =>
      Vector3.length(flat(Vector3.subtract(grip(stroke, a), grip(steady, b))));
    const none: IAutoMovieQuaternion = Quaternion.identity();
    if (apart(none, none) >= need) return { stroke: none, steady: none };
    // Each grip swings toward its own side of the other's: the sense whose
    // first motion of the grip, -(up x lever), points away from the other.
    const away: IAutoMovieVector3 = flat(
      Vector3.subtract(grip(stroke, none), grip(steady, none)),
    );
    const sense = (l: writeWith.ILever, outward: IAutoMovieVector3): number =>
      Vector3.dot(Vector3.scale(Vector3.cross(up, l.lever), -1), outward) >= 0
        ? 1
        : -1;
    const s: number = sense(stroke, away);
    const f: number = sense(steady, Vector3.scale(away, -1));
    const turns = (degrees: number): writeWith.ISplay => ({
      stroke: Quaternion.fromAxisAngle(up, s * degrees),
      steady: Quaternion.fromAxisAngle(up, f * degrees),
    });
    let lo: number = 0;
    let hi: number = 90;
    for (let i: number = 0; i < 24; ++i) {
      const mid: number = (lo + hi) / 2;
      const t: writeWith.ISplay = turns(mid);
      if (apart(t.stroke, t.steady) >= need) hi = mid;
      else lo = mid;
    }
    return turns(hi);
  }

  /**
   * A held tool's working point and its lever from the wrist.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation World metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What the splay reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ILever {
    /** The working point's target, world metres. */
    point: IAutoMovieVector3;

    /** The working point from the wrist, world-turned, metres. */
    lever: IAutoMovieVector3;
  }

  /**
   * The two tools' turns about the surface's normal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names both turns.
   * @evidence contracts/development/design.md#principled-representation World rotations applied before each held attitude.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `write` and `steady` read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ISplay {
    /** The stroking tool's turn. */
    stroke: IAutoMovieQuaternion;

    /** The steadying tool's turn. */
    steady: IAutoMovieQuaternion;
  }

  /**
   * The steadying tool's aim.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and frame.
   * @evidence contracts/development/design.md#principled-representation The held record, a world rotation, a wrist-frame contact and a world point.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `steady` and `write` read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IAim {
    /** The held tool. */
    held: IAutoMovieMotionHumanHeld.IHeld;

    /** The hand's world rotation holding it as at the entry. */
    rotation: IAutoMovieQuaternion;

    /** The working point from the wrist, in the hand's frame, metres. */
    contact: IAutoMovieVector3;

    /** The surface point it presses, world metres. */
    target: IAutoMovieVector3;
  }

  /**
   * The drives of a held tool's articulations across a span of the work.
   *
   * @param context The action's context.
   * @param tool The held tool's subject.
   * @param drive The articulations and their target travels.
   * @param duration The work's duration, seconds.
   * @param from Seconds at which the drives start.
   * @param to Seconds at which they reach their targets.
   * @returns One drive per articulation.
   * @throws {HumanRefusal} When the tool has no such articulation or a target lies outside its travel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the span, the start travel and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Each travel runs from the performance's state at the start to its target by a smoothstep over the span, at rest velocity at both ends.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit each articulation, then return its drive.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A target outside `[0, travel]` is refused with the range.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the drives; each travel is a closed form.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work No equivalent drive builder takes a held prop.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each drive closes over its two travels and the span.
   */
  export function drives(
    context: IAutoMovieMotionHumanActionContext<object>,
    tool: string,
    drive: readonly IAutoMovieMotionHumanHeldWork.IDrive[],
    duration: number,
    from: number,
    to: number,
  ): IAutoMovieMotionPropDrive[] {
    const reader: IAutoMovieMotionHumanPropReader = context.prop(tool);
    const state: Readonly<Record<string, number>> =
      reader.state?.(context.start) ?? {};
    return drive.map(
      (d: IAutoMovieMotionHumanHeldWork.IDrive): IAutoMovieMotionPropDrive => {
        const site: IAutoMovieAffordance | undefined =
          reader.prop.affordances?.find(
            (a: IAutoMovieAffordance): boolean => a.id === d.articulation,
          );
        const travel: number | undefined = site?.travel;
        if (site === undefined || travel === undefined)
          throw new HumanRefusal({
            kind: "affordance",
            axis: "drive",
            value: d.articulation,
            feasible: null,
            reason: `${tool} has no articulation called ${d.articulation}`,
            fix: "name an articulation the held prop declares with its travel",
          });
        if (!(d.to >= 0 && d.to <= travel))
          throw new HumanRefusal({
            kind: "parameter",
            axis: "drive",
            value: d.to,
            feasible: { kind: "range", minimum: 0, maximum: travel, unit: "" },
            reason: `${d.articulation} travels from 0 to ${travel}`,
            fix: "drive the articulation within its travel",
          });
        const start: number = state[d.articulation] ?? 0;
        return {
          prop: tool,
          articulation: d.articulation,
          from: from / duration,
          to: to / duration,
          travel: (seconds: number): number => {
            const u: number = Math.min(
              1,
              Math.max(0, (seconds - from) / Math.max(to - from, 1e-9)),
            );
            // A blend of the two ends lands on each exactly, so a drive
            // back to a stop never overshoots it by a rounding.
            const s: number = u * u * (3 - 2 * u);
            return start * (1 - s) + d.to * s;
          },
        };
      },
    );
  }

  /**
   * A prop set on a contact at a share of the work, refused when the
   * contact does not exist: a socket, or a working point such as a fork's
   * face, which the prop then rides as it rides a socket.
   *
   * @param context The action's context.
   * @param mount The prop and the socket.
   * @param onto The socket's prop.
   * @param share The share of the work it is set at.
   * @returns The mount.
   * @throws {HumanRefusal} When the socket is not on `onto`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the instant and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The plan's mount record; the performance keeps the prop where it lies at that instant.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and one record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing contact is refused with the prop's contacts.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work No equivalent builder exists.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function mount(
    context: IAutoMovieMotionHumanActionContext<object>,
    mount: IAutoMovieMotionHumanHeldWork.IMount,
    onto: string,
    share: number,
  ): IAutoMovieMotionPropMount {
    const sites: readonly IAutoMovieAffordance[] =
      context.prop(onto).prop.affordances ?? [];
    if (!sites.some((a: IAutoMovieAffordance): boolean => a.id === mount.point))
      throw new HumanRefusal({
        kind: "affordance",
        axis: "point",
        value: mount.point,
        feasible: {
          kind: "alternatives",
          values: sites.map((a: IAutoMovieAffordance): string => a.id),
        },
        reason: `${onto} has no contact called ${mount.point}`,
        fix: "name a contact the receiving prop declares",
      });
    return { prop: mount.prop, onto, point: mount.point, from: share };
  }

  /**
   * The steadying hand's parts.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the arm primitive, the grip and the hold.
   * @evidence contracts/development/design.md#principled-representation The plan's own record types.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `write` merges into its plan.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts All three are required.
   */
  export interface ISteadied {
    /** The steadying arm. */
    primitive: IAutoMovieMotionHumanPrimitive;

    /** Its grip on the tool. */
    contact: IAutoMovieMotionHumanContactWindow;

    /** Its kept hold and fingers. */
    hold: IAutoMovieMotionPropHold;
  }
}
