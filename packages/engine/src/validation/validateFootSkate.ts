import {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  type IAutoMovieFootContactWindow,
  type IAutoMovieJointAxes,
  IAutoMovieMotion,
  type IAutoMovieResolvedBone,
  type IAutoMovieRestFrame,
  IAutoMovieSkeleton,
  type IAutoMovieSkeletonTopology,
  type IAutoMovieValidateFootSkate,
  IAutoMovieValidation,
  IAutoMovieVector3,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { indexSkeletonTopology, resolvePose } from "../kinematics";
import { sampleMotion } from "../motion/sampleMotion";
import { windowSampleTimes } from "../motion/windowSampleTimes";
import { ViolationCollector } from "./ViolationCollector";
import { fkReachableBones } from "./fkReachableBones";

const DEFAULT_SAMPLE_RATE: number = 24;

const DEFAULT_MAX_HORIZONTAL_SPEED: number = 0.02;

/**
 * Sample admitted contact windows, resolve FK and warn when adjacent foot XZ
 * displacement divided by elapsed seconds exceeds the declared speed.
 */
export const validateFootSkate: (
  props: IAutoMovieValidateFootSkate.IProps,
) => IAutoMovieValidation = (
  props: IAutoMovieValidateFootSkate.IProps,
): IAutoMovieValidation => {
  const collector: IAutoMovieViolationCollector = new ViolationCollector();
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

  if (sampleRate <= 0)
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
      const temporalInvalid: boolean = !(
        contact.start > -Infinity &&
        contact.end < Infinity &&
        contact.end > contact.start
      );

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
      if (temporalInvalid)
        collector.push(
          "temporal",
          cp,
          `contact window must have finite start/end with end > start, but was [${contact.start}, ${contact.end}]`,
          { start: contact.start, end: contact.end },
        );
      if (maxHorizontalSpeed < 0)
        collector.push(
          "range",
          `${cp}.maxHorizontalSpeed`,
          `maxHorizontalSpeed must be a finite number >= 0, but was ${maxHorizontalSpeed}`,
          maxHorizontalSpeed,
        );
      if (
        !skeletonBones.has(contact.bone) ||
        boneUnreachable ||
        temporalInvalid ||
        maxHorizontalSpeed < 0 ||
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
 * Use windowSampleTimes to sample motion/FK and select the admitted contact
 * bone's world position.
 *
 * Clock and rig resolution stay with their canonical owners.
 *
 * Caller reachability/rate/window admission is required before the non-null
 * resolved lookup.
 *
 * Output pairs second timestamps with borrowed resolved world-position records.
 *
 * T times pay motion/FK and one resolved-bone find, returning O(T) sample rows.
 *
 * One supplied topology is reused through all window samples.
 *
 * The caller owns sample wrappers/points; no sampling task or native rig
 * remains.
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
        sampleMotion.pose(motion, time),
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
 * Strictly increasing sample times are required; this helper does not guard
 * zero dt.
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
 * Round a diagnostic quantity to three decimals with
 * Math.round(value*1000)/1000.
 *
 * The validateFootSkate owner applies presentation rounding after its actual
 * predicate.
 *
 * Binary64 rounding is not an exact decimal serialization or decision
 * tolerance.
 *
 * Only displayed metre/second quantities are rounded, leaving comparison
 * arithmetic unchanged.
 *
 * Fixed scalar arithmetic takes constant work.
 *
 * Diagnostics reuse the same presentation rule within validateFootSkate, not
 * cached measurements.
 *
 * Only a number returns and no sampled state is retained.
 */
const round: (value: number) => number = (value: number): number =>
  Math.round(value * 1_000) / 1_000;
