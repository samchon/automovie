import {
  ANKLE_DORSIFLEXION,
  DEFAULT_HUMANOID_ROM,
  scanJointRom,
} from "@automovie/engine";
import type {
  IAutoMovieJointConstraint,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanAuditRange,
  IAutoMovieScanJointRom,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditMotion as HumanAuditMotion } from "./AutoMovieMotionHumanAuditMotion";

/**
 * Whether every joint of a displayed motion stays inside its anatomical
 * range of motion at every instant.
 *
 * A body cannot bend an elbow backward or turn a knee sideways, however
 * smooth and collision-free the result looks. The reading takes the
 * displayed pose's clinical joint angles at each grid instant and measures
 * each joint against the humanoid range table the pose gate enforces
 * (`DEFAULT_HUMANOID_ROM`), by the gate's own scan (`scanJointRom`): an
 * angle outside its interval overshoots by its distance to the nearer bound,
 * an angle on an axis the joint does not have by its whole magnitude, and a
 * ball joint's combined flexion and abduction by what it exceeds the swing
 * cone. A joint the table does not list is unconstrained.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the defect, the table and the scan it reads by, and how each overshoot is measured.
 * @evidence contracts/development/implementation.md#principled-implementation The pose gate's own fault scan over the motion's instants, so the audit and the gate cannot judge a joint by different rules.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One walk over the grid and each instant's joints.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No joint, axis or instant is exempt and no tolerance is added; a non-finite angle reads as infinitely far.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in grid frames and joints.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's `scanJointRom` and range table rather than restating a limit.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace AutoMovieMotionHumanAuditRange {
  /**
   * Read one person's joints over a motion.
   *
   * @param motion The motion.
   * @param subject The person.
   * @param rate Grid samples per second.
   * @returns The reading.
   * @throws {Error} When the rate is not positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and the failure.
   * @evidence contracts/development/implementation.md#principled-implementation Every joint of every instant goes through the gate's scan against the table's constraint for its bone.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two nested loops and one callback.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A fault without a distance is a non-finite angle and reads as `Infinity`, never as zero.
   * @evidence contracts/development/implementation.md#efficient-algorithms One scan per joint per instant, no allocation beyond the grid.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The grid is `AutoMovieMotionHumanAuditMotion.grid`, the scan the engine's.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function measure(
    motion: IAutoMovieMotionHumanAuditRange.IPosed,
    subject: string,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditRange.IResult {
    const out: IAutoMovieMotionHumanAuditRange.IResult = {
      overshoot: { value: 0, seconds: 0, where: "none" },
      share: 0,
    };
    const frames: number[] = HumanAuditMotion.grid(0, motion.duration, rate);
    let past: number = 0;
    for (const t of frames) {
      let faulted: boolean = false;
      for (const joint of motion.pose(subject, t).joints) {
        const constraint: IAutoMovieJointConstraint | undefined =
          DEFAULT_HUMANOID_ROM[joint.bone];
        if (constraint === undefined) continue;
        scanJointRom(
          joint,
          constraint,
          (
            part: IAutoMovieScanJointRom.Part,
            _actual: number,
            overshoot: number | undefined,
          ): void => {
            const value: number = overshoot ?? Number.POSITIVE_INFINITY;
            faulted = true;
            if (value > out.overshoot.value)
              out.overshoot = {
                value,
                seconds: t,
                where: `${joint.bone} ${part}`,
              };
          },
        );
      }
      if (faulted) past++;
    }
    out.share = past / frames.length;
    return out;
  }

  /**
   * Read how far a foot that bears no weight dorsiflexes past the unloaded
   * ankle's limit.
   *
   * A foot bearing the body dorsiflexes as far as the loaded limit
   * (`ANKLE_DORSIFLEXION.loaded`); a foot that bears no weight reaches only
   * the passive, unloaded one (`ANKLE_DORSIFLEXION.unloaded`), read here
   * apart from the range table's one limit for the joint. A foot bears
   * weight while a plant or a pivot window holds it, on the ground or on a prop or a
   * person that bears it (a tread, a deck, a partner's hands), the windows the
   * contact audit reads (`AutoMovieMotionHumanAuditMotion.windows`), so a
   * foot's load has one source. At each grid instant each foot outside such a
   * window is read: its dorsiflexion past the unloaded limit overshoots. An
   * instant whose plants hold both feet has nothing to read, and its pose is
   * not resolved.
   *
   * @param motion The motion's windows.
   * @param posed The motion's poses.
   * @param subject The person.
   * @param rate Grid samples per second.
   * @returns The reading: the farthest an unloaded ankle dorsiflexes past its limit, degrees, and the share of instants it does.
   * @throws {Error} When the rate is not positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two limits, where a foot's load is read from and what overshoots.
   * @evidence contracts/development/implementation.md#principled-implementation The unloaded limit applies exactly where the declared plants say a foot bears nothing.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One walk over the grid and two feet.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A non-finite angle reads as `Infinity`; no foot or instant is exempt.
   * @evidence contracts/development/implementation.md#efficient-algorithms One window test per foot per instant, and one pose only at an instant where some foot bears nothing: a reading of both planted feet is zero whatever the pose, so it is not resolved.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The grid and the windows are `IAutoMovieMotionHumanAuditMotion`'s, the limit the engine's.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function unloaded(
    motion: IAutoMovieMotionHumanAuditMotion,
    posed: IAutoMovieMotionHumanAuditRange.IPosed,
    subject: string,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditRange.IResult {
    const out: IAutoMovieMotionHumanAuditRange.IResult = {
      overshoot: { value: 0, seconds: 0, where: "none" },
      share: 0,
    };
    const frames: number[] = HumanAuditMotion.grid(0, posed.duration, rate);
    const plants: IAutoMovieMotionHumanAuditMotion.IWindow[] =
      HumanAuditMotion.windows(motion, subject).filter(
        (w: IAutoMovieMotionHumanAuditMotion.IWindow): boolean =>
          w.contact.kind === "plant" || w.contact.kind === "pivot",
      );
    const bears = (part: "leftFoot" | "rightFoot", seconds: number): boolean =>
      plants.some(
        (w: IAutoMovieMotionHumanAuditMotion.IWindow): boolean =>
          w.contact.part === part &&
          w.from <= seconds + 1e-9 &&
          seconds <= w.to + 1e-9,
      );
    let past: number = 0;
    for (const t of frames) {
      // The reading concerns only a foot that bears nothing, so an instant
      // where the plants bear both feet reads no pose.
      const left: boolean = bears("leftFoot", t);
      const right: boolean = bears("rightFoot", t);
      if (left && right) continue;
      let faulted: boolean = false;
      for (const joint of posed.pose(subject, t).joints) {
        if (joint.bone !== "leftFoot" && joint.bone !== "rightFoot") continue;
        if (joint.bone === "leftFoot" ? left : right) continue;
        const flexion: number = joint.flexion ?? 0;
        const value: number = Number.isFinite(flexion)
          ? flexion - ANKLE_DORSIFLEXION.unloaded
          : Number.POSITIVE_INFINITY;
        if (value <= 0) continue;
        faulted = true;
        if (value > out.overshoot.value)
          out.overshoot = {
            value,
            seconds: t,
            where: `${joint.bone} flexion unloaded`,
          };
      }
      if (faulted) past++;
    }
    out.share = past / frames.length;
    return out;
  }
}
