import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanKnot } from "./HumanKnot";
import { prepareHumanKnotCourse } from "./prepareHumanKnotCourse";

/**
 * Prepare a posture course through key postures solved in preparation and
 * return its pure reader.
 *
 * Every continuous field of the knots' postures becomes one coordinate of a
 * knot course (`prepareHumanKnotCourse`, a minimum-jerk path through the knots
 * at their seconds after Flash and Hogan 1985, J. Neurosci. 5(7):1688, at rest
 * at the first and the last knot): the root, the heading unwrapped knot to knot
 * so it turns the short way, the tips, each joint's clinical angles (a joint a
 * knot leaves out at zero), each unwrapped the same way so a twist through ±180
 * degrees takes the short way, and, for a limb every knot sets, its goal's
 * point, bend, contact and rotation, the rotation kept in the previous knot's
 * hemisphere and normalized after the read. A limb only some knots set, a
 * goal's other fields and the posture's own rotation and digits are taken from
 * the last knot at or before the instant. A read evaluates the course once, so
 * it answers any instant in any order with no search beyond the course's own.
 *
 * @param knots The key postures at their seconds, one or more, the seconds
 *   strictly ascending.
 * @returns The posture at a second, the first knot's before the first second
 *   and the last knot's after the last.
 */
export function prepareHumanPostureCourse(
  knots: readonly prepareHumanPostureCourse.IKnot[],
): (seconds: number) => IAutoMovieMotionHumanPosture {
  const first: IAutoMovieMotionHumanPosture = knots[0]!.posture;
  const bones: AutoMovieHumanoidBone[] = [];
  for (const knot of knots)
    for (const bone of Object.keys(
      knot.posture.joints,
    ) as AutoMovieHumanoidBone[])
      if (!bones.includes(bone)) bones.push(bone);
  const limbs: AutoMovieHumanLimb[] = (
    Object.keys(first.limbs) as AutoMovieHumanLimb[]
  ).filter((limb: AutoMovieHumanLimb): boolean =>
    knots.every(
      (knot: prepareHumanPostureCourse.IKnot): boolean =>
        knot.posture.limbs[limb] !== undefined,
    ),
  );
  const rotated: AutoMovieHumanLimb[] = limbs.filter(
    (limb: AutoMovieHumanLimb): boolean =>
      knots.every(
        (knot: prepareHumanPostureCourse.IKnot): boolean =>
          knot.posture.limbs[limb]!.rotation !== undefined,
      ),
  );
  const contacted: AutoMovieHumanLimb[] = limbs.filter(
    (limb: AutoMovieHumanLimb): boolean =>
      knots.every(
        (knot: prepareHumanPostureCourse.IKnot): boolean =>
          knot.posture.limbs[limb]!.contact !== undefined,
      ),
  );

  // Each knot's coordinates, in the layout `read` takes them back from.
  let yaw: number = first.yaw;
  const angles: Partial<Record<AutoMovieHumanoidBone, number[]>> = {};
  const hemispheres: Partial<Record<AutoMovieHumanLimb, IAutoMovieQuaternion>> =
    {};
  const positions: number[][] = knots.map(
    (knot: prepareHumanPostureCourse.IKnot): number[] => {
      const p: IAutoMovieMotionHumanPosture = knot.posture;
      yaw += ((((p.yaw - yaw) % 360) + 540) % 360) - 180;
      const out: number[] = [
        p.root.x,
        p.root.y,
        p.root.z,
        yaw,
        p.pitch,
        p.roll,
      ];
      for (const bone of bones) {
        const raw: readonly number[] = p.joints[bone] ?? ZERO;
        const before: number[] | undefined = angles[bone];
        const kept: number[] =
          before === undefined
            ? [...raw]
            : raw.map(
                (v: number, i: number): number =>
                  v - 360 * Math.round((v - before[i]!) / 360),
              );
        angles[bone] = kept;
        out.push(...kept);
      }
      for (const limb of limbs) {
        const goal: IAutoMovieHumanLimbGoal = p.limbs[limb]!;
        out.push(...vector(goal.point), ...vector(goal.bend));
      }
      for (const limb of contacted)
        out.push(...vector(p.limbs[limb]!.contact!));
      for (const limb of rotated) {
        const q: IAutoMovieQuaternion = p.limbs[limb]!.rotation!;
        const near: IAutoMovieQuaternion = hemispheres[limb] ?? q;
        const sign: number =
          q.x * near.x + q.y * near.y + q.z * near.z + q.w * near.w < 0
            ? -1
            : 1;
        const kept: IAutoMovieQuaternion = {
          x: sign * q.x,
          y: sign * q.y,
          z: sign * q.z,
          w: sign * q.w,
        };
        hemispheres[limb] = kept;
        out.push(kept.x, kept.y, kept.z, kept.w);
      }
      return out;
    },
  );
  const times: number[] = knots.map(
    (knot: prepareHumanPostureCourse.IKnot): number => knot.seconds,
  );
  const course: prepareHumanKnotCourse.ICourse = prepareHumanKnotCourse(
    positions.map(
      (position: number[]): HumanKnot.IKnot => ({ position, dwell: 0 }),
    ),
    { kind: "fixed", times },
  );

  /** The last knot at or before a second, by binary search. */
  const discrete = (seconds: number): IAutoMovieMotionHumanPosture => {
    let low: number = 0;
    let high: number = knots.length - 1;
    while (low < high) {
      const middle: number = (low + high + 1) >> 1;
      if (times[middle]! <= seconds) low = middle;
      else high = middle - 1;
    }
    return knots[low]!.posture;
  };
  return (seconds: number): IAutoMovieMotionHumanPosture => {
    const c: number[] = course.position(seconds);
    const keyed: IAutoMovieMotionHumanPosture = discrete(seconds);
    let k: number = 6;
    const take = (): IAutoMovieVector3 => {
      const v: IAutoMovieVector3 = { x: c[k]!, y: c[k + 1]!, z: c[k + 2]! };
      k += 3;
      return v;
    };
    const joints: IAutoMovieMotionHumanPosture["joints"] = {};
    for (const bone of bones) {
      joints[bone] = [c[k]!, c[k + 1]!, c[k + 2]!];
      k += 3;
    }
    const out: IAutoMovieMotionHumanPosture["limbs"] = {};
    for (const limb of Object.keys(keyed.limbs) as AutoMovieHumanLimb[])
      if (!limbs.includes(limb)) out[limb] = keyed.limbs[limb];
    for (const limb of limbs)
      out[limb] = { ...keyed.limbs[limb]!, point: take(), bend: take() };
    for (const limb of contacted) out[limb]!.contact = take();
    for (const limb of rotated) {
      out[limb]!.rotation = Quaternion.normalize({
        x: c[k]!,
        y: c[k + 1]!,
        z: c[k + 2]!,
        w: c[k + 3]!,
      });
      k += 4;
    }
    return {
      root: { x: c[0]!, y: c[1]!, z: c[2]! },
      yaw: c[3]!,
      pitch: c[4]!,
      roll: c[5]!,
      joints,
      limbs: out,
      ...(keyed.rotation === undefined ? {} : { rotation: keyed.rotation }),
      ...(keyed.digits === undefined ? {} : { digits: keyed.digits }),
    };
  };
}

/** A posture course's knot. */
export namespace prepareHumanPostureCourse {
  /** One key posture of the course. */
  export interface IKnot {
    /** Its second on the course's clock. */
    seconds: number;

    /** The posture there, solved in preparation. */
    posture: IAutoMovieMotionHumanPosture;
  }
}

/** The angles of a joint a knot leaves out. */
const ZERO: readonly [number, number, number] = [0, 0, 0];

/** A vector's coordinates in order. */
function vector(v: IAutoMovieVector3): [number, number, number] {
  return [v.x, v.y, v.z];
}
