import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieCapsuleProxy,
  type IAutoMovieCapsuleProxyPair,
  type IAutoMovieResolvedBone,
  type IAutoMovieSkeletonTopology,
  type IAutoMovieValidateSelfIntersection,
  IAutoMovieValidation,
  IAutoMovieVector3,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { AutoMovieEngineKinematics } from "../../kinematics/index";
import { indexSkeletonTopology } from "../../kinematics/internal/indexSkeletonTopology";
import { segmentSegmentDistance } from "../../math/internal/segmentSegmentDistance";
import { AutoMovieEngineMotionSampling } from "../../motion/AutoMovieEngineMotionSampling";
import { sampleTimes } from "../../motion/internal/sampleTimes";
import { AutoMovieEngineViolationCollector } from "../AutoMovieEngineViolationCollector";
import { fkReachableBones } from "./fkReachableBones";
import { admitMotionSampleRate } from "./admitMotionSampleRate";
import { validateCapsule } from "./validateCapsule";

const DEFAULT_SAMPLE_RATE: number = 24;

/**
 * Sample valid capsule pairs through FK and warn when segment distance is less
 * than summed radii. A nonfinite or nonpositive rate yields a range finding
 * before the pose sweep.
 */
export function validateSelfIntersection(
  props: IAutoMovieValidateSelfIntersection.IProps,
): IAutoMovieValidation {
  const collector: IAutoMovieViolationCollector = new AutoMovieEngineViolationCollector();
  const suppressed: boolean = props.physicsIntent !== undefined;
  const sampleRate: number =
    props.sampleRate === undefined ? DEFAULT_SAMPLE_RATE : props.sampleRate;
  const path: string = props.path ?? "$input";
  const skeletonBones: Set<AutoMovieHumanoidBone> = new Set(
    props.skeleton.bones.map(
      (bone: IAutoMovieBone): AutoMovieHumanoidBone => bone.bone,
    ),
  );

  if (!admitMotionSampleRate(collector, path, sampleRate))
    return collector.toValidation();

  const topology: IAutoMovieSkeletonTopology = indexSkeletonTopology(
    props.skeleton,
  );
  const reachableBones: Set<AutoMovieHumanoidBone> = fkReachableBones(
    props.skeleton,
    topology,
  );

  props.pairs.forEach(
    (pair: IAutoMovieCapsuleProxyPair, pairIndex: number): void => {
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
            const resolved: Map<AutoMovieHumanoidBone, IAutoMovieVector3> =
              new Map(
                AutoMovieEngineKinematics.resolvePose(
                  AutoMovieEngineMotionSampling.samplePose(props.motion, time),
                  props.skeleton,
                  props.jointAxes,
                  props.restFrames,
                  topology,
                ).map(
                  (
                    bone: IAutoMovieResolvedBone,
                  ): [AutoMovieHumanoidBone, IAutoMovieVector3] => [
                    bone.bone,
                    bone.worldPosition,
                  ],
                ),
              );
            const first: { from: IAutoMovieVector3; to: IAutoMovieVector3 } =
              resolveCapsule(pair.first, resolved);
            const second: { from: IAutoMovieVector3; to: IAutoMovieVector3 } =
              resolveCapsule(pair.second, resolved);
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
    },
  );

  return collector.toValidation();
}

/**
 * Read admitted endpoint world positions from the sampled resolved map.
 *
 * ValidateCapsule's reachability gate supplies the non-null lookup premise.
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
const resolveCapsule: (
  capsule: IAutoMovieCapsuleProxy,
  resolved: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>,
) => { from: IAutoMovieVector3; to: IAutoMovieVector3 } = (
  capsule: IAutoMovieCapsuleProxy,
  resolved: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3>,
): { from: IAutoMovieVector3; to: IAutoMovieVector3 } => ({
  from: resolved.get(capsule.from)!,
  to: resolved.get(capsule.to)!,
});

/**
 * Round a diagnostic quantity to three decimals with
 * Math.round(value*1000)/1000.
 *
 * The validateSelfIntersection owner applies presentation rounding after its
 * actual predicate.
 *
 * Binary64 rounding is not an exact decimal serialization or decision
 * tolerance.
 *
 * Only displayed metre/second quantities are rounded, leaving comparison
 * arithmetic unchanged.
 *
 * Fixed scalar arithmetic takes constant work.
 *
 * Diagnostics reuse the same presentation rule within validateSelfIntersection,
 * not cached measurements.
 *
 * Only a number returns and no sampled state is retained.
 */
const round: (value: number) => number = (value: number): number =>
  Math.round(value * 1_000) / 1_000;
