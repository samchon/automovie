import type { IAutoMovieResolvedBone } from "./../kinematics/IAutoMovieResolvedBone";
import type { IAutoMovieSkeletonTopology } from "./../kinematics/IAutoMovieSkeletonTopology";
import { IAutoMovieBone,
  AutoMovieHumanoidBone,
  IAutoMovieCapsuleProxy,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  IAutoMovieJointAxes,
  indexSkeletonTopology,
  resolvePose,
} from "../kinematics";
import { segmentSegmentDistance } from "../math/segmentSegmentDistance";
import { sampleMotion } from "../motion/sampleMotion";
import { sampleTimes } from "../motion/sampleTimes";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { IAutoMovieCapsuleProxyPair } from "./IAutoMovieCapsuleProxyPair";
import { ViolationCollector } from "./ViolationCollector";
import { fkReachableBones } from "./fkReachableBones";
import { validateCapsule } from "./validateCapsule";

const DEFAULT_SAMPLE_RATE: number = 24;

/**
 * Sample valid capsule pairs through FK and warn when segment distance is less than summed radii.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Sample valid capsule pairs through FK and warn when segment distance is less than summed radii.
 * @evidence contracts/common.md#clear-and-simple-design Shared sample clock, segmentSegmentDistance and validateCapsule own temporal, distance and endpoint semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Capsule proxies approximate bodies; tangency is allowed and physicsIntent suppresses overlap warnings while malformed inputs stay errors.
 * @evidence contracts/common.md#meaningful-documentation Default24Hz, proxy/model units and pair/sample paths are stated.
 * @evidence contracts/performance.md#efficient-algorithms For P pairs and T samples, repeated motion/FK work and segment tests dominate; this coordinator resolves each pair's sampled pose independently.
 * @evidence contracts/performance.md#reuse-equivalent-work Skeleton topology/reachability are reused; pair endpoints share the same canonical capsule admission.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Sample-local resolved maps release; returned diagnostics grow with failures and no native collision world persists.
 */
export const validateSelfIntersection: (props: { motion: IAutoMovieMotion; skeleton: IAutoMovieSkeleton; pairs: readonly IAutoMovieCapsuleProxyPair[]; sampleRate?: number; path?: string; jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>; restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>; physicsIntent?: string; }) => IAutoMovieValidation = (props: {
  /** Motion clip to sample. */
  motion: IAutoMovieMotion;

  /** Skeleton used for forward kinematics. */
  skeleton: IAutoMovieSkeleton;

  /** Declared non-adjacent capsule pairs to test. */
  pairs: readonly IAutoMovieCapsuleProxyPair[];

  /** Samples per second used by the validator. Defaults to `24`. */
  sampleRate?: number;

  /** JSON path of the proxy annotation being checked. Defaults to `$input`. */
  path?: string;

  /** Optional clinical-axis remap for rigs authored in semantic axes. */
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /** Optional rest-frame remap for clinical authoring. */
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;

  /**
   * Marker that opts the pair out of the overlap expectation: close
   * choreography (a grapple, an embrace) sets this and the matching warnings
   * are suppressed.
   */
  physicsIntent?: string;
}): IAutoMovieValidation => {
  const collector: ViolationCollector = new ViolationCollector();
  const suppressed: boolean = props.physicsIntent !== undefined;
  const sampleRate: number =
    props.sampleRate === undefined ? DEFAULT_SAMPLE_RATE : props.sampleRate;
  const path: string = props.path ?? "$input";
  const skeletonBones: Set<AutoMovieHumanoidBone> = new Set(props.skeleton.bones.map((bone: IAutoMovieBone): AutoMovieHumanoidBone => bone.bone));

  if (!Number.isFinite(sampleRate))
    return rejectSampleRate(collector, path, sampleRate);
  if (sampleRate <= 0) return rejectSampleRate(collector, path, sampleRate);

  const topology: IAutoMovieSkeletonTopology = indexSkeletonTopology(props.skeleton);
  const reachableBones: Set<AutoMovieHumanoidBone> = fkReachableBones(props.skeleton, topology);

  props.pairs.forEach((pair: IAutoMovieCapsuleProxyPair, pairIndex: number): void => {
    const pp: string = `${path}.pairs[${pairIndex}]`;
    const firstValid: boolean = validateCapsule(
      pair.first,
      `${pp}.first`,
      skeletonBones,
      reachableBones,
      collector,
    );
    const secondValid: boolean = validateCapsule(
      pair.second,
      `${pp}.second`,
      skeletonBones,
      reachableBones,
      collector,
    );
    if (firstValid && secondValid) {
      sampleTimes(props.motion.duration, sampleRate).forEach(
        (time: number, sampleIndex: number): void => {
          const resolved: Map<AutoMovieHumanoidBone, IAutoMovieVector3> = new Map(
            resolvePose(
              sampleMotion(props.motion, time).pose,
              props.skeleton,
              props.jointAxes,
              props.restFrames,
              topology,
            ).map((bone: IAutoMovieResolvedBone): [AutoMovieHumanoidBone, IAutoMovieVector3] => [bone.bone, bone.worldPosition]),
          );
          const first: { from: IAutoMovieVector3; to: IAutoMovieVector3; } = resolveCapsule(pair.first, resolved);
          const second: { from: IAutoMovieVector3; to: IAutoMovieVector3; } = resolveCapsule(pair.second, resolved);
          const distance: number = segmentSegmentDistance(
            first.from,
            first.to,
            second.from,
            second.to,
          );
          const minimum: number = pair.first.radius + pair.second.radius;
          if (distance < minimum && !suppressed)
            collector.warn(
              "physics",
              `${pp}.samples[${sampleIndex}].distance`,
              `capsule centerline distance must stay >= ${round(minimum)}m at t=${round(time)}s (body parts may legitimately near-contact in close choreography; mark physicsIntent if it is deliberate)`,
              distance,
              minimum - distance,
            );
        },
      );
    }
  });

  return collector.toValidation();
};

/**
 * Append a range error for nonfinite/nonpositive sampling rate and signal refusal.
 *
 * The check runs before sampleTimes and FK resolution.
 *
 * An explicit bad rate is not replaced by the24Hz default.
 *
 * The returned failed validation and exact sampleRate fault path are stated.
 *
 * Constant finite/comparison work plus failure text is required.
 *
 * The same admitted rate serves all pairs for this call.
 *
 * Only caller-owned diagnostics remain, without a sampler task.
 */
const rejectSampleRate: (collector: ViolationCollector, path: string, sampleRate: number) => IAutoMovieValidation = (
  collector: ViolationCollector,
  path: string,
  sampleRate: number,
): IAutoMovieValidation => {
  collector.push(
    "range",
    `${path}.sampleRate`,
    `sampleRate must be a finite number > 0, but was ${sampleRate}`,
    sampleRate,
  );
  return collector.toValidation();
};

/**
 * Read admitted endpoint world positions from the sampled resolved map.
 *
 * validateCapsule's reachability gate supplies the non-null lookup premise.
 *
 * Missing endpoints are not fabricated; callers must have gated this capsule.
 *
 * The returned pair borrows positions and does not copy the body's radius.
 *
 * Two expected-constant map lookups and one wrapper allocation are required.
 *
 * A sampled FK map serves both endpoints without another solve.
 *
 * The wrapper is sample-local and no resolved map/body handle is retained.
 */
const resolveCapsule: (capsule: IAutoMovieCapsuleProxy, resolved: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>) => { from: IAutoMovieVector3; to: IAutoMovieVector3; } = (
  capsule: IAutoMovieCapsuleProxy,
  resolved: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>,
): { from: IAutoMovieVector3; to: IAutoMovieVector3 } => ({
  from: resolved.get(capsule.from)!,
  to: resolved.get(capsule.to)!,
});

/**
 * Round a diagnostic quantity to three decimals with Math.round(value*1000)/1000.
 *
 * The validateSelfIntersection owner applies presentation rounding after its actual predicate.
 *
 * Binary64 rounding is not an exact decimal serialization or decision tolerance.
 *
 * Only displayed metre/second quantities are rounded, leaving comparison arithmetic unchanged.
 *
 * Fixed scalar arithmetic takes constant work.
 *
 * Diagnostics reuse the same presentation rule within validateSelfIntersection, not cached measurements.
 *
 * Only a number returns and no sampled state is retained.
 */
const round: (value: number) => number = (value: number): number => Math.round(value * 1_000) / 1_000;
