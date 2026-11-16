import {
  AutoMovieGravity,
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  integrateAirborneRotation,
  integrateMotionTrajectory,
  resolveAutoMovieCenterOfMass,
  resolveAutoMovieHumanoidSurfaces,
  resolveAutoMovieMomentum,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { HumanForce } from "../perform/HumanForce";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanForceExchange } from "./HumanForceExchange";
import type { HumanForceResponse } from "./HumanForceResponse";

/**
 * The throw of a pulled body whose base has broken (#3439): the swing over
 * the thrower's fulcrum, the release where the centre comes level with it
 * and the flight to the landing, for `HumanForceResponse`'s `thrown`.
 *
 * First pass: the body is rigid in the pose it had when its base broke,
 * through the swing and the flight; the swing's fulcrum is fixed at the
 * thrower's placed region at that instant.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the phases, who uses it and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A rigid pendulum about a fixed fulcrum, then torque-free flight with conserved angular momentum, read by time.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The throw's input record, its plan and the force site reader the response shares.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No angle or landing is scripted: the swing and the flight are integrated.
 */
export namespace HumanForceThrow {
  /**
   * What the response hands the throw: the pulled body's model, the pull's
   * direction, the instant its base breaks, its pose frozen there, its
   * centre's speed then, its yield before and its feet's plant windows.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The state of the pulled body at the broken base, the throw's initial condition.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Ten members, each read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The yield and the plant are the response's own functions, so the throw does not restate them.
   */
  export interface IProps {
    /** The body's mass model. */
    model: resolveAutoMovieCenterOfMass.IModel;

    /** The pull's horizontal direction, unit, world. */
    direction: IAutoMovieVector3;

    /** Seconds from the action's start to the broken base. */
    broken: number;

    /** The body's pose at the broken base, written by joints alone. */
    frozen: IHumanPosture;

    /** The centre's speed along the pull at the broken base, m/s. */
    speed: number;

    /** The pull, newtons, horizontal along `direction`. */
    force: number;

    /** The grip sites' mean height, world metres. */
    grip: number;

    /** Seconds the pull lasts after the broken base. */
    remaining: number;

    /**
     * The yield's posture before the broken base.
     *
     * @param seconds Seconds since the action's start.
     * @returns The posture.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines action-relative seconds and the pre-break yielding posture; HumanForceResponse's producer holds its clock at the broken-base instant.
     * @evidence contracts/development/implementation.md#principled-implementation The supplied response producer applies the inverted-pendulum offset and the body's measured along/across tip geometry to the underlying yielded posture at min(seconds, broken).
     * @evidence contracts/development/implementation.md#clear-and-simple-structure HumanForceResponse owns the yielding law; the throw delegates its pre-break branch to this reader before taking over rigid swing and flight.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The original force, base-break time, body geometry and underlying posture remain authoritative; no fitted pose or scripted yield replaces them.
     * @evidence contracts/development/implementation.md#efficient-algorithms Each read pays the underlying plan posture and constant pendulum/vector work; fixed force, frequency, entry geometry and sensitivity scalars are prepared by the response once.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the response's actual yielded plan and fixed physical inputs while recomputing every requested second; no posture answer is retained by the throw.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The throw plan retains this callback and its response scalars for its lifetime. Each call returns a fresh transformed posture and acquires no task, handle or time history.
     */
    yieldAt(seconds: number): IHumanPosture;

    /**
     * A foot's plant on the floor from the start.
     *
     * @param part The foot.
     * @param to The share it ends at.
     * @returns The window.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines foot identity and normalized end share; HumanForceResponse supplies a ground plant starting at share zero.
     * @evidence contracts/development/implementation.md#principled-implementation The response producer declares the named foot planted on ground from zero through the supplied broken/duration share, preserving support until the base breaks.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One record constructor serves both feet; HumanForceThrow supplies each foot and the same physical phase boundary.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the exact requested foot and share without widening support, changing phase timing or claiming that a later airborne foot remains planted.
     * @evidence contracts/development/implementation.md#efficient-algorithms Constant work and one fresh contact-window record per foot, called twice during throw construction.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the existing window-construction policy only; separate fresh records keep the two feet and their ownership independent.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned throw plan owns its two contact records for its lifetime; the constructor retains no output, history or external resource.
     */
    plant(part: "leftFoot" | "rightFoot", to: number): IHumanContactWindow;
  }

  /**
   * Plan the throw after the broken base: the swing about the thrower's
   * fulcrum, the release and the flight to the landing.
   *
   * @param context The thrown body's context.
   * @param props The state at the broken base.
   * @returns The plan from the action's start.
   * @throws {HumanRefusal} A `participant` refusal on `fulcrum` with no thrower, fulcrum or placed thrower posture; a `parameter` refusal on `outcome` when the swing stops before the vertical.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the phases, the inputs and both refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The fulcrum is the thrower's region on its placed posture at the broken base; the frozen body turns about it by `HumanForceExchange.swing`, whose start rate is the pull's speed across the fulcrum line, whose drive is the pull's moment about the fulcrum while it lasts, and whose inertia is the body's composite tensor on the swing's axis plus the parallel-axis term; after release the centre follows the parabola and the orientation the conserved angular momentum `R I ω` (`integrateAirborneRotation`); the landing is the first integrator step at which the lowest joint reaches the floor.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fulcrum, swing, release state, flight, landing, plan.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A swing that stops is refused; the landing is searched, never set.
   * @evidence contracts/development/implementation.md#efficient-algorithms One swing and one flight integration at plan time, and a landing search over the flight's steps reading the trunk's joints.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The inertia, integrators and region places are their owners'. Release angle and rate share one swing read; the fixed inverse heading and rigid joint offsets are computed once without changing the landing grid or rotations.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The landing search owns its joint-offset array until synchronous return; the plan retains the fixed inverse heading and the swing's and flight's trajectories for its lifetime.
   */
  export function plan(
    context: IHumanActionContext<HumanForceResponse.IParams>,
    props: IProps,
  ): IHumanActionPlan {
    const { model, direction, broken, frozen } = props;
    const body: IHumanBody = context.body;
    const by: string | undefined = context.params.by;
    const fulcrum: AutoMovieHumanoidRegion | undefined = context.params.fulcrum;
    const thrower: IHumanActionContext.IPerformer | undefined =
      by === undefined ? undefined : context.performer(by);
    const placed: IHumanPosture | undefined = thrower?.posture?.(
      context.start + broken,
    );
    if (
      by === undefined ||
      fulcrum === undefined ||
      thrower === undefined ||
      placed === undefined
    )
      throw new HumanRefusal({
        kind: "participant",
        axis: "fulcrum",
        value: fulcrum ?? null,
        reason:
          "a throw turns the body over the thrower's fulcrum, and no thrower with a placed posture and a fulcrum region is named",
        fix: "name the thrower (by) and the region of theirs the body turns over (fulcrum), and place the thrower first",
      });
    const point: IAutoMovieVector3 = site(
      thrower.body,
      HumanTrunk.resolve(thrower.body, placed),
      fulcrum,
    );

    // The swing's plane holds the vertical and the pull; its axis turns
    // the vertical toward the pull.
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const axis: IAutoMovieVector3 = Vector3.cross(up, direction);
    const shape: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanTrunk.resolve(body, frozen);
    const centre: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
      model,
      shape,
    );
    const r: IAutoMovieVector3 = Vector3.subtract(centre, point);
    const radius: number = Math.hypot(
      Vector3.dot(r, direction),
      Vector3.dot(r, up),
    );
    const start: number = Math.atan2(
      Vector3.dot(r, direction),
      Vector3.dot(r, up),
    );
    const tangent: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(direction, Math.cos(start)),
      Vector3.scale(up, -Math.sin(start)),
    );
    const tensor: number[][] = resolveAutoMovieMomentum.inertia(model, shape);
    const about: number = [0, 1, 2].reduce(
      (s: number, i: number): number =>
        s +
        [0, 1, 2].reduce(
          (t: number, j: number): number =>
            t + component(axis, i) * tensor[i]![j]! * component(axis, j),
          0,
        ),
      0,
    );
    const swing: HumanForceExchange.ISwing | null = HumanForceExchange.swing({
      mass: model.mass,
      inertia: about,
      radius,
      angle: start,
      rate: (props.speed * Vector3.dot(direction, tangent)) / radius,

      // A horizontal pull at the grips turns the body about the fulcrum by
      // its force times the grips' height above it.
      torque: props.force * (props.grip - point.y),
      until: props.remaining,
    });
    if (swing === null)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "outcome",
        value: "thrown",
        feasible: null,
        reason: `the momentum the pull left does not carry the body over the thrower's ${fulcrum}`,
        fix: "pull harder, or bring the fulcrum under the body's centre",
      });
    const turnAt = (angle: number): IAutoMovieQuaternion =>
      Quaternion.fromAxisAngle(axis, ((angle - start) * 180) / Math.PI);
    const release: number = broken + swing.release;
    const state: { angle: number; rate: number } = swing.sample?.(swing.release) ?? {
      angle: swing.angle(swing.release),
      rate: swing.rate(swing.release),
    };
    const turned: IAutoMovieQuaternion = turnAt(state.angle);
    const rate: number = state.rate;
    const from: IAutoMovieVector3 = Vector3.add(
      point,
      Quaternion.rotateVector(turned, r),
    );
    const velocity: IAutoMovieVector3 = Vector3.scale(
      Vector3.cross(axis, Quaternion.rotateVector(turned, r)),
      rate,
    );
    const g: number = AutoMovieGravity.STANDARD;

    // The flight lasts at most until the centre itself reaches the floor.
    const fall: number =
      (velocity.y + Math.sqrt(velocity.y * velocity.y + 2 * g * from.y)) / g;
    const path = (tau: number): IAutoMovieVector3 => ({
      x: from.x + velocity.x * tau,
      y: from.y + velocity.y * tau - (g * tau * tau) / 2,
      z: from.z + velocity.z * tau,
    });
    const heading: IAutoMovieQuaternion = resolveHumanPosture.heading(frozen);
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(heading);
    const own: IHumanPosture = {
      ...frozen,
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
    };
    const local: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanTrunk.resolve(body, own);
    const momentum: IAutoMovieVector3 = Vector3.scale(
      Quaternion.rotateVector(turned, apply(tensor, axis)),
      rate,
    );
    const flight: integrateAirborneRotation.IFlight = integrateAirborneRotation(
      {
        history: integrateAirborneRotation.history(model, () => local),
        t0: 0,
        t1: Math.max(fall, integrateMotionTrajectory.STEP),
        q0: Quaternion.normalize(Quaternion.multiply(turned, heading)),
        momentum,
      },
    );
    const turnIn = (tau: number): IAutoMovieQuaternion =>
      Quaternion.normalize(
        Quaternion.multiply(
          flight.orientation(tau),
          inverse,
        ),
      );

    // The landing: the first step at which the lowest joint reaches the floor.
    const offsets: IAutoMovieVector3[] = Array.from(
      shape.values(),
      (bone: IAutoMovieResolvedBone): IAutoMovieVector3 =>
        Vector3.subtract(bone.worldPosition, centre),
    );
    const lowest = (tau: number): number => {
      const c: IAutoMovieVector3 = path(tau);
      const q: IAutoMovieQuaternion = turnIn(tau);
      let low: number = Number.POSITIVE_INFINITY;
      for (const offset of offsets)
        low = Math.min(
          low,
          c.y +
            Quaternion.rotateVector(q, offset).y,
        );
      return low;
    };
    let land: number = fall;
    for (
      let tau: number = 0;
      tau <= fall;
      tau += integrateMotionTrajectory.STEP
    )
      if (lowest(tau) <= 0) {
        land = tau;
        break;
      }
    const duration: number = release + land;
    const on: AutoMovieHumanoidRegion = context.params.on ?? "abdomen";
    return {
      duration,
      events: [
        { name: "kuzushi", share: broken / duration },
        { name: "release", share: release / duration },
        { name: "land", share: 1 },
      ],
      contacts: [
        props.plant("leftFoot", broken / duration),
        props.plant("rightFoot", broken / duration),
        {
          part: "back",
          kind: "bear",
          region: on,
          from: broken / duration,
          to: release / duration,
          support: { kind: "person", subject: by, region: fulcrum },
        },
      ],
      posture: (seconds: number): IHumanPosture => {
        if (seconds <= broken) return props.yieldAt(seconds);
        if (seconds <= release)
          return {
            ...frozen,
            rotation: {
              about: point,
              turn: turnAt(swing.angle(seconds - broken)),
            },
          };
        const tau: number = Math.min(land, seconds - release);
        const c: IAutoMovieVector3 = path(tau);
        return {
          ...frozen,
          root: Vector3.add(frozen.root, Vector3.subtract(c, centre)),
          rotation: { about: c, turn: turnIn(tau) },
        };
      },
    };
  }

  /**
   * A force site's world point on resolved bones.
   *
   * @param body The body.
   * @param bones Its resolved bones.
   * @param at The site: a region or a bone's point.
   * @returns World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input forms and the frame.
   * @evidence contracts/development/implementation.md#principled-implementation A region is placed by the engine's surface resolution, a bone's point by its bone's world transform.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two branches.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: a missing bone is the caller's canonical rig's defect.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `resolveAutoMovieHumanoidSurfaces.place`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function.
   */
  export function site(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    at: HumanForce.At,
  ): IAutoMovieVector3 {
    if (typeof at !== "string") {
      const bone: IAutoMovieResolvedBone = bones.get(at.bone)!;
      return Vector3.add(
        bone.worldPosition,
        Quaternion.rotateVector(bone.worldRotation, at.point),
      );
    }
    const frame: IHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
      body.surfaces.regions[at];
    return resolveAutoMovieHumanoidSurfaces.place(frame, bones.get(frame.bone)!)
      .point;
  }

  /** A vector's component by index. */
  function component(v: IAutoMovieVector3, i: number): number {
    return i === 0 ? v.x : i === 1 ? v.y : v.z;
  }

  /** A 3x3 tensor applied to a vector. */
  function apply(tensor: number[][], v: IAutoMovieVector3): IAutoMovieVector3 {
    return {
      x: tensor[0]![0]! * v.x + tensor[0]![1]! * v.y + tensor[0]![2]! * v.z,
      y: tensor[1]![0]! * v.x + tensor[1]![1]! * v.y + tensor[1]![2]! * v.z,
      z: tensor[2]![0]! * v.x + tensor[2]![1]! * v.y + tensor[2]![2]! * v.z,
    };
  }
}
