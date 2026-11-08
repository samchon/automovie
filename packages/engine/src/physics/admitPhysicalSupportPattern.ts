import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
  IAutoMovieFootfallPattern as Pattern,
} from "@automovie/interface";

import { isAutoMovieRecord } from "../validation/isAutoMovieRecord";
import { isPhysicalNativeNumber as scalar } from "./isPhysicalNativeNumber";

/** Admit shared support geometry before tracking or recovery can dereference a carrier. */
export function admitPhysicalSupportPattern(
  profile: P,
  pattern: Pattern,
  stepping: boolean,
): void {
  const known: Set<string> = new Set(
    profile.segments.map((segment: P.ISegment): string => segment.bone),
  );
  const vector: (value: IAutoMovieVector3) => boolean = (
    value: IAutoMovieVector3,
  ): boolean => !!value && [value.x, value.y, value.z].every(scalar);
  const names: (values: string[]) => boolean = (values: string[]): boolean =>
    Array.isArray(values) &&
    new Set(values).size === values.length &&
    Array.from(values).every(
      (bone: string): boolean => typeof bone === "string" && known.has(bone),
    );
  if (
    !pattern ||
    typeof pattern.id !== "string" ||
    !pattern.id.trim() ||
    !Array.isArray(pattern.limbs) ||
    !pattern.limbs.length ||
    !Number.isInteger(pattern.minimumSupports) ||
    pattern.minimumSupports < 0 ||
    pattern.minimumSupports > pattern.limbs.length - (stepping ? 1 : 0)
  )
    throw new Error("Invalid physical support pattern");
  const endpoints: Set<string> = new Set();
  for (const limb of pattern.limbs) {
    if (
      !limb ||
      !known.has(limb.bone) ||
      endpoints.has(limb.bone) ||
      !names(limb.chain) ||
      !limb.chain.length ||
      limb.chain.at(-1) !== limb.bone ||
      limb.chain.some(
        (bone: string, index: number): boolean =>
          index > 0 &&
          !profile.joints.some(
            (joint: P.IJoint): boolean =>
              joint.parent === limb.chain[index - 1] && joint.child === bone,
          ),
      ) ||
      (limb.localPoint !== undefined && !vector(limb.localPoint)) ||
      (limb.contacts !== undefined && !names(limb.contacts))
    )
      throw new Error("Invalid physical support carrier or chain");
    endpoints.add(limb.bone);
    if (limb.reach !== undefined && !isAutoMovieRecord(limb.reach))
      throw new Error("Invalid physical two-link support reach");
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
      if (!Array.isArray(limb.floorPoints) || limb.floorPoints.length > 64)
        throw new Error("Invalid physical support-plane witnesses");
      for (const point of limb.floorPoints)
        if (
          !point ||
          !known.has(point.bone) ||
          !(limb.contacts ?? [limb.bone]).includes(point.bone) ||
          !vector(point.localPoint)
        )
          throw new Error("Invalid physical support-plane witness carrier");
    }
    if (
      !Number.isFinite(limb.phase) ||
      limb.phase < 0 ||
      limb.phase >= 1 ||
      !Number.isFinite(limb.duty) ||
      limb.duty < 0 ||
      limb.duty > 1 ||
      !limb.offset ||
      ![limb.offset.forward, limb.offset.left].every(scalar) ||
      !Array.isArray(limb.stride) ||
      !limb.stride.length
    )
      throw new Error("Invalid physical support timing or stride");
    for (const [index, sample] of limb.stride.entries())
      if (
        !sample ||
        !scalar(sample.speed) ||
        sample.speed < 0 ||
        !scalar(sample.length) ||
        sample.length <= 0 ||
        (index > 0 && sample.speed <= limb.stride[index - 1]!.speed)
      )
        throw new Error("Invalid physical support stride samples");
  }
}
