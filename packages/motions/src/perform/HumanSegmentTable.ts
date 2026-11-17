import { Quaternion, Vector3, hingedArmSwivel, poseJointCodec } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMoviePoseJointCodec,
  IAutoMovieResolvedBone,
  IAutoMovieSwivelNear,
  IAutoMovieSwivelSeed,
  AutoMovieHumanoidBone,
} from "@automovie/interface";

import { AutoMovieMotionHumanAudit } from "../audit/AutoMovieMotionHumanAudit";
import { HumanLimbFit } from "../posture/HumanLimbFit";
import { humanRig } from "../posture/humanRig";
import { poseBones } from "../posture/poseBones";
import type { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";

/**
 * An action's displayed pose as a table of exact knots read by joint-space
 * interpolation, the way an animation runtime samples a clip: the pose is
 * solved exactly (`exact`) at the action's own key seconds (its entry and
 * the end of its showing, its events and its contact windows' edges) and at
 * the midpoints an interval needs, and any other second is the slerp of its
 * two knots' joint rotations through the displayed rig, the root's
 * translation by line and its rotation by slerp, then the range clamp; a
 * planted leg is then laid on its goal again by its own fit, continued from
 * the two knots' seeds, so a contact the exact pose keeps stays kept.
 *
 * An interval is read so only once its midpoint holds the bound: the exact
 * pose at the midpoint and the interpolated one place every bone within
 * `tolerance` of each other. The remainder of linear interpolation along a
 * smooth path is greatest at the midpoint (`A h^2 / 8` for an angular
 * acceleration `A` over the interval `h`, per joint, a point's error the sum
 * over its ancestors of its lever times that), so a midpoint within the
 * tolerance bounds the interval; a midpoint outside it becomes a knot and
 * each half is held to the same test, so a fast stretch, a branch's flip
 * or a swivel's jump splits until its halves hold or fall under `SHORTEST`,
 * which is read exactly.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the knots, the interpolation, the contact correction, the bound and its test, and where the exact pose is read instead.
 * @evidence contracts/development/design.md#principled-representation One table an action: sorted knot seconds with their exact poses and fit seeds, and which intervals hold the bound.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `read` serves `HumanSegmentShown.of`; `eligible` gates the people it serves.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The tolerance is the audits' own tightest bound; an interval is accepted only on an exact midpoint, never by assumption.
 */
export namespace HumanSegmentTable {
  /**
   * The most a table read places any bone from the exact pose, metres: the
   * tightest bound an audit reads a displayed bone against (the floor, the
   * slip, the lift and the jump, `AutoMovieMotionHumanAudit.LIMITS`), as
   * `HumanArmSwing.precision` takes the jump bound for its own.
   *
   * @returns The bound, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit and the bounds it is the least of.
   * @evidence contracts/development/implementation.md#principled-implementation The audits' own limits, read when asked so the audit module is complete by then.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One minimum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No bound of its own: the audits' limits.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function tolerance(): number {
    const limits: typeof AutoMovieMotionHumanAudit.LIMITS = AutoMovieMotionHumanAudit.LIMITS;
    return Math.min(limits.floor, limits.slip, limits.lift, limits.jump);
  }

  /** The shortest interval split further, seconds: a millisecond, the display's own rate step (`HumanSegmentPose.STEP`); a shorter one is read exactly. */
  export const SHORTEST: number = 1e-3;

  /**
   * Whether a person's displayed poses may be read from tables: no layer,
   * overlay, held prop or stop shapes them beyond their actions' own plans,
   * so a planted leg's goal at a second is its plan's.
   *
   * @param person The person.
   * @returns Whether the tables serve the person.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is required and why.
   * @evidence contracts/development/implementation.md#principled-implementation The contact correction reads the plan's goals, which are the displayed ones only without those terms.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Four counts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Any of them sends the person to the exact read.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function eligible(person: IAutoMovieMotionHumanSegment.IPerson): boolean {
    return person.layers.length === 0 && person.overlays.length === 0 && person.holds.length === 0 && person.stops.size === 0;
  }

  /**
   * The displayed pose of an action at a second, read from its table.
   *
   * @param person The person.
   * @param segment The action shown at the second.
   * @param seconds Film seconds.
   * @param until The second the action stops being shown: the next action's entry, or its own end.
   * @param prepared The evaluation's preparation (its rig reader and range clamp).
   * @param exact The action's exact displayed pose at a second, with the seeds its fits chose.
   * @returns The pose, or undefined where the second lies outside the table's span and is read exactly.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the exact fallback.
   * @evidence contracts/development/implementation.md#principled-implementation Knots are exact; an interval is interpolated only once its exact midpoint holds `tolerance`, else it splits; a planted leg is laid on its plan goal by its own continued fit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Find the bracket, test it down to a holding interval, interpolate, correct the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An interval that does not hold is never interpolated; one under `SHORTEST` is read exactly.
   * @evidence contracts/development/implementation.md#efficient-algorithms A read in a holding interval costs one slerp a joint, the clamp and one continued fit a planted leg; an interval's test costs one exact read and two FK passes, once for the table.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every knot is read once and kept for every later second of its intervals.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The table lives on the action until `HumanSegment.forget`.
   */
  export function read(
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
    seconds: number,
    until: number,
    prepared: prepareHumanSegmentPose.IPrepared,
    exact: (seconds: number) => { pose: IAutoMoviePose; seeds: IAutoMovieMotionHumanSegment["incumbents"] },
  ): IAutoMoviePose | undefined {
    const body = person.performer.body;
    const from: number = segment.entryTime;
    const to: number = Math.min(until, segment.end);
    if (!(to - from > SHORTEST) || seconds < from || seconds > to) return undefined;
    const fresh: boolean = segment.table === undefined;
    const table: ITable = (segment.table ??= { knots: [], poses: [], seeds: [], held: [] });
    const find = (at: number): number => {
      let i: number = 0;
      while (i < table.knots.length && table.knots[i]! < at) ++i;
      return i;
    };
    const knot = (at: number): number => {
      if (table.knots[find(at)] === at) return find(at);
      // The index is found after the exact read, which may itself have read
      // this table at other seconds.
      const read: { pose: IAutoMoviePose; seeds: IAutoMovieMotionHumanSegment["incumbents"] } = exact(at);
      const i: number = find(at);
      if (table.knots[i] !== at) {
        table.knots.splice(i, 0, at);
        table.poses.splice(i, 0, read.pose);
        table.seeds.splice(i, 0, read.seeds);
        table.held.splice(i, 0, false);
        if (i > 0) table.held[i - 1] = false;
      }
      return i;
    };
    if (fresh) for (const at of [from, to, ...keys(segment, from, to)]) knot(at);
    for (;;) {
      let i: number = 0;
      while (i + 1 < table.knots.length && table.knots[i + 1]! < seconds) ++i;
      const a: number = table.knots[i]!;
      const b: number = table.knots[i + 1] ?? a;
      if (seconds === a) return table.poses[i];
      if (seconds === b) return table.poses[i + 1];
      if (table.held[i]) return corrected(person, segment, seconds, table, i, (seconds - a) / (b - a), prepared);
      if (b - a < SHORTEST) return undefined;
      const middle: number = (a + b) / 2;
      const m: number = knot(middle);
      const guess: IAutoMoviePose | undefined = interpolated(table.poses[m - 1]!, table.poses[m + 1]!, 0.5, codec(table, body), prepared);
      if (guess !== undefined && within(body, guess, table.poses[m]!, prepared)) {
        table.held[m - 1] = true;
        table.held[m] = true;
      }
    }
  }

  /** One action's table (`IAutoMovieMotionHumanSegment.table`). */
  export type ITable = NonNullable<IAutoMovieMotionHumanSegment["table"]>;

  /** The action's key seconds strictly inside its span: its events, its contact windows' edges and the end of its entering offset. */
  function keys(segment: IAutoMovieMotionHumanSegment, from: number, to: number): number[] {
    const out: number[] = [];
    const at = (share: number): number => segment.start + share * segment.plan.duration;
    for (const event of segment.plan.events) out.push(at(event.share));
    for (const window of segment.plan.contacts) out.push(at(window.from), at(window.to));
    if (segment.transition !== undefined) out.push(segment.transition.cut + segment.transition.blend);
    return out.filter((k: number): boolean => k > from && k < to);
  }
  /** The table's joint codec on the body's displayed rig, made once. */
  function codec(table: ITable, body: IAutoMovieMotionHumanSegment.IPerson["performer"]["body"]): IAutoMoviePoseJointCodec.ICodec {
    return (table.codec ??= poseJointCodec(humanRig(body)));
  }

  /** The slerp at share `u` of two poses of the same joints, clamped; undefined where their joints differ. */
  function interpolated(
    a: IAutoMoviePose,
    b: IAutoMoviePose,
    u: number,
    rig: IAutoMoviePoseJointCodec.ICodec,
    prepared: prepareHumanSegmentPose.IPrepared,
  ): IAutoMoviePose | undefined {
    if (a.joints.length !== b.joints.length || (a.root === null) !== (b.root === null)) return undefined;
    const joints: IAutoMovieJointPose[] = [];
    for (let i: number = 0; i < a.joints.length; ++i) {
      const p: IAutoMovieJointPose = a.joints[i]!;
      const q: IAutoMovieJointPose = b.joints[i]!;
      if (p.bone !== q.bone) return undefined;
      const angles: [number, number, number] = rig.angles(p.bone, Quaternion.prepareSlerp(
        rig.rotation(p.bone, [p.flexion ?? 0, p.abduction ?? 0, p.twist ?? 0]),
        rig.rotation(q.bone, [q.flexion ?? 0, q.abduction ?? 0, q.twist ?? 0]),
      )(u));
      joints.push({
        bone: p.bone,
        flexion: p.flexion === null && q.flexion === null ? null : angles[0],
        abduction: p.abduction === null && q.abduction === null ? null : angles[1],
        twist: p.twist === null && q.twist === null ? null : angles[2],
      });
    }
    const root: IAutoMoviePose["root"] = a.root === null || b.root === null ? null : {
      translation: Vector3.lerp(a.root.translation, b.root.translation, u),
      rotation: Quaternion.prepareSlerp(a.root.rotation, b.root.rotation)(u),
      scale: Vector3.lerp(a.root.scale, b.root.scale, u),
    };
    return prepared.clamp({ ...a, root, joints });
  }

  /** Whether every bone of two poses lies within `tolerance` of its counterpart. */
  function within(
    body: IAutoMovieMotionHumanSegment.IPerson["performer"]["body"],
    guess: IAutoMoviePose,
    truth: IAutoMoviePose,
    prepared: prepareHumanSegmentPose.IPrepared,
  ): boolean {
    const a: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, guess, prepared.resolution());
    const b: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, truth, prepared.resolution());
    const limit: number = tolerance();
    for (const [bone, placed] of b) {
      const other: IAutoMovieResolvedBone | undefined = a.get(bone);
      if (other === undefined || !(Vector3.distance(other.worldPosition, placed.worldPosition) <= limit)) return false;
    }
    return true;
  }

  /** A holding interval's read: the slerp, then each planted leg laid on its plan goal by its own fit, continued from its knots' seeds. */
  function corrected(
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
    seconds: number,
    table: ITable,
    i: number,
    u: number,
    prepared: prepareHumanSegmentPose.IPrepared,
  ): IAutoMoviePose | undefined {
    const body = person.performer.body;
    let pose: IAutoMoviePose | undefined = interpolated(table.poses[i]!, table.poses[i + 1]!, u, codec(table, body), prepared);
    if (pose === undefined) return undefined;
    const local: number = Math.min(segment.plan.duration, Math.max(0, seconds - segment.start));
    const limbs = segment.plan.posture(local, undefined, prepared.resolution, prepared.clamp).limbs;
    for (const limb of ["leftLeg", "rightLeg"] as const) {
      const goal: IAutoMovieHumanLimbGoal | undefined = limbs[limb];
      if (goal === undefined || goal.planted !== true) continue;
      const near: IAutoMovieSwivelNear | undefined = between(table.seeds[i]?.[limb], table.seeds[i + 1]?.[limb], u);
      pose = HumanLimbFit.fit(body, pose, limb, goal, ["left", "right"], undefined, near, prepared.resolution).pose;
    }
    return pose;
  }

  /** The seed between two knots' seeds of one limb, on their branch; none where they differ in branch or are absent. */
  function between(
    a: IAutoMovieSwivelSeed | null | undefined,
    b: IAutoMovieSwivelSeed | null | undefined,
    u: number,
  ): IAutoMovieSwivelNear | undefined {
    if (a === null || a === undefined || b === null || b === undefined || a.branch !== b.branch) return undefined;
    const turn: number = b.swivel - a.swivel;
    const delta: number = turn - 360 * Math.round(turn / 360);
    return { branch: a.branch, swivel: a.swivel + u * delta, tolerance: hingedArmSwivel.RESOLUTION };
  }
}
