import type {
  AutoMovieHumanLimb,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

/**
 * A leaf resolve inside its action's legs-still window
 * (`IAutoMovieMotionHumanActionPlan.legsStill`): there the root, the trunk and
 * both legs' goals are one and the same, so every record a leg fit reads is,
 * and the legs' fit of one second is the fit of every other. The first leaf
 * resolve in the window fits the legs and the action keeps their records and
 * seeds (`IAutoMovieMotionHumanSegment.legs`); every later one is the same
 * resolve with those records given as the legs' joints and the legs' goals left
 * out, so only the head, the arms and the hands are fitted.
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
   */
  export function resolved(
    person: IAutoMovieMotionHumanSegment.IPerson,
    carrier: IAutoMovieMotionHumanSegment | undefined,
    seconds: number,
    under: IAutoMovieMotionHumanPosture,
    plain: boolean,
    resolve: (
      posture: IAutoMovieMotionHumanPosture,
    ) => IAutoMovieMotionHumanResolveHumanPosture.ISeeded,
  ): IAutoMovieMotionHumanResolveHumanPosture.ISeeded {
    const window: readonly [number, number] | undefined =
      carrier?.plan.legsStill;
    if (
      carrier === undefined ||
      window === undefined ||
      !plain ||
      person.layers.length !== 0 ||
      person.overlays.length !== 0 ||
      under.limbs.leftLeg === undefined ||
      under.limbs.rightLeg === undefined
    )
      return resolve(under);
    const local: number = Math.min(
      carrier.plan.duration,
      Math.max(0, seconds - carrier.start),
    );
    if (!(local >= window[0] && local <= window[1])) return resolve(under);
    const kept: IAutoMovieMotionHumanSegment["legs"] = carrier.legs;
    if (kept !== undefined && kept.at >= window[0] && kept.at <= window[1]) {
      const joints: IAutoMovieMotionHumanPosture["joints"] = {
        ...under.joints,
      };
      let direct: boolean = true;
      for (const joint of kept.joints) {
        if (
          joint.flexion === null ||
          joint.abduction === null ||
          joint.twist === null
        )
          direct = false;
        else joints[joint.bone] = [joint.flexion, joint.abduction, joint.twist];
      }
      if (direct) {
        const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...under.limbs };
        delete limbs.leftLeg;
        delete limbs.rightLeg;
        const fitted: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
          resolve({ ...under, joints, limbs });
        return { ...fitted, seeds: { ...fitted.seeds, ...kept.seeds } };
      }
    }
    const fitted: IAutoMovieMotionHumanResolveHumanPosture.ISeeded =
      resolve(under);
    const seeds: Partial<
      Record<
        AutoMovieHumanLimb,
        IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"][AutoMovieHumanLimb]
      >
    > = {};
    for (const limb of ["leftLeg", "rightLeg"] as const)
      if (fitted.seeds[limb] !== undefined) seeds[limb] = fitted.seeds[limb];
    carrier.legs = {
      at: local,
      joints: fitted.pose.joints.filter((joint: IAutoMovieJointPose): boolean =>
        LEG.test(joint.bone),
      ),
      seeds,
    };
    return fitted;
  }
}

/** A leg's bones, thigh to toes. */
const LEG: RegExp = /^(left|right)(UpperLeg|LowerLeg|Foot|Toes)$/;
