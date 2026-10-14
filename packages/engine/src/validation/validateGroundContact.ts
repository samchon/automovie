import type { IAutoMovieResolvedBone } from "./../kinematics/IAutoMovieResolvedBone";
import type { IAutoMovieSkeletonTopology } from "./../kinematics/IAutoMovieSkeletonTopology";
import { IAutoMovieBone, IAutoMovieVector3,
  AutoMovieHumanoidBone,
  IAutoMovieCapsuleProxy,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
  IAutoMovieValidation,
} from "@automovie/interface";

import {
  IAutoMovieJointAxes,
  indexSkeletonTopology,
  resolvePose,
} from "../kinematics";
import { sampleMotion } from "../motion/sampleMotion";
import { sampleTimes } from "../motion/sampleTimes";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { groundFunction } from "../space/groundFunction";
import { ViolationCollector } from "./ViolationCollector";
import { fkReachableBones } from "./fkReachableBones";
import { validateCapsule } from "./validateCapsule";

const DEFAULT_FOOT_BONES: readonly ["leftFoot", "rightFoot"] = ["leftFoot", "rightFoot"] as const;

/**
 * Sample FK and compare configured foot points and valid capsule endpoints to scalar/height-source ground minus tolerance.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Sample FK and compare configured foot points and valid capsule endpoints to scalar/height-source ground minus tolerance.
 * @evidence contracts/common.md#clear-and-simple-design groundFunction, shared sampleTimes and validateCapsule own the height adapter, clock and usable endpoint contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing foot bones are skipped, capsules require reachable endpoints, and endpoint checks do not solve penetration against arbitrary curved heightfields.
 * @evidence contracts/common.md#meaningful-documentation Defaults24Hz/zero ground/zero tolerance, advisory physicsIntent policy and capsule radius semantics are explicit.
 * @evidence contracts/performance.md#efficient-algorithms T samples pay motion/FK and O(F+C) support queries; two endpoints are measured per capsule.
 * @evidence contracts/performance.md#reuse-equivalent-work Topology/reachability and capsule usability are computed before the time walk; current ground callbacks execute for each measurement.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Per-frame maps release; the caller owns warnings and the borrowed callback lifetime, with no physics scene created.
 */
export const validateGroundContact: (props: { motion: IAutoMovieMotion; skeleton: IAutoMovieSkeleton; footBones?: readonly AutoMovieHumanoidBone[]; capsules?: readonly IAutoMovieCapsuleProxy[]; groundY?: number | ((x: number, z: number) => number); tolerance?: number; sampleRate?: number; path?: string; jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>; restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>; physicsIntent?: string; }) => IAutoMovieValidation = (props: {
  /** Motion clip to sample. */
  motion: IAutoMovieMotion;

  /** Skeleton used for forward kinematics. */
  skeleton: IAutoMovieSkeleton;

  /** Bones treated as ground-contact points. Defaults to both humanoid feet. */
  footBones?: readonly AutoMovieHumanoidBone[];

  /**
   * Whole-body capsule proxies swept against the ground (#1185): each is a
   * `from → to` bone segment with a radius, and its lowest surface point
   * (`min(from.y, to.y) − radius`, sampled per endpoint against a heightfield)
   * must stay above the ground, so a hand, hip, elbow, or prop clipping through
   * the floor is no longer invisible the way the foot-point check leaves it. A
   * capsule on a missing or detached bone is a `type` error, not a silent skip
   * (the totality contract the point check does not carry). Omit to check only
   * `footBones`.
   */
  capsules?: readonly IAutoMovieCapsuleProxy[];

  /** Ground height: plane scalar or `(x, z) → y` source. Defaults to `0`. */
  groundY?: number | ((x: number, z: number) => number);

  /** Allowed penetration depth before violation. Defaults to `0`. */
  tolerance?: number;

  /** Samples per second used by the validator. Defaults to `24`. */
  sampleRate?: number;

  /** JSON path of the motion being checked. Defaults to `$input`. */
  path?: string;

  /** Optional clinical-axis remap for rigs authored in semantic axes. */
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /** Optional rest-frame remap for clinical authoring. */
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;

  /**
   * Marker that opts the clip out of the ground-contact expectation: a
   * deliberate pass-through (a phasing ghost, a stylized float) sets this and
   * the matching warnings are suppressed.
   */
  physicsIntent?: string;
}): IAutoMovieValidation => {
  const collector: ViolationCollector = new ViolationCollector();
  const suppressed: boolean = props.physicsIntent !== undefined;
  const footBones: readonly AutoMovieHumanoidBone[] = props.footBones ?? DEFAULT_FOOT_BONES;
  const tolerance: number = props.tolerance ?? 0;
  const sampleRate: number = props.sampleRate ?? 24;
  const path: string = props.path ?? "$input";
  const groundAt: (x: number, z: number) => number = groundFunction(props.groundY ?? 0);
  const topology: IAutoMovieSkeletonTopology = indexSkeletonTopology(props.skeleton);

  // Capsule endpoints are gated up front, exactly like the self-intersection
  // and body-collision validators: a detached or missing endpoint is an error,
  // never a silent skip, so the sweep only ever reads FK-resolved positions.
  const capsules: readonly IAutoMovieCapsuleProxy[] = props.capsules ?? [];
  const skeletonBones: Set<AutoMovieHumanoidBone> = new Set(props.skeleton.bones.map((bone: IAutoMovieBone): AutoMovieHumanoidBone => bone.bone));
  const reachableBones: Set<AutoMovieHumanoidBone> = fkReachableBones(props.skeleton, topology);
  const capsuleValid: boolean[] = capsules.map((capsule: IAutoMovieCapsuleProxy, capsuleIndex: number): boolean =>
    validateCapsule(
      capsule,
      `${path}.capsules[${capsuleIndex}]`,
      skeletonBones,
      reachableBones,
      collector,
    ),
  );

  // Guard the sampling clock, matching the sibling sampling validators
  // (validateFootSkate/SelfIntersection/BalanceSupport): a non-finite or
  // non-positive rate makes `sampleTimes` yield an empty/NaN clock (which then
  // throws in the sampler), and a non-finite tolerance makes `minY = ground −
  // NaN = NaN` so `y < NaN` is always false. Either one would silently drop
  // every penetration (a #1051/#1082 silent-skip). Surface both as errors and
  // do not sample against a broken clock.
  const badRate: boolean = !Number.isFinite(sampleRate) || sampleRate <= 0;
  const badTolerance: boolean = !Number.isFinite(tolerance);
  if (badRate)
    collector.push(
      "range",
      `${path}.sampleRate`,
      `sampleRate must be a finite number > 0, but was ${sampleRate}`,
      sampleRate,
    );
  if (badTolerance)
    collector.push(
      "range",
      `${path}.tolerance`,
      `tolerance must be a finite number, but was ${tolerance}`,
      tolerance,
    );
  if (badRate || badTolerance) return collector.toValidation();

  sampleTimes(props.motion.duration, sampleRate).forEach((time: number, index: number): void => {
    const resolved: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
      resolvePose(
        sampleMotion(props.motion, time).pose,
        props.skeleton,
        props.jointAxes,
        props.restFrames,
        topology,
      ).map((bone: IAutoMovieResolvedBone): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [bone.bone, bone]),
    );
    for (const bone of footBones) {
      const foot: IAutoMovieResolvedBone | undefined = resolved.get(bone);
      if (foot === undefined) continue;
      const y: number = foot.worldPosition.y;
      const ground: number = groundAt(foot.worldPosition.x, foot.worldPosition.z);
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

    capsules.forEach((capsule: IAutoMovieCapsuleProxy, capsuleIndex: number): void => {
      if (!capsuleValid[capsuleIndex]) return;
      // Penetration is linear along a straight capsule over a flat plane or a
      // linear ramp, so its deepest point is at an endpoint: sampling both
      // ends against the (possibly sloped) ground finds the worst dip exactly
      // for a single surface and closely for a heightfield.
      const worst: IPenetration = [capsule.from, capsule.to].reduce(
        (deepest: IPenetration | null, endpoint: AutoMovieHumanoidBone): IPenetration => {
          const position: IAutoMovieVector3 = resolved.get(endpoint)!.worldPosition;
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
    });
  });

  return collector.toValidation();
};

/**
 * Carry an endpoint's surface height, admitted ground threshold and signed depth.
 *
 * One row keeps the deepest capsule endpoint's actual and expected heights together.
 *
 * This is endpoint sampling, not a continuous curved-heightfield solution.
 *
 * All three fields use model/world metres; positive depth means below threshold.
 *
 * A capsule endpoint creates one fixed scalar record.
 *
 * The endpoint reduction keeps the currently deepest row for reporting.
 *
 * Rows live only inside one sampled capsule reduction and no body resource is retained.
 *
 * @author Samchon
 */
interface IPenetration {
  surfaceY: number;
  minY: number;
  depth: number;
}

/**
 * Round a diagnostic quantity to three decimals with Math.round(value*1000)/1000.
 *
 * The validateGroundContact owner applies presentation rounding after its actual predicate.
 *
 * Binary64 rounding is not an exact decimal serialization or decision tolerance.
 *
 * Only displayed metre/second quantities are rounded, leaving comparison arithmetic unchanged.
 *
 * Fixed scalar arithmetic takes constant work.
 *
 * Diagnostics reuse the same presentation rule within validateGroundContact, not cached measurements.
 *
 * Only a number returns and no sampled state is retained.
 */
const round: (value: number) => number = (value: number): number => Math.round(value * 1_000) / 1_000;
