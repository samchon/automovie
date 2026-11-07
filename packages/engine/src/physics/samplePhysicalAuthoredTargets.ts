import type { IAutoMoviePhysicalProfile as P } from "@automovie/interface";

import type { AutoMoviePhysicalSimulation as Simulation } from "./AutoMoviePhysicalSimulation";
import type { IAutoMoviePhysicalBinding as Bound } from "./IAutoMoviePhysicalBinding";
import { preparePhysicalTargetSampler } from "./preparePhysicalTargetSampler";
import type { samplePhysicalTarget } from "./samplePhysicalTarget";

/** Reuse admitted interval coefficients while retaining the original authored interpolation clock and rate arithmetic. Mutable direct callers are checked by the scalar-aware bone samplers. */
export function samplePhysicalAuthoredTargets(
  body: Simulation.IBody,
  target: Simulation.ITarget,
  bound: Bound,
  step: number,
  seconds: number,
  rate: number,
): Record<string, ReturnType<typeof samplePhysicalTarget>> {
  const from: Record<string, P.ITransform> = body.targets[step - 1]!.segments;
  let prepared: samplePhysicalAuthoredTargets.IPlan | undefined =
    bound.authoredTargets.get(body.id);
  if (
    !prepared ||
    prepared.step !== step ||
    prepared.from !== from ||
    prepared.targets !== target.segments ||
    prepared.rate !== rate
  ) {
    prepared = { step, rate, from, targets: target.segments, bones: new Map() };
    bound.authoredTargets.set(body.id, prepared);
  }
  const fraction: number = Math.max(
    0,
    Math.min(1, seconds * rate - (step - 1)),
  );
  const result: Record<
    string,
    ReturnType<typeof samplePhysicalTarget>
  > = Object.create(null);
  for (const segment of body.profile.segments) {
    const bone: string = segment.bone;
    let motion: ReturnType<typeof prepared.bones.get> =
      prepared.bones.get(bone);
    if (
      !motion ||
      motion.before !== from[bone] ||
      motion.after !== target.segments[bone]
    ) {
      motion = {
        before: from[bone]!,
        after: target.segments[bone]!,
        sample: preparePhysicalTargetSampler(
          from[bone]!,
          target.segments[bone]!,
          rate,
        ),
      };
      prepared.bones.set(bone, motion);
    }
    result[bone] = motion.sample(fraction);
  }
  return result;
}

/** Run-owned transient coefficients are reconstructed from input after checkpoint restore. */
export namespace samplePhysicalAuthoredTargets {
  /** One authored cached interval, independent of fitted controller plans. */
  export interface IPlan {
    /** Enclosing cache interval. */ step: number;
    /** Original cache frequency, hertz. */ rate: number;
    /** Original admitted start transforms. */ from: Record<
      string,
      P.ITransform
    >;
    /** Original admitted end transforms. */ targets: Record<
      string,
      P.ITransform
    >;
    /** Bone coefficient ownership with value-aware mutation checks. */ bones: Map<
      string,
      {
        /** Bound start-transform reference, with scalar invalidation. */ before: P.ITransform;
        /** Bound end-transform reference, with scalar invalidation. */ after: P.ITransform;
        /** Per-bone prepared interpolation and twist. */ sample: ReturnType<
          typeof preparePhysicalTargetSampler
        >;
      }
    >;
  }
}
