import type {
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
} from "@automovie/interface";

/**
 * Admit shared support geometry before tracking or recovery can dereference a
 * carrier.
 */
export function admitPhysicalSupportPattern(
  profile: IAutoMoviePhysicalProfile,
  pattern: IAutoMovieFootfallPattern,
  stepping: boolean,
): void {
  const known: Set<string> = new Set(
    profile.segments.map(
      (segment: IAutoMoviePhysicalSegment): string => segment.bone,
    ),
  );
  const names: (values: string[]) => boolean = (values: string[]): boolean =>
    new Set(values).size === values.length &&
    values.every((bone: string): boolean => known.has(bone));
  if (
    !pattern.id.trim() ||
    !pattern.limbs.length ||
    pattern.minimumSupports < 0 ||
    pattern.minimumSupports > pattern.limbs.length - (stepping ? 1 : 0)
  )
    throw new Error("Invalid physical support pattern");
  const endpoints: Set<string> = new Set();
  for (const limb of pattern.limbs) {
    if (
      !known.has(limb.bone) ||
      endpoints.has(limb.bone) ||
      !names(limb.chain) ||
      !limb.chain.length ||
      limb.chain.at(-1) !== limb.bone ||
      limb.chain.some(
        (bone: string, index: number): boolean =>
          index > 0 &&
          !profile.joints.some(
            (joint: IAutoMoviePhysicalJoint): boolean =>
              joint.parent === limb.chain[index - 1] && joint.child === bone,
          ),
      ) ||
      (limb.contacts !== undefined && !names(limb.contacts))
    )
      throw new Error("Invalid physical support carrier or chain");
    endpoints.add(limb.bone);
    if (limb.reach) {
      const root: number = limb.chain.indexOf(limb.reach.root);
      if (
        root < 0 ||
        limb.chain.indexOf(limb.reach.middle) !== root + 1 ||
        limb.chain.indexOf(limb.reach.tip) !== root + 2
      )
        throw new Error("Invalid physical two-link support reach");
    }
    if (limb.floorPoints !== undefined) {
      if (limb.floorPoints.length > 64)
        throw new Error("Invalid physical support-plane witnesses");
      for (const point of limb.floorPoints)
        if (
          !known.has(point.bone) ||
          !(limb.contacts ?? [limb.bone]).includes(point.bone)
        )
          throw new Error("Invalid physical support-plane witness carrier");
    }
    if (
      limb.phase < 0 ||
      limb.phase >= 1 ||
      limb.duty < 0 ||
      limb.duty > 1 ||
      !limb.stride.length
    )
      throw new Error("Invalid physical support timing or stride");
    for (const [index, sample] of limb.stride.entries())
      if (
        sample.speed < 0 ||
        sample.length <= 0 ||
        (index > 0 && sample.speed <= limb.stride[index - 1]!.speed)
      )
        throw new Error("Invalid physical support stride samples");
  }
}
