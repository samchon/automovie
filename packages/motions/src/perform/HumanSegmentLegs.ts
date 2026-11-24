import type {
  AutoMovieHumanLimb,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieSwivelSeed,
} from "@automovie/interface";

/**
 * A leaf resolve inside its action's legs-still window
 * (`IAutoMovieMotionHumanActionPlan.legsStill`): there the root, the trunk and
 * both legs' goals are one and the same, so every record a leg fit reads is,
 * and the legs' fit of one second is the fit of every other. The performance
 * fits the legs once at the window's start when it is prepared
 * (`IAutoMovieMotionHumanSegment.IPrepared.still`, {@link HumanSegmentLegs.still});
 * every leaf resolve in the window is then the same resolve with those records
 * given as the legs' joints and the legs' goals left out, so only the head, the
 * arms and the hands are fitted.
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
    const kept: IAutoMovieMotionHumanSegment.IStill | undefined =
      carrier?.prepared?.still;
    if (
      carrier === undefined ||
      kept === undefined ||
      !within(person, carrier, seconds, under, plain)
    )
      return resolve(under);
    const joints: IAutoMovieMotionHumanPosture["joints"] = { ...under.joints };
    for (const joint of kept.joints) {
      if (
        joint.flexion === null ||
        joint.abduction === null ||
        joint.twist === null
      )
        return resolve(under);
      joints[joint.bone] = [joint.flexion, joint.abduction, joint.twist];
    }
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...under.limbs };
    delete limbs.leftLeg;
    delete limbs.rightLeg;
    const fitted: IAutoMovieMotionHumanResolveHumanPosture.ISeeded = resolve({
      ...under,
      joints,
      limbs,
    });
    return { ...fitted, seeds: { ...fitted.seeds, ...kept.seeds } };
  }

  /**
   * Whether a leaf resolve keeps the legs' window fit: a plain resolve of a
   * person without layers or overlays, both legs goaled, inside the carrier's
   * legs-still window.
   *
   * @param person The person.
   * @param carrier The action the leaf belongs to.
   * @param seconds Film seconds.
   * @param under The leaf's posture.
   * @param plain Whether the resolve is a full, uncontinued one.
   * @returns Whether the window's fit applies.
   */
  export function within(
    person: IAutoMovieMotionHumanSegment.IPerson,
    carrier: IAutoMovieMotionHumanSegment,
    seconds: number,
    under: IAutoMovieMotionHumanPosture,
    plain: boolean,
  ): boolean {
    const window: readonly [number, number] | undefined =
      carrier.plan.legsStill;
    if (
      window === undefined ||
      !plain ||
      person.layers.length !== 0 ||
      person.overlays.length !== 0 ||
      under.limbs.leftLeg === undefined ||
      under.limbs.rightLeg === undefined
    )
      return false;
    const local: number = Math.min(
      carrier.plan.duration,
      Math.max(0, seconds - carrier.start),
    );
    return local >= window[0] && local <= window[1];
  }

  /**
   * The legs' fit a legs-still window keeps, from the leaf resolved at the
   * window's start: its leg joint records and the legs' seeds.
   *
   * @param pose The leaf's pose at the window's start.
   * @param seeds The leaf's fit seeds by fit name.
   * @returns The kept fit.
   */
  export function still(
    pose: IAutoMoviePose,
    seeds: ReadonlyMap<string, IAutoMovieSwivelSeed | null>,
  ): IAutoMovieMotionHumanSegment.IStill {
    const legs: Partial<Record<AutoMovieHumanLimb, IAutoMovieSwivelSeed | null>> =
      {};
    for (const limb of ["leftLeg", "rightLeg"] as const) {
      const seed: IAutoMovieSwivelSeed | null | undefined = seeds.get(
        `leaf::${limb}`,
      );
      if (seed !== undefined) legs[limb] = seed;
    }
    return {
      joints: pose.joints.filter((joint: IAutoMovieJointPose): boolean =>
        LEG.test(joint.bone),
      ),
      seeds: legs,
    };
  }
}

/** A leg's bones, thigh to toes. */
const LEG: RegExp = /^(left|right)(UpperLeg|LowerLeg|Foot|Toes)$/;
