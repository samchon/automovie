import { Transform } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  IAutoMovieHumanLimbGoal,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieMotionHumanTurnHumanPosture,
  IAutoMoviePose,
} from "@automovie/interface";

import { HumanLimbView } from "./HumanLimbView";
import { HumanPosture } from "./HumanPosture";
import { prepareHumanPostureProjection } from "./prepareHumanPostureProjection";
import { resolveHumanPostureSource } from "./resolveHumanPostureSource";
import { turnHumanPosture } from "./turnHumanPosture";

/**
 * The assembly of a posture, built from the assembly of another posture of the
 * same body: every bone whose direct angles are exactly the other posture's
 * keeps that assembly's clamped record, and only the others are clamped again.
 * A plan that reads one instant under several variations (an arm let out, a
 * root shifted) assembles the instant once and derives the rest.
 *
 * @param body The performer's body.
 * @param assembled An assembly of this body
 *   (`resolveHumanPostureSource.assemble`), left unchanged.
 * @param posture The posture to assemble.
 * @returns The posture's assembly: the pose `assemble` gives it, value for
 *   value, sharing every record whose bone's angles did not change, and the
 *   root itself when the root and heading did not.
 */
export function deriveHumanPosture(
  body: IAutoMovieMotionHumanBody,
  assembled: resolveHumanPostureSource.IAssembled,
  posture: IAutoMovieMotionHumanPosture,
): resolveHumanPostureSource.IAssembled {
  const from: IAutoMovieMotionHumanPosture = assembled.posture;
  const clamp: ReturnType<typeof prepareHumanPostureProjection.joints> =
    prepareHumanPostureProjection.joints(body, body.projection);
  const before: readonly IAutoMovieJointPose[] = assembled.pose.joints;
  if (
    from.rotation !== undefined ||
    posture.rotation !== undefined ||
    assembled.base !== undefined ||
    assembled.pose.root === null ||
    clamp === undefined ||
    before.length !== body.skeleton.bones.length
  )
    return resolveHumanPostureSource.assemble(body, posture, assembled.base);

  // Each bone's record: the other assembly's where the angles are the same.
  let joints: IAutoMovieJointPose[] | undefined;
  for (let i: number = 0; i < before.length; ++i) {
    const bone: IAutoMovieJointPose["bone"] = body.skeleton.bones[i]!.bone;
    const old: readonly [number, number, number] | undefined =
      from.joints[bone];
    const set: readonly [number, number, number] | undefined =
      posture.joints[bone];
    if (
      old === set ||
      (old !== undefined &&
        set !== undefined &&
        Object.is(old[0], set[0]) &&
        Object.is(old[1], set[1]) &&
        Object.is(old[2], set[2]))
    )
      continue;
    joints ??= before.slice();
    joints[i] = clamp(
      set === undefined
        ? { bone, flexion: 0, abduction: 0, twist: 0 }
        : { bone, flexion: set[0], abduction: set[1], twist: set[2] },
    );
  }

  // The root: the other assembly's own when root and heading are the same.
  const turned: IAutoMovieMotionHumanTurnHumanPosture.ITurned =
    turnHumanPosture(posture);
  const placed: boolean =
    Object.is(from.root.x, posture.root.x) &&
    Object.is(from.root.y, posture.root.y) &&
    Object.is(from.root.z, posture.root.z) &&
    Object.is(from.yaw, posture.yaw) &&
    Object.is(from.pitch, posture.pitch) &&
    Object.is(from.roll, posture.roll);
  const root: NonNullable<IAutoMoviePose["root"]> = placed
    ? assembled.pose.root
    : Transform.of({ ...turned.position }, turned.rotation);
  return {
    posture,
    pose: {
      skeleton: body.skeleton.id,
      root,
      joints: joints ?? assembled.pose.joints,
    },
    limbs: turned.limbs,
  };
}

/**
 * Companion of {@link deriveHumanPosture}: a fit of one assembly taken for
 * another.
 */
export namespace deriveHumanPosture {
  /** A completed cold fit: the assembly it ran on and what it returned. */
  export interface ISolved {
    /** The assembly the fit ran on. */
    assembled: resolveHumanPostureSource.IAssembled;

    /**
     * What `resolveHumanPostureSource.fit` returned for that assembly's own
     * goals, with no nearby seed.
     */
    seeded: IAutoMovieMotionHumanResolveHumanPosture.ISeeded;
  }

  /**
   * The cold fit of an assembly's own goals, taken from a completed cold fit of
   * another assembly when every limb's fit reads exactly what it read there;
   * undefined otherwise, for the ordinary fit.
   *
   * A limb fit is a function of the records it reads (`HumanLimbView.of`: its
   * chain, its toes and their ancestors for a leg), the root, the goal and the
   * body. The fit is taken when both assemblies have the same limbs, all legs
   * with unattached goals that are equal value for value, the same root, and
   * the very same record objects at every index a leg's fit reads; the result
   * is then the completed fit's pose with the records the two assemblies differ
   * in replaced by this assembly's, which is the pose the ordinary fit builds,
   * record for record and in the same order, because the fits' filters and
   * appends never touch a record outside what they read. Seeds and values are
   * copied. A posture with digit goals, an arm goal, an attached goal, or a
   * differing record that is not finite (which the ordinary fit's admission
   * refuses) is not taken.
   *
   * @param body The performer's body.
   * @param assembled The assembly to fit.
   * @param solved A completed cold fit of another assembly of this body.
   * @returns The fit, or undefined.
   */
  export function inherited(
    body: IAutoMovieMotionHumanBody,
    assembled: resolveHumanPostureSource.IAssembled,
    solved: ISolved,
  ): IAutoMovieMotionHumanResolveHumanPosture.ISeeded | undefined {
    const before: resolveHumanPostureSource.IAssembled = solved.assembled;
    const limbs: AutoMovieHumanLimb[] = HumanPosture.LIMBS.filter(
      (limb: AutoMovieHumanLimb): boolean =>
        assembled.limbs[limb] !== undefined,
    );
    if (
      limbs.length === 0 ||
      Object.keys(assembled.limbs).length !== limbs.length ||
      Object.keys(before.limbs).length !== limbs.length ||
      assembled.posture.digits !== undefined ||
      before.posture.digits !== undefined ||
      assembled.pose.joints.length !== before.pose.joints.length ||
      !same(assembled.pose.root, before.pose.root)
    )
      return undefined;
    for (const limb of limbs) {
      const goal: IAutoMovieHumanLimbGoal | undefined = assembled.limbs[limb];
      if (
        goal === undefined ||
        !limb.endsWith("Leg") ||
        goal.on !== undefined ||
        !same(goal, before.limbs[limb]) ||
        solved.seeded.seeds[limb] === undefined
      )
        return undefined;
      for (const index of HumanLimbView(body, assembled.pose, limb, goal, [])
        .at)
        if (assembled.pose.joints[index] !== before.pose.joints[index])
          return undefined;
    }

    // The records the two assemblies differ in, none of which a fit read.
    const swapped: Map<IAutoMovieJointPose, IAutoMovieJointPose> = new Map();
    for (let i: number = 0; i < before.pose.joints.length; ++i) {
      const now: IAutoMovieJointPose = assembled.pose.joints[i]!;
      if (now === before.pose.joints[i]) continue;
      for (const angle of [now.flexion, now.abduction, now.twist])
        if (angle !== null && !Number.isFinite(angle)) return undefined;
      swapped.set(before.pose.joints[i]!, now);
    }
    const seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"] = {};
    const values: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["values"] =
      {};
    for (const limb of limbs) {
      const seed: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"][AutoMovieHumanLimb] =
        solved.seeded.seeds[limb];
      seeds[limb] = seed === null || seed === undefined ? null : { ...seed };
      const value: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["values"][AutoMovieHumanLimb] =
        solved.seeded.values[limb];
      if (value !== undefined) values[limb] = { ...value };
    }
    return {
      pose: {
        ...assembled.pose,
        joints:
          swapped.size === 0
            ? solved.seeded.pose.joints.slice()
            : solved.seeded.pose.joints.map(
                (joint: IAutoMovieJointPose): IAutoMovieJointPose =>
                  swapped.get(joint) ?? joint,
              ),
      },
      seeds,
      values,
    };
  }
}

/**
 * Whether two values are equal value for value: Object.is on primitives, and
 * the same own enumerable members, in number and each, on arrays and plain
 * records.
 */
function same(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  )
    return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const left: [string, unknown][] = Object.entries(a);
  const right: Record<string, unknown> = { ...b };
  if (left.length !== Object.keys(right).length) return false;
  for (const [key, value] of left)
    if (!(key in right) || !same(value, right[key])) return false;
  return true;
}
