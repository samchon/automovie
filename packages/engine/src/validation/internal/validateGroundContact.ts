import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieCapsuleProxy,
  type IAutoMovieResolvedBone,
  type IAutoMovieSkeletonTopology,
  type IAutoMovieValidateGroundContact,
  IAutoMovieValidation,
  IAutoMovieVector3,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { AutoMovieEngineKinematics } from "../../kinematics/index";
import { indexSkeletonTopology } from "../../kinematics/internal/indexSkeletonTopology";
import { AutoMovieEngineMotionSampling } from "../../motion/AutoMovieEngineMotionSampling";
import { sampleTimes } from "../../motion/internal/sampleTimes";
import { groundFunction } from "../../space/internal/groundFunction";
import { AutoMovieEngineViolationCollector } from "../AutoMovieEngineViolationCollector";
import { fkReachableBones } from "./fkReachableBones";
import { admitMotionSampleRate } from "./admitMotionSampleRate";
import { validateCapsule } from "./validateCapsule";

const DEFAULT_FOOT_BONES: readonly ["leftFoot", "rightFoot"] = [
  "leftFoot",
  "rightFoot",
] as const;

/**
 * Sample FK and compare configured foot points and valid capsule endpoints to
 * scalar/height-source ground minus tolerance. A nonfinite tolerance or a
 * nonfinite or nonpositive rate yields a range finding before the pose sweep.
 */
export function validateGroundContact(
  props: IAutoMovieValidateGroundContact.IProps,
): IAutoMovieValidation {
  const collector: IAutoMovieViolationCollector = new AutoMovieEngineViolationCollector();
  const suppressed: boolean = props.physicsIntent !== undefined;
  const footBones: readonly AutoMovieHumanoidBone[] =
    props.footBones ?? DEFAULT_FOOT_BONES;
  const tolerance: number = props.tolerance ?? 0;
  const sampleRate: number = props.sampleRate ?? 24;
  const path: string = props.path ?? "$input";
  const groundAt: (x: number, z: number) => number = groundFunction(
    props.groundY ?? 0,
  );
  const topology: IAutoMovieSkeletonTopology = indexSkeletonTopology(
    props.skeleton,
  );

  // Capsule endpoints are gated up front, exactly like the self-intersection
  // and body-collision validators: a detached or missing endpoint is an error,
  // never a silent skip, so the sweep only ever reads FK-resolved positions.
  const capsules: readonly IAutoMovieCapsuleProxy[] = props.capsules ?? [];
  const skeletonBones: Set<AutoMovieHumanoidBone> = new Set(
    props.skeleton.bones.map(
      (bone: IAutoMovieBone): AutoMovieHumanoidBone => bone.bone,
    ),
  );
  const reachableBones: Set<AutoMovieHumanoidBone> = fkReachableBones(
    props.skeleton,
    topology,
  );
  const capsuleValid: boolean[] = capsules.map(
    (capsule: IAutoMovieCapsuleProxy, capsuleIndex: number): boolean =>
      validateCapsule(
        capsule,
        `${path}.capsules[${capsuleIndex}]`,
        skeletonBones,
        reachableBones,
        collector,
      ),
  );

  const rateValid: boolean = admitMotionSampleRate(collector, path, sampleRate);
  const toleranceValid: boolean = Number.isFinite(tolerance);
  if (!toleranceValid)
    collector.push(
      "range",
      `${path}.tolerance`,
      `tolerance must be finite, but was ${tolerance}`,
      tolerance,
    );
  if (!rateValid || !toleranceValid) return collector.toValidation();

  sampleTimes(props.motion.duration, sampleRate).forEach(
    (time: number, index: number): void => {
      const resolved: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
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
            ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [
              bone.bone,
              bone,
            ],
          ),
        );
      for (const bone of footBones) {
        const foot: IAutoMovieResolvedBone | undefined = resolved.get(bone);
        if (foot === undefined) continue;
        const y: number = foot.worldPosition.y;
        const ground: number = groundAt(
          foot.worldPosition.x,
          foot.worldPosition.z,
        );
        const minY: number = ground - tolerance;
        if (y < minY && !suppressed)
          collector.warn(
            "physics",
            `${path}.samples[${index}].${bone}.worldPosition.y`,
            `${bone} world y must stay >= ${minY} at t=${round(time)}s (ground ${ground}, tolerance ${tolerance}; a foot usually should not pass through the ground; mark physicsIntent if it is deliberate)`,
            y,
            minY - y,
          );
      }

      capsules.forEach(
        (capsule: IAutoMovieCapsuleProxy, capsuleIndex: number): void => {
          if (!capsuleValid[capsuleIndex]) return;
          // Penetration is linear along a straight capsule over a flat plane or a
          // linear ramp, so its deepest point is at an endpoint: sampling both
          // ends against the (possibly sloped) ground finds the worst dip exactly
          // for a single surface and closely for a heightfield.
          const worst: IPenetration = [capsule.from, capsule.to].reduce(
            (
              deepest: IPenetration | null,
              endpoint: AutoMovieHumanoidBone,
            ): IPenetration => {
              const position: IAutoMovieVector3 =
                resolved.get(endpoint)!.worldPosition;
              const surfaceY: number = position.y - capsule.radius;
              const minY: number = groundAt(position.x, position.z) - tolerance;
              const candidate: IPenetration = {
                surfaceY,
                minY,
                depth: minY - surfaceY,
              };
              return deepest === null || candidate.depth > deepest.depth
                ? candidate
                : deepest;
            },
            null,
          )!;
          if (worst.depth > 0 && !suppressed)
            collector.warn(
              "physics",
              `${path}.samples[${index}].capsules[${capsuleIndex}].lowestY`,
              `capsule (${capsule.from} to ${capsule.to}) lowest surface y must stay >= ${round(worst.minY)} at t=${round(time)}s (radius ${capsule.radius}, tolerance ${tolerance}; a body part usually should not pass through the ground; mark physicsIntent if it is deliberate)`,
              worst.surfaceY,
              worst.depth,
            );
        },
      );
    },
  );

  return collector.toValidation();
}

/**
 * Carry an endpoint's surface height, admitted ground threshold and signed
 * depth.
 *
 * One row keeps the deepest capsule endpoint's actual and expected heights
 * together.
 *
 * This is endpoint sampling, not a continuous curved-heightfield solution.
 *
 * All three fields use model/world metres; positive depth means below
 * threshold.
 *
 * A capsule endpoint creates one fixed scalar record.
 *
 * The endpoint reduction keeps the currently deepest row for reporting.
 *
 * Rows live only inside one sampled capsule reduction and no body resource is
 * retained.
 */
interface IPenetration {
  surfaceY: number;
  minY: number;
  depth: number;
}

/**
 * Round a diagnostic quantity to three decimals with
 * Math.round(value*1000)/1000.
 *
 * The validateGroundContact owner applies presentation rounding after its
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
 * Diagnostics reuse the same presentation rule within validateGroundContact,
 * not cached measurements.
 *
 * Only a number returns and no sampled state is retained.
 */
const round: (value: number) => number = (value: number): number =>
  Math.round(value * 1_000) / 1_000;
