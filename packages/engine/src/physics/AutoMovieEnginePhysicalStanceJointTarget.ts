import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";


/** The input and result of {@link AutoMovieEnginePhysicalStanceJointTarget}. */
export namespace AutoMovieEnginePhysicalStanceJointTarget {
  /**
   * The relative rotation and relative angular velocity one joint's motor drives
   * toward under internal actuation, by the joint's role in the stance.
   *
   * - A `planted` foot's carrier joint holds the foot at a world orientation
   *   against the actual parent: a standing foot the one latched when its stance
   *   began, so a leaning shank does not tip the sole onto an edge (Coros,
   *   Beaudoin and van de Panne 2010, Section 3.3); a swinging foot its authored
   *   one, level, apart from its path (Pratt et al., M2V2, Section VII-D1).
   * - A stance leg's `hip`, its first joint, holds the parent, the trunk, at its
   *   intended world orientation over the actual thigh: the world-frame torso PD
   *   that SIMBICON realizes at the stance hip, tau_A = -tau_torso - tau_B (Yin,
   *   Loken and van de Panne 2007, Section 3.2). A ground moment cannot turn the
   *   pelvis against the thighs; only the hips can.
   * - Every other joint keeps the `posture` of the goal pose, the authored pose
   *   refit to the present footholds, as a posture task keeps a fixed reference
   *   (TSID, `tsid_biped.py`), never a pose latched at a landing, which would let
   *   each landing ratchet the stance's shape.
   *
   * The target is `inv(P) C` for the desired parent and child anchor frames `P`
   * and `C` in the world, and its velocity the desired child's angular velocity
   * less the desired parent's, in `P`.
   *
   * @param input The role, the joint's anchor frames, the actual and goal
   *   rotations and spins, and the role's own reference.
   * @returns The relative rotation and the relative angular velocity, in the
   *   parent's anchor frame.
   */
  export function compute(
    input: Parameters<typeof computeJointTarget>[0],
  ): ReturnType<typeof computeJointTarget> {
    return computeJointTarget(input);
  }
  /**
   * A rotation with its twist about a unit axis removed: q = s t with t the
   * twist about the axis, the swing s = q t^-1 (swing-twist decomposition).
   *
   * @param q The rotation.
   * @param axis The axis, unit length.
   * @returns The swing, whose axis is perpendicular to the given one.
   */
  export function swing(
    q: IAutoMovieQuaternion,
    axis: IAutoMovieVector3,
  ): IAutoMovieQuaternion {
    const along: number = q.x * axis.x + q.y * axis.y + q.z * axis.z;
    const size: number = Math.hypot(along, q.w);
    if (!(size > 1e-12)) return q;
    const twist: IAutoMovieQuaternion = {
      x: (axis.x * along) / size,
      y: (axis.y * along) / size,
      z: (axis.z * along) / size,
      w: q.w / size,
    };
    return Quaternion.multiply(q, Quaternion.inverse(twist));
  }

  /** A joint's rotations and spins, world. */
  export interface IPair {
    /** The parent body's world rotation. */
    parent: IAutoMovieQuaternion;

    /** The child body's world rotation. */
    child: IAutoMovieQuaternion;

    /** The parent's angular velocity, radians per second. */
    parentSpin: IAutoMovieVector3;

    /** The child's angular velocity, radians per second. */
    childSpin: IAutoMovieVector3;
  }

  /** A planted foot's carrier joint. */
  export interface IPlanted extends IBase {
    /** The role. */
    role: "planted";

    /** The foot's world rotation latched when its stance began. */
    latched: IAutoMovieQuaternion;
  }

  /** A stance leg's first joint. */
  export interface IHip extends IBase {
    /** The role. */
    role: "hip";

    /** The parent's intended world rotation and angular velocity. */
    intended: IHipIntended;

    /**
     * The world axis, unit length, the trunk is released about while the
     * stance's hip strategy turns it (design-4017-edge, E2); absent, none.
     */
    release?: IAutoMovieVector3;
  }

  /** The intended object of {@link IHip}. */
  export type IHipIntended = { rotation: IAutoMovieQuaternion; spin: IAutoMovieVector3 };

  /** Any other joint. */
  export interface IPosture extends IBase {
    /** The role. */
    role: "posture";
  }

  /** One joint's role and references. */
  export type IInput = IPlanted | IHip | IPosture;

  /** The motor's reference. */
  export interface IResult {
    /** The child's anchor frame relative to the parent's. */
    target: IAutoMovieQuaternion;

    /**
     * The child's angular velocity relative to the parent's, in the parent's
     * anchor frame, radians per second.
     */
    velocity: IAutoMovieVector3;
  }

  /*
   * What every role reads.
   */
  interface IBase {
    /*
     * The joint's anchor frame rotation on the parent, in the parent's body
     * frame.
     */
    parentFrame: IAutoMovieQuaternion;

    /*
     * The joint's anchor frame rotation on the child, in the child's body
     * frame.
     */
    childFrame: IAutoMovieQuaternion;

    /*
     * The bodies as they are.
     */
    actual: IPair;

    /*
     * The goal pose's bodies.
     */
    goal: IPair;
  }
}

function computeJointTarget(
  input: AutoMovieEnginePhysicalStanceJointTarget.IInput,
): AutoMovieEnginePhysicalStanceJointTarget.IResult {
  // During the hip strategy the stance hips release the trunk along its axis
  // (design-4017-edge, E2): the intended attitude keeps the actual one's turn
  // about that axis, its error's twist about it removed, and the intended
  // spin the actual one's along it.
  const intended: { rotation: IAutoMovieQuaternion; spin: IAutoMovieVector3 } | undefined =
    input.role !== "hip"
      ? undefined
      : input.release === undefined
        ? input.intended
        : {
            rotation: Quaternion.multiply(
              AutoMovieEnginePhysicalStanceJointTarget.swing(
                Quaternion.multiply(
                  input.intended.rotation,
                  Quaternion.inverse(input.actual.parent),
                ),
                input.release,
              ),
              input.actual.parent,
            ),
            spin: Vector3.add(
              input.intended.spin,
              Vector3.scale(
                input.release,
                Vector3.dot(input.actual.parentSpin, input.release) -
                  Vector3.dot(input.intended.spin, input.release),
              ),
            ),
          };
  const parent: IAutoMovieQuaternion =
    input.role === "planted"
      ? input.actual.parent
      : input.role === "hip"
        ? intended!.rotation
        : input.goal.parent;
  const child: IAutoMovieQuaternion =
    input.role === "planted"
      ? input.latched
      : input.role === "hip"
        ? input.actual.child
        : input.goal.child;
  const frame: IAutoMovieQuaternion = Quaternion.multiply(
    parent,
    input.parentFrame,
  );
  const spin: IAutoMovieVector3 =
    input.role === "hip"
      ? Vector3.subtract(input.actual.childSpin, intended!.spin)
      : Vector3.subtract(input.goal.childSpin, input.goal.parentSpin);
  return {
    target: Quaternion.multiply(
      Quaternion.inverse(frame),
      Quaternion.multiply(child, input.childFrame),
    ),
    velocity: Quaternion.rotateVector(Quaternion.inverse(frame), spin),
  };
}
