import {
  AutoMovieStationHermite,
  Quaternion,
  RigidCarrierSample,
  Vector3,
  integrateMotionTrajectory,
  samplePoseVelocity,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieSwivelSeed,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPropFrame } from "../perform/HumanPropFrame";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanLimbFit } from "../posture/HumanLimbFit";
import { poseBones } from "../posture/internal/poseBones";

/** A dismount's material-frame custody up to the instant it leaves support. */
export namespace HumanMountOffSupports {
  /** A measured world twist at the exact outgoing support boundary. */
  interface IRate {
    /** Linear velocity, world metres per second. */
    readonly velocity: IAutoMovieVector3;

    /** Angular velocity, world radians per second. */
    readonly spin: IAutoMovieVector3;
  }

  /** A prepared world frame, frozen at the actual release for flight. */
  export interface IFrame extends IRate {
    /** The last held pose, on the exact release second. */
    readonly end: IAutoMovieRigidTransform;

    /** The world frame at an action second. */
    at(seconds: number): IAutoMovieRigidTransform;
  }

  /** A support's world frame at a film second. */
  type Read = (film: number) => IAutoMovieRigidTransform;

  /** A planted foot's exact world goal, including its complete orientation. */
  type Foot = IAutoMovieHumanLimbGoal & { rotation: IAutoMovieQuaternion };

  /** The source pose and named material readers of the dismount. */
  type Context = Pick<
    IAutoMovieMotionHumanActionContext,
    "body" | "entry" | "prop" | "start"
  >;

  /** The goal while the foot bears, and its world placement on departing. */
  export interface IFoot extends IRate {
    /** The last supported foot goal. */
    readonly end: Foot;

    /** The goal at an action second. */
    at(seconds: number): Foot;
  }

  /** The dismount's already-authored world trajectory receives this offset. */
  export type Offset = (elapsed: number) => IAutoMovieRigidTransform;

  /** A stationary frame has neither linear nor angular motion. */
  const STILL: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

  /**
   * Prepare a named entry plant from its displayed ankle and knee. The raw
   * goal supplies the material ball socket, and the displayed joints supply
   * the branch the solver actually chose.
   */
  export function feet(
    context: Context,
    off: (side: AutoMovieHumanSide) => number,
  ): Partial<Record<AutoMovieHumanSide, IFoot>> {
    const { body, entry, start }: Context = context;
    const held: IAutoMovieMotionHumanEntryState.ISupport[] = [];
    const requested: Set<AutoMovieHumanoidBone> = new Set();
    for (const side of ["left", "right"] as const) {
      const bearing: IAutoMovieMotionHumanEntryState.ISupport | undefined =
        entry.supports.find(
          (contact): boolean =>
            contact.part === `${side}Foot` &&
            contact.kind === "plant" &&
            (contact.socket === "ball" ||
              (contact.socket !== undefined &&
                typeof contact.socket !== "string" &&
                Number.isFinite(contact.socket.x) &&
                Number.isFinite(contact.socket.y) &&
                Number.isFinite(contact.socket.z))) &&
            contact.support.kind === "prop" &&
            contact.support.point !== undefined,
        );
      if (bearing === undefined || !entry.feet[side].planted) continue;
      held.push(bearing);
      requested.add(`${side}LowerLeg`);
    }
    const out: Partial<Record<AutoMovieHumanSide, IFoot>> = {};
    if (requested.size === 0) return out;
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      entry.pose,
      undefined,
      requested,
    );
    for (const bearing of held) {
      if (bearing.support.kind !== "prop") continue;
      const prop: ReturnType<Context["prop"]> = context.prop(
        bearing.support.subject,
      );
      const name: string | undefined = bearing.support.point;
      if (
        typeof bearing.socket === "object" &&
        !prop.prop.affordances?.some(
          (site) => site.id === name && site.kind === "stirrup",
        )
      )
        continue;
      const side: AutoMovieHumanSide =
        bearing.part === "leftFoot" ? "left" : "right";
      const displayed: IAutoMovieMotionHumanEntryState.IFoot = entry.feet[side];
      const knee: IAutoMovieResolvedBone | undefined = bones.get(`${side}LowerLeg`);
      if (knee === undefined) continue;
      const frame: IFrame | undefined = material(
        prop,
        name,
        start,
        off(side),
        { position: displayed.ankle, rotation: displayed.rotation },
      );
      if (frame === undefined) continue;
      const limb: "leftLeg" | "rightLeg" = `${side}Leg`;
      const seed: IAutoMovieSwivelSeed | null = HumanLimbFit.seed(
        body,
        entry.pose,
        limb,
      );
      out[side] = foot(
        {
          point: displayed.ankle,
          rotation: displayed.rotation,
          bend: knee.worldPosition,
          contact:
            typeof bearing.socket === "object"
              ? bearing.socket
              : (entry.posture.limbs[limb]?.contact ??
                HumanFoot.offset(body, side, "ball")),
          planted: true,
          ...(seed === null ? {} : { seed }),
        },
        frame,
      );
    }
    return out;
  }

  /**
   * Read the named material when one is declared. A stationary interval is
   * borrowed only when the original rigid carrier proves the whole hold.
   */
  export function material(
    prop: IAutoMovieMotionHumanPropReader,
    name: string | undefined,
    start: number,
    release: number,
    world: IAutoMovieRigidTransform,
  ): IFrame | undefined {
    const site: IAutoMovieMotionHumanPropReader["site"] = prop.site;
    if (name !== undefined && site === undefined) return undefined;
    const fixed: boolean =
      name === undefined &&
      (RigidCarrierSample.holds(prop.prop)?.some(
        (hold: RigidCarrierSample.IHold): boolean =>
          hold.contains(start) && hold.contains(start + release),
      ) ?? false);
    return frame(
      name === undefined
        ? (film: number): IAutoMovieRigidTransform => prop.frame(film)
        : (film: number): IAutoMovieRigidTransform => site!.call(prop, name, film),
      start,
      release,
      world,
      fixed,
    );
  }

  /**
   * Keep a displayed pose in the material's coordinates until release. The
   * actual release is prepared once, so a free pose never reads the carrier.
   */
  export function frame(
    read: Read,
    start: number,
    release: number,
    world: IAutoMovieRigidTransform,
    fixed: boolean = false,
  ): IFrame {
    if (fixed || release <= 0)
      return { end: world, velocity: STILL, spin: STILL, at: () => world };
    const local: IAutoMovieRigidTransform = HumanPropFrame.relative(
      read(start),
      world,
    );
    const at = (seconds: number): IAutoMovieRigidTransform =>
      seconds <= 0
        ? world
        : HumanPropFrame.compose(read(start + seconds), local);
    const end: IAutoMovieRigidTransform = at(release);
    // The same left-sided derivative as motion entry, using only the named
    // material while it still bore the body. No request crosses release.
    const h: number = Math.min(integrateMotionTrajectory.STEP, release / 2);
    const near: IAutoMovieRigidTransform = at(release - h);
    const far: IAutoMovieRigidTransform = at(release - 2 * h);
    const rate = (
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      Vector3.scale(Vector3.subtract(Vector3.scale(a, 4), b), 1 / (2 * h));
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(end.rotation);
    const delta = (other: IAutoMovieRigidTransform): IAutoMovieVector3 =>
      Vector3.scale(
        samplePoseVelocity.rotationVector(
          Quaternion.multiply(other.rotation, inverse),
        ),
        -1,
      );
    const velocity: IAutoMovieVector3 = rate(
      Vector3.subtract(end.position, near.position),
      Vector3.subtract(end.position, far.position),
    );
    return {
      end,
      velocity,
      spin: rate(delta(near), delta(far)),
      at: (seconds: number): IAutoMovieRigidTransform =>
        seconds >= release ? end : at(seconds),
    };
  }

  /**
   * Follow the held ankle's full rotation with its knee and leave the ball
   * socket and the measured swivel branch in their owning ankle coordinates.
   */
  export function foot(goal: Foot, held: IFrame): IFoot {
    const bend: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(goal.rotation),
      Vector3.subtract(goal.bend, goal.point),
    );
    const place = (ankle: IAutoMovieRigidTransform): Foot => ({
      ...goal,
      point: ankle.position,
      rotation: ankle.rotation,
      bend: Vector3.add(
        ankle.position,
        Quaternion.rotateVector(ankle.rotation, bend),
      ),
    });
    const first: IAutoMovieRigidTransform = held.at(0);
    const end: Foot = held.end === first ? goal : place(held.end);
    return {
      end,
      velocity: held.velocity,
      spin: held.spin,
      at: (seconds: number): Foot => {
        if (seconds <= 0) return goal;
        const ankle: IAutoMovieRigidTransform = held.at(seconds);
        return ankle === held.end ? end : place(ankle);
      },
    };
  }

  /**
   * Add the outgoing material's measured motion to a stationary-ended flight
   * curve. The quintic's first derivative is one at release and its value
   * and derivatives are zero at the destination, so the floor is unaltered.
   */
  export function departure(rate: IRate, span: number): Offset | undefined {
    const speed: number = Vector3.length(rate.spin) / Quaternion.DEG2RAD;
    if (
      !(span > 0) ||
      (Vector3.dot(rate.velocity, rate.velocity) === 0 && speed === 0)
    )
      return undefined;
    const turn: ReturnType<typeof Quaternion.prepareAxisAngle> =
      Quaternion.prepareAxisAngle(rate.spin);
    return (elapsed: number): IAutoMovieRigidTransform => {
      const u: number = Math.min(1, Math.max(0, elapsed / span));
      const weight: number = AutoMovieStationHermite.weights(
        u,
        span,
        0,
        true,
      )[1]!;
      return {
        position: Vector3.scale(rate.velocity, weight),
        rotation: turn(speed * weight),
      };
    };
  }
}
