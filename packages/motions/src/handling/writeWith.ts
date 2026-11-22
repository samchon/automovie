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
import { HumanHand } from "../posture/HumanHand";
import { pickUp } from "./pickUp";

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
  ): writeWith.ISteadied {
    const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
    const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
      context,
      other,
      steady.tool,
    );
    const frame: IAutoMovieRigidTransform = context
      .prop(steady.tool)
      .frame(context.entry.seconds);
    const rotation: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(
        frame.rotation,
        Quaternion.inverse(held.frame.rotation),
      ),
    );
    const contact: IAutoMovieVector3 = Vector3.add(
      HumanHand.offset(context.body, other, "grip").point,
      AutoMovieMotionHumanHeld.point(held, steady.tip).point,
    );
    const lever: IAutoMovieVector3 = Quaternion.rotateVector(rotation, contact);
    const target: IAutoMovieVector3 = Vector3.add(
      origin,
      Quaternion.rotateVector(facing, {
        x: steady.at[0],
        y: 0,
        z: steady.at[1],
      }),
    );
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
        disc: 0,
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
