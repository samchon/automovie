import type {
  AutoMovieHumanLimb,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

/**
 * A leaf resolve inside its action's legs-still window
 * (`IAutoMovieMotionHumanActionPlan.legsStill`): there the root, the trunk
 * and both legs' goals are one and the same, so every record a leg fit reads
 * is, and the legs' fit of one second is the fit of every other. The first
 * leaf resolve in the window fits the legs and the action keeps their records
 * and seeds (`IAutoMovieMotionHumanSegment.legs`); every later one is the
 * same resolve with those records given as the legs' joints and the legs'
 * goals left out, so only the head, the arms and the hands are fitted.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the window, what is kept, how a later resolve reads it and what it fits.
 * @evidence contracts/development/design.md#principled-representation The action's own kept leg records, read where its plan states the legs still.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One entry the display's leaf resolve calls.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Only a plan's statement opens the window; a person with layers or overlays, a continued or partial resolve, or a record with a rest axis keeps the full resolve.
 */
export namespace HumanSegmentLegs {
  /**
   * The leaf resolve of a posture at a film second.
   *
   * @param person The person.
   * @param carrier The action the leaf belongs to.
   * @param seconds Film seconds.
   * @param under The leaf's posture.
   * @param plain Whether the resolve is a full, uncontinued one.
   * @param resolve The leaf's own resolve of a posture.
   * @returns The resolve's result.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Leg fits run first (`orderHumanLimbs`), so the arms read the fitted legs; given as direct joints those same values are what the arms read, and the leg fit's own inputs are unchanged inside the window by the plan's statement, so its records are the fit's. The kept seeds keep the legs' plant check (`HumanSegmentPlant.settled`) as the fitted resolve sets it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One gate, then either the kept legs or a full resolve that keeps them.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Outside the window, with a layer or overlay, continued, partial, or with a rest axis in a kept record, the full resolve runs.
   * @evidence contracts/development/implementation.md#efficient-algorithms Inside the window, two leg fits once for the window in place of at every leaf resolve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The kept records are the action's own fit's inside the window its plan states.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One record set per action, released by `HumanSegment.forget`.
   */
  export function resolved(
    person: IAutoMovieMotionHumanSegment.IPerson,
    carrier: IAutoMovieMotionHumanSegment | undefined,
    seconds: number,
    under: IAutoMovieMotionHumanPosture,
    plain: boolean,
    resolve: (posture: IAutoMovieMotionHumanPosture) => IAutoMovieMotionHumanResolveHumanPosture.ISeeded,
  ): IAutoMovieMotionHumanResolveHumanPosture.ISeeded {
    const window: readonly [number, number] | undefined = carrier?.plan.legsStill;
    if (
      carrier === undefined || window === undefined || !plain ||
      person.layers.length !== 0 || person.overlays.length !== 0 ||
      under.limbs.leftLeg === undefined || under.limbs.rightLeg === undefined
    )
      return resolve(under);
    const local: number = Math.min(carrier.plan.duration, Math.max(0, seconds - carrier.start));
    if (!(local >= window[0] && local <= window[1])) return resolve(under);
    const kept: IAutoMovieMotionHumanSegment["legs"] = carrier.legs;
    if (kept !== undefined && kept.at >= window[0] && kept.at <= window[1]) {
      const joints: IAutoMovieMotionHumanPosture["joints"] = { ...under.joints };
      let direct: boolean = true;
      for (const joint of kept.joints) {
        if (joint.flexion === null || joint.abduction === null || joint.twist === null) direct = false;
        else joints[joint.bone] = [joint.flexion, joint.abduction, joint.twist];
      }
      if (direct) {
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...under.limbs };
        delete limbs.leftLeg;
        delete limbs.rightLeg;
        const fitted: IAutoMovieMotionHumanResolveHumanPosture.ISeeded = resolve({ ...under, joints, limbs });
        return { ...fitted, seeds: { ...fitted.seeds, ...kept.seeds } };
      }
    }
    const fitted: IAutoMovieMotionHumanResolveHumanPosture.ISeeded = resolve(under);
    const seeds: Partial<Record<AutoMovieHumanLimb, IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"][AutoMovieHumanLimb]>> = {};
    for (const limb of ["leftLeg", "rightLeg"] as const)
      if (fitted.seeds[limb] !== undefined) seeds[limb] = fitted.seeds[limb];
    carrier.legs = {
      at: local,
      joints: fitted.pose.joints.filter((joint: IAutoMovieJointPose): boolean => LEG.test(joint.bone)),
      seeds,
    };
    return fitted;
  }
}

/** A leg's bones, thigh to toes. */
const LEG: RegExp = /^(left|right)(UpperLeg|LowerLeg|Foot|Toes)$/;
