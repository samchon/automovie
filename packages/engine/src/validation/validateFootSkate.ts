import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieMotion,
  IAutoMovieSkeleton,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  IAutoMovieJointAxes,
  IAutoMovieSkeletonTopology,
  indexSkeletonTopology,
  resolvePose,
} from "../kinematics";
import { sampleMotion } from "../motion/sampleMotion";
import { windowSampleTimes } from "../motion/windowSampleTimes";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import type { IAutoMovieResolvedBone } from "./../kinematics/IAutoMovieResolvedBone";
import { IAutoMovieFootContactWindow } from "./IAutoMovieFootContactWindow";
import { ViolationCollector } from "./ViolationCollector";
import { fkReachableBones } from "./fkReachableBones";

const DEFAULT_SAMPLE_RATE: number = 24;

const DEFAULT_MAX_HORIZONTAL_SPEED: number = 0.02;

/**
 * Sample admitted contact windows, resolve FK and warn when adjacent foot XZ displacement divided by elapsed seconds exceeds the declared speed.
 *
 * @evidence contracts/common.md#principled-implementation Sample admitted contact windows, resolve FK and warn when adjacent foot XZ displacement divided by elapsed seconds exceeds the declared speed.
 * @evidence contracts/common.md#clear-and-simple-design Shared window clock and reachability prevent missing FK lookups and mismatched physics sample times.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts physicsIntent suppresses skate warnings only; finite positive rate and valid reachable bone/window/speed remain mandatory errors.
 * @evidence contracts/common.md#meaningful-documentation Defaults24Hz and0.02m/s, contact-local sample paths and advisory behavior are stated.
 * @evidence contracts/performance.md#efficient-algorithms T samples pay motion/FK plus one bone find each; stored samples use O(T) space per contact.
 * @evidence contracts/performance.md#reuse-equivalent-work Topology/reachability are computed once for the invocation, not again for every window.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Sample arrays release per contact; returned warnings grow with violations and retain no playback or solver handle.
 */
export const validateFootSkate: (props: {
  motion: IAutoMovieMotion;
  skeleton: IAutoMovieSkeleton;
  contacts: readonly IAutoMovieFootContactWindow[];
  sampleRate?: number;
  path?: string;
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;
  physicsIntent?: string;
}) => IAutoMovieValidation = (props: {
  /** Motion clip to sample. */
  motion: IAutoMovieMotion;

  /** Skeleton used for forward kinematics. */
  skeleton: IAutoMovieSkeleton;

  /** Declared planted-foot windows to test. */
  contacts: readonly IAutoMovieFootContactWindow[];

  /** Samples per second used by the validator. Defaults to `24`. */
  sampleRate?: number;

  /** JSON path of the contact annotation being checked. Defaults to `$input`. */
  path?: string;

  /** Optional clinical-axis remap for rigs authored in semantic axes. */
  jointAxes?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>;

  /** Optional rest-frame remap for clinical authoring. */
  restFrames?: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>;

  /**
   * Marker that opts the clip out of the foot-plant expectation. Foot skate is
   * a physical-plausibility warning, not a gate: a deliberate slide (a
   * moonwalk, a skate, a comedic scoot) sets this and the matching warnings are
   * suppressed. Malformed annotations (bad bone, window, rate) stay errors.
   */
  physicsIntent?: string;
}): IAutoMovieValidation => {
  const collector: ViolationCollector = new ViolationCollector();
  const suppressed: boolean = props.physicsIntent !== undefined;
  const sampleRate: number = props.sampleRate ?? DEFAULT_SAMPLE_RATE;
  const path: string = props.path ?? "$input";
  const skeletonBones: Set<AutoMovieHumanoidBone> = new Set(
    props.skeleton.bones.map(
      (bone: IAutoMovieBone): AutoMovieHumanoidBone => bone.bone,
    ),
  );
  const topology: IAutoMovieSkeletonTopology = indexSkeletonTopology(
    props.skeleton,
  );
  const reachableBones: Set<AutoMovieHumanoidBone> = fkReachableBones(
    props.skeleton,
    topology,
  );

  if (!Number.isFinite(sampleRate) || sampleRate <= 0)
    collector.push(
      "range",
      `${path}.sampleRate`,
      `sampleRate must be a finite number > 0, but was ${sampleRate}`,
      sampleRate,
    );

  props.contacts.forEach(
    (contact: IAutoMovieFootContactWindow, contactIndex: number): void => {
      const cp: string = `${path}.contacts[${contactIndex}]`;
      const maxHorizontalSpeed: number =
        contact.maxHorizontalSpeed ?? DEFAULT_MAX_HORIZONTAL_SPEED;

      if (!skeletonBones.has(contact.bone))
        collector.push(
          "type",
          `${cp}.bone`,
          `contact bone "${contact.bone}" must exist in the target skeleton`,
          contact.bone,
        );
      // A declared-but-detached bone (its parent chain never reaches a root) is
      // never returned by FK, so reading its resolved position would crash rather
      // than report the malformed rig. Gate on FK-reachability, not just
      // declaration, and skip sampling when it is unreachable.
      const boneUnreachable: boolean =
        skeletonBones.has(contact.bone) && !reachableBones.has(contact.bone);
      if (boneUnreachable)
        collector.push(
          "type",
          `${cp}.bone`,
          `contact bone "${contact.bone}" is declared but not reachable from a root bone via forward kinematics`,
          contact.bone,
        );
      if (
        !Number.isFinite(contact.start) ||
        !Number.isFinite(contact.end) ||
        contact.end <= contact.start
      )
        collector.push(
          "temporal",
          cp,
          `contact window must have finite start/end with end > start, but was [${contact.start}, ${contact.end}]`,
          { start: contact.start, end: contact.end },
        );
      if (!Number.isFinite(maxHorizontalSpeed) || maxHorizontalSpeed < 0)
        collector.push(
          "range",
          `${cp}.maxHorizontalSpeed`,
          `maxHorizontalSpeed must be a finite number >= 0, but was ${maxHorizontalSpeed}`,
          maxHorizontalSpeed,
        );
      if (
        !skeletonBones.has(contact.bone) ||
        boneUnreachable ||
        !Number.isFinite(contact.start) ||
        !Number.isFinite(contact.end) ||
        contact.end <= contact.start ||
        !Number.isFinite(maxHorizontalSpeed) ||
        maxHorizontalSpeed < 0 ||
        !Number.isFinite(sampleRate) ||
        sampleRate <= 0
      )
        return;

      const samples: { time: number; position: IAutoMovieVector3 }[] =
        sampleWindow(
          props.motion,
          props.skeleton,
          contact,
          sampleRate,
          props.jointAxes,
          props.restFrames,
          topology,
        );
      for (let index: number = 1; index < samples.length; index++) {
        const previous: { time: number; position: IAutoMovieVector3 } =
          samples[index - 1]!;
        const current: { time: number; position: IAutoMovieVector3 } =
          samples[index]!;
        const speed: number = horizontalSpeed(previous, current);
        if (speed > maxHorizontalSpeed && !suppressed)
          collector.warn(
            "physics",
            `${cp}.samples[${index}].${contact.bone}.horizontalSpeed`,
            `${contact.bone} planted horizontal speed must stay <= ${maxHorizontalSpeed}m/s between t=${round(previous.time)}s and t=${round(current.time)}s (a planted foot usually should not skate; mark physicsIntent if the slide is deliberate)`,
            speed,
            speed - maxHorizontalSpeed,
          );
      }
    },
  );

  return collector.toValidation();
};

/**
 * Use windowSampleTimes to sample motion/FK and select the admitted contact bone's world position.
 *
 * Clock and rig resolution stay with their canonical owners.
 *
 * Caller reachability/rate/window admission is required before the non-null resolved lookup.
 *
 * Output pairs second timestamps with borrowed resolved world-position records.
 *
 * T times pay motion/FK and one resolved-bone find, returning O(T) sample rows.
 *
 * One supplied topology is reused through all window samples.
 *
 * The caller owns sample wrappers/points; no sampling task or native rig remains.
 */
const sampleWindow: (
  motion: IAutoMovieMotion,
  skeleton: IAutoMovieSkeleton,
  contact: IAutoMovieFootContactWindow,
  sampleRate: number,
  jointAxes:
    | Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>
    | undefined,
  restFrames:
    | Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>
    | undefined,
  topology: IAutoMovieSkeletonTopology,
) => Array<{ time: number; position: IAutoMovieVector3 }> = (
  motion: IAutoMovieMotion,
  skeleton: IAutoMovieSkeleton,
  contact: IAutoMovieFootContactWindow,
  sampleRate: number,
  jointAxes:
    | Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>
    | undefined,
  restFrames:
    | Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>
    | undefined,
  topology: IAutoMovieSkeletonTopology,
): Array<{ time: number; position: IAutoMovieVector3 }> =>
  windowSampleTimes(contact.start, contact.end, sampleRate).map(
    (time: number): { time: number; position: IAutoMovieVector3 } => {
      const resolved: IAutoMovieResolvedBone | undefined = resolvePose(
        sampleMotion(motion, time).pose,
        skeleton,
        jointAxes,
        restFrames,
        topology,
      ).find(
        (bone: IAutoMovieResolvedBone): boolean => bone.bone === contact.bone,
      );
      return { time, position: resolved!.worldPosition };
    },
  );

/**
 * Divide XZ displacement magnitude by the two samples' elapsed seconds.
 *
 * This measures horizontal skating without treating vertical motion as a slide.
 *
 * Strictly increasing sample times are required; this helper does not guard zero dt.
 *
 * Output is model/world units per second.
 *
 * One hypot and fixed subtraction/division take constant work.
 *
 * Adjacent contact samples share stored FK points rather than resolving again.
 *
 * Only a speed scalar returns; sample rows are not retained.
 */
const horizontalSpeed: (
  previous: { time: number; position: IAutoMovieVector3 },
  current: { time: number; position: IAutoMovieVector3 },
) => number = (
  previous: { time: number; position: IAutoMovieVector3 },
  current: { time: number; position: IAutoMovieVector3 },
): number => {
  const dx: number = current.position.x - previous.position.x;
  const dz: number = current.position.z - previous.position.z;
  return Math.hypot(dx, dz) / (current.time - previous.time);
};

/**
 * Round a diagnostic quantity to three decimals with Math.round(value*1000)/1000.
 *
 * The validateFootSkate owner applies presentation rounding after its actual predicate.
 *
 * Binary64 rounding is not an exact decimal serialization or decision tolerance.
 *
 * Only displayed metre/second quantities are rounded, leaving comparison arithmetic unchanged.
 *
 * Fixed scalar arithmetic takes constant work.
 *
 * Diagnostics reuse the same presentation rule within validateFootSkate, not cached measurements.
 *
 * Only a number returns and no sampled state is retained.
 */
const round: (value: number) => number = (value: number): number =>
  Math.round(value * 1_000) / 1_000;
