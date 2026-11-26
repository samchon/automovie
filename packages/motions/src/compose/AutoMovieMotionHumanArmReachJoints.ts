import { ROM_TOLERANCE, clampJointToSkeleton, getConstraint, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";

/**
 * The arm's joints as Tolani, Goswami and Badler 2000 (Graphical Models 62:353,
 * section 3.3) read them for a free hand attitude: the shoulder's three angles,
 * the hinge, and the wrist's three as one spherical joint whose distal twist
 * the rig takes in the forearm; their ranges, the terms of F, and their check
 * by the rig's own clamp (`clampJointToSkeleton`), in the fit's frame (a left
 * arm is solved as its mirror image's right) and named on the arm's own side.
 */
export namespace AutoMovieMotionHumanArmReachJoints {
  /** The free angles of one family: the root, the hinge and the wrist. */
  export interface IFreeAngles {
    /** The root joint. */
    upper: IAutoMovieJointPose;

    /** The mid joint, its hinge only. */
    lower: IAutoMovieJointPose;

    /** The end joint, its twist the distal twist the forearm takes. */
    effector: IAutoMovieJointPose;
  }

  /** Each axis's range a chart is read against; null for an immobile axis. */
  export interface IAxisRanges {
    /** The flexion's. */
    flexion: Range;

    /** The abduction's. */
    abduction: Range;

    /** The twist's. */
    twist: Range;
  }

  /** The ranges F reads, in the fit's frame (the right arm's). */
  export interface IRanges {
    /** The shoulder's. */
    upper: IAutoMovieJointConstraint | null;

    /** The forearm's, whose twist the wrist's distal twist is read against. */
    lower: IAutoMovieJointConstraint | null;

    /** The hand's. */
    hand: IAutoMovieJointConstraint | null;
  }

  /** The rig's clamps of the three played joints, in the fit's frame. */
  export interface IClamps {
    /** The shoulder's. */
    upper: IClamp;

    /** The forearm's, which takes the wrist's distal twist. */
    lower: IClamp;

    /** The hand's. */
    hand: IClamp;
  }

  /** One joint axis's displacement by its clamp. */
  export interface IDisplaced {
    /** The joint, its bone without the side prefix. */
    part: Part;

    /** The axis. */
    axis: Axis;

    /** How far the clamp moves it, degrees; 0 within the range. */
    degrees: number;
  }

  /** A joint's axis past its range. */
  export interface IPast {
    /** The bone, on the arm's own side. */
    bone: AutoMovieHumanoidBone;

    /** The axis. */
    axis: Axis;

    /** How far past its range, degrees. */
    degrees: number;
  }

  /**
   * A chart read at each angle's full-turn alias nearest its axis's range, as
   * the rig reads a chart (`nearestAngleAlias`).
   *
   * @param joint The chart's angles, degrees.
   * @param ranges The axes' ranges; null for an immobile joint.
   * @returns The angles at those aliases.
   */
  export function aliased(
    joint: IAutoMovieJointPose,
    ranges: IAxisRanges | null,
  ): IAutoMovieJointPose {
    function near(value: Angle, range: Range): number {
      return AutoMovieEngineMath.nearestAngleAlias(value ?? 0, range ?? null);
    }
    return {
      ...joint,
      flexion: near(joint.flexion, ranges?.flexion),
      abduction: near(joint.abduction, ranges?.abduction),
      twist: near(joint.twist, ranges?.twist),
    };
  }

  /**
   * The ranges of the arm's joints on a body, in the fit's frame.
   *
   * @param body The body.
   * @returns The shoulder's, the forearm's and the hand's.
   */
  export function rangesOf(body: IAutoMovieMotionHumanBody): IRanges {
    function of(bone: AutoMovieHumanoidBone): IAutoMovieJointConstraint | null {
      return getConstraint(bone, body.bones.get(bone)?.constraint ?? null);
    }
    return { upper: of(UPPER), lower: of(LOWER), hand: of(HAND) };
  }

  /**
   * F's terms (section 3.3): the shoulder's three angles, the hand's flexion
   * and abduction and the distal twist against the forearm's twist range; an
   * axis with no range (an immobile one) is no term.
   *
   * @param free The free angles.
   * @param ranges The joints' ranges.
   * @returns Each term's angle and range.
   */
  export function terms(free: IFreeAngles, ranges: IRanges): Term[] {
    const out: Term[] = [];
    function add(value: Angle, range: Range): void {
      if (range !== null && range !== undefined) out.push([value ?? 0, range]);
    }
    add(free.upper.flexion, ranges.upper?.flexion);
    add(free.upper.abduction, ranges.upper?.abduction);
    add(free.upper.twist, ranges.upper?.twist);
    add(free.effector.flexion, ranges.hand?.flexion);
    add(free.effector.abduction, ranges.hand?.abduction);
    add(free.effector.twist, ranges.lower?.twist);
    return out;
  }

  /**
   * The rig's clamps of the arm's joints (`clampJointToSkeleton.of`).
   *
   * @param body The body.
   * @returns The shoulder's, the forearm's and the hand's.
   */
  export function clampsOf(body: IAutoMovieMotionHumanBody): IClamps {
    return {
      upper: clampJointToSkeleton.of(UPPER, body.skeleton),
      lower: clampJointToSkeleton.of(LOWER, body.skeleton),
      hand: clampJointToSkeleton.of(HAND, body.skeleton),
    };
  }

  /**
   * Each joint axis's displacement by the rig's own clamp at the free angles:
   * the shoulder, the forearm with the wrist's distal twist, and the hand
   * without it, in that order, three axes each.
   *
   * @param free The free angles.
   * @param clamps The joints' clamps.
   * @returns The nine displacements.
   */
  export function displaced(free: IFreeAngles, clamps: IClamps): IDisplaced[] {
    const effector: IAutoMovieJointPose = free.effector;
    const joints: readonly IJoint[] = [
      {
        part: "UpperArm",
        joint: { ...free.upper, bone: UPPER },
        clamp: clamps.upper,
      },
      {
        part: "LowerArm",
        joint: { ...free.lower, bone: LOWER, twist: effector.twist ?? 0 },
        clamp: clamps.lower,
      },
      {
        part: "Hand",
        joint: { ...effector, bone: HAND, twist: 0 },
        clamp: clamps.hand,
      },
    ];
    const out: IDisplaced[] = [];
    for (const { part, joint, clamp } of joints) {
      const clamped: IAutoMovieJointPose = clamp(joint);
      for (const axis of AXES)
        out.push({
          part,
          axis,
          degrees: Math.abs((joint[axis] ?? 0) - (clamped[axis] ?? 0)),
        });
    }
    return out;
  }

  /**
   * The joint axis farthest past the rig's range, named on the arm's own side
   * (a left arm is solved as its mirror image's right); null when every one is
   * within the range tolerance (`ROM_TOLERANCE`).
   *
   * @param side The arm.
   * @param displacements The joints' displacements by their clamps.
   * @returns The farthest, or null.
   */
  export function beyond(
    side: AutoMovieHumanSide,
    displacements: readonly IDisplaced[],
  ): IPast | null {
    let worst: IPast | null = null;
    for (const d of displacements)
      if (
        d.degrees > ROM_TOLERANCE &&
        (worst === null || d.degrees > worst.degrees)
      )
        worst = {
          bone: `${side}${d.part}`,
          axis: d.axis,
          degrees: d.degrees,
        };
    return worst;
  }
}

/** A joint's clinical axis. */
type Axis = "flexion" | "abduction" | "twist";

/** A free angle, degrees, as a joint pose holds it: absent or null is zero. */
type Angle = IAutoMovieJointPose["flexion"] | undefined;

/** An axis's range, as a constraint holds it: absent or null is immobile. */
type Range = IAutoMovieJointConstraint["flexion"] | undefined;

/** One term of F: a free angle, degrees, and its joint's range. */
type Term = readonly [number, IAutoMovieAngleRange];

/** One joint's clamp by the rig's ranges. */
type IClamp = (joint: IAutoMovieJointPose) => IAutoMovieJointPose;

/** An arm joint's bone without the side prefix. */
type Part = "UpperArm" | "LowerArm" | "Hand";

/** One joint of the arm at the free angles, with its clamp. */
interface IJoint {
  /** The joint, its bone without the side prefix. */
  part: Part;

  /** Its angles, in the fit's frame. */
  joint: IAutoMovieJointPose;

  /** Its clamp. */
  clamp: IClamp;
}

/** The fit's frame bones: a left arm is solved as its mirror image's right. */
const UPPER: AutoMovieHumanoidBone = "rightUpperArm";

/** The fit's frame forearm. */
const LOWER: AutoMovieHumanoidBone = "rightLowerArm";

/** The fit's frame hand. */
const HAND: AutoMovieHumanoidBone = "rightHand";

/** A joint's three clinical axes. */
const AXES: readonly Axis[] = ["flexion", "abduction", "twist"];
