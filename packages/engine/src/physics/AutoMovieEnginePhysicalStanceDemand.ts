import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { convexHull2D } from "../math/internal/convexHull2D";
import { AutoMoviePhysicalBalance } from "./AutoMoviePhysicalBalance";
import type { AutoMovieXpbdBody } from "./AutoMovieXpbdBody";
import { AutoMovieEnginePhysicalBipedPressure } from "./AutoMovieEnginePhysicalBipedPressure";
import type { AutoMovieEnginePhysicalIcpController } from "./AutoMovieEnginePhysicalIcpController";
import { AutoMovieEnginePhysicalLegCapacity } from "./AutoMovieEnginePhysicalLegCapacity";
import { AutoMovieEnginePhysicalStanceAllocation } from "./AutoMovieEnginePhysicalStanceAllocation";
import { AutoMovieEnginePhysicalStanceBalance } from "./AutoMovieEnginePhysicalStanceBalance";
import { AutoMovieEnginePhysicalStanceHip } from "./AutoMovieEnginePhysicalStanceHip";
import { AutoMovieEnginePhysicalStancePressure } from "./AutoMovieEnginePhysicalStancePressure";
import { AutoMovieEnginePhysicalStanceSupport } from "./AutoMovieEnginePhysicalStanceSupport";
import { physicalSupportFootprint } from "./internal/physicalSupportFootprint";

/** A support limb of the balance pattern. */
type Limb = IAutoMovieFootfallPattern["limbs"][number];

/**
 * The stance's support wrench for one balance step (`AutoMovieEnginePhysicalStanceBalance`):
 * its inputs, its result and the demand that builds it.
 */
export namespace AutoMovieEnginePhysicalStanceDemand {
  /** One balance step's inputs. */
  export interface IInput {
    /** Admitted settings. */
    settings: Pick<
      IAutoMoviePhysicalSimulationInput.IInput,
      "gravity" | "floor"
    >;
    /** The body. */
    body: IAutoMoviePhysicalSimulationInput.IBody;
    /** Its native segments. */
    segments: ReadonlyMap<string, AutoMovieXpbdBody>;
    /** The planted stance limbs, whose outlines bound the command. */
    stance: readonly Limb[];
    /**
     * Each stance limb's foot this step: its bearing share, which bounds its
     * normal force and is zero once it bears nothing, and its flatness share,
     * which draws its centre-of-pressure rows from its shrunken outline (flat
     * on its plant) to its ankle joint centre (bearing on an edge as a point
     * foot, where it can transmit no ankle torque; Coros, Beaudoin and van de
     * Panne 2010, Section 3.3), both ramped (`FADE`). One model serves the
     * allocation and the J^T chain: a joint is never dropped after allocating.
     */
    feet: Readonly<
      Record<
        string,
        {
          bearing: number;
          flat: number;
          ankle: IAutoMovieVector3;
          /**
           * Where an unseated foot bears now: its bearing face at its present
           * pose.
           */
          edge?: readonly IAutoMovieVector3[];
          /**
           * Its low-passed measured floor load, newtons, the force its leg's
           * joints carry now (`hipRoom`); absent takes its bearing share of the
           * lift.
           */
          load?: number;
        }
      >
    >;
    /**
     * The planted poses of the stance limbs' carriers: authored, moved by a
     * landed step.
     */
    planted: Readonly<Record<string, IAutoMovieRigidTransform>>;
    /** The authored pose's centre of mass, world metres. */
    center: IAutoMovieVector3;
    /**
     * Whether a recovery step has landed, so the stance stands on a new
     * polygon.
     */
    landed?: boolean;
    /**
     * The capture point's shift for the body's angular momentum (`spin`),
     * metres.
     */
    spin?: IAutoMovieVector3;
    /** Its velocity, world metres per second. */
    velocity: IAutoMovieVector3;
    /** The torso's servo moment and any swing hip's reaction, world N m. */
    torque: IAutoMovieVector3;
    /** The point the moment is taken about, world metres. */
    origin: IAutoMovieVector3;
    /**
     * The trunk's intended world rotation, which the hip strategy's angle is
     * measured from (`hip`); absent, no hip strategy.
     */
    intended?: IAutoMovieQuaternion;
    /** The tracking strength in [0, 1]. */
    strength: number;
    /** The centre-of-pressure integral's bias, world metres (`integrate`). */
    bias?: IAutoMovieVector3;

    /**
     * IHMC's capture-point feedback controller for a two-support body
     * (`AutoMovieEnginePhysicalBipedPressure`): its state, the plan's capture point and rate,
     * world x and z, absent for the authored centre of mass's at rest, and the
     * controller's update period, seconds. With it the controller sets the
     * centre of pressure and pivot, and the law, the allocation, the bias and
     * the trunk's horizontal moment are not used.
     */
    icp?: IInputIcp;

    /**
     * The pendulum's rate the controller runs at, per second
     * (`IAutoMoviePhysicalRecoveryState.omega`); absent, sqrt(g / h) at the
     * authored centre of mass's height over the floor.
     */
    omega?: number;
  }

  /** The icp object of {@link IInput}. */
  export type IInputIcp = {
    state: AutoMovieEnginePhysicalIcpController.IState;
    desired?: {
      position: { x: number; z: number };
      velocity: { x: number; z: number };
    };
    dt: number;
    /** Whether a foot swings, which selects the yaw rate command. */
    swinging?: boolean;
  };

  /** One balance step's demand and bearing. */
  export interface IResult {
    /** The support force, newtons. */
    force: IAutoMovieVector3;
    /** The support moment about the origin, N m. */
    torque: IAutoMovieVector3;
    /**
     * The extrapolated centre of mass, its reference and the command, world
     * metres.
     */
    capture: IAutoMovieVector3;
    /** The reference. */
    reference: IAutoMovieVector3;
    /** The centre of pressure commanded on the support. */
    pressure: IAutoMovieVector3;
    /**
     * The centroidal moment pivot the pendulum's force is aimed through, world
     * metres; it may leave the support (`allocate`).
     */
    pivot: IAutoMovieVector3;
    /** Whether the law's command was trimmed. */
    clamped: boolean;
    /**
     * The actual centre of mass and its velocity, world metres and metres per
     * second.
     */
    center: IAutoMovieVector3;
    /** Its velocity. */
    velocity: IAutoMovieVector3;
    /** The pendulum's natural frequency, per second. */
    omega: number;
    /**
     * The world axis, unit length, the hip strategy turns the trunk about,
     * which the stance hips release while it runs (design-4017-edge, E2);
     * absent without it.
     */
    release?: IAutoMovieVector3;

    /** The capture-point feedback controller's next state, when it ran. */
    icp?: AutoMovieEnginePhysicalIcpController.IState;

    /**
     * IHMC's weighted objective for the root task, when a controller of IHMC's
     * ran (`IObjective`).
     */
    objective?: AutoMovieEnginePhysicalStancePressure.IObjective;
  }

  /**
   * The demand of one step.
   *
   * @param input The step's inputs.
   * @returns The demand and bearing, or undefined with no stance outline.
   */
  export function demand(input: IInput): IResult | undefined {
    const { settings, body, segments } = input;
    const floor: number = settings.floor;
    const gravity: number =
      Vector3.length(settings.gravity) *
      (body.mode.kind === "exaggerated" ? body.mode.gravity : 1);
    const mass: number = body.profile.mass;
    const height: number = input.center.y - floor;
    if (!(height > 0) || !(input.strength > 0)) return undefined;
    const omega: number = input.omega ?? Math.sqrt(gravity / height);

    // Without gravity there is no pendulum to balance: the root's task is the
    // mass centre's servo (`physicalRootDemand`).
    if (!(omega > 0)) return undefined;
    const outlines: { limb: Limb; outline: IAutoMovieVector3[] }[] =
      input.stance
        .map((limb: Limb) => ({
          limb,
          outline: convexHull2D(
            physicalSupportFootprint(body.profile, input.planted, limb, floor),
          ),
        }))
        .filter((entry) => entry.outline.length > 0);
    if (outlines.length === 0) return undefined;
    // The reference lies on the planted polygon; the command on what can bear
    // now (`support`).
    const planted: IAutoMovieVector3[] = AutoMovieEnginePhysicalStanceSupport.shrink(
      convexHull2D(outlines.flatMap((entry) => entry.outline)),
      AutoMovieEnginePhysicalStanceBalance.MARGIN,
    );
    const bearable = AutoMovieEnginePhysicalStanceSupport.support(
      outlines
        .filter(({ limb }) => (input.feet[limb.bone]?.bearing ?? 0) > 0)
        .map(({ limb, outline }) => ({
          limb,
          outline,
          bearing: input.feet[limb.bone]!.bearing,
          flat: input.feet[limb.bone]!.flat,
          ankle: { ...input.feet[limb.bone]!.ankle, y: floor },
          ...(input.feet[limb.bone]!.edge
            ? { edge: input.feet[limb.bone]!.edge! }
            : {}),
        })),
    );
    const bearing: { limb: Limb; points: IAutoMovieVector3[] }[] =
      bearable.feet;
    if (bearing.length === 0) return undefined;
    const polygon: IAutoMovieVector3[] = bearable.polygon;
    let center: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    let velocity: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const segment of body.profile.segments) {
      const rigid: AutoMovieXpbdBody = segments.get(segment.bone)!;
      const at: IAutoMovieVector3 = Vector3.add(
        rigid.translation(),
        Quaternion.rotateVector(rigid.rotation(), segment.centerOfMass),
      );
      const share: number = segment.mass / mass;
      center = Vector3.add(center, Vector3.scale(at, share));
      velocity = Vector3.add(
        velocity,
        Vector3.scale(rigid.velocityAtPoint(at), share),
      );
    }
    // The body's rotation counts in its capture point (`spin`).
    const capture: IAutoMovieVector3 = {
      x: center.x + velocity.x / omega + (input.spin?.x ?? 0),
      y: floor,
      z: center.z + velocity.z / omega + (input.spin?.z ?? 0),
    };
    // After a landed step the reference is the new polygon's centroid: the
    // authored stance no longer describes where the body stands, and a
    // reference left at the old one pulls it back (Pratt et al., M2V2,
    // Section VII-E1, "stop in double support").
    const reference: IAutoMovieVector3 = input.landed
      ? AutoMovieEnginePhysicalStanceSupport.centroid(planted, floor)
      : AutoMoviePhysicalBalance.nearest(planted, {
          x: input.center.x + input.velocity.x / omega,
          y: floor,
          z: input.center.z + input.velocity.z / omega,
        });
    const command: IAutoMovieVector3 = AutoMovieEnginePhysicalStanceAllocation.law(
      capture,
      reference,
      input.bias,
    );
    const weight: number = mass * gravity;
    const lift: number = Math.max(
      weight * (1 - AutoMovieEnginePhysicalStanceBalance.BAND),
      Math.min(
        weight * (1 + AutoMovieEnginePhysicalStanceBalance.BAND),
        weight +
          mass * omega * omega * (input.center.y - center.y) -
          2 * mass * omega * (velocity.y - input.velocity.y),
      ),
    );
    // The torso's moment asks the centre of pressure to lie (tau_z, -tau_x) /
    // F_y from the pivot; the support is shared between capture, that moment
    // and convergence in that order, convergence before the moment in the
    // band past the shrunken edge (`allocate`), and the moment borne is
    // what the two points' offset carries. Its yaw is borne as asked: the
    // feet turn the body only by their friction about the vertical, which the
    // support cascade's torsional rows carry within their levers' cones
    // (`AutoMovieXpbdSupportRows`; design-4017-qp3, Section 1, rule 2).
    const limbs: readonly Limb[] =
      (body.supportTracking?.pattern ?? body.balance?.pattern)?.limbs ??
      input.stance;
    // No foot is asked for more of the weight than its leg's joints hold at
    // its present pose (`AutoMovieEnginePhysicalLegCapacity`): the command's region is the
    // support cut to where every foot's share stays within its capacity.
    const capacity: IAutoMovieVector3[] | undefined =
      AutoMovieEnginePhysicalLegCapacity.region(
        bearing.map(({ limb, points }) => {
          const middle: IAutoMovieVector3 = Vector3.scale(
            points.reduce(
              (
                sum: IAutoMovieVector3,
                p: IAutoMovieVector3,
              ): IAutoMovieVector3 => Vector3.add(sum, p),
              { x: 0, y: 0, z: 0 },
            ),
            1 / Math.max(1, points.length),
          );
          return {
            points,
            share:
              AutoMovieEnginePhysicalLegCapacity.compute({
                profile: body.profile,
                segments,
                chain: limb.chain,
                point: { ...middle, y: floor },
              }) / lift,
          };
        }),
      );
    // Each bearing foot's present load at its bearing points' middle: its
    // measured floor load, or its bearing share of the lift without one.
    const shares: number = bearing.reduce(
      (sum: number, { limb }): number => sum + input.feet[limb.bone]!.bearing,
      0,
    );
    const carried: { limb: Limb; point: IAutoMovieVector3; force: number }[] =
      bearing.map(({ limb, points }) => ({
        limb,
        point: {
          ...Vector3.scale(
            points.reduce(
              (
                sum: IAutoMovieVector3,
                p: IAutoMovieVector3,
              ): IAutoMovieVector3 => Vector3.add(sum, p),
              { x: 0, y: 0, z: 0 },
            ),
            1 / Math.max(1, points.length),
          ),
          y: floor,
        },
        force:
          input.feet[limb.bone]!.load ??
          (lift * input.feet[limb.bone]!.bearing) / Math.max(1e-9, shares),
      }));
    const capped = (
      outline: readonly IAutoMovieVector3[],
    ): readonly IAutoMovieVector3[] => {
      if (!capacity) return outline;
      const cut: IAutoMovieVector3[] = AutoMovieEnginePhysicalLegCapacity.intersect(
        outline,
        capacity,
      );
      return cut.length >= 3 ? cut : outline;
    };
    // A two-support body's centre of pressure and pivot are IHMC's
    // capture-point feedback controller's (`AutoMovieEnginePhysicalBipedPressure`); the
    // law's command, the allocation and the trunk's offset are not used.
    const icp: AutoMovieEnginePhysicalBipedPressure.IResult | undefined = input.icp
      ? AutoMovieEnginePhysicalBipedPressure.compute({
          state: input.icp.state,
          outlines: outlines.map(
            (entry: {
              limb: Limb;
              outline: IAutoMovieVector3[];
            }): IAutoMovieVector3[] => entry.outline,
          ),
          ...(input.icp.desired ? { desired: input.icp.desired } : {}),
          authored: { center: input.center, velocity: input.velocity },
          center,
          velocity,
          omega,
          dt: input.icp.dt,
          floor,
        })
      : undefined;
    const {
      pressure,
      pivot,
      clamped,
      strategy,
    }: ReturnType<typeof AutoMovieEnginePhysicalStanceAllocation.allocate> = icp
      ? { pressure: icp.pressure, pivot: icp.pivot, clamped: !icp.converged }
      : AutoMovieEnginePhysicalStanceAllocation.allocate({
          capture,
          reference,
          command,
          offset: {
            x: input.torque.z / lift,
            y: 0,
            z: -input.torque.x / lift,
          },
          shrunken: capped(polygon),
          support: capped(bearable.hull),
          // The bearing feet's hips deliver the ground's moment on the body
          // with the room their feet's forces leave them (`hipRoom`): the
          // pivot's offset along d turns the body about the axis across it,
          // (d_z, 0, -d_x).
          bound: (direction: IAutoMovieVector3): number =>
            AutoMovieEnginePhysicalStanceHip.hipRoom({
              profile: body.profile,
              segments,
              stance: carried,
              axis: { x: direction.z, y: 0, z: -direction.x },
            }) / lift,
          ...(input.intended
            ? {
                hip: (direction: IAutoMovieVector3): number | undefined => {
                  const strategy = AutoMovieEnginePhysicalStanceHip.hip({
                    profile: body.profile,
                    segments,
                    limbs,
                    stance: input.stance,
                    direction,
                    intended: input.intended!,
                  });
                  if (!strategy) return undefined;
                  // Bang-bang: out while the trunk can still be stopped within
                  // the angle left, back once its turn would carry it past.
                  const braking: boolean =
                    strategy.rate > 0 &&
                    (strategy.rate * strategy.rate * strategy.inertia) /
                      (2 * strategy.torque) >=
                      strategy.angle;
                  if (!braking && !(strategy.angle > 0)) return undefined;
                  return ((braking ? -1 : 1) * strategy.torque) / lift;
                },
              }
            : {}),
        });
    const aimed: IAutoMovieVector3 = Vector3.scale(
      {
        x: mass * omega * omega * (center.x - pivot.x),
        y: lift,
        z: mass * omega * omega * (center.z - pivot.z),
      },
      input.strength,
    );

    // The controllers' pivots are not bounded, so their force is held within
    // the body's maximum root force, as the root's other tasks hold theirs
    // (`physicalRootExternal`, `physicalCentroidalTask`).
    const most: number = body.maximumRootForce * input.strength;
    const force: IAutoMovieVector3 =
      icp && Vector3.length(aimed) > most
        ? Vector3.scale(aimed, most / Vector3.length(aimed))
        : aimed;
    const reaction: IAutoMovieVector3 = {
      x: -(pressure.z - pivot.z) * lift,
      y: input.torque.y,
      z: (pressure.x - pivot.x) * lift,
    };
    const torque: IAutoMovieVector3 = Vector3.add(
      Vector3.cross(Vector3.subtract(center, input.origin), force),
      Vector3.scale(reaction, input.strength),
    );
    const objective: IResult["objective"] = icp
      ? AutoMovieEnginePhysicalStancePressure.objective({
          center,
          swinging: input.icp?.swinging === true,
          outlines,
          planted: input.planted,
          point: icp.pressure,
        })
      : undefined;
    return {
      force,
      torque,
      capture,
      reference,
      pressure,
      pivot,
      clamped,
      center,
      velocity,
      omega,
      // The hip strategy turns the trunk about the stance hips' axis across
      // its outward direction, which the stance hips release (`hip`).
      ...(strategy ? { release: { x: strategy.z, y: 0, z: -strategy.x } } : {}),
      ...(icp ? { icp: icp.state } : {}),
      ...(objective ? { objective } : {}),
    };
  }
}
