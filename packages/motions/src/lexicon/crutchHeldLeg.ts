import {
  ANKLE_DORSIFLEXION,
  Quaternion,
  Vector3,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanLimbReference,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walkFoot } from "../actions/walkFoot";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { crawl } from "../floor/crawl";
import { HumanFoot } from "../posture/HumanFoot";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The injured leg a crutch gait holds off the floor once the hands bear
 * (Physiopedia, Crutches: the three-point gait; HealthLinkBC, Using
 * crutches). Its foot first rises a stepping limb's rise (`crawl.LIFT`)
 * straight up over its place through the first third of the lift, as a
 * stepping foot clears the floor before it travels (`supportStep`), while the
 * pelvis moves on above it; the leg then folds from its angles there to the
 * held hip and knee flexion, the ankle dorsiflexing by the shank's tilt up to
 * a weightless ankle's limit (`ANKLE_DORSIFLEXION.unloaded`) so the toes do
 * not pitch down. A leg the posture holds by its joints alone rises from the
 * foot where those joints stand it.
 *
 * @param props The leg, its timing and the posture it lifts from.
 * @returns The writer of a posture with the leg held, the base posture's other parts kept.
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
  // The hip flexion nearest the asked one that keeps the held foot's every
  // sole point a swing's clearance (`walkFoot.CLEARANCE`) above the level
  // beneath it, in closed form: in the leg's sagittal plane the ankle hangs
  // L1 cos θ + L2 cos(θ − k) = A cos(θ − φ) below the hip, θ the thigh's
  // angle forward of vertical (the hip's flexion plus the pelvis's forward
  // tilt) and k the knee's flexion, so it hangs lower than a drop D only
  // within acos(D / A) of φ. The hip joint is the posture's own rigid offset
  // of the rest hip from the root; nothing is resolved.
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
  const clearing: (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
    knee: number,
    hip: number,
  ) => number = (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
    knee: number,
    hip: number,
  ): number => {
    if (props.floor === undefined) return hip;
    const hipY: number =
      posture.root.y +
      Quaternion.rotateVector(resolveHumanPosture.heading(posture), restHip).y;
    const drop: number =
      hipY -
      (props.floor(seconds) + reachDown + walkFoot.CLEARANCE);
    const k: number = knee * Quaternion.DEG2RAD;
    const a: number = Math.hypot(
      thigh + shank * Math.cos(k),
      shank * Math.sin(k),
    );
    if (drop >= a) return hip;
    // The ankle is too low within acos(D / A) of φ, the angle of its
    // lowest hang: the thigh is moved to the nearer edge of that band.
    const phi: number = Math.atan2(shank * Math.sin(k), thigh + shank * Math.cos(k));
    const band: number = Math.acos(Math.max(-1, drop / a));
    const theta: number = (hip + posture.pitch) * Quaternion.DEG2RAD;
    if (Math.abs(theta - phi) >= band) return hip;
    const edge: number = theta >= phi ? phi + band : phi - band;
    return edge / Quaternion.DEG2RAD - posture.pitch;
  };
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
        ...resolveHumanPosture.reference(pose, leg),
        foot: [ankle?.flexion ?? 0, ankle?.abduction ?? 0, ankle?.twist ?? 0],
      };
    }
    const from: crutchHeldLeg.IRaised = raised;
    const start: number = cleared;
    const s: number = minimumJerk(
      Math.min(1, (seconds - start) / (held - start)),
    ).s;
    const knee: number = from.lower[0] + (props.knee - from.lower[0]) * s;
    // The clearance comes in with the fold, so the fold starts where the rise
    // left the leg and is held clear of the level beneath once it is held.
    const folded: number = from.upper[0] + (props.hip - from.upper[0]) * s;
    const hip: number =
      folded + (clearing(base, seconds, knee, folded) - folded) * s;
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

/**
 * Companion types of {@link crutchHeldLeg}.
 */
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

    /** The height of the level beneath the held foot at an action second, world metres; the held angles alone when absent. */
    floor?: (seconds: number) => number;
  }

  /** The leg where it starts to fold: its hip's and knee's angles and its ankle's, degrees. */
  export interface IRaised extends IAutoMovieHumanLimbReference {
    /** The ankle's `[flexion, abduction, twist]`, degrees. */
    foot: readonly [number, number, number];
  }
}
