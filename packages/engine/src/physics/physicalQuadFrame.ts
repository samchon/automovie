import type {
  IAutoMoviePhysicalRecoveryState,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import type { physicalBalanceSense } from "./physicalBalanceSense";
import { physicalQuadrupedDcmController } from "./physicalQuadrupedDcmController";
import { physicalQuadrupedStep as Step } from "./physicalQuadrupedStep";

/** The authored stance's forward, as the stance's heading reads it. */
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };

/**
 * The generic quadruped's DCM gains, per second: its force controller's
 * parameter file sets `kpX_DcmPosition` and `kpY_DcmPosition` to 2 and
 * `kpZ_DcmPosition` to 0 (201903 example-simulations
 * `parameters/simulation_force_controller.xml` l.99-101, which
 * `GenericQuadrupedModelFactory.getParameterResourceName` l.100-107 loads),
 * over the code's defaults of 1 (`DivergentComponentOfMotionController`
 * l.51-53).
 */
const DCM_GAINS: Readonly<Step.IPoint> = { x: 2.0, y: 2.0, z: 0.0 };

/**
 * How a four-support body maps onto IHMC's quadruped controller
 * (`physicalQuadPlan`, `physicalQuadTouchdown`): IHMC's z-up world frame, its
 * quadrants and its soles.
 *
 * IHMC's frame is x forward, y left and z up; this engine's is y up with +z the
 * authored forward and +x left of it (up x forward), so a point maps as (x, y,
 * z) = (Z, X, Y), a proper rotation (`physicalQuadrupedStep`).
 */
export namespace physicalQuadFrame {
  /** A world point in IHMC's frame. */
  export function ihmc(point: IAutoMovieVector3): Step.IPoint {
    return { x: point.z, y: point.x, z: point.y };
  }

  /** An IHMC point back in the world frame. */
  export function world(point: Step.IPoint): IAutoMovieVector3 {
    return { x: point.y, y: point.z, z: point.x };
  }

  /**
   * Each support limb's quadrant, from its authored endpoint against the four
   * endpoints' mean: a front leg ahead of the mean, a left leg left of it, the
   * authored stance facing +z as the stance's heading reads it
   * (`physicalBalanceStance`), so the quadrants and the body's frame (`body`)
   * agree. IHMC names its legs by the robot's build; this engine's pattern
   * names them by bone only, so the authored stance names them.
   *
   * @param sense The body's readings.
   * @returns The quadrant of each support bone, or undefined when the four
   *   limbs do not name four distinct quadrants.
   */
  export function quadrants(
    sense: physicalBalanceSense.ISense,
  ): Record<string, Step.Quadrant> | undefined {
    if (sense.limbs.length !== 4) return undefined;
    const points: IAutoMovieVector3[] = sense.limbs.map(
      (limb: physicalBalanceSense.ILimb): IAutoMovieVector3 =>
        sense.authored(limb.bone),
    );
    const mean: { x: number; z: number } = {
      x: points.reduce((sum: number, p: IAutoMovieVector3) => sum + p.x, 0) / 4,
      z: points.reduce((sum: number, p: IAutoMovieVector3) => sum + p.z, 0) / 4,
    };
    const result: Record<string, Step.Quadrant> = Object.create(null);
    sense.limbs.forEach(
      (limb: physicalBalanceSense.ILimb, index: number): void => {
        const dx: number = points[index]!.x - mean.x;
        const dz: number = points[index]!.z - mean.z;
        const front: boolean = dx * FORWARD.x + dz * FORWARD.z > 0;
        const left: boolean = dx * FORWARD.z - dz * FORWARD.x > 0;
        result[limb.bone] = front
          ? left
            ? "frontLeft"
            : "frontRight"
          : left
            ? "hindLeft"
            : "hindRight";
      },
    );
    return new Set(Object.values(result)).size === 4 ? result : undefined;
  }

  /**
   * The bone of each quadrant.
   *
   * @param quadrants Each support bone's quadrant.
   * @returns Each quadrant's bone.
   */
  export function bones(
    quadrants: Readonly<Record<string, Step.Quadrant>>,
  ): Record<Step.Quadrant, string> {
    return Object.fromEntries(
      Object.entries(quadrants).map(
        ([bone, quadrant]: [string, Step.Quadrant]): [Step.Quadrant, string] => [
          quadrant,
          bone,
        ],
      ),
    ) as Record<Step.Quadrant, string>;
  }

  /**
   * The four soles, IHMC's sole frames' origins: each limb's support endpoint
   * where it is now, or where the authored motion puts it, in IHMC's frame.
   *
   * @param sense The body's readings.
   * @param quadrants Each support bone's quadrant.
   * @param authored Whether to read the authored endpoints, false by default.
   * @returns Each quadrant's sole, metres.
   */
  export function soles(
    sense: physicalBalanceSense.ISense,
    quadrants: Readonly<Record<string, Step.Quadrant>>,
    authored: boolean = false,
  ): Record<Step.Quadrant, Step.IPoint> {
    const bone: Record<Step.Quadrant, string> = bones(quadrants);
    const at = (name: string): Step.IPoint =>
      ihmc(authored ? sense.authored(name) : sense.actual(name));
    return {
      frontLeft: at(bone.frontLeft),
      frontRight: at(bone.frontRight),
      hindRight: at(bone.hindRight),
      hindLeft: at(bone.hindLeft),
    };
  }

  /**
   * The body's z-up frame, the crossover projection's (IHMC `bodyZUpFrame`):
   * the root's position and its heading's yaw, in IHMC's frame.
   *
   * @param sense The body's readings.
   * @returns The pose.
   */
  export function body(sense: physicalBalanceSense.ISense): Step.IPose {
    const heading: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.multiply(
        sense.root.body.rotation(),
        Quaternion.inverse(sense.targets[sense.root.segment.bone]!.rotation),
      ),
      FORWARD,
    );
    return {
      position: ihmc(sense.root.body.translation()),
      yaw: Math.atan2(heading.x, heading.z),
    };
  }
  /**
   * The quadruped's centroidal moment pivot this update, IHMC's virtual
   * repellent point from its DCM controller (`physicalQuadrupedDcmController`,
   * 201903 `QuadrupedBalanceManager.compute` l.297-322): the DCM estimate xi = c
   * + v / omega (`DivergentComponentOfMotionEstimator`) driven to the plan's
   * xi_d and rate, which the plan phase writes (`physicalQuadPlan`), else the
   * authored centre of mass's at rest, with the generic quadruped's gains.
   *
   * @param input The plan's capture point and rate, world x and z, if any, the
   *   authored centre of mass, the actual centre of mass and velocity, the
   *   pendulum's rate, per second, and the floor's height.
   * @returns The pivot on the floor, world metres.
   */
  export function pivot(input: {
    desired?: NonNullable<IAutoMoviePhysicalRecoveryState["desired"]>;
    authored: IAutoMovieVector3;
    center: IAutoMovieVector3;
    velocity: IAutoMovieVector3;
    omega: number;
    floor: number;
  }): IAutoMovieVector3 {
    const point = (p: { x: number; z: number }): Step.IPoint =>
      ihmc({ x: p.x, y: 0, z: p.z });
    const vrp: Step.IPoint = physicalQuadrupedDcmController({
      estimate: point({
        x: input.center.x + input.velocity.x / input.omega,
        z: input.center.z + input.velocity.z / input.omega,
      }),
      desired: point(input.desired?.position ?? input.authored),
      desiredVelocity: point(input.desired?.velocity ?? { x: 0, z: 0 }),
      omega: input.omega,
      gains: DCM_GAINS,
    });
    const at: IAutoMovieVector3 = world(vrp);
    return { x: at.x, y: input.floor, z: at.z };
  }
}
