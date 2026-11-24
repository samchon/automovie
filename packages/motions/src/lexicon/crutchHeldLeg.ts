import {
  ANKLE_DORSIFLEXION,
  Quaternion,
  Vector3,
  getConstraint,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanLimbReference,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSequentialConvex,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walkFoot } from "../actions/walkFoot";
import { readHumanBone } from "../body/readHumanBone";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { crawl } from "../floor/crawl";
import { HumanArmRefine } from "../posture/HumanArmRefine";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanLimbFit } from "../posture/HumanLimbFit";
import { HumanSequentialConvex as SCO } from "../posture/HumanSequentialConvex";
import { HumanSequentialConvexFunctions as F } from "../posture/HumanSequentialConvexFunctions";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { crutchHeldLegDepth } from "./crutchHeldLegDepth";

/**
 * Trajopt's sco settings for a joint-space course (`OptimizeProblem`,
 * src/trajopt/problem_description.cpp lines 244-257, github.com/joschu/trajopt
 * at commit 8da5bb00b690647318a12fa4f5dd7e6c8a0f501c, BSD-2-Clause), the same
 * the arm course is solved at (`HumanArmOptimiser`), its boxes read in this
 * course's degrees.
 */
const LEG: Readonly<IAutoMovieMotionHumanSequentialConvex.IParameters> = {
  ...SCO.DEFAULTS,
  maxIter: 40,
  minApproxImproveFrac: 0.001,
  improveRatioThreshold: 0.2,
  meritErrorCoeff: 20,
  trustBoxSize: (0.1 * 180) / Math.PI,
  minTrustBoxSize: (1e-4 * 180) / Math.PI,
};

/**
 * The injured leg a crutch gait holds off the floor once the hands bear
 * (Physiopedia, Crutches: the three-point gait; HealthLinkBC, Using crutches).
 * Its foot first rises a stepping limb's rise (`crawl.LIFT`) straight up over
 * its place through the first third of the lift, as a stepping foot clears the
 * floor before it travels (`supportStep`), while the pelvis moves on above it;
 * the leg then folds from its angles there to the held hip and knee flexion on
 * a course planned once against the levels beneath the foot (`plan`, TrajOpt's
 * collision constraint), the ankle dorsiflexing by the shank's tilt up to a
 * weightless ankle's limit (`ANKLE_DORSIFLEXION.unloaded`) so the toes do not
 * pitch down. A leg the posture holds by its joints alone rises from the foot
 * where those joints stand it.
 *
 * @param props The leg, its timing and the posture it lifts from.
 * @returns The writer of a posture with the leg held, the base posture's other
 *   parts kept.
 */
export function crutchHeldLeg(
  props: crutchHeldLeg.IProps,
): (
  base: IAutoMovieMotionHumanPosture,
  seconds: number,
) => IAutoMovieMotionHumanPosture {
  const { body, side, lifted, held, read } = props;
  const leg: `${AutoMovieHumanSide}Leg` = `${side}Leg`;
  const cleared: number = lifted + (held - lifted) / 3;
  let bearing: IAutoMovieMotionHumanPosture | undefined;
  let raised: crutchHeldLeg.IRaised | undefined;
  let standing: IAutoMovieHumanLimbGoal | undefined;
  const footGoal: (
    posture: IAutoMovieMotionHumanPosture,
  ) => IAutoMovieHumanLimbGoal = (
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieHumanLimbGoal => {
    const foot: IAutoMovieResolvedBone = poseBones(
      body,
      resolveHumanPosture(body, posture),
    ).get(`${side}Foot`)!;
    return AutoMovieMotionHumanLeg.goal(
      body,
      posture,
      side,
      { ankle: foot.worldPosition, rotation: foot.worldRotation },
      false,
    );
  };
  const rising = (
    base: IAutoMovieMotionHumanPosture,
    seconds: number,
    from: IAutoMovieMotionHumanPosture,
    stood: IAutoMovieHumanLimbGoal,
  ): IAutoMovieMotionHumanPosture => {
    const s: number = minimumJerk(
      Math.min(1, (seconds - lifted) / (cleared - lifted)),
    ).s;
    return {
      ...base,
      limbs: {
        ...base.limbs,
        [leg]: {
          point: Vector3.add(stood.point, { x: 0, y: crawl.LIFT * s, z: 0 }),
          // The knee keeps the side it bent toward as the pelvis moves on.
          bend: Vector3.add(stood.bend, Vector3.subtract(base.root, from.root)),
          ...(stood.rotation !== undefined ? { rotation: stood.rotation } : {}),
        },
      },
    };
  };
  // The held leg's course from where it starts to fold, planned as TrajOpt
  // plans a chain (Schulman et al. 2014, IJRR 33:1251): its hip and knee
  // flexion at the law's phase instants (`knots`), the joint velocity cost
  // and the held pose's joint cost, trajopt's `JointVelCost` and
  // `JointPosCost` in radians at coefficient 1, under a collision constraint
  // per knot (section IV-A): the foot, every sole point of which lies within
  // its farthest sole socket of the ankle, stays a swing's clearance
  // (`walkFoot.CLEARANCE`) from the levels beneath it, the flight's treads and
  // nosings where the law gives them (`stairs`), else its floor. In the
  // leg's sagittal plane the ankle lies L1 sin θ + L2 sin(θ − k) ahead of the
  // hip and L1 cos θ + L2 cos(θ − k) below it, θ the thigh's angle forward of
  // vertical (the hip's flexion plus the pelvis's forward tilt) and k the
  // knee's flexion; the hip joint is the posture's own rigid offset of the
  // rest hip from the root, so nothing is resolved. The course is solved
  // once by trajopt's loop (`HumanSequentialConvex`) on functions
  // convexified as trajopt's (`HumanSequentialConvexFunctions`), from the
  // law's own fold as its seed, and played on the C² via-point quintic
  // (`HumanArmRefine.hermite`).
  const thigh: number = body.measure.thigh;
  const shank: number = body.measure.shank;
  const restHip: IAutoMovieVector3 = body.rest.get(`${side}UpperLeg`)!;
  // However the foot hangs, no point of it lies further below the ankle
  // than its farthest sole socket.
  const reachDown: number = Math.max(
    ...HumanFoot.SOCKETS.map(
      (socket: IAutoMovieMotionHumanFoot.Socket): number =>
        Vector3.length(HumanFoot.offset(body, side, socket)),
    ),
  );
  const knots: number[] = [
    cleared,
    held,
    ...(props.knots ?? []).filter((t: number): boolean => t > held),
  ];
  // The foot's clearance at a knot: its ankle's distance from the levels
  // beneath, less the foot's reach and the swing's clearance.
  const clearance = (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
    hip: number,
    knee: number,
  ): number => {
    const heading: IAutoMovieQuaternion = humanPostureHeading(posture);
    const joint: IAutoMovieVector3 = Vector3.add(
      posture.root,
      Quaternion.rotateVector(heading, restHip),
    );
    const theta: number = (hip + posture.pitch) * Quaternion.DEG2RAD;
    const shin: number = theta - knee * Quaternion.DEG2RAD;
    const forward: IAutoMovieVector3 = Vector3.normalize({
      ...Quaternion.rotateVector(heading, { x: 0, y: 0, z: 1 }),
      y: 0,
    });
    const ankle: IAutoMovieVector3 = Vector3.add(
      Vector3.add(
        joint,
        Vector3.scale(
          forward,
          thigh * Math.sin(theta) + shank * Math.sin(shin),
        ),
      ),
      { x: 0, y: -(thigh * Math.cos(theta) + shank * Math.cos(shin)), z: 0 },
    );
    const distance: number =
      props.stairs !== undefined
        ? crutchHeldLegDepth(
            props.stairs.steps,
            Vector3.dot(
              Vector3.subtract(ankle, props.stairs.origin),
              props.stairs.forward,
            ),
            ankle.y,
          )
        : ankle.y - props.floor!(seconds);
    return distance - reachDown - walkFoot.CLEARANCE;
  };
  const plan = (from: crutchHeldLeg.IRaised): number[][] => {
    const postures: IAutoMovieMotionHumanPosture[] = knots.map(
      (t: number): IAutoMovieMotionHumanPosture => read(t),
    );
    const seed: number[] = knots.slice(1).flatMap((t: number): number[] => {
      const s: number = minimumJerk(
        Math.min(1, (t - cleared) / (held - cleared)),
      ).s;
      return [
        from.upper[0] + (props.hip - from.upper[0]) * s,
        from.lower[0] + (props.knee - from.lower[0]) * s,
      ];
    });
    const course = (x: F.Vector): number[][] => [
      [from.upper[0], from.lower[0]],
      ...knots
        .slice(1)
        .map((_: number, j: number): number[] => [x[2 * j]!, x[2 * j + 1]!]),
    ];
    const hipRange: IAutoMovieAngleRange = range(`${side}UpperLeg`);
    const kneeRange: IAutoMovieAngleRange = range(`${side}LowerLeg`);
    const solved: IAutoMovieMotionHumanSequentialConvex.IResult<
      F.Vector,
      IAutoMovieMotionHumanSequentialConvex.IEvaluation
    > = SCO.minimise(
      F.problem({
        costs: [
          {
            f: (x: F.Vector): number => {
              const c: number[][] = course(x);
              let sum: number = 0;
              for (let j: number = 0; j + 1 < c.length; ++j)
                for (let d: number = 0; d < 2; ++d)
                  sum +=
                    ((c[j + 1]![d]! - c[j]![d]!) * Quaternion.DEG2RAD) ** 2;
              return sum;
            },
            full: true,
          },
          {
            f: (x: F.Vector): number => {
              let sum: number = 0;
              knots.forEach((t: number, j: number): void => {
                if (j === 0 || t < held) return;
                sum +=
                  ((x[2 * (j - 1)]! - props.hip) * Quaternion.DEG2RAD) ** 2 +
                  ((x[2 * (j - 1) + 1]! - props.knee) * Quaternion.DEG2RAD) **
                    2;
              });
              return sum;
            },
            full: false,
          },
        ],
        // A leg with no level beneath it given has no collision row.
        constraints:
          props.stairs === undefined && props.floor === undefined
            ? []
            : [
                {
                  g: (x: F.Vector): F.Vector =>
                    knots
                      .slice(1)
                      .map(
                        (t: number, j: number): number =>
                          -clearance(
                            postures[j + 1]!,
                            t,
                            x[2 * j]!,
                            x[2 * j + 1]!,
                          ),
                      ),
                  equality: false,
                },
              ],
        low: seed.map((_: number, i: number): number =>
          i % 2 === 0 ? hipRange.min : kneeRange.min,
        ),
        high: seed.map((_: number, i: number): number =>
          i % 2 === 0 ? hipRange.max : kneeRange.max,
        ),
      }),
      seed,
      LEG,
    );
    return course(solved.x);
  };
  const range = (bone: AutoMovieHumanoidBone): IAutoMovieAngleRange =>
    getConstraint(bone, readHumanBone(body, bone)?.constraint ?? null)
      ?.flexion ?? { min: -Infinity, max: Infinity };
  let planned: number[][] | undefined;
  return (
    base: IAutoMovieMotionHumanPosture,
    seconds: number,
  ): IAutoMovieMotionHumanPosture => {
    if (seconds <= lifted) return base;
    // Read at the bearing stance's last representable instant: at `lifted`
    // itself a support plan has already let the foot's goal go.
    bearing ??= read(lifted - Math.abs(lifted) * Number.EPSILON);
    // A plan that holds the foot by its joints alone gives it no goal: the
    // goal is then the foot where those joints stand it.
    standing ??= bearing.limbs[leg] ?? footGoal(bearing);
    const stood: IAutoMovieHumanLimbGoal = standing;
    if (seconds < cleared) return rising(base, seconds, bearing, stood);
    if (raised === undefined) {
      const pose: IAutoMoviePose = resolveHumanPosture(
        body,
        rising(read(cleared), cleared, bearing, stood),
      );
      const ankle: IAutoMovieJointPose | undefined = pose.joints.find(
        (j: IAutoMovieJointPose): boolean => j.bone === `${side}Foot`,
      );
      raised = {
        ...HumanLimbFit.reference(pose, leg),
        foot: [ankle?.flexion ?? 0, ankle?.abduction ?? 0, ankle?.twist ?? 0],
      };
    }
    const from: crutchHeldLeg.IRaised = raised;
    planned ??= plan(from);
    const s: number = minimumJerk(
      Math.min(1, (seconds - cleared) / (held - cleared)),
    ).s;
    const [hip, knee] = HumanArmRefine.hermite(knots, planned, seconds) as [
      number,
      number,
    ];
    const tilt: number = knee - from.lower[0] - (hip - from.upper[0]);
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...base.limbs };
    delete limbs[leg];
    return {
      ...base,
      limbs,
      joints: {
        ...base.joints,
        [`${side}UpperLeg`]: [
          hip,
          from.upper[1] * (1 - s),
          from.upper[2] * (1 - s),
        ],
        [`${side}LowerLeg`]: [
          knee,
          from.lower[1] * (1 - s),
          from.lower[2] * (1 - s),
        ],
        [`${side}Foot`]: [
          from.foot[0] +
            Math.min(
              Math.max(0, ANKLE_DORSIFLEXION.unloaded - from.foot[0]),
              Math.max(0, tilt),
            ),
          from.foot[1],
          from.foot[2],
        ],
      },
    };
  };
}

/** Companion types of {@link crutchHeldLeg}. */
export namespace crutchHeldLeg {
  /** The leg to hold and when. */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The injured side. */
    side: AutoMovieHumanSide;

    /** When the foot leaves the floor, action seconds. */
    lifted: number;

    /** When the leg is held, action seconds. */
    held: number;

    /** The held hip flexion, degrees. */
    hip: number;

    /** The held knee flexion, degrees. */
    knee: number;

    /** The law's posture before the leg is held, by action second. */
    read: (seconds: number) => IAutoMovieMotionHumanPosture;

    /**
     * The height of the level beneath the held foot at an action second, world
     * metres, where the law gives no flight; the held angles alone when neither
     * is given.
     */
    floor?: (seconds: number) => number;

    /** The flight beneath the held foot, its treads and nosings. */
    stairs?: IStairs;

    /**
     * The law's phase instants after the leg is held, action seconds: the
     * course's further knots.
     */
    knots?: readonly number[];
  }

  /** A flight's profile in the vertical plane of its climb. */
  export interface IStairs {
    /** Where its distances ahead are measured from, world metres. */
    origin: IAutoMovieVector3;

    /** The climb's horizontal direction, a unit vector. */
    forward: IAutoMovieVector3;

    /** Its levels, nearest first. */
    steps: readonly IStep[];
  }

  /** One level of a flight: solid below its height from where it begins. */
  export interface IStep {
    /** Where it begins ahead of the origin, metres. */
    from: number;

    /** Its height, world metres. */
    height: number;
  }

  /**
   * The leg where it starts to fold: its hip's and knee's angles and its
   * ankle's, degrees.
   */
  export interface IRaised extends IAutoMovieHumanLimbReference {
    /** The ankle's `[flexion, abduction, twist]`, degrees. */
    foot: readonly [number, number, number];
  }
}
