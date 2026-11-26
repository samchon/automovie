import {
  AutoMovieGravity,
  Quaternion,
  Vector3,
  integrateAirborneRotation,
  integrateMotionTrajectory,
  resolveAutoMovieCenterOfMass,
  resolveAutoMovieHumanoidSurfaces,
  resolveAutoMovieMomentum,
} from "@automovie/engine";
import type {
  AutoMovieHumanForceSite,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanForceExchange,
  IAutoMovieMotionHumanForceResponse,
  IAutoMovieMotionHumanForceThrow,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { HumanForceExchange } from "./HumanForceExchange";

/**
 * The throw of a pulled body whose base has broken: the swing over the
 * thrower's fulcrum, the release where the centre comes level with it and the
 * flight to the landing, for `HumanForceResponse`'s `thrown`.
 *
 * First pass: the body is rigid in the pose it had when its base broke, through
 * the swing and the flight; the swing's fulcrum is fixed at the thrower's
 * placed region at that instant.
 */
export namespace HumanForceThrow {
  /**
   * Plan the throw after the broken base: the swing about the thrower's
   * fulcrum, the release and the flight to the landing.
   *
   * @param context The thrown body's context.
   * @param props The state at the broken base.
   * @returns The plan from the action's start.
   * @throws {HumanRefusal} A `participant` refusal on `fulcrum` with no
   *   thrower, fulcrum or placed thrower posture; a `parameter` refusal on
   *   `outcome` when the swing stops before the vertical.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanForceResponse.IParams>,
    props: IAutoMovieMotionHumanForceThrow.IProps,
  ): IAutoMovieMotionHumanActionPlan {
    const {
      model,
      direction,
      broken,
      frozen,
    }: IAutoMovieMotionHumanForceThrow.IProps = props;
    const body: IAutoMovieMotionHumanBody = context.body;
    const by: string | undefined = context.params.partner;
    const fulcrum: AutoMovieHumanoidRegion | undefined = context.params.fulcrum;
    const thrower: IAutoMovieMotionHumanPerformerReader | undefined =
      by === undefined ? undefined : context.performer(by);
    const placed: IAutoMovieMotionHumanPosture | undefined = thrower?.posture?.(
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
    const swing: IAutoMovieMotionHumanForceExchange.ISwing | null =
      HumanForceExchange.swing({
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
        reason: `the momentum the pull left does not carry the body over the thrower's ${fulcrum}: at the broken base (${broken.toFixed(3)} s) the centre stands ${(centre.y - point.y).toFixed(3)} m above the fulcrum and ${Vector3.dot(r, direction).toFixed(3)} m along the pull, ${((start * 180) / Math.PI).toFixed(1)} degrees from its vertical, turning at ${((props.speed * Vector3.dot(direction, tangent)) / radius).toFixed(3)} rad/s`,
        fix: "pull harder, or bring the fulcrum under the body's centre",
      });
    const turnAt: (angle: number) => IAutoMovieQuaternion = (
      angle: number,
    ): IAutoMovieQuaternion =>
      Quaternion.fromAxisAngle(axis, ((angle - start) * 180) / Math.PI);
    const release: number = broken + swing.release;
    const state: IPlanState = swing.sample?.(swing.release) ?? {
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
    const path: (tau: number) => IAutoMovieVector3 = (
      tau: number,
    ): IAutoMovieVector3 => ({
      x: from.x + velocity.x * tau,
      y: from.y + velocity.y * tau - (g * tau * tau) / 2,
      z: from.z + velocity.z * tau,
    });
    const heading: IAutoMovieQuaternion = humanPostureHeading(frozen);
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(heading);
    const own: IAutoMovieMotionHumanPosture = {
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

    // This authored geometry is held for the entire rigid flight. Its copied
    // native constructor proves that fact without inspecting callback samples.
    const end: number = Math.max(fall, integrateMotionTrajectory.STEP);
    const fixed: integrateAirborneRotation.ICachedHistory | undefined =
      end < Infinity
        ? integrateAirborneRotation.fixed(model, body.skeleton, local, {
            from: 0,
            to: end,
          })
        : undefined;
    let rigid: IAutoMovieIntegrateAirborneRotation.IInstant | undefined;
    if (fixed === undefined) {
      const history: integrateAirborneRotation.ICachedHistory =
        integrateAirborneRotation.history(model, () => local);
      try {
        rigid = history(0);
      } finally {
        history.clear();
      }
    }
    let flight: IAutoMovieIntegrateAirborneRotation.IFlight;
    try {
      flight = integrateAirborneRotation({
        history:
          fixed ?? ((): IAutoMovieIntegrateAirborneRotation.IInstant => rigid!),
        t0: 0,
        t1: end,
        q0: Quaternion.normalize(Quaternion.multiply(turned, heading)),
        momentum,
      });
    } finally {
      fixed?.clear();
    }
    const turnIn: (tau: number) => IAutoMovieQuaternion = (
      tau: number,
    ): IAutoMovieQuaternion =>
      Quaternion.normalize(
        Quaternion.multiply(flight.orientation(tau), inverse),
      );

    // The landing: the first step at which the lowest joint reaches the floor.
    const offsets: IAutoMovieVector3[] = Array.from(
      shape.values(),
      (bone: IAutoMovieResolvedBone): IAutoMovieVector3 =>
        Vector3.subtract(bone.worldPosition, centre),
    );
    const lowest: (tau: number) => number = (tau: number): number => {
      const c: IAutoMovieVector3 = path(tau);
      const q: IAutoMovieQuaternion = turnIn(tau);
      let low: number = Number.POSITIVE_INFINITY;
      for (const offset of offsets)
        low = Math.min(low, c.y + Quaternion.rotateVectorY(q, offset));
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
      posture: (seconds: number): IAutoMovieMotionHumanPosture => {
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
   */
  export function site(
    body: Pick<IAutoMovieMotionHumanBody, "surfaces">,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    at: AutoMovieHumanForceSite,
  ): IAutoMovieVector3 {
    if (typeof at !== "string") {
      const bone: IAutoMovieResolvedBone = bones.get(at.bone)!;
      return Vector3.add(
        bone.worldPosition,
        Quaternion.rotateVector(bone.worldRotation, at.point),
      );
    }
    const frame: IAutoMovieMotionHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
      body.surfaces.regions[at];
    return resolveAutoMovieHumanoidSurfaces.point(
      frame,
      bones.get(frame.bone)!,
    );
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

/** The record of `IPlanState`'s site. */
type IPlanState = { angle: number; rate: number };
