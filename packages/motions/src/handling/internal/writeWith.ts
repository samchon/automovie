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

import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../../compose/internal/AutoMovieMotionHumanHeld";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanArmTrajectoryTerms } from "../../posture/internal/HumanArmTrajectoryTerms";
import { HumanHand } from "../../posture/internal/HumanHand";
import { pickUp } from "./pickUp";

/*
 * The parts a held tool's work shares between `write` and `workHeld`: a surface
 * the other hand holds still, the reach refusal of a working point, the other
 * hand's tool kept on the work, the fingers' drives of the tool's articulations
 * and the props a tool takes or leaves at the work's end.
 *
 * A held tool rides its hand rigidly, so its working point lies at a fixed
 * lever from the wrist for the whole work: the wrist goal is the point less
 * that lever, as `write` aims it, and a point is within reach exactly when that
 * wrist is (`pickUp.reachable`). A drive moves an articulation from where the
 * performance has it at the work's start to its target across the work's span,
 * on the clock's stroke progress. A mount sets its prop on the socket at the
 * instant the work ends, so the prop rides from where it lies then
 * (`IAutoMovieMotionPropMount`).
 */
export namespace writeWith {
  /*
   * Whether a surface prop is stationary for a stroke: fixed in the scene, or
   * held at entry by the hand that does not stroke, which holds still.
   * Parameter context: The action's context.
   * Parameter on: The surface prop's subject.
   * Parameter side: The stroking hand.
   * Returns: Whether the surface may carry the stroke.
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

  /*
   * Refuse a working point whose wrist lies beyond the arm.
   * Parameter context: The action's context.
   * Parameter side: The working hand.
   * Parameter points: The working point's targets, world metres.
   * Parameter lever: The working point from the wrist, world-turned, metres.
   * With the distance, when any wrist lies beyond the
   * straight arm.
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

  /*
   * The other hand's held tool kept on one point of the work through the
   * stroke: its arm primitive, its grip contact, its kept hold and fingers.
   * Parameter context: The action's context.
   * Parameter steady: The steadying tool and its point.
   * Parameter side: The stroking hand; the other one steadies.
   * Parameter origin: The surface's origin, world metres.
   * Parameter facing: The surface's attitude, world.
   * Parameter clock: The stroke's clock.
   * Parameter turn: The steadying tool's turn about the surface's normal (`splay`);
   * none when absent.
   * Parameter together: The group the stroking arm is planned in, so the two arms
   * are one problem over one span; planned alone when absent.
   * Returns: The steadying hand's parts.
   * When the other hand does not hold the tool, the tool
   * has no such point, or the point is beyond the arm.
   */
  export function steady(
    context: IAutoMovieMotionHumanActionContext<object>,
    steady: IAutoMovieMotionHumanHeldWork.ISteady,
    side: AutoMovieHumanSide,
    origin: IAutoMovieVector3,
    facing: IAutoMovieQuaternion,
    clock: IAutoMovieMotionClock,
    turn: IAutoMovieQuaternion = Quaternion.identity(),
    together?: ReturnType<typeof AutoMovieMotionHumanArm.together>,
  ): writeWith.ISteadied {
    const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
    const aim: writeWith.IAim = steadyAim(
      context,
      steady,
      side,
      origin,
      facing,
    );
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
        ...(together === undefined ? {} : { together }),
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

  /*
   * The steadying tool's aim: the tool as the other hand holds it, its attitude
   * at the entry, its working point from the wrist and the surface point it
   * presses.
   * Parameter context: The action's context.
   * Parameter steady: The steadying tool and its point.
   * Parameter side: The stroking hand; the other one steadies.
   * Parameter origin: The surface's origin, world metres.
   * Parameter facing: The surface's attitude, world.
   * Returns: The aim.
   * When the other hand does not hold the tool or the
   * tool has no such point.
   */
  export function steadyAim(
    context: IAutoMovieMotionHumanActionContext<object>,
    steady: IAutoMovieMotionHumanHeldWork.ISteady,
    side: AutoMovieHumanSide,
    origin: IAutoMovieVector3,
    facing: IAutoMovieQuaternion,
  ): writeWith.IAim {
    const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
    const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld(
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
          x: steady.at.x,
          y: 0,
          z: steady.at.z,
        }),
      ),
    };
  }

  /*
   * The turns about the surface's normal that set two held tools' grips a hand
   * apart: the stroking tool's and the steadying one's, each through its
   * working point, its handle swung toward its own hand's side.
   *
   * Two tools taken up as they lay (a knife and a fork side by side) point the
   * same way, so with their working points a short way apart on the food the
   * two hands holding them meet. Held as diners hold them, each handle leaves
   * the plate toward its own hand. The grips are the working points less the
   * levers, so turning each lever about the normal through its point moves its
   * grip on a circle; the least equal turn of both that keeps the grips'
   * centres a hand's length and the arm planner's clearance
   * (`HumanArmTrajectoryTerms.DEPTH` for each hand) apart over the whole stroke
   * is found by bisection on that separation, which grows with the turn up to a
   * right angle. A hand closed on a handle lies within half its length of the
   * grip's centre, the palm's middle, so two hands whose grips stand a hand's
   * length apart lie in disjoint spheres and cannot meet, the sphere bound the
   * arm planner's own clearance reads; a hand's breadth apart, measured at the
   * stroke's first point alone, left the stroking hand 16 mm inside the
   * steadying one across a knife's saw (measured on the dining cut). The
   * stroking grip moves along the stroke's segments with its lever fixed, so
   * its least distance from the steadying grip is the least over those
   * segments, each a closed-form point-to-segment distance. Grips already that
   * far apart are left as held.
   * Parameter body: The body.
   * Parameter facing: The surface's attitude, world.
   * Parameter stroke: The stroking tool's working point at the stroke's start and
   * its lever, world metres.
   * Parameter steady: The steadying tool's working point and lever, world metres.
   * Parameter path: The stroking working point's vertices in order, world metres;
   * the start alone when absent.
   * Returns: The stroking tool's turn and the steadying tool's, world.
   */
  export function splay(
    body: IAutoMovieMotionHumanActionContext<object>["body"],
    facing: IAutoMovieQuaternion,
    stroke: writeWith.ILever,
    steady: writeWith.ILever,
    path: readonly IAutoMovieVector3[] = [stroke.point],
  ): writeWith.ISplay {
    const up: IAutoMovieVector3 = Quaternion.rotateVector(facing, {
      x: 0,
      y: 1,
      z: 0,
    });
    const flat = (v: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.subtract(v, Vector3.scale(up, Vector3.dot(v, up)));
    const need: number = body.measure.hand + 2 * HumanArmTrajectoryTerms.DEPTH;
    const grip = (
      l: writeWith.ILever,
      q: IAutoMovieQuaternion,
    ): IAutoMovieVector3 =>
      Vector3.subtract(l.point, Quaternion.rotateVector(q, l.lever));
    // The least flat distance of the stroking grip, carried along the path
    // with its lever fixed, from the steadying grip.
    const apart = (
      a: IAutoMovieQuaternion,
      b: IAutoMovieQuaternion,
    ): number => {
      const fixed: IAutoMovieVector3 = grip(steady, b);
      const at = (point: IAutoMovieVector3): IAutoMovieVector3 =>
        flat(Vector3.subtract(grip({ point, lever: stroke.lever }, a), fixed));
      let least: number = Infinity;
      for (let i: number = 0; i < path.length; ++i) {
        const p: IAutoMovieVector3 = at(path[i]!);
        least = Math.min(least, Vector3.length(p));
        if (i + 1 === path.length) break;
        const d: IAutoMovieVector3 = Vector3.subtract(at(path[i + 1]!), p);
        const dd: number = Vector3.dot(d, d);
        if (!(dd > 0)) continue;
        const u: number = Math.max(0, Math.min(1, -Vector3.dot(p, d) / dd));
        least = Math.min(
          least,
          Vector3.length(Vector3.add(p, Vector3.scale(d, u))),
        );
      }
      return least;
    };
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

  /*
   * A held tool's working point and its lever from the wrist.
   */
  export interface ILever {
    /*
     * The working point's target, world metres.
     */
    point: IAutoMovieVector3;

    /*
     * The working point from the wrist, world-turned, metres.
     */
    lever: IAutoMovieVector3;
  }

  /*
   * The two tools' turns about the surface's normal.
   */
  export interface ISplay {
    /*
     * The stroking tool's turn.
     */
    stroke: IAutoMovieQuaternion;

    /*
     * The steadying tool's turn.
     */
    steady: IAutoMovieQuaternion;
  }

  /*
   * The steadying tool's aim.
   */
  export interface IAim {
    /*
     * The held tool.
     */
    held: IAutoMovieMotionHumanHeld.IHeld;

    /*
     * The hand's world rotation holding it as at the entry.
     */
    rotation: IAutoMovieQuaternion;

    /*
     * The working point from the wrist, in the hand's frame, metres.
     */
    contact: IAutoMovieVector3;

    /*
     * The surface point it presses, world metres.
     */
    target: IAutoMovieVector3;
  }

  /*
   * The drives of a held tool's articulations across a span of the work.
   * Parameter context: The action's context.
   * Parameter tool: The held tool's subject.
   * Parameter drive: The articulations and their target travels.
   * Parameter duration: The work's duration, seconds.
   * Parameter from: Seconds at which the drives start.
   * Parameter to: Seconds at which they reach their targets.
   * Returns: One drive per articulation.
   * When the tool has no such articulation or a target
   * lies outside its travel.
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

  /*
   * A prop set on a contact at a share of the work, refused when the contact
   * does not exist: a socket, or a working point such as a fork's face, which
   * the prop then rides as it rides a socket.
   * Parameter context: The action's context.
   * Parameter mount: The prop and the socket.
   * Parameter onto: The socket's prop.
   * Parameter share: The share of the work it is set at.
   * Returns: The mount.
   * When the socket is not on `onto`.
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

  /*
   * The steadying hand's parts.
   */
  export interface ISteadied {
    /*
     * The steadying arm.
     */
    primitive: IAutoMovieMotionHumanPrimitive;

    /*
     * Its grip on the tool.
     */
    contact: IAutoMovieMotionHumanContactWindow;

    /*
     * Its kept hold and fingers.
     */
    hold: IAutoMovieMotionPropHold;
  }
}
