import { ANKLE_DORSIFLEXION, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanLimbReference,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { crawl } from "../floor/crawl";
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the clearing rise, the fold, the ankle's share and the goal-less case.
 * @evidence contracts/development/implementation.md#principled-implementation A foot breaks contact vertically before it travels, then a minimum-jerk joint blend (Flash and Hogan 1985) from the angles reached; the ankle's compensation is the shank's sagittal tilt, the knee's flexion less the hip's.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two phases, each a closed form of the second.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The fold starts from the resolved angles of the rise's end, so the two phases join.
 * @evidence contracts/development/implementation.md#efficient-algorithms The standing posture and the fold's start are read once per plan; every other read is constant work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The crutch walk's and the crutch stair climb's injured legs share this writer.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the standing posture and the fold's start angles for the plan's life.
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
    const tilt: number =
      (props.knee - from.lower[0] - (props.hip - from.upper[0])) * s;
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...base.limbs };
    delete limbs[leg];
    return {
      ...base,
      limbs,
      joints: {
        ...base.joints,
        [`${side}UpperLeg`]: [
          from.upper[0] + (props.hip - from.upper[0]) * s,
          from.upper[1] * (1 - s),
          from.upper[2] * (1 - s),
        ],
        [`${side}LowerLeg`]: [
          from.lower[0] + (props.knee - from.lower[0]) * s,
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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each member's meaning, unit and timebase.
 * @evidence contracts/development/design.md#principled-representation The leg, its two instants, its held angles and the posture reader it lifts from.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What the crutch laws hand the writer.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the limb reference's angle triples.
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
  }

  /** The leg where it starts to fold: its hip's and knee's angles and its ankle's, degrees. */
  export interface IRaised extends IAutoMovieHumanLimbReference {
    /** The ankle's `[flexion, abduction, twist]`, degrees. */
    foot: readonly [number, number, number];
  }
}
