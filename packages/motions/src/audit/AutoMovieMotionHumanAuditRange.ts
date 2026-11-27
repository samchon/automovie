import {
  ANKLE_DORSIFLEXION,
  DEFAULT_HUMANOID_ROM,
  AutoMovieEngineKinematics,
} from "@automovie/engine";
import type {
  IAutoMovieJointConstraint,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanAuditRange,
  IAutoMovieScanJointRom,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditMotion as HumanAuditMotion } from "./AutoMovieMotionHumanAuditMotion";

/** The alternatives of `UnloadedBearsPart`'s site. */
type UnloadedBearsPart = "leftFoot" | "rightFoot";

/**
 * Whether every joint of a displayed motion stays inside its anatomical range
 * of motion at every instant.
 *
 * A body cannot bend an elbow backward or turn a knee sideways, however smooth
 * and collision-free the result looks. The reading takes the displayed pose's
 * clinical joint angles at each grid instant and measures each joint against
 * the humanoid range table the pose gate enforces (`DEFAULT_HUMANOID_ROM`), by
 * the gate's own scan (`AutoMovieEngineKinematics.scanJointRom`): an angle outside its interval
 * overshoots by its distance to the nearer bound, an angle on an axis the joint
 * does not have by its whole magnitude, and a ball joint's combined flexion and
 * abduction by what it exceeds the swing cone. A joint the table does not list
 * is unconstrained.
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
        AutoMovieEngineKinematics.scanJointRom(
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
   * (`ANKLE_DORSIFLEXION.loaded`); a foot that bears no weight reaches only the
   * passive, unloaded one (`ANKLE_DORSIFLEXION.unloaded`), read here apart from
   * the range table's one limit for the joint. A foot bears weight while a
   * plant, a pivot or a bearing slide window holds it, on the ground or on a
   * prop or a person that bears it (a tread, a deck, a partner's hands), the
   * windows the contact audit reads
   * (`AutoMovieMotionHumanAuditMotion.windows`), so a foot's load has one
   * source. At each grid instant each foot outside such a window is read: its
   * dorsiflexion past the unloaded limit overshoots. An instant whose plants
   * hold both feet has nothing to read, and its pose is not resolved.
   *
   * @param motion The motion's windows.
   * @param posed The motion's poses.
   * @param subject The person.
   * @param rate Grid samples per second.
   * @returns The reading: the farthest an unloaded ankle dorsiflexes past its
   *   limit, degrees, and the share of instants it does.
   * @throws {Error} When the rate is not positive.
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
          w.contact.kind === "plant" ||
          w.contact.kind === "pivot" ||
          w.contact.kind === "bear",
      );
    const bears = (part: UnloadedBearsPart, seconds: number): boolean =>
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
        const value: number = flexion - ANKLE_DORSIFLEXION.unloaded;
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
