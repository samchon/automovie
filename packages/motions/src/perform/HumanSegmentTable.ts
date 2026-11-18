import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { AutoMovieMotionHumanAudit } from "../audit/AutoMovieMotionHumanAudit";
import { poseBones } from "../posture/poseBones";
import { HumanSegment } from "./HumanSegment";
import { HumanSegmentContact } from "./HumanSegmentContact";
import type { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";

/**
 * An action's displayed pose as a table of exact knots read by joint-space
 * interpolation, the way an animation runtime samples a clip and then runs
 * its contact IK: the final displayed pose (the action with every layer,
 * overlay, carried prop, stop and transition on it) is solved exactly at the
 * seconds where something starts, ends or happens (the action's entry and
 * the end of its showing, its events, contact windows, holds and the end of
 * its entering offset; each running overlay's own; each layer's window and
 * fades; each carried hold's start, takeover and fade; each weapon's stop)
 * and at the midpoints an interval needs. Any other second is the slerp of
 * its two knots' joint rotations through the body's codec, the root's
 * translation and scale by line and its rotation by slerp, then the range
 * clamp, and then the late contact pass (`HumanSegmentContact`) lays every
 * bearing hand and foot on its site by the analytic two-bone IK.
 *
 * An interval is read so only once its midpoint holds the bound: the exact
 * pose at the midpoint and the read there (interpolated and laid) place every
 * bone within `tolerance` of each other. The remainder of linear
 * interpolation along a smooth path is greatest at the midpoint (`A h^2 / 8`
 * for an angular acceleration `A` over the interval `h`, per joint, a
 * point's error the sum over its ancestors of its lever times that), so a
 * midpoint within the tolerance bounds the interval; a midpoint outside it
 * becomes a knot and each half is held to the same test, so a fast stretch,
 * a branch's flip or a swivel's jump splits until its halves hold or fall
 * under `SHORTEST`, which is read exactly.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the knots, the interpolation, the contact pass, the bound and its test, and where the exact pose is read instead.
 * @evidence contracts/development/design.md#principled-representation One table an action: sorted knot seconds with their exact poses and world bones, and which intervals hold the bound.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `read` serves `HumanSegmentShown.of`; `tolerance` is the bound its spec reads.
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
   * The displayed pose of an action at a second, read from its table.
   *
   * @param person The person.
   * @param segment The action shown at the second.
   * @param seconds Film seconds.
   * @param until The second the action stops being shown: the next action's entry, or infinity.
   * @param prepared The evaluation's preparation (its rig reader and range clamp).
   * @param exact The action's exact displayed pose at a second.
   * @returns The pose, or undefined where the second lies outside the table's span or in an interval under `SHORTEST`, both read exactly.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the exact fallback.
   * @evidence contracts/development/implementation.md#principled-implementation Knots are exact; an interval is read only once its exact midpoint holds `tolerance` against the read itself, else it splits; bearing ends are laid by the analytic contact pass.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Find the bracket, test it down to a holding interval, interpolate, lay the contacts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An interval that does not hold is never read; one under `SHORTEST` is read exactly.
   * @evidence contracts/development/implementation.md#efficient-algorithms A read in a holding interval costs one slerp a moving joint, the clamp and one demanded FK and closed-form solve a bearing end; an interval's test costs one exact read and two FK passes, once for the table.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every knot is read once and kept, with its world bones, for every later second of its intervals.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The table lives on the action until `HumanSegment.forget`.
   */
  export function read(
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
    seconds: number,
    until: number,
    prepared: prepareHumanSegmentPose.IPrepared,
    exact: (seconds: number) => IAutoMoviePose,
  ): IAutoMoviePose | undefined {
    const body: IAutoMovieMotionHumanBody = person.performer.body;
    const from: number = segment.entryTime;
    const to: number = Math.min(until, segment.end);
    if (!(to - from > SHORTEST) || seconds < from || seconds > to) return undefined;
    const fresh: boolean = segment.table === undefined;
    const table: ITable = (segment.table ??= { knots: [], poses: [], bones: [], held: [] });
    const find = (at: number): number => {
      let i: number = 0;
      while (i < table.knots.length && table.knots[i]! < at) ++i;
      return i;
    };
    const knot = (at: number): number => {
      if (table.knots[find(at)] === at) return find(at);
      // The index is found after the exact read, which may itself have read
      // this table at other seconds.
      const pose: IAutoMoviePose = exact(at);
      const i: number = find(at);
      if (table.knots[i] !== at) {
        table.knots.splice(i, 0, at);
        table.poses.splice(i, 0, pose);
        table.bones.splice(i, 0, poseBones(body, pose, prepared.resolution()));
        table.held.splice(i, 0, false);
        if (i > 0) table.held[i - 1] = false;
      }
      return i;
    };
    if (fresh) for (const at of [from, to, ...keys(person, segment, from, to)]) knot(at);
    for (;;) {
      let i: number = 0;
      while (i + 1 < table.knots.length && table.knots[i + 1]! < seconds) ++i;
      const a: number = table.knots[i]!;
      const b: number = table.knots[i + 1] ?? a;
      if (seconds === a) return table.poses[i];
      if (seconds === b) return table.poses[i + 1];
      if (table.held[i]) return between(person, segment, table, i, i + 1, seconds, prepared);
      if (b - a < SHORTEST) return undefined;
      const m: number = knot((a + b) / 2);
      const guess: IAutoMoviePose | undefined = between(person, segment, table, m - 1, m + 1, table.knots[m]!, prepared);
      if (guess !== undefined && within(body, guess, table.bones[m]!, prepared)) {
        table.held[m - 1] = true;
        table.held[m] = true;
      }
    }
  }

  /** One action's table (`IAutoMovieMotionHumanSegment.table`). */
  export type ITable = NonNullable<IAutoMovieMotionHumanSegment["table"]>;

  /** The seconds strictly inside the span where the displayed pose's terms start, end or happen. */
  function keys(
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
    from: number,
    to: number,
  ): number[] {
    const out: number[] = [];
    for (const source of [segment, ...person.overlays]) {
      const at = (share: number): number => source.start + share * source.plan.duration;
      if (source !== segment) out.push(source.entryTime, source.start, source.end);
      for (const event of source.plan.events) out.push(at(event.share));
      for (const window of source.plan.contacts) out.push(at(window.from), at(window.to));
      for (const hold of source.plan.holds ?? []) out.push(at(hold.from));
      if (source.transition !== undefined) out.push(source.transition.cut + source.transition.blend);
    }
    for (const layered of person.layers)
      out.push(layered.from, layered.from + layered.fade, layered.to - layered.fade, layered.to);
    for (const held of person.holds) out.push(held.from, held.until, held.until + HumanSegment.FADE);
    for (const stop of person.stops.values()) out.push(stop);
    return out.filter((k: number): boolean => k > from && k < to);
  }

  /** The read at a second between two knots: the slerp, the clamp, then the contact pass. */
  function between(
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
    table: ITable,
    i: number,
    j: number,
    seconds: number,
    prepared: prepareHumanSegmentPose.IPrepared,
  ): IAutoMoviePose | undefined {
    const body: IAutoMovieMotionHumanBody = person.performer.body;
    const u: number = (seconds - table.knots[i]!) / (table.knots[j]! - table.knots[i]!);
    const pose: IAutoMoviePose | undefined = interpolated(body, table.poses[i]!, table.poses[j]!, u, prepared);
    if (pose === undefined) return undefined;
    return HumanSegmentContact.laid(body, pose, HumanSegmentContact.supports(person, segment, seconds),
      table.bones[i]!, table.bones[j]!, u, prepared);
  }

  /** The slerp at share `u` of two poses of the same joints, clamped; undefined where their joints differ. */
  function interpolated(
    body: IAutoMovieMotionHumanBody,
    a: IAutoMoviePose,
    b: IAutoMoviePose,
    u: number,
    prepared: prepareHumanSegmentPose.IPrepared,
  ): IAutoMoviePose | undefined {
    if (a.joints.length !== b.joints.length || (a.root === null) !== (b.root === null)) return undefined;
    const joints: IAutoMovieJointPose[] = [];
    for (let i: number = 0; i < a.joints.length; ++i) {
      const p: IAutoMovieJointPose = a.joints[i]!;
      const q: IAutoMovieJointPose = b.joints[i]!;
      if (p.bone !== q.bone) return undefined;
      if (p.flexion === q.flexion && p.abduction === q.abduction && p.twist === q.twist) {
        joints.push(p);
        continue;
      }
      const angles: [number, number, number] = body.codec.angles(p.bone, Quaternion.slerp(
        body.codec.rotation(p.bone, [p.flexion ?? 0, p.abduction ?? 0, p.twist ?? 0]),
        body.codec.rotation(q.bone, [q.flexion ?? 0, q.abduction ?? 0, q.twist ?? 0]),
        u,
      ));
      joints.push({
        bone: p.bone,
        flexion: p.flexion === null && q.flexion === null ? null : angles[0],
        abduction: p.abduction === null && q.abduction === null ? null : angles[1],
        twist: p.twist === null && q.twist === null ? null : angles[2],
      });
    }
    const root: IAutoMoviePose["root"] = a.root === null || b.root === null ? null : {
      translation: Vector3.lerp(a.root.translation, b.root.translation, u),
      rotation: Quaternion.slerp(a.root.rotation, b.root.rotation, u),
      scale: Vector3.lerp(a.root.scale, b.root.scale, u),
    };
    return prepared.clamp({ ...a, root, joints });
  }

  /** Whether every bone of a read lies within `tolerance` of the exact pose's. */
  function within(
    body: IAutoMovieMotionHumanBody,
    guess: IAutoMoviePose,
    truth: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    prepared: prepareHumanSegmentPose.IPrepared,
  ): boolean {
    const read: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(body, guess, prepared.resolution());
    const limit: number = tolerance();
    for (const [bone, placed] of truth) {
      const other: IAutoMovieResolvedBone | undefined = read.get(bone);
      if (other === undefined || !(Vector3.distance(other.worldPosition, placed.worldPosition) <= limit)) return false;
    }
    return true;
  }
}
