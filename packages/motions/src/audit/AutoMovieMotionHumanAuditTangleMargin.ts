import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditTangle,
  IAutoMovieMotionHumanColliders,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanLinkCertificate } from "../posture/HumanLinkCertificate";
import { AutoMovieMotionHumanAuditTangleModel as M } from "./AutoMovieMotionHumanAuditTangleModel";
import { prepareAutoMovieMotionHumanAuditDepths } from "./prepareAutoMovieMotionHumanAuditDepths";

/** The record of `IAcrossResult`'s site. */
type IAcrossResult = { depth: number; base: number };

/** The record of `IOwnResult`'s site. */
type IOwnResult = { excess: number; base: number };

/** The record of `IEnteringReading`'s site. */
type IEnteringReading = { depth: number; base: number };

/** The record of `IEnteringRead`'s site. */
type IEnteringRead = {
  due: (index: number) => boolean;
  heard: (index: number, base: number, apart: boolean, depth: number) => void;
};

/** The record of `IWithinBackward`'s site. */
type IWithinBackward = { excess: number; base: number };

/** The record of `IWithinForward`'s site. */
type IWithinForward = { excess: number; base: number };

/** The record of `IWithinRead`'s site. */
type IWithinRead = {
  due: (index: number) => boolean;
  heard: (index: number, base: number, apart: boolean, depth: number) => void;
};

/**
 * What lets the penetration audits (`AutoMovieMotionHumanAuditTangle` of one
 * body, `AutoMovieMotionHumanAuditPartner` of two) leave a pair of segments
 * unread at the grid instants a reading certifies, by conservative advancement
 * (`advanceAutoMovieGrid`): a pair's margin, how far its depth can still grow
 * before a reading of it could change the audit's record, and each segment's
 * travel, how far any point of it can move between two grid instants.
 *
 * A probe's depth in a segment, zero outside, is the distance to the segment's
 * surface from inside, so it grows no faster than the probe and the segment's
 * surface move toward each other. Its room
 * (`prepareAutoMovieMotionHumanAuditDepths`), the most over the segment's
 * shapes of a bounding sphere's radius less the probe's distance from its
 * centre, bounds the depth from above and moves no faster either. So a probe
 * read at depth `d` with room `r` lies, an instant later, no deeper than the
 * lesser of `d` and `r` plus the two segments' travel between the instants; a
 * pair whose every probe stays at or below the depth the audit has already
 * recorded for it adds nothing there, which is the margin. A pair whose
 * bounding spheres do not meet is not read at all, and its spheres stay apart
 * while the two segments travel less than the gap between them (each sphere's
 * centre lies within its segment's extent), so that gap is its margin. The
 * travel of a segment between two neighbouring grid instants is the distance
 * its origin moved plus its extent (`IPart.extent`) times the chord of the
 * angle it turned (a rigid motion moves a point `x` from the origin by the
 * origin's move plus `(R2 - R1) x`, whose length is at most `2 sin(angle / 2)
 *
 * |x|`); summed over the steps between two instants it bounds how far any of
 *
 * Its points moved between them, by the triangle inequality. The poses are the
 * motion's own on its grid, read anyway by the audit, so the bound is measured,
 * never estimated.
 */
export namespace AutoMovieMotionHumanAuditTangleMargin {
  /**
   * A nanometre, metres: below it a depth is the rounding of the two frames,
   * and no pair is recorded.
   */
  export const NANOMETRE: number = 1e-9;

  /**
   * Every pair of segments of one placed pose of a body that pass into each
   * other beyond their reference depths, each once with the deeper direction:
   * the reading of `AutoMovieMotionHumanAuditTangle.pose`.
   *
   * A caller that certifies pairs across the instants of a motion passes
   * `read`: a pair whose index (`i * parts + j`, `i < j`) is not `due` is not
   * read, and every pair read is `heard`: with `apart`, the gap between its
   * bounding spheres, which is its margin, when they do not meet; otherwise
   * with its base (the lesser of its two directions' `own` bases) and the depth
   * it read, less any allowance, whether or not it passed into the other. The
   * pair's record is the greatest such depth above the nanometre.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param skip Unordered pair keys not to read.
   * @param pressed Unordered pair keys read only beyond a depth, metres.
   * @param key The unordered pair key
   *   (`AutoMovieMotionHumanAuditTangle.unordered`).
   * @param read The certifying caller's gate and listener; every pair within
   *   reach is read when absent.
   * @returns The pairs, `a` the segment whose probe lies deeper, with `seconds`
   *   zero.
   */
  export function within(
    m: import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditTangle,
  IAutoMovieMotionHumanColliders,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanLinkCertificate } from "../posture/HumanLinkCertificate";
import { AutoMovieMotionHumanAuditTangleModel as M } from "./AutoMovieMotionHumanAuditTangleModel";
import { prepareAutoMovieMotionHumanAuditDepths } from "./prepareAutoMovieMotionHumanAuditDepths";

/** The record of `IAcrossResult`'s site. */
type IAcrossResult = { depth: number; base: number };

/** The record of `IOwnResult`'s site. */
type IOwnResult = { excess: number; base: number };

/** The record of `IEnteringReading`'s site. */
type IEnteringReading = { depth: number; base: number };

/** The record of `IEnteringRead`'s site. */
type IEnteringRead = {
  due: (index: number) => boolean;
  heard: (index: number, base: number, apart: boolean, depth: number) => void;
};

/** The record of `IWithinBackward`'s site. */
type IWithinBackward = { excess: number; base: number };

/** The record of `IWithinForward`'s site. */
type IWithinForward = { excess: number; base: number };

/** The record of `IWithinRead`'s site. */
type IWithinRead = {
  due: (index: number) => boolean;
  heard: (index: number, base: number, apart: boolean, depth: number) => void;
};

/**
 * What lets the penetration audits (`AutoMovieMotionHumanAuditTangle` of one
 * body, `AutoMovieMotionHumanAuditPartner` of two) leave a pair of segments
 * unread at the grid instants a reading certifies, by conservative advancement
 * (`advanceAutoMovieGrid`): a pair's margin, how far its depth can still grow
 * before a reading of it could change the audit's record, and each segment's
 * travel, how far any point of it can move between two grid instants.
 *
 * A probe's depth in a segment, zero outside, is the distance to the segment's
 * surface from inside, so it grows no faster than the probe and the segment's
 * surface move toward each other. Its room
 * (`prepareAutoMovieMotionHumanAuditDepths`), the most over the segment's
 * shapes of a bounding sphere's radius less the probe's distance from its
 * centre, bounds the depth from above and moves no faster either. So a probe
 * read at depth `d` with room `r` lies, an instant later, no deeper than the
 * lesser of `d` and `r` plus the two segments' travel between the instants; a
 * pair whose every probe stays at or below the depth the audit has already
 * recorded for it adds nothing there, which is the margin. A pair whose
 * bounding spheres do not meet is not read at all, and its spheres stay apart
 * while the two segments travel less than the gap between them (each sphere's
 * centre lies within its segment's extent), so that gap is its margin. The
 * travel of a segment between two neighbouring grid instants is the distance
 * its origin moved plus its extent (`IPart.extent`) times the chord of the
 * angle it turned (a rigid motion moves a point `x` from the origin by the
 * origin's move plus `(R2 - R1) x`, whose length is at most `2 sin(angle / 2)
 *
 * |x|`); summed over the steps between two instants it bounds how far any of
 *
 * Its points moved between them, by the triangle inequality. The poses are the
 * motion's own on its grid, read anyway by the audit, so the bound is measured,
 * never estimated.
 */
export namespace AutoMovieMotionHumanAuditTangleMargin {
  /**
   * A nanometre, metres: below it a depth is the rounding of the two frames,
   * and no pair is recorded.
   */
  export const NANOMETRE: number = 1e-9;

  /**
   * Every pair of segments of one placed pose of a body that pass into each
   * other beyond their reference depths, each once with the deeper direction:
   * the reading of `AutoMovieMotionHumanAuditTangle.pose`.
   *
   * A caller that certifies pairs across the instants of a motion passes
   * `read`: a pair whose index (`i * parts + j`, `i < j`) is not `due` is not
   * read, and every pair read is `heard`: with `apart`, the gap between its
   * bounding spheres, which is its margin, when they do not meet; otherwise
   * with its base (the lesser of its two directions' `own` bases) and the depth
   * it read, less any allowance, whether or not it passed into the other. The
   * pair's record is the greatest such depth above the nanometre.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param skip Unordered pair keys not to read.
   * @param pressed Unordered pair keys read only beyond a depth, metres.
   * @param key The unordered pair key
   *   (`AutoMovieMotionHumanAuditTangle.unordered`).
   * @param read The certifying caller's gate and listener; every pair within
   *   reach is read when absent.
   * @returns The pairs, `a` the segment whose probe lies deeper, with `seconds`
   *   zero.
   */
  export function within(
    m: M.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    skip: ReadonlySet<string>,
    pressed: ReadonlyMap<string, number>,
    key: (a: AutoMovieHumanoidBone, b: AutoMovieHumanoidBone) => string,
    read?: IWithinRead,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    const out: IAutoMovieMotionHumanAuditTangle.IPair[] = [];
    const centres: IAutoMovieVector3[] = placed.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        i: number,
      ): IAutoMovieVector3 => M.centre(p, m.parts[i]!),
    );

    // Each segment read in is prepared once for this placement.
    const targets: NonNullable<Parameters<typeof M.beyond>[4]> = [];
    for (let i: number = 0; i < placed.length; i++)
      for (let j: number = i + 1; j < placed.length; j++) {
        if (m.related[i]![j]!) continue;
        const index: number = i * placed.length + j;
        if (read !== undefined && !read.due(index)) continue;

        // Two segments whose bounding spheres are apart are not read, and
        // their spheres stay apart while the two travel less than the gap
        // (each centre lies within the segment's extent), so the gap itself
        // is the margin.
        const reach: number = m.parts[i]!.radius + m.parts[j]!.radius;
        const apart: number = Vector3.distance(centres[i]!, centres[j]!);
        if (apart >= reach) {
          read?.heard(index, apart - reach, true, 0);
          continue;
        }

        // A pair's key is built only where some pair is skipped or pressed.
        if (skip.size !== 0 && skip.has(key(placed[i]!.bone, placed[j]!.bone)))
          continue;

        // Two segments their link pair's certificate shows apart hold no
        // probe of either inside the other, and none enters while the two
        // travel less than that clearance (`HumanLinkCertificate.clearance`), so
        // it is the pair's margin as the spheres' gap is.
        const clear: number = HumanLinkCertificate.clearance(
          placed[i]!,
          m.parts[i]!,
          placed[j]!,
          m.parts[j]!,
        );
        if (clear > 0) {
          read?.heard(index, clear, true, 0);
          continue;
        }
        const forward: IWithinForward = own(m, placed, i, j, targets);
        const backward: IWithinBackward = own(m, placed, j, i, targets);
        const depth: number =
          Math.max(forward.excess, backward.excess) -
          (pressed.size === 0
            ? 0
            : (pressed.get(key(placed[i]!.bone, placed[j]!.bone)) ?? 0));
        read?.heard(index, Math.min(forward.base, backward.base), false, depth);
        if (depth > NANOMETRE)
          out.push({
            a: placed[forward.excess >= backward.excess ? i : j]!.bone,
            b: placed[forward.excess >= backward.excess ? j : i]!.bone,
            depth,
            seconds: 0,
          });
      }
    return out;
  }

  /**
   * Every segment of one placed body that passes into a segment of another, at
   * its full depth: the reading of `AutoMovieMotionHumanAuditTangle.across` on
   * segments already placed.
   *
   * A caller that certifies pairs across the instants of a motion
   * (`AutoMovieMotionHumanAuditPartner`) passes `read`: a pair whose index (`i
   *
   * - Other's parts + j`) is not `due`is not read, and every pair read
   *   is`heard`as`within`hears it, its base being`across`'s.
   *
   * @param m The model of the body whose probes are read.
   * @param mine Its placed segments.
   * @param o The model of the body they are read against.
   * @param theirs That body's placed segments.
   * @param read The certifying caller's gate and listener; every pair within
   *   reach is read when absent.
   * @returns The pairs, `a` of the first body in `b` of the other, with
   *   `seconds` zero.
   */
  export function entering(
    m: M.IModel,
    mine: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    o: M.IModel,
    theirs: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    read?: IEnteringRead,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    const out: IAutoMovieMotionHumanAuditTangle.IPair[] = [];
    const near: IAutoMovieVector3[] = mine.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        i: number,
      ): IAutoMovieVector3 => M.centre(p, m.parts[i]!),
    );
    const far: IAutoMovieVector3[] = theirs.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        j: number,
      ): IAutoMovieVector3 => M.centre(p, o.parts[j]!),
    );

    // Each of the other body's segments is prepared once for this placement.
    const targets: NonNullable<Parameters<typeof M.beyond>[4]> = [];
    for (let i: number = 0; i < mine.length; i++)
      for (let j: number = 0; j < theirs.length; j++) {
        const index: number = i * theirs.length + j;
        if (read !== undefined && !read.due(index)) continue;

        // Bounding spheres apart: the gap itself is the margin (`within`).
        const reach: number = m.parts[i]!.radius + o.parts[j]!.radius;
        const apart: number = Vector3.distance(near[i]!, far[j]!);
        if (apart >= reach) {
          read?.heard(index, apart - reach, true, 0);
          continue;
        }
        const clear: number = HumanLinkCertificate.clearance(
          mine[i]!,
          m.parts[i]!,
          theirs[j]!,
          o.parts[j]!,
        );
        if (clear > 0) {
          read?.heard(index, clear, true, 0);
          continue;
        }
        const reading: IEnteringReading = across(
          m.parts[i]!.probes,
          mine[i]!,
          (targets[j] ??= prepareAutoMovieMotionHumanAuditDepths(theirs[j]!)),
        );
        read?.heard(index, reading.base, false, reading.depth);
        if (reading.depth > NANOMETRE)
          out.push({
            a: mine[i]!.bone,
            b: theirs[j]!.bone,
            depth: reading.depth,
            seconds: 0,
          });
      }
    return out;
  }

  /**
   * How deep segment `i`'s probes lie in segment `j` of the same body beyond
   * their reference depths, and how far that can grow before it exceeds a depth
   * already recorded.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param i The segment whose probes are read.
   * @param j The segment they are read in.
   * @param targets The caller's list of prepared segments for this reading of
   *   `placed` (`AutoMovieMotionHumanAuditTangleModel.beyond`).
   * @returns `excess`, the model's `excess` of the pair, metres, zero when no
   *   probe lies deeper than its reference; `base`, metres, such that while the
   *   two segments travel less than `base + K` the excess stays at or below any
   *   `K` of zero or more.
   */
  export function own(
    m: M.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    i: number,
    j: number,
    targets: Parameters<typeof M.beyond>[4],
  ): IOwnResult {
    const room: Float64Array = new Float64Array(m.parts[i]!.probes.length);
    const over: Float64Array = M.beyond(m, placed, i, j, targets, room);
    const reference: Float64Array = M.reference(m, i, j);
    let excess: number = 0;
    let grows: number = -Infinity;
    for (let k: number = 0; k < over.length; k++) {
      excess = Math.max(excess, over[k]!);

      // How far above its reference the probe can be read now: its excess,
      // and never above its room less the reference.
      grows = Math.max(grows, Math.min(over[k]!, room[k]! - reference[k]!));
    }
    return { excess, base: -grows };
  }

  /**
   * How deep segment `i` of one body's probes lie in a segment of another body,
   * which shares no reference with it, and how far that can grow before it
   * exceeds a depth already recorded.
   *
   * @param probes Segment `i`'s probes, in its frame.
   * @param mine Segment `i` as placed.
   * @param read The other segment's prepared depth reader for this pose.
   * @returns `depth`, metres, the deepest probe, zero outside; `base`, metres,
   *   such that while the two segments travel less than `base + K` the depth
   *   stays at or below any `K` of zero or more.
   */
  export function across(
    probes: readonly IAutoMovieVector3[],
    mine: IAutoMovieMotionHumanColliders.IPlaced,
    read: ReturnType<typeof prepareAutoMovieMotionHumanAuditDepths>,
  ): IAcrossResult {
    const room: Float64Array = new Float64Array(probes.length);
    const depths: Float64Array = read(probes, mine, room);
    let depth: number = 0;
    let grows: number = -Infinity;
    for (let k: number = 0; k < depths.length; k++) {
      depth = Math.max(depth, depths[k]!);
      grows = Math.max(grows, Math.min(depths[k]!, room[k]!));
    }
    return { depth, base: -grows };
  }

  /**
   * How far any point of each segment of a body moved from a motion's first
   * grid instant to each later one, at most.
   *
   * @param m The body's model.
   * @param frames The body's placed segments at each grid instant, in grid
   *   order.
   * @returns Per instant, per segment, metres: the sum over the grid steps
   *   before it of the segment's travel over that step; zero at the first
   *   instant. Between instants `a < b` a segment's points moved no more than
   *   its value at `b` less its value at `a`.
   */
  export function travel(
    m: M.IModel,
    frames: readonly (readonly IAutoMovieMotionHumanColliders.IPlaced[])[],
  ): Float64Array[] {
    const out: Float64Array[] = [];
    for (let k: number = 0; k < frames.length; k++) {
      const sum: Float64Array = new Float64Array(m.parts.length);
      if (k > 0) {
        const before: Float64Array = out[k - 1]!;
        for (let s: number = 0; s < m.parts.length; s++) {
          const a: IAutoMovieMotionHumanColliders.IPlaced = frames[k - 1]![s]!;
          const b: IAutoMovieMotionHumanColliders.IPlaced = frames[k]![s]!;
          const turn: IAutoMovieQuaternion = Quaternion.multiply(
            b.pose.rotation,
            Quaternion.inverse(a.pose.rotation),
          );
          sum[s] =
            before[s]! +
            Vector3.distance(a.pose.position, b.pose.position) +
            2 * Math.hypot(turn.x, turn.y, turn.z) * m.parts[s]!.extent;
        }
      }
      out.push(sum);
    }
    return out;
  }
}
.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    skip: ReadonlySet<string>,
    pressed: ReadonlyMap<string, number>,
    key: (a: AutoMovieHumanoidBone, b: AutoMovieHumanoidBone) => string,
    read?: IWithinRead,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    const out: IAutoMovieMotionHumanAuditTangle.IPair[] = [];
    const centres: IAutoMovieVector3[] = placed.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        i: number,
      ): IAutoMovieVector3 => M.centre(p, m.parts[i]!),
    );

    // Each segment read in is prepared once for this placement.
    const targets: NonNullable<Parameters<typeof M.beyond>[4]> = [];
    for (let i: number = 0; i < placed.length; i++)
      for (let j: number = i + 1; j < placed.length; j++) {
        if (m.related[i]![j]!) continue;
        const index: number = i * placed.length + j;
        if (read !== undefined && !read.due(index)) continue;

        // Two segments whose bounding spheres are apart are not read, and
        // their spheres stay apart while the two travel less than the gap
        // (each centre lies within the segment's extent), so the gap itself
        // is the margin.
        const reach: number = m.parts[i]!.radius + m.parts[j]!.radius;
        const apart: number = Vector3.distance(centres[i]!, centres[j]!);
        if (apart >= reach) {
          read?.heard(index, apart - reach, true, 0);
          continue;
        }

        // A pair's key is built only where some pair is skipped or pressed.
        if (skip.size !== 0 && skip.has(key(placed[i]!.bone, placed[j]!.bone)))
          continue;

        // Two segments their link pair's certificate shows apart hold no
        // probe of either inside the other, and none enters while the two
        // travel less than that clearance (`HumanLinkCertificate.clearance`), so
        // it is the pair's margin as the spheres' gap is.
        const clear: number = HumanLinkCertificate.clearance(
          placed[i]!,
          m.parts[i]!,
          placed[j]!,
          m.parts[j]!,
        );
        if (clear > 0) {
          read?.heard(index, clear, true, 0);
          continue;
        }
        const forward: IWithinForward = own(m, placed, i, j, targets);
        const backward: IWithinBackward = own(m, placed, j, i, targets);
        const depth: number =
          Math.max(forward.excess, backward.excess) -
          (pressed.size === 0
            ? 0
            : (pressed.get(key(placed[i]!.bone, placed[j]!.bone)) ?? 0));
        read?.heard(index, Math.min(forward.base, backward.base), false, depth);
        if (depth > NANOMETRE)
          out.push({
            a: placed[forward.excess >= backward.excess ? i : j]!.bone,
            b: placed[forward.excess >= backward.excess ? j : i]!.bone,
            depth,
            seconds: 0,
          });
      }
    return out;
  }

  /**
   * Every segment of one placed body that passes into a segment of another, at
   * its full depth: the reading of `AutoMovieMotionHumanAuditTangle.across` on
   * segments already placed.
   *
   * A caller that certifies pairs across the instants of a motion
   * (`AutoMovieMotionHumanAuditPartner`) passes `read`: a pair whose index (`i
   *
   * - Other's parts + j`) is not `due`is not read, and every pair read
   *   is`heard`as`within`hears it, its base being`across`'s.
   *
   * @param m The model of the body whose probes are read.
   * @param mine Its placed segments.
   * @param o The model of the body they are read against.
   * @param theirs That body's placed segments.
   * @param read The certifying caller's gate and listener; every pair within
   *   reach is read when absent.
   * @returns The pairs, `a` of the first body in `b` of the other, with
   *   `seconds` zero.
   */
  export function entering(
    m: import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditTangle,
  IAutoMovieMotionHumanColliders,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanLinkCertificate } from "../posture/HumanLinkCertificate";
import { AutoMovieMotionHumanAuditTangleModel as M } from "./AutoMovieMotionHumanAuditTangleModel";
import { prepareAutoMovieMotionHumanAuditDepths } from "./prepareAutoMovieMotionHumanAuditDepths";

/** The record of `IAcrossResult`'s site. */
type IAcrossResult = { depth: number; base: number };

/** The record of `IOwnResult`'s site. */
type IOwnResult = { excess: number; base: number };

/** The record of `IEnteringReading`'s site. */
type IEnteringReading = { depth: number; base: number };

/** The record of `IEnteringRead`'s site. */
type IEnteringRead = {
  due: (index: number) => boolean;
  heard: (index: number, base: number, apart: boolean, depth: number) => void;
};

/** The record of `IWithinBackward`'s site. */
type IWithinBackward = { excess: number; base: number };

/** The record of `IWithinForward`'s site. */
type IWithinForward = { excess: number; base: number };

/** The record of `IWithinRead`'s site. */
type IWithinRead = {
  due: (index: number) => boolean;
  heard: (index: number, base: number, apart: boolean, depth: number) => void;
};

/**
 * What lets the penetration audits (`AutoMovieMotionHumanAuditTangle` of one
 * body, `AutoMovieMotionHumanAuditPartner` of two) leave a pair of segments
 * unread at the grid instants a reading certifies, by conservative advancement
 * (`advanceAutoMovieGrid`): a pair's margin, how far its depth can still grow
 * before a reading of it could change the audit's record, and each segment's
 * travel, how far any point of it can move between two grid instants.
 *
 * A probe's depth in a segment, zero outside, is the distance to the segment's
 * surface from inside, so it grows no faster than the probe and the segment's
 * surface move toward each other. Its room
 * (`prepareAutoMovieMotionHumanAuditDepths`), the most over the segment's
 * shapes of a bounding sphere's radius less the probe's distance from its
 * centre, bounds the depth from above and moves no faster either. So a probe
 * read at depth `d` with room `r` lies, an instant later, no deeper than the
 * lesser of `d` and `r` plus the two segments' travel between the instants; a
 * pair whose every probe stays at or below the depth the audit has already
 * recorded for it adds nothing there, which is the margin. A pair whose
 * bounding spheres do not meet is not read at all, and its spheres stay apart
 * while the two segments travel less than the gap between them (each sphere's
 * centre lies within its segment's extent), so that gap is its margin. The
 * travel of a segment between two neighbouring grid instants is the distance
 * its origin moved plus its extent (`IPart.extent`) times the chord of the
 * angle it turned (a rigid motion moves a point `x` from the origin by the
 * origin's move plus `(R2 - R1) x`, whose length is at most `2 sin(angle / 2)
 *
 * |x|`); summed over the steps between two instants it bounds how far any of
 *
 * Its points moved between them, by the triangle inequality. The poses are the
 * motion's own on its grid, read anyway by the audit, so the bound is measured,
 * never estimated.
 */
export namespace AutoMovieMotionHumanAuditTangleMargin {
  /**
   * A nanometre, metres: below it a depth is the rounding of the two frames,
   * and no pair is recorded.
   */
  export const NANOMETRE: number = 1e-9;

  /**
   * Every pair of segments of one placed pose of a body that pass into each
   * other beyond their reference depths, each once with the deeper direction:
   * the reading of `AutoMovieMotionHumanAuditTangle.pose`.
   *
   * A caller that certifies pairs across the instants of a motion passes
   * `read`: a pair whose index (`i * parts + j`, `i < j`) is not `due` is not
   * read, and every pair read is `heard`: with `apart`, the gap between its
   * bounding spheres, which is its margin, when they do not meet; otherwise
   * with its base (the lesser of its two directions' `own` bases) and the depth
   * it read, less any allowance, whether or not it passed into the other. The
   * pair's record is the greatest such depth above the nanometre.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param skip Unordered pair keys not to read.
   * @param pressed Unordered pair keys read only beyond a depth, metres.
   * @param key The unordered pair key
   *   (`AutoMovieMotionHumanAuditTangle.unordered`).
   * @param read The certifying caller's gate and listener; every pair within
   *   reach is read when absent.
   * @returns The pairs, `a` the segment whose probe lies deeper, with `seconds`
   *   zero.
   */
  export function within(
    m: M.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    skip: ReadonlySet<string>,
    pressed: ReadonlyMap<string, number>,
    key: (a: AutoMovieHumanoidBone, b: AutoMovieHumanoidBone) => string,
    read?: IWithinRead,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    const out: IAutoMovieMotionHumanAuditTangle.IPair[] = [];
    const centres: IAutoMovieVector3[] = placed.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        i: number,
      ): IAutoMovieVector3 => M.centre(p, m.parts[i]!),
    );

    // Each segment read in is prepared once for this placement.
    const targets: NonNullable<Parameters<typeof M.beyond>[4]> = [];
    for (let i: number = 0; i < placed.length; i++)
      for (let j: number = i + 1; j < placed.length; j++) {
        if (m.related[i]![j]!) continue;
        const index: number = i * placed.length + j;
        if (read !== undefined && !read.due(index)) continue;

        // Two segments whose bounding spheres are apart are not read, and
        // their spheres stay apart while the two travel less than the gap
        // (each centre lies within the segment's extent), so the gap itself
        // is the margin.
        const reach: number = m.parts[i]!.radius + m.parts[j]!.radius;
        const apart: number = Vector3.distance(centres[i]!, centres[j]!);
        if (apart >= reach) {
          read?.heard(index, apart - reach, true, 0);
          continue;
        }

        // A pair's key is built only where some pair is skipped or pressed.
        if (skip.size !== 0 && skip.has(key(placed[i]!.bone, placed[j]!.bone)))
          continue;

        // Two segments their link pair's certificate shows apart hold no
        // probe of either inside the other, and none enters while the two
        // travel less than that clearance (`HumanLinkCertificate.clearance`), so
        // it is the pair's margin as the spheres' gap is.
        const clear: number = HumanLinkCertificate.clearance(
          placed[i]!,
          m.parts[i]!,
          placed[j]!,
          m.parts[j]!,
        );
        if (clear > 0) {
          read?.heard(index, clear, true, 0);
          continue;
        }
        const forward: IWithinForward = own(m, placed, i, j, targets);
        const backward: IWithinBackward = own(m, placed, j, i, targets);
        const depth: number =
          Math.max(forward.excess, backward.excess) -
          (pressed.size === 0
            ? 0
            : (pressed.get(key(placed[i]!.bone, placed[j]!.bone)) ?? 0));
        read?.heard(index, Math.min(forward.base, backward.base), false, depth);
        if (depth > NANOMETRE)
          out.push({
            a: placed[forward.excess >= backward.excess ? i : j]!.bone,
            b: placed[forward.excess >= backward.excess ? j : i]!.bone,
            depth,
            seconds: 0,
          });
      }
    return out;
  }

  /**
   * Every segment of one placed body that passes into a segment of another, at
   * its full depth: the reading of `AutoMovieMotionHumanAuditTangle.across` on
   * segments already placed.
   *
   * A caller that certifies pairs across the instants of a motion
   * (`AutoMovieMotionHumanAuditPartner`) passes `read`: a pair whose index (`i
   *
   * - Other's parts + j`) is not `due`is not read, and every pair read
   *   is`heard`as`within`hears it, its base being`across`'s.
   *
   * @param m The model of the body whose probes are read.
   * @param mine Its placed segments.
   * @param o The model of the body they are read against.
   * @param theirs That body's placed segments.
   * @param read The certifying caller's gate and listener; every pair within
   *   reach is read when absent.
   * @returns The pairs, `a` of the first body in `b` of the other, with
   *   `seconds` zero.
   */
  export function entering(
    m: M.IModel,
    mine: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    o: M.IModel,
    theirs: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    read?: IEnteringRead,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    const out: IAutoMovieMotionHumanAuditTangle.IPair[] = [];
    const near: IAutoMovieVector3[] = mine.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        i: number,
      ): IAutoMovieVector3 => M.centre(p, m.parts[i]!),
    );
    const far: IAutoMovieVector3[] = theirs.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        j: number,
      ): IAutoMovieVector3 => M.centre(p, o.parts[j]!),
    );

    // Each of the other body's segments is prepared once for this placement.
    const targets: NonNullable<Parameters<typeof M.beyond>[4]> = [];
    for (let i: number = 0; i < mine.length; i++)
      for (let j: number = 0; j < theirs.length; j++) {
        const index: number = i * theirs.length + j;
        if (read !== undefined && !read.due(index)) continue;

        // Bounding spheres apart: the gap itself is the margin (`within`).
        const reach: number = m.parts[i]!.radius + o.parts[j]!.radius;
        const apart: number = Vector3.distance(near[i]!, far[j]!);
        if (apart >= reach) {
          read?.heard(index, apart - reach, true, 0);
          continue;
        }
        const clear: number = HumanLinkCertificate.clearance(
          mine[i]!,
          m.parts[i]!,
          theirs[j]!,
          o.parts[j]!,
        );
        if (clear > 0) {
          read?.heard(index, clear, true, 0);
          continue;
        }
        const reading: IEnteringReading = across(
          m.parts[i]!.probes,
          mine[i]!,
          (targets[j] ??= prepareAutoMovieMotionHumanAuditDepths(theirs[j]!)),
        );
        read?.heard(index, reading.base, false, reading.depth);
        if (reading.depth > NANOMETRE)
          out.push({
            a: mine[i]!.bone,
            b: theirs[j]!.bone,
            depth: reading.depth,
            seconds: 0,
          });
      }
    return out;
  }

  /**
   * How deep segment `i`'s probes lie in segment `j` of the same body beyond
   * their reference depths, and how far that can grow before it exceeds a depth
   * already recorded.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param i The segment whose probes are read.
   * @param j The segment they are read in.
   * @param targets The caller's list of prepared segments for this reading of
   *   `placed` (`AutoMovieMotionHumanAuditTangleModel.beyond`).
   * @returns `excess`, the model's `excess` of the pair, metres, zero when no
   *   probe lies deeper than its reference; `base`, metres, such that while the
   *   two segments travel less than `base + K` the excess stays at or below any
   *   `K` of zero or more.
   */
  export function own(
    m: M.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    i: number,
    j: number,
    targets: Parameters<typeof M.beyond>[4],
  ): IOwnResult {
    const room: Float64Array = new Float64Array(m.parts[i]!.probes.length);
    const over: Float64Array = M.beyond(m, placed, i, j, targets, room);
    const reference: Float64Array = M.reference(m, i, j);
    let excess: number = 0;
    let grows: number = -Infinity;
    for (let k: number = 0; k < over.length; k++) {
      excess = Math.max(excess, over[k]!);

      // How far above its reference the probe can be read now: its excess,
      // and never above its room less the reference.
      grows = Math.max(grows, Math.min(over[k]!, room[k]! - reference[k]!));
    }
    return { excess, base: -grows };
  }

  /**
   * How deep segment `i` of one body's probes lie in a segment of another body,
   * which shares no reference with it, and how far that can grow before it
   * exceeds a depth already recorded.
   *
   * @param probes Segment `i`'s probes, in its frame.
   * @param mine Segment `i` as placed.
   * @param read The other segment's prepared depth reader for this pose.
   * @returns `depth`, metres, the deepest probe, zero outside; `base`, metres,
   *   such that while the two segments travel less than `base + K` the depth
   *   stays at or below any `K` of zero or more.
   */
  export function across(
    probes: readonly IAutoMovieVector3[],
    mine: IAutoMovieMotionHumanColliders.IPlaced,
    read: ReturnType<typeof prepareAutoMovieMotionHumanAuditDepths>,
  ): IAcrossResult {
    const room: Float64Array = new Float64Array(probes.length);
    const depths: Float64Array = read(probes, mine, room);
    let depth: number = 0;
    let grows: number = -Infinity;
    for (let k: number = 0; k < depths.length; k++) {
      depth = Math.max(depth, depths[k]!);
      grows = Math.max(grows, Math.min(depths[k]!, room[k]!));
    }
    return { depth, base: -grows };
  }

  /**
   * How far any point of each segment of a body moved from a motion's first
   * grid instant to each later one, at most.
   *
   * @param m The body's model.
   * @param frames The body's placed segments at each grid instant, in grid
   *   order.
   * @returns Per instant, per segment, metres: the sum over the grid steps
   *   before it of the segment's travel over that step; zero at the first
   *   instant. Between instants `a < b` a segment's points moved no more than
   *   its value at `b` less its value at `a`.
   */
  export function travel(
    m: M.IModel,
    frames: readonly (readonly IAutoMovieMotionHumanColliders.IPlaced[])[],
  ): Float64Array[] {
    const out: Float64Array[] = [];
    for (let k: number = 0; k < frames.length; k++) {
      const sum: Float64Array = new Float64Array(m.parts.length);
      if (k > 0) {
        const before: Float64Array = out[k - 1]!;
        for (let s: number = 0; s < m.parts.length; s++) {
          const a: IAutoMovieMotionHumanColliders.IPlaced = frames[k - 1]![s]!;
          const b: IAutoMovieMotionHumanColliders.IPlaced = frames[k]![s]!;
          const turn: IAutoMovieQuaternion = Quaternion.multiply(
            b.pose.rotation,
            Quaternion.inverse(a.pose.rotation),
          );
          sum[s] =
            before[s]! +
            Vector3.distance(a.pose.position, b.pose.position) +
            2 * Math.hypot(turn.x, turn.y, turn.z) * m.parts[s]!.extent;
        }
      }
      out.push(sum);
    }
    return out;
  }
}
.IModel,
    mine: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    o: import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditTangle,
  IAutoMovieMotionHumanColliders,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanLinkCertificate } from "../posture/HumanLinkCertificate";
import { AutoMovieMotionHumanAuditTangleModel as M } from "./AutoMovieMotionHumanAuditTangleModel";
import { prepareAutoMovieMotionHumanAuditDepths } from "./prepareAutoMovieMotionHumanAuditDepths";

/** The record of `IAcrossResult`'s site. */
type IAcrossResult = { depth: number; base: number };

/** The record of `IOwnResult`'s site. */
type IOwnResult = { excess: number; base: number };

/** The record of `IEnteringReading`'s site. */
type IEnteringReading = { depth: number; base: number };

/** The record of `IEnteringRead`'s site. */
type IEnteringRead = {
  due: (index: number) => boolean;
  heard: (index: number, base: number, apart: boolean, depth: number) => void;
};

/** The record of `IWithinBackward`'s site. */
type IWithinBackward = { excess: number; base: number };

/** The record of `IWithinForward`'s site. */
type IWithinForward = { excess: number; base: number };

/** The record of `IWithinRead`'s site. */
type IWithinRead = {
  due: (index: number) => boolean;
  heard: (index: number, base: number, apart: boolean, depth: number) => void;
};

/**
 * What lets the penetration audits (`AutoMovieMotionHumanAuditTangle` of one
 * body, `AutoMovieMotionHumanAuditPartner` of two) leave a pair of segments
 * unread at the grid instants a reading certifies, by conservative advancement
 * (`advanceAutoMovieGrid`): a pair's margin, how far its depth can still grow
 * before a reading of it could change the audit's record, and each segment's
 * travel, how far any point of it can move between two grid instants.
 *
 * A probe's depth in a segment, zero outside, is the distance to the segment's
 * surface from inside, so it grows no faster than the probe and the segment's
 * surface move toward each other. Its room
 * (`prepareAutoMovieMotionHumanAuditDepths`), the most over the segment's
 * shapes of a bounding sphere's radius less the probe's distance from its
 * centre, bounds the depth from above and moves no faster either. So a probe
 * read at depth `d` with room `r` lies, an instant later, no deeper than the
 * lesser of `d` and `r` plus the two segments' travel between the instants; a
 * pair whose every probe stays at or below the depth the audit has already
 * recorded for it adds nothing there, which is the margin. A pair whose
 * bounding spheres do not meet is not read at all, and its spheres stay apart
 * while the two segments travel less than the gap between them (each sphere's
 * centre lies within its segment's extent), so that gap is its margin. The
 * travel of a segment between two neighbouring grid instants is the distance
 * its origin moved plus its extent (`IPart.extent`) times the chord of the
 * angle it turned (a rigid motion moves a point `x` from the origin by the
 * origin's move plus `(R2 - R1) x`, whose length is at most `2 sin(angle / 2)
 *
 * |x|`); summed over the steps between two instants it bounds how far any of
 *
 * Its points moved between them, by the triangle inequality. The poses are the
 * motion's own on its grid, read anyway by the audit, so the bound is measured,
 * never estimated.
 */
export namespace AutoMovieMotionHumanAuditTangleMargin {
  /**
   * A nanometre, metres: below it a depth is the rounding of the two frames,
   * and no pair is recorded.
   */
  export const NANOMETRE: number = 1e-9;

  /**
   * Every pair of segments of one placed pose of a body that pass into each
   * other beyond their reference depths, each once with the deeper direction:
   * the reading of `AutoMovieMotionHumanAuditTangle.pose`.
   *
   * A caller that certifies pairs across the instants of a motion passes
   * `read`: a pair whose index (`i * parts + j`, `i < j`) is not `due` is not
   * read, and every pair read is `heard`: with `apart`, the gap between its
   * bounding spheres, which is its margin, when they do not meet; otherwise
   * with its base (the lesser of its two directions' `own` bases) and the depth
   * it read, less any allowance, whether or not it passed into the other. The
   * pair's record is the greatest such depth above the nanometre.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param skip Unordered pair keys not to read.
   * @param pressed Unordered pair keys read only beyond a depth, metres.
   * @param key The unordered pair key
   *   (`AutoMovieMotionHumanAuditTangle.unordered`).
   * @param read The certifying caller's gate and listener; every pair within
   *   reach is read when absent.
   * @returns The pairs, `a` the segment whose probe lies deeper, with `seconds`
   *   zero.
   */
  export function within(
    m: M.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    skip: ReadonlySet<string>,
    pressed: ReadonlyMap<string, number>,
    key: (a: AutoMovieHumanoidBone, b: AutoMovieHumanoidBone) => string,
    read?: IWithinRead,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    const out: IAutoMovieMotionHumanAuditTangle.IPair[] = [];
    const centres: IAutoMovieVector3[] = placed.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        i: number,
      ): IAutoMovieVector3 => M.centre(p, m.parts[i]!),
    );

    // Each segment read in is prepared once for this placement.
    const targets: NonNullable<Parameters<typeof M.beyond>[4]> = [];
    for (let i: number = 0; i < placed.length; i++)
      for (let j: number = i + 1; j < placed.length; j++) {
        if (m.related[i]![j]!) continue;
        const index: number = i * placed.length + j;
        if (read !== undefined && !read.due(index)) continue;

        // Two segments whose bounding spheres are apart are not read, and
        // their spheres stay apart while the two travel less than the gap
        // (each centre lies within the segment's extent), so the gap itself
        // is the margin.
        const reach: number = m.parts[i]!.radius + m.parts[j]!.radius;
        const apart: number = Vector3.distance(centres[i]!, centres[j]!);
        if (apart >= reach) {
          read?.heard(index, apart - reach, true, 0);
          continue;
        }

        // A pair's key is built only where some pair is skipped or pressed.
        if (skip.size !== 0 && skip.has(key(placed[i]!.bone, placed[j]!.bone)))
          continue;

        // Two segments their link pair's certificate shows apart hold no
        // probe of either inside the other, and none enters while the two
        // travel less than that clearance (`HumanLinkCertificate.clearance`), so
        // it is the pair's margin as the spheres' gap is.
        const clear: number = HumanLinkCertificate.clearance(
          placed[i]!,
          m.parts[i]!,
          placed[j]!,
          m.parts[j]!,
        );
        if (clear > 0) {
          read?.heard(index, clear, true, 0);
          continue;
        }
        const forward: IWithinForward = own(m, placed, i, j, targets);
        const backward: IWithinBackward = own(m, placed, j, i, targets);
        const depth: number =
          Math.max(forward.excess, backward.excess) -
          (pressed.size === 0
            ? 0
            : (pressed.get(key(placed[i]!.bone, placed[j]!.bone)) ?? 0));
        read?.heard(index, Math.min(forward.base, backward.base), false, depth);
        if (depth > NANOMETRE)
          out.push({
            a: placed[forward.excess >= backward.excess ? i : j]!.bone,
            b: placed[forward.excess >= backward.excess ? j : i]!.bone,
            depth,
            seconds: 0,
          });
      }
    return out;
  }

  /**
   * Every segment of one placed body that passes into a segment of another, at
   * its full depth: the reading of `AutoMovieMotionHumanAuditTangle.across` on
   * segments already placed.
   *
   * A caller that certifies pairs across the instants of a motion
   * (`AutoMovieMotionHumanAuditPartner`) passes `read`: a pair whose index (`i
   *
   * - Other's parts + j`) is not `due`is not read, and every pair read
   *   is`heard`as`within`hears it, its base being`across`'s.
   *
   * @param m The model of the body whose probes are read.
   * @param mine Its placed segments.
   * @param o The model of the body they are read against.
   * @param theirs That body's placed segments.
   * @param read The certifying caller's gate and listener; every pair within
   *   reach is read when absent.
   * @returns The pairs, `a` of the first body in `b` of the other, with
   *   `seconds` zero.
   */
  export function entering(
    m: M.IModel,
    mine: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    o: M.IModel,
    theirs: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    read?: IEnteringRead,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    const out: IAutoMovieMotionHumanAuditTangle.IPair[] = [];
    const near: IAutoMovieVector3[] = mine.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        i: number,
      ): IAutoMovieVector3 => M.centre(p, m.parts[i]!),
    );
    const far: IAutoMovieVector3[] = theirs.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        j: number,
      ): IAutoMovieVector3 => M.centre(p, o.parts[j]!),
    );

    // Each of the other body's segments is prepared once for this placement.
    const targets: NonNullable<Parameters<typeof M.beyond>[4]> = [];
    for (let i: number = 0; i < mine.length; i++)
      for (let j: number = 0; j < theirs.length; j++) {
        const index: number = i * theirs.length + j;
        if (read !== undefined && !read.due(index)) continue;

        // Bounding spheres apart: the gap itself is the margin (`within`).
        const reach: number = m.parts[i]!.radius + o.parts[j]!.radius;
        const apart: number = Vector3.distance(near[i]!, far[j]!);
        if (apart >= reach) {
          read?.heard(index, apart - reach, true, 0);
          continue;
        }
        const clear: number = HumanLinkCertificate.clearance(
          mine[i]!,
          m.parts[i]!,
          theirs[j]!,
          o.parts[j]!,
        );
        if (clear > 0) {
          read?.heard(index, clear, true, 0);
          continue;
        }
        const reading: IEnteringReading = across(
          m.parts[i]!.probes,
          mine[i]!,
          (targets[j] ??= prepareAutoMovieMotionHumanAuditDepths(theirs[j]!)),
        );
        read?.heard(index, reading.base, false, reading.depth);
        if (reading.depth > NANOMETRE)
          out.push({
            a: mine[i]!.bone,
            b: theirs[j]!.bone,
            depth: reading.depth,
            seconds: 0,
          });
      }
    return out;
  }

  /**
   * How deep segment `i`'s probes lie in segment `j` of the same body beyond
   * their reference depths, and how far that can grow before it exceeds a depth
   * already recorded.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param i The segment whose probes are read.
   * @param j The segment they are read in.
   * @param targets The caller's list of prepared segments for this reading of
   *   `placed` (`AutoMovieMotionHumanAuditTangleModel.beyond`).
   * @returns `excess`, the model's `excess` of the pair, metres, zero when no
   *   probe lies deeper than its reference; `base`, metres, such that while the
   *   two segments travel less than `base + K` the excess stays at or below any
   *   `K` of zero or more.
   */
  export function own(
    m: M.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    i: number,
    j: number,
    targets: Parameters<typeof M.beyond>[4],
  ): IOwnResult {
    const room: Float64Array = new Float64Array(m.parts[i]!.probes.length);
    const over: Float64Array = M.beyond(m, placed, i, j, targets, room);
    const reference: Float64Array = M.reference(m, i, j);
    let excess: number = 0;
    let grows: number = -Infinity;
    for (let k: number = 0; k < over.length; k++) {
      excess = Math.max(excess, over[k]!);

      // How far above its reference the probe can be read now: its excess,
      // and never above its room less the reference.
      grows = Math.max(grows, Math.min(over[k]!, room[k]! - reference[k]!));
    }
    return { excess, base: -grows };
  }

  /**
   * How deep segment `i` of one body's probes lie in a segment of another body,
   * which shares no reference with it, and how far that can grow before it
   * exceeds a depth already recorded.
   *
   * @param probes Segment `i`'s probes, in its frame.
   * @param mine Segment `i` as placed.
   * @param read The other segment's prepared depth reader for this pose.
   * @returns `depth`, metres, the deepest probe, zero outside; `base`, metres,
   *   such that while the two segments travel less than `base + K` the depth
   *   stays at or below any `K` of zero or more.
   */
  export function across(
    probes: readonly IAutoMovieVector3[],
    mine: IAutoMovieMotionHumanColliders.IPlaced,
    read: ReturnType<typeof prepareAutoMovieMotionHumanAuditDepths>,
  ): IAcrossResult {
    const room: Float64Array = new Float64Array(probes.length);
    const depths: Float64Array = read(probes, mine, room);
    let depth: number = 0;
    let grows: number = -Infinity;
    for (let k: number = 0; k < depths.length; k++) {
      depth = Math.max(depth, depths[k]!);
      grows = Math.max(grows, Math.min(depths[k]!, room[k]!));
    }
    return { depth, base: -grows };
  }

  /**
   * How far any point of each segment of a body moved from a motion's first
   * grid instant to each later one, at most.
   *
   * @param m The body's model.
   * @param frames The body's placed segments at each grid instant, in grid
   *   order.
   * @returns Per instant, per segment, metres: the sum over the grid steps
   *   before it of the segment's travel over that step; zero at the first
   *   instant. Between instants `a < b` a segment's points moved no more than
   *   its value at `b` less its value at `a`.
   */
  export function travel(
    m: M.IModel,
    frames: readonly (readonly IAutoMovieMotionHumanColliders.IPlaced[])[],
  ): Float64Array[] {
    const out: Float64Array[] = [];
    for (let k: number = 0; k < frames.length; k++) {
      const sum: Float64Array = new Float64Array(m.parts.length);
      if (k > 0) {
        const before: Float64Array = out[k - 1]!;
        for (let s: number = 0; s < m.parts.length; s++) {
          const a: IAutoMovieMotionHumanColliders.IPlaced = frames[k - 1]![s]!;
          const b: IAutoMovieMotionHumanColliders.IPlaced = frames[k]![s]!;
          const turn: IAutoMovieQuaternion = Quaternion.multiply(
            b.pose.rotation,
            Quaternion.inverse(a.pose.rotation),
          );
          sum[s] =
            before[s]! +
            Vector3.distance(a.pose.position, b.pose.position) +
            2 * Math.hypot(turn.x, turn.y, turn.z) * m.parts[s]!.extent;
        }
      }
      out.push(sum);
    }
    return out;
  }
}
.IModel,
    theirs: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    read?: IEnteringRead,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    const out: IAutoMovieMotionHumanAuditTangle.IPair[] = [];
    const near: IAutoMovieVector3[] = mine.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        i: number,
      ): IAutoMovieVector3 => M.centre(p, m.parts[i]!),
    );
    const far: IAutoMovieVector3[] = theirs.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        j: number,
      ): IAutoMovieVector3 => M.centre(p, o.parts[j]!),
    );

    // Each of the other body's segments is prepared once for this placement.
    const targets: NonNullable<Parameters<typeof M.beyond>[4]> = [];
    for (let i: number = 0; i < mine.length; i++)
      for (let j: number = 0; j < theirs.length; j++) {
        const index: number = i * theirs.length + j;
        if (read !== undefined && !read.due(index)) continue;

        // Bounding spheres apart: the gap itself is the margin (`within`).
        const reach: number = m.parts[i]!.radius + o.parts[j]!.radius;
        const apart: number = Vector3.distance(near[i]!, far[j]!);
        if (apart >= reach) {
          read?.heard(index, apart - reach, true, 0);
          continue;
        }
        const clear: number = HumanLinkCertificate.clearance(
          mine[i]!,
          m.parts[i]!,
          theirs[j]!,
          o.parts[j]!,
        );
        if (clear > 0) {
          read?.heard(index, clear, true, 0);
          continue;
        }
        const reading: IEnteringReading = across(
          m.parts[i]!.probes,
          mine[i]!,
          (targets[j] ??= prepareAutoMovieMotionHumanAuditDepths(theirs[j]!)),
        );
        read?.heard(index, reading.base, false, reading.depth);
        if (reading.depth > NANOMETRE)
          out.push({
            a: mine[i]!.bone,
            b: theirs[j]!.bone,
            depth: reading.depth,
            seconds: 0,
          });
      }
    return out;
  }

  /**
   * How deep segment `i`'s probes lie in segment `j` of the same body beyond
   * their reference depths, and how far that can grow before it exceeds a depth
   * already recorded.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param i The segment whose probes are read.
   * @param j The segment they are read in.
   * @param targets The caller's list of prepared segments for this reading of
   *   `placed` (`AutoMovieMotionHumanAuditTangleModel.beyond`).
   * @returns `excess`, the model's `excess` of the pair, metres, zero when no
   *   probe lies deeper than its reference; `base`, metres, such that while the
   *   two segments travel less than `base + K` the excess stays at or below any
   *   `K` of zero or more.
   */
  export function own(
    m: import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditTangle,
  IAutoMovieMotionHumanColliders,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanLinkCertificate } from "../posture/HumanLinkCertificate";
import { AutoMovieMotionHumanAuditTangleModel as M } from "./AutoMovieMotionHumanAuditTangleModel";
import { prepareAutoMovieMotionHumanAuditDepths } from "./prepareAutoMovieMotionHumanAuditDepths";

/** The record of `IAcrossResult`'s site. */
type IAcrossResult = { depth: number; base: number };

/** The record of `IOwnResult`'s site. */
type IOwnResult = { excess: number; base: number };

/** The record of `IEnteringReading`'s site. */
type IEnteringReading = { depth: number; base: number };

/** The record of `IEnteringRead`'s site. */
type IEnteringRead = {
  due: (index: number) => boolean;
  heard: (index: number, base: number, apart: boolean, depth: number) => void;
};

/** The record of `IWithinBackward`'s site. */
type IWithinBackward = { excess: number; base: number };

/** The record of `IWithinForward`'s site. */
type IWithinForward = { excess: number; base: number };

/** The record of `IWithinRead`'s site. */
type IWithinRead = {
  due: (index: number) => boolean;
  heard: (index: number, base: number, apart: boolean, depth: number) => void;
};

/**
 * What lets the penetration audits (`AutoMovieMotionHumanAuditTangle` of one
 * body, `AutoMovieMotionHumanAuditPartner` of two) leave a pair of segments
 * unread at the grid instants a reading certifies, by conservative advancement
 * (`advanceAutoMovieGrid`): a pair's margin, how far its depth can still grow
 * before a reading of it could change the audit's record, and each segment's
 * travel, how far any point of it can move between two grid instants.
 *
 * A probe's depth in a segment, zero outside, is the distance to the segment's
 * surface from inside, so it grows no faster than the probe and the segment's
 * surface move toward each other. Its room
 * (`prepareAutoMovieMotionHumanAuditDepths`), the most over the segment's
 * shapes of a bounding sphere's radius less the probe's distance from its
 * centre, bounds the depth from above and moves no faster either. So a probe
 * read at depth `d` with room `r` lies, an instant later, no deeper than the
 * lesser of `d` and `r` plus the two segments' travel between the instants; a
 * pair whose every probe stays at or below the depth the audit has already
 * recorded for it adds nothing there, which is the margin. A pair whose
 * bounding spheres do not meet is not read at all, and its spheres stay apart
 * while the two segments travel less than the gap between them (each sphere's
 * centre lies within its segment's extent), so that gap is its margin. The
 * travel of a segment between two neighbouring grid instants is the distance
 * its origin moved plus its extent (`IPart.extent`) times the chord of the
 * angle it turned (a rigid motion moves a point `x` from the origin by the
 * origin's move plus `(R2 - R1) x`, whose length is at most `2 sin(angle / 2)
 *
 * |x|`); summed over the steps between two instants it bounds how far any of
 *
 * Its points moved between them, by the triangle inequality. The poses are the
 * motion's own on its grid, read anyway by the audit, so the bound is measured,
 * never estimated.
 */
export namespace AutoMovieMotionHumanAuditTangleMargin {
  /**
   * A nanometre, metres: below it a depth is the rounding of the two frames,
   * and no pair is recorded.
   */
  export const NANOMETRE: number = 1e-9;

  /**
   * Every pair of segments of one placed pose of a body that pass into each
   * other beyond their reference depths, each once with the deeper direction:
   * the reading of `AutoMovieMotionHumanAuditTangle.pose`.
   *
   * A caller that certifies pairs across the instants of a motion passes
   * `read`: a pair whose index (`i * parts + j`, `i < j`) is not `due` is not
   * read, and every pair read is `heard`: with `apart`, the gap between its
   * bounding spheres, which is its margin, when they do not meet; otherwise
   * with its base (the lesser of its two directions' `own` bases) and the depth
   * it read, less any allowance, whether or not it passed into the other. The
   * pair's record is the greatest such depth above the nanometre.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param skip Unordered pair keys not to read.
   * @param pressed Unordered pair keys read only beyond a depth, metres.
   * @param key The unordered pair key
   *   (`AutoMovieMotionHumanAuditTangle.unordered`).
   * @param read The certifying caller's gate and listener; every pair within
   *   reach is read when absent.
   * @returns The pairs, `a` the segment whose probe lies deeper, with `seconds`
   *   zero.
   */
  export function within(
    m: M.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    skip: ReadonlySet<string>,
    pressed: ReadonlyMap<string, number>,
    key: (a: AutoMovieHumanoidBone, b: AutoMovieHumanoidBone) => string,
    read?: IWithinRead,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    const out: IAutoMovieMotionHumanAuditTangle.IPair[] = [];
    const centres: IAutoMovieVector3[] = placed.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        i: number,
      ): IAutoMovieVector3 => M.centre(p, m.parts[i]!),
    );

    // Each segment read in is prepared once for this placement.
    const targets: NonNullable<Parameters<typeof M.beyond>[4]> = [];
    for (let i: number = 0; i < placed.length; i++)
      for (let j: number = i + 1; j < placed.length; j++) {
        if (m.related[i]![j]!) continue;
        const index: number = i * placed.length + j;
        if (read !== undefined && !read.due(index)) continue;

        // Two segments whose bounding spheres are apart are not read, and
        // their spheres stay apart while the two travel less than the gap
        // (each centre lies within the segment's extent), so the gap itself
        // is the margin.
        const reach: number = m.parts[i]!.radius + m.parts[j]!.radius;
        const apart: number = Vector3.distance(centres[i]!, centres[j]!);
        if (apart >= reach) {
          read?.heard(index, apart - reach, true, 0);
          continue;
        }

        // A pair's key is built only where some pair is skipped or pressed.
        if (skip.size !== 0 && skip.has(key(placed[i]!.bone, placed[j]!.bone)))
          continue;

        // Two segments their link pair's certificate shows apart hold no
        // probe of either inside the other, and none enters while the two
        // travel less than that clearance (`HumanLinkCertificate.clearance`), so
        // it is the pair's margin as the spheres' gap is.
        const clear: number = HumanLinkCertificate.clearance(
          placed[i]!,
          m.parts[i]!,
          placed[j]!,
          m.parts[j]!,
        );
        if (clear > 0) {
          read?.heard(index, clear, true, 0);
          continue;
        }
        const forward: IWithinForward = own(m, placed, i, j, targets);
        const backward: IWithinBackward = own(m, placed, j, i, targets);
        const depth: number =
          Math.max(forward.excess, backward.excess) -
          (pressed.size === 0
            ? 0
            : (pressed.get(key(placed[i]!.bone, placed[j]!.bone)) ?? 0));
        read?.heard(index, Math.min(forward.base, backward.base), false, depth);
        if (depth > NANOMETRE)
          out.push({
            a: placed[forward.excess >= backward.excess ? i : j]!.bone,
            b: placed[forward.excess >= backward.excess ? j : i]!.bone,
            depth,
            seconds: 0,
          });
      }
    return out;
  }

  /**
   * Every segment of one placed body that passes into a segment of another, at
   * its full depth: the reading of `AutoMovieMotionHumanAuditTangle.across` on
   * segments already placed.
   *
   * A caller that certifies pairs across the instants of a motion
   * (`AutoMovieMotionHumanAuditPartner`) passes `read`: a pair whose index (`i
   *
   * - Other's parts + j`) is not `due`is not read, and every pair read
   *   is`heard`as`within`hears it, its base being`across`'s.
   *
   * @param m The model of the body whose probes are read.
   * @param mine Its placed segments.
   * @param o The model of the body they are read against.
   * @param theirs That body's placed segments.
   * @param read The certifying caller's gate and listener; every pair within
   *   reach is read when absent.
   * @returns The pairs, `a` of the first body in `b` of the other, with
   *   `seconds` zero.
   */
  export function entering(
    m: M.IModel,
    mine: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    o: M.IModel,
    theirs: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    read?: IEnteringRead,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    const out: IAutoMovieMotionHumanAuditTangle.IPair[] = [];
    const near: IAutoMovieVector3[] = mine.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        i: number,
      ): IAutoMovieVector3 => M.centre(p, m.parts[i]!),
    );
    const far: IAutoMovieVector3[] = theirs.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        j: number,
      ): IAutoMovieVector3 => M.centre(p, o.parts[j]!),
    );

    // Each of the other body's segments is prepared once for this placement.
    const targets: NonNullable<Parameters<typeof M.beyond>[4]> = [];
    for (let i: number = 0; i < mine.length; i++)
      for (let j: number = 0; j < theirs.length; j++) {
        const index: number = i * theirs.length + j;
        if (read !== undefined && !read.due(index)) continue;

        // Bounding spheres apart: the gap itself is the margin (`within`).
        const reach: number = m.parts[i]!.radius + o.parts[j]!.radius;
        const apart: number = Vector3.distance(near[i]!, far[j]!);
        if (apart >= reach) {
          read?.heard(index, apart - reach, true, 0);
          continue;
        }
        const clear: number = HumanLinkCertificate.clearance(
          mine[i]!,
          m.parts[i]!,
          theirs[j]!,
          o.parts[j]!,
        );
        if (clear > 0) {
          read?.heard(index, clear, true, 0);
          continue;
        }
        const reading: IEnteringReading = across(
          m.parts[i]!.probes,
          mine[i]!,
          (targets[j] ??= prepareAutoMovieMotionHumanAuditDepths(theirs[j]!)),
        );
        read?.heard(index, reading.base, false, reading.depth);
        if (reading.depth > NANOMETRE)
          out.push({
            a: mine[i]!.bone,
            b: theirs[j]!.bone,
            depth: reading.depth,
            seconds: 0,
          });
      }
    return out;
  }

  /**
   * How deep segment `i`'s probes lie in segment `j` of the same body beyond
   * their reference depths, and how far that can grow before it exceeds a depth
   * already recorded.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param i The segment whose probes are read.
   * @param j The segment they are read in.
   * @param targets The caller's list of prepared segments for this reading of
   *   `placed` (`AutoMovieMotionHumanAuditTangleModel.beyond`).
   * @returns `excess`, the model's `excess` of the pair, metres, zero when no
   *   probe lies deeper than its reference; `base`, metres, such that while the
   *   two segments travel less than `base + K` the excess stays at or below any
   *   `K` of zero or more.
   */
  export function own(
    m: M.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    i: number,
    j: number,
    targets: Parameters<typeof M.beyond>[4],
  ): IOwnResult {
    const room: Float64Array = new Float64Array(m.parts[i]!.probes.length);
    const over: Float64Array = M.beyond(m, placed, i, j, targets, room);
    const reference: Float64Array = M.reference(m, i, j);
    let excess: number = 0;
    let grows: number = -Infinity;
    for (let k: number = 0; k < over.length; k++) {
      excess = Math.max(excess, over[k]!);

      // How far above its reference the probe can be read now: its excess,
      // and never above its room less the reference.
      grows = Math.max(grows, Math.min(over[k]!, room[k]! - reference[k]!));
    }
    return { excess, base: -grows };
  }

  /**
   * How deep segment `i` of one body's probes lie in a segment of another body,
   * which shares no reference with it, and how far that can grow before it
   * exceeds a depth already recorded.
   *
   * @param probes Segment `i`'s probes, in its frame.
   * @param mine Segment `i` as placed.
   * @param read The other segment's prepared depth reader for this pose.
   * @returns `depth`, metres, the deepest probe, zero outside; `base`, metres,
   *   such that while the two segments travel less than `base + K` the depth
   *   stays at or below any `K` of zero or more.
   */
  export function across(
    probes: readonly IAutoMovieVector3[],
    mine: IAutoMovieMotionHumanColliders.IPlaced,
    read: ReturnType<typeof prepareAutoMovieMotionHumanAuditDepths>,
  ): IAcrossResult {
    const room: Float64Array = new Float64Array(probes.length);
    const depths: Float64Array = read(probes, mine, room);
    let depth: number = 0;
    let grows: number = -Infinity;
    for (let k: number = 0; k < depths.length; k++) {
      depth = Math.max(depth, depths[k]!);
      grows = Math.max(grows, Math.min(depths[k]!, room[k]!));
    }
    return { depth, base: -grows };
  }

  /**
   * How far any point of each segment of a body moved from a motion's first
   * grid instant to each later one, at most.
   *
   * @param m The body's model.
   * @param frames The body's placed segments at each grid instant, in grid
   *   order.
   * @returns Per instant, per segment, metres: the sum over the grid steps
   *   before it of the segment's travel over that step; zero at the first
   *   instant. Between instants `a < b` a segment's points moved no more than
   *   its value at `b` less its value at `a`.
   */
  export function travel(
    m: M.IModel,
    frames: readonly (readonly IAutoMovieMotionHumanColliders.IPlaced[])[],
  ): Float64Array[] {
    const out: Float64Array[] = [];
    for (let k: number = 0; k < frames.length; k++) {
      const sum: Float64Array = new Float64Array(m.parts.length);
      if (k > 0) {
        const before: Float64Array = out[k - 1]!;
        for (let s: number = 0; s < m.parts.length; s++) {
          const a: IAutoMovieMotionHumanColliders.IPlaced = frames[k - 1]![s]!;
          const b: IAutoMovieMotionHumanColliders.IPlaced = frames[k]![s]!;
          const turn: IAutoMovieQuaternion = Quaternion.multiply(
            b.pose.rotation,
            Quaternion.inverse(a.pose.rotation),
          );
          sum[s] =
            before[s]! +
            Vector3.distance(a.pose.position, b.pose.position) +
            2 * Math.hypot(turn.x, turn.y, turn.z) * m.parts[s]!.extent;
        }
      }
      out.push(sum);
    }
    return out;
  }
}
.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    i: number,
    j: number,
    targets: Parameters<typeof M.beyond>[4],
  ): IOwnResult {
    const room: Float64Array = new Float64Array(m.parts[i]!.probes.length);
    const over: Float64Array = M.beyond(m, placed, i, j, targets, room);
    const reference: Float64Array = M.reference(m, i, j);
    let excess: number = 0;
    let grows: number = -Infinity;
    for (let k: number = 0; k < over.length; k++) {
      excess = Math.max(excess, over[k]!);

      // How far above its reference the probe can be read now: its excess,
      // and never above its room less the reference.
      grows = Math.max(grows, Math.min(over[k]!, room[k]! - reference[k]!));
    }
    return { excess, base: -grows };
  }

  /**
   * How deep segment `i` of one body's probes lie in a segment of another body,
   * which shares no reference with it, and how far that can grow before it
   * exceeds a depth already recorded.
   *
   * @param probes Segment `i`'s probes, in its frame.
   * @param mine Segment `i` as placed.
   * @param read The other segment's prepared depth reader for this pose.
   * @returns `depth`, metres, the deepest probe, zero outside; `base`, metres,
   *   such that while the two segments travel less than `base + K` the depth
   *   stays at or below any `K` of zero or more.
   */
  export function across(
    probes: readonly IAutoMovieVector3[],
    mine: IAutoMovieMotionHumanColliders.IPlaced,
    read: ReturnType<typeof prepareAutoMovieMotionHumanAuditDepths>,
  ): IAcrossResult {
    const room: Float64Array = new Float64Array(probes.length);
    const depths: Float64Array = read(probes, mine, room);
    let depth: number = 0;
    let grows: number = -Infinity;
    for (let k: number = 0; k < depths.length; k++) {
      depth = Math.max(depth, depths[k]!);
      grows = Math.max(grows, Math.min(depths[k]!, room[k]!));
    }
    return { depth, base: -grows };
  }

  /**
   * How far any point of each segment of a body moved from a motion's first
   * grid instant to each later one, at most.
   *
   * @param m The body's model.
   * @param frames The body's placed segments at each grid instant, in grid
   *   order.
   * @returns Per instant, per segment, metres: the sum over the grid steps
   *   before it of the segment's travel over that step; zero at the first
   *   instant. Between instants `a < b` a segment's points moved no more than
   *   its value at `b` less its value at `a`.
   */
  export function travel(
    m: import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditTangle,
  IAutoMovieMotionHumanColliders,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanLinkCertificate } from "../posture/HumanLinkCertificate";
import { AutoMovieMotionHumanAuditTangleModel as M } from "./AutoMovieMotionHumanAuditTangleModel";
import { prepareAutoMovieMotionHumanAuditDepths } from "./prepareAutoMovieMotionHumanAuditDepths";

/** The record of `IAcrossResult`'s site. */
type IAcrossResult = { depth: number; base: number };

/** The record of `IOwnResult`'s site. */
type IOwnResult = { excess: number; base: number };

/** The record of `IEnteringReading`'s site. */
type IEnteringReading = { depth: number; base: number };

/** The record of `IEnteringRead`'s site. */
type IEnteringRead = {
  due: (index: number) => boolean;
  heard: (index: number, base: number, apart: boolean, depth: number) => void;
};

/** The record of `IWithinBackward`'s site. */
type IWithinBackward = { excess: number; base: number };

/** The record of `IWithinForward`'s site. */
type IWithinForward = { excess: number; base: number };

/** The record of `IWithinRead`'s site. */
type IWithinRead = {
  due: (index: number) => boolean;
  heard: (index: number, base: number, apart: boolean, depth: number) => void;
};

/**
 * What lets the penetration audits (`AutoMovieMotionHumanAuditTangle` of one
 * body, `AutoMovieMotionHumanAuditPartner` of two) leave a pair of segments
 * unread at the grid instants a reading certifies, by conservative advancement
 * (`advanceAutoMovieGrid`): a pair's margin, how far its depth can still grow
 * before a reading of it could change the audit's record, and each segment's
 * travel, how far any point of it can move between two grid instants.
 *
 * A probe's depth in a segment, zero outside, is the distance to the segment's
 * surface from inside, so it grows no faster than the probe and the segment's
 * surface move toward each other. Its room
 * (`prepareAutoMovieMotionHumanAuditDepths`), the most over the segment's
 * shapes of a bounding sphere's radius less the probe's distance from its
 * centre, bounds the depth from above and moves no faster either. So a probe
 * read at depth `d` with room `r` lies, an instant later, no deeper than the
 * lesser of `d` and `r` plus the two segments' travel between the instants; a
 * pair whose every probe stays at or below the depth the audit has already
 * recorded for it adds nothing there, which is the margin. A pair whose
 * bounding spheres do not meet is not read at all, and its spheres stay apart
 * while the two segments travel less than the gap between them (each sphere's
 * centre lies within its segment's extent), so that gap is its margin. The
 * travel of a segment between two neighbouring grid instants is the distance
 * its origin moved plus its extent (`IPart.extent`) times the chord of the
 * angle it turned (a rigid motion moves a point `x` from the origin by the
 * origin's move plus `(R2 - R1) x`, whose length is at most `2 sin(angle / 2)
 *
 * |x|`); summed over the steps between two instants it bounds how far any of
 *
 * Its points moved between them, by the triangle inequality. The poses are the
 * motion's own on its grid, read anyway by the audit, so the bound is measured,
 * never estimated.
 */
export namespace AutoMovieMotionHumanAuditTangleMargin {
  /**
   * A nanometre, metres: below it a depth is the rounding of the two frames,
   * and no pair is recorded.
   */
  export const NANOMETRE: number = 1e-9;

  /**
   * Every pair of segments of one placed pose of a body that pass into each
   * other beyond their reference depths, each once with the deeper direction:
   * the reading of `AutoMovieMotionHumanAuditTangle.pose`.
   *
   * A caller that certifies pairs across the instants of a motion passes
   * `read`: a pair whose index (`i * parts + j`, `i < j`) is not `due` is not
   * read, and every pair read is `heard`: with `apart`, the gap between its
   * bounding spheres, which is its margin, when they do not meet; otherwise
   * with its base (the lesser of its two directions' `own` bases) and the depth
   * it read, less any allowance, whether or not it passed into the other. The
   * pair's record is the greatest such depth above the nanometre.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param skip Unordered pair keys not to read.
   * @param pressed Unordered pair keys read only beyond a depth, metres.
   * @param key The unordered pair key
   *   (`AutoMovieMotionHumanAuditTangle.unordered`).
   * @param read The certifying caller's gate and listener; every pair within
   *   reach is read when absent.
   * @returns The pairs, `a` the segment whose probe lies deeper, with `seconds`
   *   zero.
   */
  export function within(
    m: M.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    skip: ReadonlySet<string>,
    pressed: ReadonlyMap<string, number>,
    key: (a: AutoMovieHumanoidBone, b: AutoMovieHumanoidBone) => string,
    read?: IWithinRead,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    const out: IAutoMovieMotionHumanAuditTangle.IPair[] = [];
    const centres: IAutoMovieVector3[] = placed.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        i: number,
      ): IAutoMovieVector3 => M.centre(p, m.parts[i]!),
    );

    // Each segment read in is prepared once for this placement.
    const targets: NonNullable<Parameters<typeof M.beyond>[4]> = [];
    for (let i: number = 0; i < placed.length; i++)
      for (let j: number = i + 1; j < placed.length; j++) {
        if (m.related[i]![j]!) continue;
        const index: number = i * placed.length + j;
        if (read !== undefined && !read.due(index)) continue;

        // Two segments whose bounding spheres are apart are not read, and
        // their spheres stay apart while the two travel less than the gap
        // (each centre lies within the segment's extent), so the gap itself
        // is the margin.
        const reach: number = m.parts[i]!.radius + m.parts[j]!.radius;
        const apart: number = Vector3.distance(centres[i]!, centres[j]!);
        if (apart >= reach) {
          read?.heard(index, apart - reach, true, 0);
          continue;
        }

        // A pair's key is built only where some pair is skipped or pressed.
        if (skip.size !== 0 && skip.has(key(placed[i]!.bone, placed[j]!.bone)))
          continue;

        // Two segments their link pair's certificate shows apart hold no
        // probe of either inside the other, and none enters while the two
        // travel less than that clearance (`HumanLinkCertificate.clearance`), so
        // it is the pair's margin as the spheres' gap is.
        const clear: number = HumanLinkCertificate.clearance(
          placed[i]!,
          m.parts[i]!,
          placed[j]!,
          m.parts[j]!,
        );
        if (clear > 0) {
          read?.heard(index, clear, true, 0);
          continue;
        }
        const forward: IWithinForward = own(m, placed, i, j, targets);
        const backward: IWithinBackward = own(m, placed, j, i, targets);
        const depth: number =
          Math.max(forward.excess, backward.excess) -
          (pressed.size === 0
            ? 0
            : (pressed.get(key(placed[i]!.bone, placed[j]!.bone)) ?? 0));
        read?.heard(index, Math.min(forward.base, backward.base), false, depth);
        if (depth > NANOMETRE)
          out.push({
            a: placed[forward.excess >= backward.excess ? i : j]!.bone,
            b: placed[forward.excess >= backward.excess ? j : i]!.bone,
            depth,
            seconds: 0,
          });
      }
    return out;
  }

  /**
   * Every segment of one placed body that passes into a segment of another, at
   * its full depth: the reading of `AutoMovieMotionHumanAuditTangle.across` on
   * segments already placed.
   *
   * A caller that certifies pairs across the instants of a motion
   * (`AutoMovieMotionHumanAuditPartner`) passes `read`: a pair whose index (`i
   *
   * - Other's parts + j`) is not `due`is not read, and every pair read
   *   is`heard`as`within`hears it, its base being`across`'s.
   *
   * @param m The model of the body whose probes are read.
   * @param mine Its placed segments.
   * @param o The model of the body they are read against.
   * @param theirs That body's placed segments.
   * @param read The certifying caller's gate and listener; every pair within
   *   reach is read when absent.
   * @returns The pairs, `a` of the first body in `b` of the other, with
   *   `seconds` zero.
   */
  export function entering(
    m: M.IModel,
    mine: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    o: M.IModel,
    theirs: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    read?: IEnteringRead,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    const out: IAutoMovieMotionHumanAuditTangle.IPair[] = [];
    const near: IAutoMovieVector3[] = mine.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        i: number,
      ): IAutoMovieVector3 => M.centre(p, m.parts[i]!),
    );
    const far: IAutoMovieVector3[] = theirs.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        j: number,
      ): IAutoMovieVector3 => M.centre(p, o.parts[j]!),
    );

    // Each of the other body's segments is prepared once for this placement.
    const targets: NonNullable<Parameters<typeof M.beyond>[4]> = [];
    for (let i: number = 0; i < mine.length; i++)
      for (let j: number = 0; j < theirs.length; j++) {
        const index: number = i * theirs.length + j;
        if (read !== undefined && !read.due(index)) continue;

        // Bounding spheres apart: the gap itself is the margin (`within`).
        const reach: number = m.parts[i]!.radius + o.parts[j]!.radius;
        const apart: number = Vector3.distance(near[i]!, far[j]!);
        if (apart >= reach) {
          read?.heard(index, apart - reach, true, 0);
          continue;
        }
        const clear: number = HumanLinkCertificate.clearance(
          mine[i]!,
          m.parts[i]!,
          theirs[j]!,
          o.parts[j]!,
        );
        if (clear > 0) {
          read?.heard(index, clear, true, 0);
          continue;
        }
        const reading: IEnteringReading = across(
          m.parts[i]!.probes,
          mine[i]!,
          (targets[j] ??= prepareAutoMovieMotionHumanAuditDepths(theirs[j]!)),
        );
        read?.heard(index, reading.base, false, reading.depth);
        if (reading.depth > NANOMETRE)
          out.push({
            a: mine[i]!.bone,
            b: theirs[j]!.bone,
            depth: reading.depth,
            seconds: 0,
          });
      }
    return out;
  }

  /**
   * How deep segment `i`'s probes lie in segment `j` of the same body beyond
   * their reference depths, and how far that can grow before it exceeds a depth
   * already recorded.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param i The segment whose probes are read.
   * @param j The segment they are read in.
   * @param targets The caller's list of prepared segments for this reading of
   *   `placed` (`AutoMovieMotionHumanAuditTangleModel.beyond`).
   * @returns `excess`, the model's `excess` of the pair, metres, zero when no
   *   probe lies deeper than its reference; `base`, metres, such that while the
   *   two segments travel less than `base + K` the excess stays at or below any
   *   `K` of zero or more.
   */
  export function own(
    m: M.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    i: number,
    j: number,
    targets: Parameters<typeof M.beyond>[4],
  ): IOwnResult {
    const room: Float64Array = new Float64Array(m.parts[i]!.probes.length);
    const over: Float64Array = M.beyond(m, placed, i, j, targets, room);
    const reference: Float64Array = M.reference(m, i, j);
    let excess: number = 0;
    let grows: number = -Infinity;
    for (let k: number = 0; k < over.length; k++) {
      excess = Math.max(excess, over[k]!);

      // How far above its reference the probe can be read now: its excess,
      // and never above its room less the reference.
      grows = Math.max(grows, Math.min(over[k]!, room[k]! - reference[k]!));
    }
    return { excess, base: -grows };
  }

  /**
   * How deep segment `i` of one body's probes lie in a segment of another body,
   * which shares no reference with it, and how far that can grow before it
   * exceeds a depth already recorded.
   *
   * @param probes Segment `i`'s probes, in its frame.
   * @param mine Segment `i` as placed.
   * @param read The other segment's prepared depth reader for this pose.
   * @returns `depth`, metres, the deepest probe, zero outside; `base`, metres,
   *   such that while the two segments travel less than `base + K` the depth
   *   stays at or below any `K` of zero or more.
   */
  export function across(
    probes: readonly IAutoMovieVector3[],
    mine: IAutoMovieMotionHumanColliders.IPlaced,
    read: ReturnType<typeof prepareAutoMovieMotionHumanAuditDepths>,
  ): IAcrossResult {
    const room: Float64Array = new Float64Array(probes.length);
    const depths: Float64Array = read(probes, mine, room);
    let depth: number = 0;
    let grows: number = -Infinity;
    for (let k: number = 0; k < depths.length; k++) {
      depth = Math.max(depth, depths[k]!);
      grows = Math.max(grows, Math.min(depths[k]!, room[k]!));
    }
    return { depth, base: -grows };
  }

  /**
   * How far any point of each segment of a body moved from a motion's first
   * grid instant to each later one, at most.
   *
   * @param m The body's model.
   * @param frames The body's placed segments at each grid instant, in grid
   *   order.
   * @returns Per instant, per segment, metres: the sum over the grid steps
   *   before it of the segment's travel over that step; zero at the first
   *   instant. Between instants `a < b` a segment's points moved no more than
   *   its value at `b` less its value at `a`.
   */
  export function travel(
    m: M.IModel,
    frames: readonly (readonly IAutoMovieMotionHumanColliders.IPlaced[])[],
  ): Float64Array[] {
    const out: Float64Array[] = [];
    for (let k: number = 0; k < frames.length; k++) {
      const sum: Float64Array = new Float64Array(m.parts.length);
      if (k > 0) {
        const before: Float64Array = out[k - 1]!;
        for (let s: number = 0; s < m.parts.length; s++) {
          const a: IAutoMovieMotionHumanColliders.IPlaced = frames[k - 1]![s]!;
          const b: IAutoMovieMotionHumanColliders.IPlaced = frames[k]![s]!;
          const turn: IAutoMovieQuaternion = Quaternion.multiply(
            b.pose.rotation,
            Quaternion.inverse(a.pose.rotation),
          );
          sum[s] =
            before[s]! +
            Vector3.distance(a.pose.position, b.pose.position) +
            2 * Math.hypot(turn.x, turn.y, turn.z) * m.parts[s]!.extent;
        }
      }
      out.push(sum);
    }
    return out;
  }
}
.IModel,
    frames: readonly (readonly IAutoMovieMotionHumanColliders.IPlaced[])[],
  ): Float64Array[] {
    const out: Float64Array[] = [];
    for (let k: number = 0; k < frames.length; k++) {
      const sum: Float64Array = new Float64Array(m.parts.length);
      if (k > 0) {
        const before: Float64Array = out[k - 1]!;
        for (let s: number = 0; s < m.parts.length; s++) {
          const a: IAutoMovieMotionHumanColliders.IPlaced = frames[k - 1]![s]!;
          const b: IAutoMovieMotionHumanColliders.IPlaced = frames[k]![s]!;
          const turn: IAutoMovieQuaternion = Quaternion.multiply(
            b.pose.rotation,
            Quaternion.inverse(a.pose.rotation),
          );
          sum[s] =
            before[s]! +
            Vector3.distance(a.pose.position, b.pose.position) +
            2 * Math.hypot(turn.x, turn.y, turn.z) * m.parts[s]!.extent;
        }
      }
      out.push(sum);
    }
    return out;
  }
}
,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditTangle,
  IAutoMovieMotionHumanColliders,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanLinkCertificate } from "../posture/HumanLinkCertificate";
import { AutoMovieMotionHumanAuditTangleModel as M } from "./AutoMovieMotionHumanAuditTangleModel";
import { prepareAutoMovieMotionHumanAuditDepths } from "./prepareAutoMovieMotionHumanAuditDepths";

/** The record of `IAcrossResult`'s site. */
type IAcrossResult = { depth: number; base: number };

/** The record of `IOwnResult`'s site. */
type IOwnResult = { excess: number; base: number };

/** The record of `IEnteringReading`'s site. */
type IEnteringReading = { depth: number; base: number };

/** The record of `IEnteringRead`'s site. */
type IEnteringRead = {
  due: (index: number) => boolean;
  heard: (index: number, base: number, apart: boolean, depth: number) => void;
};

/** The record of `IWithinBackward`'s site. */
type IWithinBackward = { excess: number; base: number };

/** The record of `IWithinForward`'s site. */
type IWithinForward = { excess: number; base: number };

/** The record of `IWithinRead`'s site. */
type IWithinRead = {
  due: (index: number) => boolean;
  heard: (index: number, base: number, apart: boolean, depth: number) => void;
};

/**
 * What lets the penetration audits (`AutoMovieMotionHumanAuditTangle` of one
 * body, `AutoMovieMotionHumanAuditPartner` of two) leave a pair of segments
 * unread at the grid instants a reading certifies, by conservative advancement
 * (`advanceAutoMovieGrid`): a pair's margin, how far its depth can still grow
 * before a reading of it could change the audit's record, and each segment's
 * travel, how far any point of it can move between two grid instants.
 *
 * A probe's depth in a segment, zero outside, is the distance to the segment's
 * surface from inside, so it grows no faster than the probe and the segment's
 * surface move toward each other. Its room
 * (`prepareAutoMovieMotionHumanAuditDepths`), the most over the segment's
 * shapes of a bounding sphere's radius less the probe's distance from its
 * centre, bounds the depth from above and moves no faster either. So a probe
 * read at depth `d` with room `r` lies, an instant later, no deeper than the
 * lesser of `d` and `r` plus the two segments' travel between the instants; a
 * pair whose every probe stays at or below the depth the audit has already
 * recorded for it adds nothing there, which is the margin. A pair whose
 * bounding spheres do not meet is not read at all, and its spheres stay apart
 * while the two segments travel less than the gap between them (each sphere's
 * centre lies within its segment's extent), so that gap is its margin. The
 * travel of a segment between two neighbouring grid instants is the distance
 * its origin moved plus its extent (`IPart.extent`) times the chord of the
 * angle it turned (a rigid motion moves a point `x` from the origin by the
 * origin's move plus `(R2 - R1) x`, whose length is at most `2 sin(angle / 2)
 *
 * |x|`); summed over the steps between two instants it bounds how far any of
 *
 * Its points moved between them, by the triangle inequality. The poses are the
 * motion's own on its grid, read anyway by the audit, so the bound is measured,
 * never estimated.
 */
export namespace AutoMovieMotionHumanAuditTangleMargin {
  /**
   * A nanometre, metres: below it a depth is the rounding of the two frames,
   * and no pair is recorded.
   */
  export const NANOMETRE: number = 1e-9;

  /**
   * Every pair of segments of one placed pose of a body that pass into each
   * other beyond their reference depths, each once with the deeper direction:
   * the reading of `AutoMovieMotionHumanAuditTangle.pose`.
   *
   * A caller that certifies pairs across the instants of a motion passes
   * `read`: a pair whose index (`i * parts + j`, `i < j`) is not `due` is not
   * read, and every pair read is `heard`: with `apart`, the gap between its
   * bounding spheres, which is its margin, when they do not meet; otherwise
   * with its base (the lesser of its two directions' `own` bases) and the depth
   * it read, less any allowance, whether or not it passed into the other. The
   * pair's record is the greatest such depth above the nanometre.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param skip Unordered pair keys not to read.
   * @param pressed Unordered pair keys read only beyond a depth, metres.
   * @param key The unordered pair key
   *   (`AutoMovieMotionHumanAuditTangle.unordered`).
   * @param read The certifying caller's gate and listener; every pair within
   *   reach is read when absent.
   * @returns The pairs, `a` the segment whose probe lies deeper, with `seconds`
   *   zero.
   */
  export function within(
    m: import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditTangle,
  IAutoMovieMotionHumanColliders,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanLinkCertificate } from "../posture/HumanLinkCertificate";
import { AutoMovieMotionHumanAuditTangleModel as M } from "./AutoMovieMotionHumanAuditTangleModel";
import { prepareAutoMovieMotionHumanAuditDepths } from "./prepareAutoMovieMotionHumanAuditDepths";

/** The record of `IAcrossResult`'s site. */
type IAcrossResult = { depth: number; base: number };

/** The record of `IOwnResult`'s site. */
type IOwnResult = { excess: number; base: number };

/** The record of `IEnteringReading`'s site. */
type IEnteringReading = { depth: number; base: number };

/** The record of `IEnteringRead`'s site. */
type IEnteringRead = {
  due: (index: number) => boolean;
  heard: (index: number, base: number, apart: boolean, depth: number) => void;
};

/** The record of `IWithinBackward`'s site. */
type IWithinBackward = { excess: number; base: number };

/** The record of `IWithinForward`'s site. */
type IWithinForward = { excess: number; base: number };

/** The record of `IWithinRead`'s site. */
type IWithinRead = {
  due: (index: number) => boolean;
  heard: (index: number, base: number, apart: boolean, depth: number) => void;
};

/**
 * What lets the penetration audits (`AutoMovieMotionHumanAuditTangle` of one
 * body, `AutoMovieMotionHumanAuditPartner` of two) leave a pair of segments
 * unread at the grid instants a reading certifies, by conservative advancement
 * (`advanceAutoMovieGrid`): a pair's margin, how far its depth can still grow
 * before a reading of it could change the audit's record, and each segment's
 * travel, how far any point of it can move between two grid instants.
 *
 * A probe's depth in a segment, zero outside, is the distance to the segment's
 * surface from inside, so it grows no faster than the probe and the segment's
 * surface move toward each other. Its room
 * (`prepareAutoMovieMotionHumanAuditDepths`), the most over the segment's
 * shapes of a bounding sphere's radius less the probe's distance from its
 * centre, bounds the depth from above and moves no faster either. So a probe
 * read at depth `d` with room `r` lies, an instant later, no deeper than the
 * lesser of `d` and `r` plus the two segments' travel between the instants; a
 * pair whose every probe stays at or below the depth the audit has already
 * recorded for it adds nothing there, which is the margin. A pair whose
 * bounding spheres do not meet is not read at all, and its spheres stay apart
 * while the two segments travel less than the gap between them (each sphere's
 * centre lies within its segment's extent), so that gap is its margin. The
 * travel of a segment between two neighbouring grid instants is the distance
 * its origin moved plus its extent (`IPart.extent`) times the chord of the
 * angle it turned (a rigid motion moves a point `x` from the origin by the
 * origin's move plus `(R2 - R1) x`, whose length is at most `2 sin(angle / 2)
 *
 * |x|`); summed over the steps between two instants it bounds how far any of
 *
 * Its points moved between them, by the triangle inequality. The poses are the
 * motion's own on its grid, read anyway by the audit, so the bound is measured,
 * never estimated.
 */
export namespace AutoMovieMotionHumanAuditTangleMargin {
  /**
   * A nanometre, metres: below it a depth is the rounding of the two frames,
   * and no pair is recorded.
   */
  export const NANOMETRE: number = 1e-9;

  /**
   * Every pair of segments of one placed pose of a body that pass into each
   * other beyond their reference depths, each once with the deeper direction:
   * the reading of `AutoMovieMotionHumanAuditTangle.pose`.
   *
   * A caller that certifies pairs across the instants of a motion passes
   * `read`: a pair whose index (`i * parts + j`, `i < j`) is not `due` is not
   * read, and every pair read is `heard`: with `apart`, the gap between its
   * bounding spheres, which is its margin, when they do not meet; otherwise
   * with its base (the lesser of its two directions' `own` bases) and the depth
   * it read, less any allowance, whether or not it passed into the other. The
   * pair's record is the greatest such depth above the nanometre.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param skip Unordered pair keys not to read.
   * @param pressed Unordered pair keys read only beyond a depth, metres.
   * @param key The unordered pair key
   *   (`AutoMovieMotionHumanAuditTangle.unordered`).
   * @param read The certifying caller's gate and listener; every pair within
   *   reach is read when absent.
   * @returns The pairs, `a` the segment whose probe lies deeper, with `seconds`
   *   zero.
   */
  export function within(
    m: M.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    skip: ReadonlySet<string>,
    pressed: ReadonlyMap<string, number>,
    key: (a: AutoMovieHumanoidBone, b: AutoMovieHumanoidBone) => string,
    read?: IWithinRead,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    const out: IAutoMovieMotionHumanAuditTangle.IPair[] = [];
    const centres: IAutoMovieVector3[] = placed.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        i: number,
      ): IAutoMovieVector3 => M.centre(p, m.parts[i]!),
    );

    // Each segment read in is prepared once for this placement.
    const targets: NonNullable<Parameters<typeof M.beyond>[4]> = [];
    for (let i: number = 0; i < placed.length; i++)
      for (let j: number = i + 1; j < placed.length; j++) {
        if (m.related[i]![j]!) continue;
        const index: number = i * placed.length + j;
        if (read !== undefined && !read.due(index)) continue;

        // Two segments whose bounding spheres are apart are not read, and
        // their spheres stay apart while the two travel less than the gap
        // (each centre lies within the segment's extent), so the gap itself
        // is the margin.
        const reach: number = m.parts[i]!.radius + m.parts[j]!.radius;
        const apart: number = Vector3.distance(centres[i]!, centres[j]!);
        if (apart >= reach) {
          read?.heard(index, apart - reach, true, 0);
          continue;
        }

        // A pair's key is built only where some pair is skipped or pressed.
        if (skip.size !== 0 && skip.has(key(placed[i]!.bone, placed[j]!.bone)))
          continue;

        // Two segments their link pair's certificate shows apart hold no
        // probe of either inside the other, and none enters while the two
        // travel less than that clearance (`HumanLinkCertificate.clearance`), so
        // it is the pair's margin as the spheres' gap is.
        const clear: number = HumanLinkCertificate.clearance(
          placed[i]!,
          m.parts[i]!,
          placed[j]!,
          m.parts[j]!,
        );
        if (clear > 0) {
          read?.heard(index, clear, true, 0);
          continue;
        }
        const forward: IWithinForward = own(m, placed, i, j, targets);
        const backward: IWithinBackward = own(m, placed, j, i, targets);
        const depth: number =
          Math.max(forward.excess, backward.excess) -
          (pressed.size === 0
            ? 0
            : (pressed.get(key(placed[i]!.bone, placed[j]!.bone)) ?? 0));
        read?.heard(index, Math.min(forward.base, backward.base), false, depth);
        if (depth > NANOMETRE)
          out.push({
            a: placed[forward.excess >= backward.excess ? i : j]!.bone,
            b: placed[forward.excess >= backward.excess ? j : i]!.bone,
            depth,
            seconds: 0,
          });
      }
    return out;
  }

  /**
   * Every segment of one placed body that passes into a segment of another, at
   * its full depth: the reading of `AutoMovieMotionHumanAuditTangle.across` on
   * segments already placed.
   *
   * A caller that certifies pairs across the instants of a motion
   * (`AutoMovieMotionHumanAuditPartner`) passes `read`: a pair whose index (`i
   *
   * - Other's parts + j`) is not `due`is not read, and every pair read
   *   is`heard`as`within`hears it, its base being`across`'s.
   *
   * @param m The model of the body whose probes are read.
   * @param mine Its placed segments.
   * @param o The model of the body they are read against.
   * @param theirs That body's placed segments.
   * @param read The certifying caller's gate and listener; every pair within
   *   reach is read when absent.
   * @returns The pairs, `a` of the first body in `b` of the other, with
   *   `seconds` zero.
   */
  export function entering(
    m: M.IModel,
    mine: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    o: M.IModel,
    theirs: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    read?: IEnteringRead,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    const out: IAutoMovieMotionHumanAuditTangle.IPair[] = [];
    const near: IAutoMovieVector3[] = mine.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        i: number,
      ): IAutoMovieVector3 => M.centre(p, m.parts[i]!),
    );
    const far: IAutoMovieVector3[] = theirs.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        j: number,
      ): IAutoMovieVector3 => M.centre(p, o.parts[j]!),
    );

    // Each of the other body's segments is prepared once for this placement.
    const targets: NonNullable<Parameters<typeof M.beyond>[4]> = [];
    for (let i: number = 0; i < mine.length; i++)
      for (let j: number = 0; j < theirs.length; j++) {
        const index: number = i * theirs.length + j;
        if (read !== undefined && !read.due(index)) continue;

        // Bounding spheres apart: the gap itself is the margin (`within`).
        const reach: number = m.parts[i]!.radius + o.parts[j]!.radius;
        const apart: number = Vector3.distance(near[i]!, far[j]!);
        if (apart >= reach) {
          read?.heard(index, apart - reach, true, 0);
          continue;
        }
        const clear: number = HumanLinkCertificate.clearance(
          mine[i]!,
          m.parts[i]!,
          theirs[j]!,
          o.parts[j]!,
        );
        if (clear > 0) {
          read?.heard(index, clear, true, 0);
          continue;
        }
        const reading: IEnteringReading = across(
          m.parts[i]!.probes,
          mine[i]!,
          (targets[j] ??= prepareAutoMovieMotionHumanAuditDepths(theirs[j]!)),
        );
        read?.heard(index, reading.base, false, reading.depth);
        if (reading.depth > NANOMETRE)
          out.push({
            a: mine[i]!.bone,
            b: theirs[j]!.bone,
            depth: reading.depth,
            seconds: 0,
          });
      }
    return out;
  }

  /**
   * How deep segment `i`'s probes lie in segment `j` of the same body beyond
   * their reference depths, and how far that can grow before it exceeds a depth
   * already recorded.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param i The segment whose probes are read.
   * @param j The segment they are read in.
   * @param targets The caller's list of prepared segments for this reading of
   *   `placed` (`AutoMovieMotionHumanAuditTangleModel.beyond`).
   * @returns `excess`, the model's `excess` of the pair, metres, zero when no
   *   probe lies deeper than its reference; `base`, metres, such that while the
   *   two segments travel less than `base + K` the excess stays at or below any
   *   `K` of zero or more.
   */
  export function own(
    m: M.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    i: number,
    j: number,
    targets: Parameters<typeof M.beyond>[4],
  ): IOwnResult {
    const room: Float64Array = new Float64Array(m.parts[i]!.probes.length);
    const over: Float64Array = M.beyond(m, placed, i, j, targets, room);
    const reference: Float64Array = M.reference(m, i, j);
    let excess: number = 0;
    let grows: number = -Infinity;
    for (let k: number = 0; k < over.length; k++) {
      excess = Math.max(excess, over[k]!);

      // How far above its reference the probe can be read now: its excess,
      // and never above its room less the reference.
      grows = Math.max(grows, Math.min(over[k]!, room[k]! - reference[k]!));
    }
    return { excess, base: -grows };
  }

  /**
   * How deep segment `i` of one body's probes lie in a segment of another body,
   * which shares no reference with it, and how far that can grow before it
   * exceeds a depth already recorded.
   *
   * @param probes Segment `i`'s probes, in its frame.
   * @param mine Segment `i` as placed.
   * @param read The other segment's prepared depth reader for this pose.
   * @returns `depth`, metres, the deepest probe, zero outside; `base`, metres,
   *   such that while the two segments travel less than `base + K` the depth
   *   stays at or below any `K` of zero or more.
   */
  export function across(
    probes: readonly IAutoMovieVector3[],
    mine: IAutoMovieMotionHumanColliders.IPlaced,
    read: ReturnType<typeof prepareAutoMovieMotionHumanAuditDepths>,
  ): IAcrossResult {
    const room: Float64Array = new Float64Array(probes.length);
    const depths: Float64Array = read(probes, mine, room);
    let depth: number = 0;
    let grows: number = -Infinity;
    for (let k: number = 0; k < depths.length; k++) {
      depth = Math.max(depth, depths[k]!);
      grows = Math.max(grows, Math.min(depths[k]!, room[k]!));
    }
    return { depth, base: -grows };
  }

  /**
   * How far any point of each segment of a body moved from a motion's first
   * grid instant to each later one, at most.
   *
   * @param m The body's model.
   * @param frames The body's placed segments at each grid instant, in grid
   *   order.
   * @returns Per instant, per segment, metres: the sum over the grid steps
   *   before it of the segment's travel over that step; zero at the first
   *   instant. Between instants `a < b` a segment's points moved no more than
   *   its value at `b` less its value at `a`.
   */
  export function travel(
    m: M.IModel,
    frames: readonly (readonly IAutoMovieMotionHumanColliders.IPlaced[])[],
  ): Float64Array[] {
    const out: Float64Array[] = [];
    for (let k: number = 0; k < frames.length; k++) {
      const sum: Float64Array = new Float64Array(m.parts.length);
      if (k > 0) {
        const before: Float64Array = out[k - 1]!;
        for (let s: number = 0; s < m.parts.length; s++) {
          const a: IAutoMovieMotionHumanColliders.IPlaced = frames[k - 1]![s]!;
          const b: IAutoMovieMotionHumanColliders.IPlaced = frames[k]![s]!;
          const turn: IAutoMovieQuaternion = Quaternion.multiply(
            b.pose.rotation,
            Quaternion.inverse(a.pose.rotation),
          );
          sum[s] =
            before[s]! +
            Vector3.distance(a.pose.position, b.pose.position) +
            2 * Math.hypot(turn.x, turn.y, turn.z) * m.parts[s]!.extent;
        }
      }
      out.push(sum);
    }
    return out;
  }
}
.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    skip: ReadonlySet<string>,
    pressed: ReadonlyMap<string, number>,
    key: (a: AutoMovieHumanoidBone, b: AutoMovieHumanoidBone) => string,
    read?: IWithinRead,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    const out: IAutoMovieMotionHumanAuditTangle.IPair[] = [];
    const centres: IAutoMovieVector3[] = placed.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        i: number,
      ): IAutoMovieVector3 => M.centre(p, m.parts[i]!),
    );

    // Each segment read in is prepared once for this placement.
    const targets: NonNullable<Parameters<typeof M.beyond>[4]> = [];
    for (let i: number = 0; i < placed.length; i++)
      for (let j: number = i + 1; j < placed.length; j++) {
        if (m.related[i]![j]!) continue;
        const index: number = i * placed.length + j;
        if (read !== undefined && !read.due(index)) continue;

        // Two segments whose bounding spheres are apart are not read, and
        // their spheres stay apart while the two travel less than the gap
        // (each centre lies within the segment's extent), so the gap itself
        // is the margin.
        const reach: number = m.parts[i]!.radius + m.parts[j]!.radius;
        const apart: number = Vector3.distance(centres[i]!, centres[j]!);
        if (apart >= reach) {
          read?.heard(index, apart - reach, true, 0);
          continue;
        }

        // A pair's key is built only where some pair is skipped or pressed.
        if (skip.size !== 0 && skip.has(key(placed[i]!.bone, placed[j]!.bone)))
          continue;

        // Two segments their link pair's certificate shows apart hold no
        // probe of either inside the other, and none enters while the two
        // travel less than that clearance (`HumanLinkCertificate.clearance`), so
        // it is the pair's margin as the spheres' gap is.
        const clear: number = HumanLinkCertificate.clearance(
          placed[i]!,
          m.parts[i]!,
          placed[j]!,
          m.parts[j]!,
        );
        if (clear > 0) {
          read?.heard(index, clear, true, 0);
          continue;
        }
        const forward: IWithinForward = own(m, placed, i, j, targets);
        const backward: IWithinBackward = own(m, placed, j, i, targets);
        const depth: number =
          Math.max(forward.excess, backward.excess) -
          (pressed.size === 0
            ? 0
            : (pressed.get(key(placed[i]!.bone, placed[j]!.bone)) ?? 0));
        read?.heard(index, Math.min(forward.base, backward.base), false, depth);
        if (depth > NANOMETRE)
          out.push({
            a: placed[forward.excess >= backward.excess ? i : j]!.bone,
            b: placed[forward.excess >= backward.excess ? j : i]!.bone,
            depth,
            seconds: 0,
          });
      }
    return out;
  }

  /**
   * Every segment of one placed body that passes into a segment of another, at
   * its full depth: the reading of `AutoMovieMotionHumanAuditTangle.across` on
   * segments already placed.
   *
   * A caller that certifies pairs across the instants of a motion
   * (`AutoMovieMotionHumanAuditPartner`) passes `read`: a pair whose index (`i
   *
   * - Other's parts + j`) is not `due`is not read, and every pair read
   *   is`heard`as`within`hears it, its base being`across`'s.
   *
   * @param m The model of the body whose probes are read.
   * @param mine Its placed segments.
   * @param o The model of the body they are read against.
   * @param theirs That body's placed segments.
   * @param read The certifying caller's gate and listener; every pair within
   *   reach is read when absent.
   * @returns The pairs, `a` of the first body in `b` of the other, with
   *   `seconds` zero.
   */
  export function entering(
    m: import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditTangle,
  IAutoMovieMotionHumanColliders,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanLinkCertificate } from "../posture/HumanLinkCertificate";
import { AutoMovieMotionHumanAuditTangleModel as M } from "./AutoMovieMotionHumanAuditTangleModel";
import { prepareAutoMovieMotionHumanAuditDepths } from "./prepareAutoMovieMotionHumanAuditDepths";

/** The record of `IAcrossResult`'s site. */
type IAcrossResult = { depth: number; base: number };

/** The record of `IOwnResult`'s site. */
type IOwnResult = { excess: number; base: number };

/** The record of `IEnteringReading`'s site. */
type IEnteringReading = { depth: number; base: number };

/** The record of `IEnteringRead`'s site. */
type IEnteringRead = {
  due: (index: number) => boolean;
  heard: (index: number, base: number, apart: boolean, depth: number) => void;
};

/** The record of `IWithinBackward`'s site. */
type IWithinBackward = { excess: number; base: number };

/** The record of `IWithinForward`'s site. */
type IWithinForward = { excess: number; base: number };

/** The record of `IWithinRead`'s site. */
type IWithinRead = {
  due: (index: number) => boolean;
  heard: (index: number, base: number, apart: boolean, depth: number) => void;
};

/**
 * What lets the penetration audits (`AutoMovieMotionHumanAuditTangle` of one
 * body, `AutoMovieMotionHumanAuditPartner` of two) leave a pair of segments
 * unread at the grid instants a reading certifies, by conservative advancement
 * (`advanceAutoMovieGrid`): a pair's margin, how far its depth can still grow
 * before a reading of it could change the audit's record, and each segment's
 * travel, how far any point of it can move between two grid instants.
 *
 * A probe's depth in a segment, zero outside, is the distance to the segment's
 * surface from inside, so it grows no faster than the probe and the segment's
 * surface move toward each other. Its room
 * (`prepareAutoMovieMotionHumanAuditDepths`), the most over the segment's
 * shapes of a bounding sphere's radius less the probe's distance from its
 * centre, bounds the depth from above and moves no faster either. So a probe
 * read at depth `d` with room `r` lies, an instant later, no deeper than the
 * lesser of `d` and `r` plus the two segments' travel between the instants; a
 * pair whose every probe stays at or below the depth the audit has already
 * recorded for it adds nothing there, which is the margin. A pair whose
 * bounding spheres do not meet is not read at all, and its spheres stay apart
 * while the two segments travel less than the gap between them (each sphere's
 * centre lies within its segment's extent), so that gap is its margin. The
 * travel of a segment between two neighbouring grid instants is the distance
 * its origin moved plus its extent (`IPart.extent`) times the chord of the
 * angle it turned (a rigid motion moves a point `x` from the origin by the
 * origin's move plus `(R2 - R1) x`, whose length is at most `2 sin(angle / 2)
 *
 * |x|`); summed over the steps between two instants it bounds how far any of
 *
 * Its points moved between them, by the triangle inequality. The poses are the
 * motion's own on its grid, read anyway by the audit, so the bound is measured,
 * never estimated.
 */
export namespace AutoMovieMotionHumanAuditTangleMargin {
  /**
   * A nanometre, metres: below it a depth is the rounding of the two frames,
   * and no pair is recorded.
   */
  export const NANOMETRE: number = 1e-9;

  /**
   * Every pair of segments of one placed pose of a body that pass into each
   * other beyond their reference depths, each once with the deeper direction:
   * the reading of `AutoMovieMotionHumanAuditTangle.pose`.
   *
   * A caller that certifies pairs across the instants of a motion passes
   * `read`: a pair whose index (`i * parts + j`, `i < j`) is not `due` is not
   * read, and every pair read is `heard`: with `apart`, the gap between its
   * bounding spheres, which is its margin, when they do not meet; otherwise
   * with its base (the lesser of its two directions' `own` bases) and the depth
   * it read, less any allowance, whether or not it passed into the other. The
   * pair's record is the greatest such depth above the nanometre.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param skip Unordered pair keys not to read.
   * @param pressed Unordered pair keys read only beyond a depth, metres.
   * @param key The unordered pair key
   *   (`AutoMovieMotionHumanAuditTangle.unordered`).
   * @param read The certifying caller's gate and listener; every pair within
   *   reach is read when absent.
   * @returns The pairs, `a` the segment whose probe lies deeper, with `seconds`
   *   zero.
   */
  export function within(
    m: M.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    skip: ReadonlySet<string>,
    pressed: ReadonlyMap<string, number>,
    key: (a: AutoMovieHumanoidBone, b: AutoMovieHumanoidBone) => string,
    read?: IWithinRead,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    const out: IAutoMovieMotionHumanAuditTangle.IPair[] = [];
    const centres: IAutoMovieVector3[] = placed.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        i: number,
      ): IAutoMovieVector3 => M.centre(p, m.parts[i]!),
    );

    // Each segment read in is prepared once for this placement.
    const targets: NonNullable<Parameters<typeof M.beyond>[4]> = [];
    for (let i: number = 0; i < placed.length; i++)
      for (let j: number = i + 1; j < placed.length; j++) {
        if (m.related[i]![j]!) continue;
        const index: number = i * placed.length + j;
        if (read !== undefined && !read.due(index)) continue;

        // Two segments whose bounding spheres are apart are not read, and
        // their spheres stay apart while the two travel less than the gap
        // (each centre lies within the segment's extent), so the gap itself
        // is the margin.
        const reach: number = m.parts[i]!.radius + m.parts[j]!.radius;
        const apart: number = Vector3.distance(centres[i]!, centres[j]!);
        if (apart >= reach) {
          read?.heard(index, apart - reach, true, 0);
          continue;
        }

        // A pair's key is built only where some pair is skipped or pressed.
        if (skip.size !== 0 && skip.has(key(placed[i]!.bone, placed[j]!.bone)))
          continue;

        // Two segments their link pair's certificate shows apart hold no
        // probe of either inside the other, and none enters while the two
        // travel less than that clearance (`HumanLinkCertificate.clearance`), so
        // it is the pair's margin as the spheres' gap is.
        const clear: number = HumanLinkCertificate.clearance(
          placed[i]!,
          m.parts[i]!,
          placed[j]!,
          m.parts[j]!,
        );
        if (clear > 0) {
          read?.heard(index, clear, true, 0);
          continue;
        }
        const forward: IWithinForward = own(m, placed, i, j, targets);
        const backward: IWithinBackward = own(m, placed, j, i, targets);
        const depth: number =
          Math.max(forward.excess, backward.excess) -
          (pressed.size === 0
            ? 0
            : (pressed.get(key(placed[i]!.bone, placed[j]!.bone)) ?? 0));
        read?.heard(index, Math.min(forward.base, backward.base), false, depth);
        if (depth > NANOMETRE)
          out.push({
            a: placed[forward.excess >= backward.excess ? i : j]!.bone,
            b: placed[forward.excess >= backward.excess ? j : i]!.bone,
            depth,
            seconds: 0,
          });
      }
    return out;
  }

  /**
   * Every segment of one placed body that passes into a segment of another, at
   * its full depth: the reading of `AutoMovieMotionHumanAuditTangle.across` on
   * segments already placed.
   *
   * A caller that certifies pairs across the instants of a motion
   * (`AutoMovieMotionHumanAuditPartner`) passes `read`: a pair whose index (`i
   *
   * - Other's parts + j`) is not `due`is not read, and every pair read
   *   is`heard`as`within`hears it, its base being`across`'s.
   *
   * @param m The model of the body whose probes are read.
   * @param mine Its placed segments.
   * @param o The model of the body they are read against.
   * @param theirs That body's placed segments.
   * @param read The certifying caller's gate and listener; every pair within
   *   reach is read when absent.
   * @returns The pairs, `a` of the first body in `b` of the other, with
   *   `seconds` zero.
   */
  export function entering(
    m: M.IModel,
    mine: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    o: M.IModel,
    theirs: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    read?: IEnteringRead,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    const out: IAutoMovieMotionHumanAuditTangle.IPair[] = [];
    const near: IAutoMovieVector3[] = mine.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        i: number,
      ): IAutoMovieVector3 => M.centre(p, m.parts[i]!),
    );
    const far: IAutoMovieVector3[] = theirs.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        j: number,
      ): IAutoMovieVector3 => M.centre(p, o.parts[j]!),
    );

    // Each of the other body's segments is prepared once for this placement.
    const targets: NonNullable<Parameters<typeof M.beyond>[4]> = [];
    for (let i: number = 0; i < mine.length; i++)
      for (let j: number = 0; j < theirs.length; j++) {
        const index: number = i * theirs.length + j;
        if (read !== undefined && !read.due(index)) continue;

        // Bounding spheres apart: the gap itself is the margin (`within`).
        const reach: number = m.parts[i]!.radius + o.parts[j]!.radius;
        const apart: number = Vector3.distance(near[i]!, far[j]!);
        if (apart >= reach) {
          read?.heard(index, apart - reach, true, 0);
          continue;
        }
        const clear: number = HumanLinkCertificate.clearance(
          mine[i]!,
          m.parts[i]!,
          theirs[j]!,
          o.parts[j]!,
        );
        if (clear > 0) {
          read?.heard(index, clear, true, 0);
          continue;
        }
        const reading: IEnteringReading = across(
          m.parts[i]!.probes,
          mine[i]!,
          (targets[j] ??= prepareAutoMovieMotionHumanAuditDepths(theirs[j]!)),
        );
        read?.heard(index, reading.base, false, reading.depth);
        if (reading.depth > NANOMETRE)
          out.push({
            a: mine[i]!.bone,
            b: theirs[j]!.bone,
            depth: reading.depth,
            seconds: 0,
          });
      }
    return out;
  }

  /**
   * How deep segment `i`'s probes lie in segment `j` of the same body beyond
   * their reference depths, and how far that can grow before it exceeds a depth
   * already recorded.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param i The segment whose probes are read.
   * @param j The segment they are read in.
   * @param targets The caller's list of prepared segments for this reading of
   *   `placed` (`AutoMovieMotionHumanAuditTangleModel.beyond`).
   * @returns `excess`, the model's `excess` of the pair, metres, zero when no
   *   probe lies deeper than its reference; `base`, metres, such that while the
   *   two segments travel less than `base + K` the excess stays at or below any
   *   `K` of zero or more.
   */
  export function own(
    m: M.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    i: number,
    j: number,
    targets: Parameters<typeof M.beyond>[4],
  ): IOwnResult {
    const room: Float64Array = new Float64Array(m.parts[i]!.probes.length);
    const over: Float64Array = M.beyond(m, placed, i, j, targets, room);
    const reference: Float64Array = M.reference(m, i, j);
    let excess: number = 0;
    let grows: number = -Infinity;
    for (let k: number = 0; k < over.length; k++) {
      excess = Math.max(excess, over[k]!);

      // How far above its reference the probe can be read now: its excess,
      // and never above its room less the reference.
      grows = Math.max(grows, Math.min(over[k]!, room[k]! - reference[k]!));
    }
    return { excess, base: -grows };
  }

  /**
   * How deep segment `i` of one body's probes lie in a segment of another body,
   * which shares no reference with it, and how far that can grow before it
   * exceeds a depth already recorded.
   *
   * @param probes Segment `i`'s probes, in its frame.
   * @param mine Segment `i` as placed.
   * @param read The other segment's prepared depth reader for this pose.
   * @returns `depth`, metres, the deepest probe, zero outside; `base`, metres,
   *   such that while the two segments travel less than `base + K` the depth
   *   stays at or below any `K` of zero or more.
   */
  export function across(
    probes: readonly IAutoMovieVector3[],
    mine: IAutoMovieMotionHumanColliders.IPlaced,
    read: ReturnType<typeof prepareAutoMovieMotionHumanAuditDepths>,
  ): IAcrossResult {
    const room: Float64Array = new Float64Array(probes.length);
    const depths: Float64Array = read(probes, mine, room);
    let depth: number = 0;
    let grows: number = -Infinity;
    for (let k: number = 0; k < depths.length; k++) {
      depth = Math.max(depth, depths[k]!);
      grows = Math.max(grows, Math.min(depths[k]!, room[k]!));
    }
    return { depth, base: -grows };
  }

  /**
   * How far any point of each segment of a body moved from a motion's first
   * grid instant to each later one, at most.
   *
   * @param m The body's model.
   * @param frames The body's placed segments at each grid instant, in grid
   *   order.
   * @returns Per instant, per segment, metres: the sum over the grid steps
   *   before it of the segment's travel over that step; zero at the first
   *   instant. Between instants `a < b` a segment's points moved no more than
   *   its value at `b` less its value at `a`.
   */
  export function travel(
    m: M.IModel,
    frames: readonly (readonly IAutoMovieMotionHumanColliders.IPlaced[])[],
  ): Float64Array[] {
    const out: Float64Array[] = [];
    for (let k: number = 0; k < frames.length; k++) {
      const sum: Float64Array = new Float64Array(m.parts.length);
      if (k > 0) {
        const before: Float64Array = out[k - 1]!;
        for (let s: number = 0; s < m.parts.length; s++) {
          const a: IAutoMovieMotionHumanColliders.IPlaced = frames[k - 1]![s]!;
          const b: IAutoMovieMotionHumanColliders.IPlaced = frames[k]![s]!;
          const turn: IAutoMovieQuaternion = Quaternion.multiply(
            b.pose.rotation,
            Quaternion.inverse(a.pose.rotation),
          );
          sum[s] =
            before[s]! +
            Vector3.distance(a.pose.position, b.pose.position) +
            2 * Math.hypot(turn.x, turn.y, turn.z) * m.parts[s]!.extent;
        }
      }
      out.push(sum);
    }
    return out;
  }
}
.IModel,
    mine: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    o: import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditTangle,
  IAutoMovieMotionHumanColliders,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanLinkCertificate } from "../posture/HumanLinkCertificate";
import { AutoMovieMotionHumanAuditTangleModel as M } from "./AutoMovieMotionHumanAuditTangleModel";
import { prepareAutoMovieMotionHumanAuditDepths } from "./prepareAutoMovieMotionHumanAuditDepths";

/** The record of `IAcrossResult`'s site. */
type IAcrossResult = { depth: number; base: number };

/** The record of `IOwnResult`'s site. */
type IOwnResult = { excess: number; base: number };

/** The record of `IEnteringReading`'s site. */
type IEnteringReading = { depth: number; base: number };

/** The record of `IEnteringRead`'s site. */
type IEnteringRead = {
  due: (index: number) => boolean;
  heard: (index: number, base: number, apart: boolean, depth: number) => void;
};

/** The record of `IWithinBackward`'s site. */
type IWithinBackward = { excess: number; base: number };

/** The record of `IWithinForward`'s site. */
type IWithinForward = { excess: number; base: number };

/** The record of `IWithinRead`'s site. */
type IWithinRead = {
  due: (index: number) => boolean;
  heard: (index: number, base: number, apart: boolean, depth: number) => void;
};

/**
 * What lets the penetration audits (`AutoMovieMotionHumanAuditTangle` of one
 * body, `AutoMovieMotionHumanAuditPartner` of two) leave a pair of segments
 * unread at the grid instants a reading certifies, by conservative advancement
 * (`advanceAutoMovieGrid`): a pair's margin, how far its depth can still grow
 * before a reading of it could change the audit's record, and each segment's
 * travel, how far any point of it can move between two grid instants.
 *
 * A probe's depth in a segment, zero outside, is the distance to the segment's
 * surface from inside, so it grows no faster than the probe and the segment's
 * surface move toward each other. Its room
 * (`prepareAutoMovieMotionHumanAuditDepths`), the most over the segment's
 * shapes of a bounding sphere's radius less the probe's distance from its
 * centre, bounds the depth from above and moves no faster either. So a probe
 * read at depth `d` with room `r` lies, an instant later, no deeper than the
 * lesser of `d` and `r` plus the two segments' travel between the instants; a
 * pair whose every probe stays at or below the depth the audit has already
 * recorded for it adds nothing there, which is the margin. A pair whose
 * bounding spheres do not meet is not read at all, and its spheres stay apart
 * while the two segments travel less than the gap between them (each sphere's
 * centre lies within its segment's extent), so that gap is its margin. The
 * travel of a segment between two neighbouring grid instants is the distance
 * its origin moved plus its extent (`IPart.extent`) times the chord of the
 * angle it turned (a rigid motion moves a point `x` from the origin by the
 * origin's move plus `(R2 - R1) x`, whose length is at most `2 sin(angle / 2)
 *
 * |x|`); summed over the steps between two instants it bounds how far any of
 *
 * Its points moved between them, by the triangle inequality. The poses are the
 * motion's own on its grid, read anyway by the audit, so the bound is measured,
 * never estimated.
 */
export namespace AutoMovieMotionHumanAuditTangleMargin {
  /**
   * A nanometre, metres: below it a depth is the rounding of the two frames,
   * and no pair is recorded.
   */
  export const NANOMETRE: number = 1e-9;

  /**
   * Every pair of segments of one placed pose of a body that pass into each
   * other beyond their reference depths, each once with the deeper direction:
   * the reading of `AutoMovieMotionHumanAuditTangle.pose`.
   *
   * A caller that certifies pairs across the instants of a motion passes
   * `read`: a pair whose index (`i * parts + j`, `i < j`) is not `due` is not
   * read, and every pair read is `heard`: with `apart`, the gap between its
   * bounding spheres, which is its margin, when they do not meet; otherwise
   * with its base (the lesser of its two directions' `own` bases) and the depth
   * it read, less any allowance, whether or not it passed into the other. The
   * pair's record is the greatest such depth above the nanometre.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param skip Unordered pair keys not to read.
   * @param pressed Unordered pair keys read only beyond a depth, metres.
   * @param key The unordered pair key
   *   (`AutoMovieMotionHumanAuditTangle.unordered`).
   * @param read The certifying caller's gate and listener; every pair within
   *   reach is read when absent.
   * @returns The pairs, `a` the segment whose probe lies deeper, with `seconds`
   *   zero.
   */
  export function within(
    m: M.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    skip: ReadonlySet<string>,
    pressed: ReadonlyMap<string, number>,
    key: (a: AutoMovieHumanoidBone, b: AutoMovieHumanoidBone) => string,
    read?: IWithinRead,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    const out: IAutoMovieMotionHumanAuditTangle.IPair[] = [];
    const centres: IAutoMovieVector3[] = placed.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        i: number,
      ): IAutoMovieVector3 => M.centre(p, m.parts[i]!),
    );

    // Each segment read in is prepared once for this placement.
    const targets: NonNullable<Parameters<typeof M.beyond>[4]> = [];
    for (let i: number = 0; i < placed.length; i++)
      for (let j: number = i + 1; j < placed.length; j++) {
        if (m.related[i]![j]!) continue;
        const index: number = i * placed.length + j;
        if (read !== undefined && !read.due(index)) continue;

        // Two segments whose bounding spheres are apart are not read, and
        // their spheres stay apart while the two travel less than the gap
        // (each centre lies within the segment's extent), so the gap itself
        // is the margin.
        const reach: number = m.parts[i]!.radius + m.parts[j]!.radius;
        const apart: number = Vector3.distance(centres[i]!, centres[j]!);
        if (apart >= reach) {
          read?.heard(index, apart - reach, true, 0);
          continue;
        }

        // A pair's key is built only where some pair is skipped or pressed.
        if (skip.size !== 0 && skip.has(key(placed[i]!.bone, placed[j]!.bone)))
          continue;

        // Two segments their link pair's certificate shows apart hold no
        // probe of either inside the other, and none enters while the two
        // travel less than that clearance (`HumanLinkCertificate.clearance`), so
        // it is the pair's margin as the spheres' gap is.
        const clear: number = HumanLinkCertificate.clearance(
          placed[i]!,
          m.parts[i]!,
          placed[j]!,
          m.parts[j]!,
        );
        if (clear > 0) {
          read?.heard(index, clear, true, 0);
          continue;
        }
        const forward: IWithinForward = own(m, placed, i, j, targets);
        const backward: IWithinBackward = own(m, placed, j, i, targets);
        const depth: number =
          Math.max(forward.excess, backward.excess) -
          (pressed.size === 0
            ? 0
            : (pressed.get(key(placed[i]!.bone, placed[j]!.bone)) ?? 0));
        read?.heard(index, Math.min(forward.base, backward.base), false, depth);
        if (depth > NANOMETRE)
          out.push({
            a: placed[forward.excess >= backward.excess ? i : j]!.bone,
            b: placed[forward.excess >= backward.excess ? j : i]!.bone,
            depth,
            seconds: 0,
          });
      }
    return out;
  }

  /**
   * Every segment of one placed body that passes into a segment of another, at
   * its full depth: the reading of `AutoMovieMotionHumanAuditTangle.across` on
   * segments already placed.
   *
   * A caller that certifies pairs across the instants of a motion
   * (`AutoMovieMotionHumanAuditPartner`) passes `read`: a pair whose index (`i
   *
   * - Other's parts + j`) is not `due`is not read, and every pair read
   *   is`heard`as`within`hears it, its base being`across`'s.
   *
   * @param m The model of the body whose probes are read.
   * @param mine Its placed segments.
   * @param o The model of the body they are read against.
   * @param theirs That body's placed segments.
   * @param read The certifying caller's gate and listener; every pair within
   *   reach is read when absent.
   * @returns The pairs, `a` of the first body in `b` of the other, with
   *   `seconds` zero.
   */
  export function entering(
    m: M.IModel,
    mine: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    o: M.IModel,
    theirs: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    read?: IEnteringRead,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    const out: IAutoMovieMotionHumanAuditTangle.IPair[] = [];
    const near: IAutoMovieVector3[] = mine.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        i: number,
      ): IAutoMovieVector3 => M.centre(p, m.parts[i]!),
    );
    const far: IAutoMovieVector3[] = theirs.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        j: number,
      ): IAutoMovieVector3 => M.centre(p, o.parts[j]!),
    );

    // Each of the other body's segments is prepared once for this placement.
    const targets: NonNullable<Parameters<typeof M.beyond>[4]> = [];
    for (let i: number = 0; i < mine.length; i++)
      for (let j: number = 0; j < theirs.length; j++) {
        const index: number = i * theirs.length + j;
        if (read !== undefined && !read.due(index)) continue;

        // Bounding spheres apart: the gap itself is the margin (`within`).
        const reach: number = m.parts[i]!.radius + o.parts[j]!.radius;
        const apart: number = Vector3.distance(near[i]!, far[j]!);
        if (apart >= reach) {
          read?.heard(index, apart - reach, true, 0);
          continue;
        }
        const clear: number = HumanLinkCertificate.clearance(
          mine[i]!,
          m.parts[i]!,
          theirs[j]!,
          o.parts[j]!,
        );
        if (clear > 0) {
          read?.heard(index, clear, true, 0);
          continue;
        }
        const reading: IEnteringReading = across(
          m.parts[i]!.probes,
          mine[i]!,
          (targets[j] ??= prepareAutoMovieMotionHumanAuditDepths(theirs[j]!)),
        );
        read?.heard(index, reading.base, false, reading.depth);
        if (reading.depth > NANOMETRE)
          out.push({
            a: mine[i]!.bone,
            b: theirs[j]!.bone,
            depth: reading.depth,
            seconds: 0,
          });
      }
    return out;
  }

  /**
   * How deep segment `i`'s probes lie in segment `j` of the same body beyond
   * their reference depths, and how far that can grow before it exceeds a depth
   * already recorded.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param i The segment whose probes are read.
   * @param j The segment they are read in.
   * @param targets The caller's list of prepared segments for this reading of
   *   `placed` (`AutoMovieMotionHumanAuditTangleModel.beyond`).
   * @returns `excess`, the model's `excess` of the pair, metres, zero when no
   *   probe lies deeper than its reference; `base`, metres, such that while the
   *   two segments travel less than `base + K` the excess stays at or below any
   *   `K` of zero or more.
   */
  export function own(
    m: M.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    i: number,
    j: number,
    targets: Parameters<typeof M.beyond>[4],
  ): IOwnResult {
    const room: Float64Array = new Float64Array(m.parts[i]!.probes.length);
    const over: Float64Array = M.beyond(m, placed, i, j, targets, room);
    const reference: Float64Array = M.reference(m, i, j);
    let excess: number = 0;
    let grows: number = -Infinity;
    for (let k: number = 0; k < over.length; k++) {
      excess = Math.max(excess, over[k]!);

      // How far above its reference the probe can be read now: its excess,
      // and never above its room less the reference.
      grows = Math.max(grows, Math.min(over[k]!, room[k]! - reference[k]!));
    }
    return { excess, base: -grows };
  }

  /**
   * How deep segment `i` of one body's probes lie in a segment of another body,
   * which shares no reference with it, and how far that can grow before it
   * exceeds a depth already recorded.
   *
   * @param probes Segment `i`'s probes, in its frame.
   * @param mine Segment `i` as placed.
   * @param read The other segment's prepared depth reader for this pose.
   * @returns `depth`, metres, the deepest probe, zero outside; `base`, metres,
   *   such that while the two segments travel less than `base + K` the depth
   *   stays at or below any `K` of zero or more.
   */
  export function across(
    probes: readonly IAutoMovieVector3[],
    mine: IAutoMovieMotionHumanColliders.IPlaced,
    read: ReturnType<typeof prepareAutoMovieMotionHumanAuditDepths>,
  ): IAcrossResult {
    const room: Float64Array = new Float64Array(probes.length);
    const depths: Float64Array = read(probes, mine, room);
    let depth: number = 0;
    let grows: number = -Infinity;
    for (let k: number = 0; k < depths.length; k++) {
      depth = Math.max(depth, depths[k]!);
      grows = Math.max(grows, Math.min(depths[k]!, room[k]!));
    }
    return { depth, base: -grows };
  }

  /**
   * How far any point of each segment of a body moved from a motion's first
   * grid instant to each later one, at most.
   *
   * @param m The body's model.
   * @param frames The body's placed segments at each grid instant, in grid
   *   order.
   * @returns Per instant, per segment, metres: the sum over the grid steps
   *   before it of the segment's travel over that step; zero at the first
   *   instant. Between instants `a < b` a segment's points moved no more than
   *   its value at `b` less its value at `a`.
   */
  export function travel(
    m: M.IModel,
    frames: readonly (readonly IAutoMovieMotionHumanColliders.IPlaced[])[],
  ): Float64Array[] {
    const out: Float64Array[] = [];
    for (let k: number = 0; k < frames.length; k++) {
      const sum: Float64Array = new Float64Array(m.parts.length);
      if (k > 0) {
        const before: Float64Array = out[k - 1]!;
        for (let s: number = 0; s < m.parts.length; s++) {
          const a: IAutoMovieMotionHumanColliders.IPlaced = frames[k - 1]![s]!;
          const b: IAutoMovieMotionHumanColliders.IPlaced = frames[k]![s]!;
          const turn: IAutoMovieQuaternion = Quaternion.multiply(
            b.pose.rotation,
            Quaternion.inverse(a.pose.rotation),
          );
          sum[s] =
            before[s]! +
            Vector3.distance(a.pose.position, b.pose.position) +
            2 * Math.hypot(turn.x, turn.y, turn.z) * m.parts[s]!.extent;
        }
      }
      out.push(sum);
    }
    return out;
  }
}
.IModel,
    theirs: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    read?: IEnteringRead,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    const out: IAutoMovieMotionHumanAuditTangle.IPair[] = [];
    const near: IAutoMovieVector3[] = mine.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        i: number,
      ): IAutoMovieVector3 => M.centre(p, m.parts[i]!),
    );
    const far: IAutoMovieVector3[] = theirs.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        j: number,
      ): IAutoMovieVector3 => M.centre(p, o.parts[j]!),
    );

    // Each of the other body's segments is prepared once for this placement.
    const targets: NonNullable<Parameters<typeof M.beyond>[4]> = [];
    for (let i: number = 0; i < mine.length; i++)
      for (let j: number = 0; j < theirs.length; j++) {
        const index: number = i * theirs.length + j;
        if (read !== undefined && !read.due(index)) continue;

        // Bounding spheres apart: the gap itself is the margin (`within`).
        const reach: number = m.parts[i]!.radius + o.parts[j]!.radius;
        const apart: number = Vector3.distance(near[i]!, far[j]!);
        if (apart >= reach) {
          read?.heard(index, apart - reach, true, 0);
          continue;
        }
        const clear: number = HumanLinkCertificate.clearance(
          mine[i]!,
          m.parts[i]!,
          theirs[j]!,
          o.parts[j]!,
        );
        if (clear > 0) {
          read?.heard(index, clear, true, 0);
          continue;
        }
        const reading: IEnteringReading = across(
          m.parts[i]!.probes,
          mine[i]!,
          (targets[j] ??= prepareAutoMovieMotionHumanAuditDepths(theirs[j]!)),
        );
        read?.heard(index, reading.base, false, reading.depth);
        if (reading.depth > NANOMETRE)
          out.push({
            a: mine[i]!.bone,
            b: theirs[j]!.bone,
            depth: reading.depth,
            seconds: 0,
          });
      }
    return out;
  }

  /**
   * How deep segment `i`'s probes lie in segment `j` of the same body beyond
   * their reference depths, and how far that can grow before it exceeds a depth
   * already recorded.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param i The segment whose probes are read.
   * @param j The segment they are read in.
   * @param targets The caller's list of prepared segments for this reading of
   *   `placed` (`AutoMovieMotionHumanAuditTangleModel.beyond`).
   * @returns `excess`, the model's `excess` of the pair, metres, zero when no
   *   probe lies deeper than its reference; `base`, metres, such that while the
   *   two segments travel less than `base + K` the excess stays at or below any
   *   `K` of zero or more.
   */
  export function own(
    m: import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditTangle,
  IAutoMovieMotionHumanColliders,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanLinkCertificate } from "../posture/HumanLinkCertificate";
import { AutoMovieMotionHumanAuditTangleModel as M } from "./AutoMovieMotionHumanAuditTangleModel";
import { prepareAutoMovieMotionHumanAuditDepths } from "./prepareAutoMovieMotionHumanAuditDepths";

/** The record of `IAcrossResult`'s site. */
type IAcrossResult = { depth: number; base: number };

/** The record of `IOwnResult`'s site. */
type IOwnResult = { excess: number; base: number };

/** The record of `IEnteringReading`'s site. */
type IEnteringReading = { depth: number; base: number };

/** The record of `IEnteringRead`'s site. */
type IEnteringRead = {
  due: (index: number) => boolean;
  heard: (index: number, base: number, apart: boolean, depth: number) => void;
};

/** The record of `IWithinBackward`'s site. */
type IWithinBackward = { excess: number; base: number };

/** The record of `IWithinForward`'s site. */
type IWithinForward = { excess: number; base: number };

/** The record of `IWithinRead`'s site. */
type IWithinRead = {
  due: (index: number) => boolean;
  heard: (index: number, base: number, apart: boolean, depth: number) => void;
};

/**
 * What lets the penetration audits (`AutoMovieMotionHumanAuditTangle` of one
 * body, `AutoMovieMotionHumanAuditPartner` of two) leave a pair of segments
 * unread at the grid instants a reading certifies, by conservative advancement
 * (`advanceAutoMovieGrid`): a pair's margin, how far its depth can still grow
 * before a reading of it could change the audit's record, and each segment's
 * travel, how far any point of it can move between two grid instants.
 *
 * A probe's depth in a segment, zero outside, is the distance to the segment's
 * surface from inside, so it grows no faster than the probe and the segment's
 * surface move toward each other. Its room
 * (`prepareAutoMovieMotionHumanAuditDepths`), the most over the segment's
 * shapes of a bounding sphere's radius less the probe's distance from its
 * centre, bounds the depth from above and moves no faster either. So a probe
 * read at depth `d` with room `r` lies, an instant later, no deeper than the
 * lesser of `d` and `r` plus the two segments' travel between the instants; a
 * pair whose every probe stays at or below the depth the audit has already
 * recorded for it adds nothing there, which is the margin. A pair whose
 * bounding spheres do not meet is not read at all, and its spheres stay apart
 * while the two segments travel less than the gap between them (each sphere's
 * centre lies within its segment's extent), so that gap is its margin. The
 * travel of a segment between two neighbouring grid instants is the distance
 * its origin moved plus its extent (`IPart.extent`) times the chord of the
 * angle it turned (a rigid motion moves a point `x` from the origin by the
 * origin's move plus `(R2 - R1) x`, whose length is at most `2 sin(angle / 2)
 *
 * |x|`); summed over the steps between two instants it bounds how far any of
 *
 * Its points moved between them, by the triangle inequality. The poses are the
 * motion's own on its grid, read anyway by the audit, so the bound is measured,
 * never estimated.
 */
export namespace AutoMovieMotionHumanAuditTangleMargin {
  /**
   * A nanometre, metres: below it a depth is the rounding of the two frames,
   * and no pair is recorded.
   */
  export const NANOMETRE: number = 1e-9;

  /**
   * Every pair of segments of one placed pose of a body that pass into each
   * other beyond their reference depths, each once with the deeper direction:
   * the reading of `AutoMovieMotionHumanAuditTangle.pose`.
   *
   * A caller that certifies pairs across the instants of a motion passes
   * `read`: a pair whose index (`i * parts + j`, `i < j`) is not `due` is not
   * read, and every pair read is `heard`: with `apart`, the gap between its
   * bounding spheres, which is its margin, when they do not meet; otherwise
   * with its base (the lesser of its two directions' `own` bases) and the depth
   * it read, less any allowance, whether or not it passed into the other. The
   * pair's record is the greatest such depth above the nanometre.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param skip Unordered pair keys not to read.
   * @param pressed Unordered pair keys read only beyond a depth, metres.
   * @param key The unordered pair key
   *   (`AutoMovieMotionHumanAuditTangle.unordered`).
   * @param read The certifying caller's gate and listener; every pair within
   *   reach is read when absent.
   * @returns The pairs, `a` the segment whose probe lies deeper, with `seconds`
   *   zero.
   */
  export function within(
    m: M.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    skip: ReadonlySet<string>,
    pressed: ReadonlyMap<string, number>,
    key: (a: AutoMovieHumanoidBone, b: AutoMovieHumanoidBone) => string,
    read?: IWithinRead,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    const out: IAutoMovieMotionHumanAuditTangle.IPair[] = [];
    const centres: IAutoMovieVector3[] = placed.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        i: number,
      ): IAutoMovieVector3 => M.centre(p, m.parts[i]!),
    );

    // Each segment read in is prepared once for this placement.
    const targets: NonNullable<Parameters<typeof M.beyond>[4]> = [];
    for (let i: number = 0; i < placed.length; i++)
      for (let j: number = i + 1; j < placed.length; j++) {
        if (m.related[i]![j]!) continue;
        const index: number = i * placed.length + j;
        if (read !== undefined && !read.due(index)) continue;

        // Two segments whose bounding spheres are apart are not read, and
        // their spheres stay apart while the two travel less than the gap
        // (each centre lies within the segment's extent), so the gap itself
        // is the margin.
        const reach: number = m.parts[i]!.radius + m.parts[j]!.radius;
        const apart: number = Vector3.distance(centres[i]!, centres[j]!);
        if (apart >= reach) {
          read?.heard(index, apart - reach, true, 0);
          continue;
        }

        // A pair's key is built only where some pair is skipped or pressed.
        if (skip.size !== 0 && skip.has(key(placed[i]!.bone, placed[j]!.bone)))
          continue;

        // Two segments their link pair's certificate shows apart hold no
        // probe of either inside the other, and none enters while the two
        // travel less than that clearance (`HumanLinkCertificate.clearance`), so
        // it is the pair's margin as the spheres' gap is.
        const clear: number = HumanLinkCertificate.clearance(
          placed[i]!,
          m.parts[i]!,
          placed[j]!,
          m.parts[j]!,
        );
        if (clear > 0) {
          read?.heard(index, clear, true, 0);
          continue;
        }
        const forward: IWithinForward = own(m, placed, i, j, targets);
        const backward: IWithinBackward = own(m, placed, j, i, targets);
        const depth: number =
          Math.max(forward.excess, backward.excess) -
          (pressed.size === 0
            ? 0
            : (pressed.get(key(placed[i]!.bone, placed[j]!.bone)) ?? 0));
        read?.heard(index, Math.min(forward.base, backward.base), false, depth);
        if (depth > NANOMETRE)
          out.push({
            a: placed[forward.excess >= backward.excess ? i : j]!.bone,
            b: placed[forward.excess >= backward.excess ? j : i]!.bone,
            depth,
            seconds: 0,
          });
      }
    return out;
  }

  /**
   * Every segment of one placed body that passes into a segment of another, at
   * its full depth: the reading of `AutoMovieMotionHumanAuditTangle.across` on
   * segments already placed.
   *
   * A caller that certifies pairs across the instants of a motion
   * (`AutoMovieMotionHumanAuditPartner`) passes `read`: a pair whose index (`i
   *
   * - Other's parts + j`) is not `due`is not read, and every pair read
   *   is`heard`as`within`hears it, its base being`across`'s.
   *
   * @param m The model of the body whose probes are read.
   * @param mine Its placed segments.
   * @param o The model of the body they are read against.
   * @param theirs That body's placed segments.
   * @param read The certifying caller's gate and listener; every pair within
   *   reach is read when absent.
   * @returns The pairs, `a` of the first body in `b` of the other, with
   *   `seconds` zero.
   */
  export function entering(
    m: M.IModel,
    mine: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    o: M.IModel,
    theirs: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    read?: IEnteringRead,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    const out: IAutoMovieMotionHumanAuditTangle.IPair[] = [];
    const near: IAutoMovieVector3[] = mine.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        i: number,
      ): IAutoMovieVector3 => M.centre(p, m.parts[i]!),
    );
    const far: IAutoMovieVector3[] = theirs.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        j: number,
      ): IAutoMovieVector3 => M.centre(p, o.parts[j]!),
    );

    // Each of the other body's segments is prepared once for this placement.
    const targets: NonNullable<Parameters<typeof M.beyond>[4]> = [];
    for (let i: number = 0; i < mine.length; i++)
      for (let j: number = 0; j < theirs.length; j++) {
        const index: number = i * theirs.length + j;
        if (read !== undefined && !read.due(index)) continue;

        // Bounding spheres apart: the gap itself is the margin (`within`).
        const reach: number = m.parts[i]!.radius + o.parts[j]!.radius;
        const apart: number = Vector3.distance(near[i]!, far[j]!);
        if (apart >= reach) {
          read?.heard(index, apart - reach, true, 0);
          continue;
        }
        const clear: number = HumanLinkCertificate.clearance(
          mine[i]!,
          m.parts[i]!,
          theirs[j]!,
          o.parts[j]!,
        );
        if (clear > 0) {
          read?.heard(index, clear, true, 0);
          continue;
        }
        const reading: IEnteringReading = across(
          m.parts[i]!.probes,
          mine[i]!,
          (targets[j] ??= prepareAutoMovieMotionHumanAuditDepths(theirs[j]!)),
        );
        read?.heard(index, reading.base, false, reading.depth);
        if (reading.depth > NANOMETRE)
          out.push({
            a: mine[i]!.bone,
            b: theirs[j]!.bone,
            depth: reading.depth,
            seconds: 0,
          });
      }
    return out;
  }

  /**
   * How deep segment `i`'s probes lie in segment `j` of the same body beyond
   * their reference depths, and how far that can grow before it exceeds a depth
   * already recorded.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param i The segment whose probes are read.
   * @param j The segment they are read in.
   * @param targets The caller's list of prepared segments for this reading of
   *   `placed` (`AutoMovieMotionHumanAuditTangleModel.beyond`).
   * @returns `excess`, the model's `excess` of the pair, metres, zero when no
   *   probe lies deeper than its reference; `base`, metres, such that while the
   *   two segments travel less than `base + K` the excess stays at or below any
   *   `K` of zero or more.
   */
  export function own(
    m: M.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    i: number,
    j: number,
    targets: Parameters<typeof M.beyond>[4],
  ): IOwnResult {
    const room: Float64Array = new Float64Array(m.parts[i]!.probes.length);
    const over: Float64Array = M.beyond(m, placed, i, j, targets, room);
    const reference: Float64Array = M.reference(m, i, j);
    let excess: number = 0;
    let grows: number = -Infinity;
    for (let k: number = 0; k < over.length; k++) {
      excess = Math.max(excess, over[k]!);

      // How far above its reference the probe can be read now: its excess,
      // and never above its room less the reference.
      grows = Math.max(grows, Math.min(over[k]!, room[k]! - reference[k]!));
    }
    return { excess, base: -grows };
  }

  /**
   * How deep segment `i` of one body's probes lie in a segment of another body,
   * which shares no reference with it, and how far that can grow before it
   * exceeds a depth already recorded.
   *
   * @param probes Segment `i`'s probes, in its frame.
   * @param mine Segment `i` as placed.
   * @param read The other segment's prepared depth reader for this pose.
   * @returns `depth`, metres, the deepest probe, zero outside; `base`, metres,
   *   such that while the two segments travel less than `base + K` the depth
   *   stays at or below any `K` of zero or more.
   */
  export function across(
    probes: readonly IAutoMovieVector3[],
    mine: IAutoMovieMotionHumanColliders.IPlaced,
    read: ReturnType<typeof prepareAutoMovieMotionHumanAuditDepths>,
  ): IAcrossResult {
    const room: Float64Array = new Float64Array(probes.length);
    const depths: Float64Array = read(probes, mine, room);
    let depth: number = 0;
    let grows: number = -Infinity;
    for (let k: number = 0; k < depths.length; k++) {
      depth = Math.max(depth, depths[k]!);
      grows = Math.max(grows, Math.min(depths[k]!, room[k]!));
    }
    return { depth, base: -grows };
  }

  /**
   * How far any point of each segment of a body moved from a motion's first
   * grid instant to each later one, at most.
   *
   * @param m The body's model.
   * @param frames The body's placed segments at each grid instant, in grid
   *   order.
   * @returns Per instant, per segment, metres: the sum over the grid steps
   *   before it of the segment's travel over that step; zero at the first
   *   instant. Between instants `a < b` a segment's points moved no more than
   *   its value at `b` less its value at `a`.
   */
  export function travel(
    m: M.IModel,
    frames: readonly (readonly IAutoMovieMotionHumanColliders.IPlaced[])[],
  ): Float64Array[] {
    const out: Float64Array[] = [];
    for (let k: number = 0; k < frames.length; k++) {
      const sum: Float64Array = new Float64Array(m.parts.length);
      if (k > 0) {
        const before: Float64Array = out[k - 1]!;
        for (let s: number = 0; s < m.parts.length; s++) {
          const a: IAutoMovieMotionHumanColliders.IPlaced = frames[k - 1]![s]!;
          const b: IAutoMovieMotionHumanColliders.IPlaced = frames[k]![s]!;
          const turn: IAutoMovieQuaternion = Quaternion.multiply(
            b.pose.rotation,
            Quaternion.inverse(a.pose.rotation),
          );
          sum[s] =
            before[s]! +
            Vector3.distance(a.pose.position, b.pose.position) +
            2 * Math.hypot(turn.x, turn.y, turn.z) * m.parts[s]!.extent;
        }
      }
      out.push(sum);
    }
    return out;
  }
}
.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    i: number,
    j: number,
    targets: Parameters<typeof M.beyond>[4],
  ): IOwnResult {
    const room: Float64Array = new Float64Array(m.parts[i]!.probes.length);
    const over: Float64Array = M.beyond(m, placed, i, j, targets, room);
    const reference: Float64Array = M.reference(m, i, j);
    let excess: number = 0;
    let grows: number = -Infinity;
    for (let k: number = 0; k < over.length; k++) {
      excess = Math.max(excess, over[k]!);

      // How far above its reference the probe can be read now: its excess,
      // and never above its room less the reference.
      grows = Math.max(grows, Math.min(over[k]!, room[k]! - reference[k]!));
    }
    return { excess, base: -grows };
  }

  /**
   * How deep segment `i` of one body's probes lie in a segment of another body,
   * which shares no reference with it, and how far that can grow before it
   * exceeds a depth already recorded.
   *
   * @param probes Segment `i`'s probes, in its frame.
   * @param mine Segment `i` as placed.
   * @param read The other segment's prepared depth reader for this pose.
   * @returns `depth`, metres, the deepest probe, zero outside; `base`, metres,
   *   such that while the two segments travel less than `base + K` the depth
   *   stays at or below any `K` of zero or more.
   */
  export function across(
    probes: readonly IAutoMovieVector3[],
    mine: IAutoMovieMotionHumanColliders.IPlaced,
    read: ReturnType<typeof prepareAutoMovieMotionHumanAuditDepths>,
  ): IAcrossResult {
    const room: Float64Array = new Float64Array(probes.length);
    const depths: Float64Array = read(probes, mine, room);
    let depth: number = 0;
    let grows: number = -Infinity;
    for (let k: number = 0; k < depths.length; k++) {
      depth = Math.max(depth, depths[k]!);
      grows = Math.max(grows, Math.min(depths[k]!, room[k]!));
    }
    return { depth, base: -grows };
  }

  /**
   * How far any point of each segment of a body moved from a motion's first
   * grid instant to each later one, at most.
   *
   * @param m The body's model.
   * @param frames The body's placed segments at each grid instant, in grid
   *   order.
   * @returns Per instant, per segment, metres: the sum over the grid steps
   *   before it of the segment's travel over that step; zero at the first
   *   instant. Between instants `a < b` a segment's points moved no more than
   *   its value at `b` less its value at `a`.
   */
  export function travel(
    m: import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditTangle,
  IAutoMovieMotionHumanColliders,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanLinkCertificate } from "../posture/HumanLinkCertificate";
import { AutoMovieMotionHumanAuditTangleModel as M } from "./AutoMovieMotionHumanAuditTangleModel";
import { prepareAutoMovieMotionHumanAuditDepths } from "./prepareAutoMovieMotionHumanAuditDepths";

/** The record of `IAcrossResult`'s site. */
type IAcrossResult = { depth: number; base: number };

/** The record of `IOwnResult`'s site. */
type IOwnResult = { excess: number; base: number };

/** The record of `IEnteringReading`'s site. */
type IEnteringReading = { depth: number; base: number };

/** The record of `IEnteringRead`'s site. */
type IEnteringRead = {
  due: (index: number) => boolean;
  heard: (index: number, base: number, apart: boolean, depth: number) => void;
};

/** The record of `IWithinBackward`'s site. */
type IWithinBackward = { excess: number; base: number };

/** The record of `IWithinForward`'s site. */
type IWithinForward = { excess: number; base: number };

/** The record of `IWithinRead`'s site. */
type IWithinRead = {
  due: (index: number) => boolean;
  heard: (index: number, base: number, apart: boolean, depth: number) => void;
};

/**
 * What lets the penetration audits (`AutoMovieMotionHumanAuditTangle` of one
 * body, `AutoMovieMotionHumanAuditPartner` of two) leave a pair of segments
 * unread at the grid instants a reading certifies, by conservative advancement
 * (`advanceAutoMovieGrid`): a pair's margin, how far its depth can still grow
 * before a reading of it could change the audit's record, and each segment's
 * travel, how far any point of it can move between two grid instants.
 *
 * A probe's depth in a segment, zero outside, is the distance to the segment's
 * surface from inside, so it grows no faster than the probe and the segment's
 * surface move toward each other. Its room
 * (`prepareAutoMovieMotionHumanAuditDepths`), the most over the segment's
 * shapes of a bounding sphere's radius less the probe's distance from its
 * centre, bounds the depth from above and moves no faster either. So a probe
 * read at depth `d` with room `r` lies, an instant later, no deeper than the
 * lesser of `d` and `r` plus the two segments' travel between the instants; a
 * pair whose every probe stays at or below the depth the audit has already
 * recorded for it adds nothing there, which is the margin. A pair whose
 * bounding spheres do not meet is not read at all, and its spheres stay apart
 * while the two segments travel less than the gap between them (each sphere's
 * centre lies within its segment's extent), so that gap is its margin. The
 * travel of a segment between two neighbouring grid instants is the distance
 * its origin moved plus its extent (`IPart.extent`) times the chord of the
 * angle it turned (a rigid motion moves a point `x` from the origin by the
 * origin's move plus `(R2 - R1) x`, whose length is at most `2 sin(angle / 2)
 *
 * |x|`); summed over the steps between two instants it bounds how far any of
 *
 * Its points moved between them, by the triangle inequality. The poses are the
 * motion's own on its grid, read anyway by the audit, so the bound is measured,
 * never estimated.
 */
export namespace AutoMovieMotionHumanAuditTangleMargin {
  /**
   * A nanometre, metres: below it a depth is the rounding of the two frames,
   * and no pair is recorded.
   */
  export const NANOMETRE: number = 1e-9;

  /**
   * Every pair of segments of one placed pose of a body that pass into each
   * other beyond their reference depths, each once with the deeper direction:
   * the reading of `AutoMovieMotionHumanAuditTangle.pose`.
   *
   * A caller that certifies pairs across the instants of a motion passes
   * `read`: a pair whose index (`i * parts + j`, `i < j`) is not `due` is not
   * read, and every pair read is `heard`: with `apart`, the gap between its
   * bounding spheres, which is its margin, when they do not meet; otherwise
   * with its base (the lesser of its two directions' `own` bases) and the depth
   * it read, less any allowance, whether or not it passed into the other. The
   * pair's record is the greatest such depth above the nanometre.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param skip Unordered pair keys not to read.
   * @param pressed Unordered pair keys read only beyond a depth, metres.
   * @param key The unordered pair key
   *   (`AutoMovieMotionHumanAuditTangle.unordered`).
   * @param read The certifying caller's gate and listener; every pair within
   *   reach is read when absent.
   * @returns The pairs, `a` the segment whose probe lies deeper, with `seconds`
   *   zero.
   */
  export function within(
    m: M.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    skip: ReadonlySet<string>,
    pressed: ReadonlyMap<string, number>,
    key: (a: AutoMovieHumanoidBone, b: AutoMovieHumanoidBone) => string,
    read?: IWithinRead,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    const out: IAutoMovieMotionHumanAuditTangle.IPair[] = [];
    const centres: IAutoMovieVector3[] = placed.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        i: number,
      ): IAutoMovieVector3 => M.centre(p, m.parts[i]!),
    );

    // Each segment read in is prepared once for this placement.
    const targets: NonNullable<Parameters<typeof M.beyond>[4]> = [];
    for (let i: number = 0; i < placed.length; i++)
      for (let j: number = i + 1; j < placed.length; j++) {
        if (m.related[i]![j]!) continue;
        const index: number = i * placed.length + j;
        if (read !== undefined && !read.due(index)) continue;

        // Two segments whose bounding spheres are apart are not read, and
        // their spheres stay apart while the two travel less than the gap
        // (each centre lies within the segment's extent), so the gap itself
        // is the margin.
        const reach: number = m.parts[i]!.radius + m.parts[j]!.radius;
        const apart: number = Vector3.distance(centres[i]!, centres[j]!);
        if (apart >= reach) {
          read?.heard(index, apart - reach, true, 0);
          continue;
        }

        // A pair's key is built only where some pair is skipped or pressed.
        if (skip.size !== 0 && skip.has(key(placed[i]!.bone, placed[j]!.bone)))
          continue;

        // Two segments their link pair's certificate shows apart hold no
        // probe of either inside the other, and none enters while the two
        // travel less than that clearance (`HumanLinkCertificate.clearance`), so
        // it is the pair's margin as the spheres' gap is.
        const clear: number = HumanLinkCertificate.clearance(
          placed[i]!,
          m.parts[i]!,
          placed[j]!,
          m.parts[j]!,
        );
        if (clear > 0) {
          read?.heard(index, clear, true, 0);
          continue;
        }
        const forward: IWithinForward = own(m, placed, i, j, targets);
        const backward: IWithinBackward = own(m, placed, j, i, targets);
        const depth: number =
          Math.max(forward.excess, backward.excess) -
          (pressed.size === 0
            ? 0
            : (pressed.get(key(placed[i]!.bone, placed[j]!.bone)) ?? 0));
        read?.heard(index, Math.min(forward.base, backward.base), false, depth);
        if (depth > NANOMETRE)
          out.push({
            a: placed[forward.excess >= backward.excess ? i : j]!.bone,
            b: placed[forward.excess >= backward.excess ? j : i]!.bone,
            depth,
            seconds: 0,
          });
      }
    return out;
  }

  /**
   * Every segment of one placed body that passes into a segment of another, at
   * its full depth: the reading of `AutoMovieMotionHumanAuditTangle.across` on
   * segments already placed.
   *
   * A caller that certifies pairs across the instants of a motion
   * (`AutoMovieMotionHumanAuditPartner`) passes `read`: a pair whose index (`i
   *
   * - Other's parts + j`) is not `due`is not read, and every pair read
   *   is`heard`as`within`hears it, its base being`across`'s.
   *
   * @param m The model of the body whose probes are read.
   * @param mine Its placed segments.
   * @param o The model of the body they are read against.
   * @param theirs That body's placed segments.
   * @param read The certifying caller's gate and listener; every pair within
   *   reach is read when absent.
   * @returns The pairs, `a` of the first body in `b` of the other, with
   *   `seconds` zero.
   */
  export function entering(
    m: M.IModel,
    mine: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    o: M.IModel,
    theirs: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    read?: IEnteringRead,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    const out: IAutoMovieMotionHumanAuditTangle.IPair[] = [];
    const near: IAutoMovieVector3[] = mine.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        i: number,
      ): IAutoMovieVector3 => M.centre(p, m.parts[i]!),
    );
    const far: IAutoMovieVector3[] = theirs.map(
      (
        p: IAutoMovieMotionHumanColliders.IPlaced,
        j: number,
      ): IAutoMovieVector3 => M.centre(p, o.parts[j]!),
    );

    // Each of the other body's segments is prepared once for this placement.
    const targets: NonNullable<Parameters<typeof M.beyond>[4]> = [];
    for (let i: number = 0; i < mine.length; i++)
      for (let j: number = 0; j < theirs.length; j++) {
        const index: number = i * theirs.length + j;
        if (read !== undefined && !read.due(index)) continue;

        // Bounding spheres apart: the gap itself is the margin (`within`).
        const reach: number = m.parts[i]!.radius + o.parts[j]!.radius;
        const apart: number = Vector3.distance(near[i]!, far[j]!);
        if (apart >= reach) {
          read?.heard(index, apart - reach, true, 0);
          continue;
        }
        const clear: number = HumanLinkCertificate.clearance(
          mine[i]!,
          m.parts[i]!,
          theirs[j]!,
          o.parts[j]!,
        );
        if (clear > 0) {
          read?.heard(index, clear, true, 0);
          continue;
        }
        const reading: IEnteringReading = across(
          m.parts[i]!.probes,
          mine[i]!,
          (targets[j] ??= prepareAutoMovieMotionHumanAuditDepths(theirs[j]!)),
        );
        read?.heard(index, reading.base, false, reading.depth);
        if (reading.depth > NANOMETRE)
          out.push({
            a: mine[i]!.bone,
            b: theirs[j]!.bone,
            depth: reading.depth,
            seconds: 0,
          });
      }
    return out;
  }

  /**
   * How deep segment `i`'s probes lie in segment `j` of the same body beyond
   * their reference depths, and how far that can grow before it exceeds a depth
   * already recorded.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param i The segment whose probes are read.
   * @param j The segment they are read in.
   * @param targets The caller's list of prepared segments for this reading of
   *   `placed` (`AutoMovieMotionHumanAuditTangleModel.beyond`).
   * @returns `excess`, the model's `excess` of the pair, metres, zero when no
   *   probe lies deeper than its reference; `base`, metres, such that while the
   *   two segments travel less than `base + K` the excess stays at or below any
   *   `K` of zero or more.
   */
  export function own(
    m: M.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    i: number,
    j: number,
    targets: Parameters<typeof M.beyond>[4],
  ): IOwnResult {
    const room: Float64Array = new Float64Array(m.parts[i]!.probes.length);
    const over: Float64Array = M.beyond(m, placed, i, j, targets, room);
    const reference: Float64Array = M.reference(m, i, j);
    let excess: number = 0;
    let grows: number = -Infinity;
    for (let k: number = 0; k < over.length; k++) {
      excess = Math.max(excess, over[k]!);

      // How far above its reference the probe can be read now: its excess,
      // and never above its room less the reference.
      grows = Math.max(grows, Math.min(over[k]!, room[k]! - reference[k]!));
    }
    return { excess, base: -grows };
  }

  /**
   * How deep segment `i` of one body's probes lie in a segment of another body,
   * which shares no reference with it, and how far that can grow before it
   * exceeds a depth already recorded.
   *
   * @param probes Segment `i`'s probes, in its frame.
   * @param mine Segment `i` as placed.
   * @param read The other segment's prepared depth reader for this pose.
   * @returns `depth`, metres, the deepest probe, zero outside; `base`, metres,
   *   such that while the two segments travel less than `base + K` the depth
   *   stays at or below any `K` of zero or more.
   */
  export function across(
    probes: readonly IAutoMovieVector3[],
    mine: IAutoMovieMotionHumanColliders.IPlaced,
    read: ReturnType<typeof prepareAutoMovieMotionHumanAuditDepths>,
  ): IAcrossResult {
    const room: Float64Array = new Float64Array(probes.length);
    const depths: Float64Array = read(probes, mine, room);
    let depth: number = 0;
    let grows: number = -Infinity;
    for (let k: number = 0; k < depths.length; k++) {
      depth = Math.max(depth, depths[k]!);
      grows = Math.max(grows, Math.min(depths[k]!, room[k]!));
    }
    return { depth, base: -grows };
  }

  /**
   * How far any point of each segment of a body moved from a motion's first
   * grid instant to each later one, at most.
   *
   * @param m The body's model.
   * @param frames The body's placed segments at each grid instant, in grid
   *   order.
   * @returns Per instant, per segment, metres: the sum over the grid steps
   *   before it of the segment's travel over that step; zero at the first
   *   instant. Between instants `a < b` a segment's points moved no more than
   *   its value at `b` less its value at `a`.
   */
  export function travel(
    m: M.IModel,
    frames: readonly (readonly IAutoMovieMotionHumanColliders.IPlaced[])[],
  ): Float64Array[] {
    const out: Float64Array[] = [];
    for (let k: number = 0; k < frames.length; k++) {
      const sum: Float64Array = new Float64Array(m.parts.length);
      if (k > 0) {
        const before: Float64Array = out[k - 1]!;
        for (let s: number = 0; s < m.parts.length; s++) {
          const a: IAutoMovieMotionHumanColliders.IPlaced = frames[k - 1]![s]!;
          const b: IAutoMovieMotionHumanColliders.IPlaced = frames[k]![s]!;
          const turn: IAutoMovieQuaternion = Quaternion.multiply(
            b.pose.rotation,
            Quaternion.inverse(a.pose.rotation),
          );
          sum[s] =
            before[s]! +
            Vector3.distance(a.pose.position, b.pose.position) +
            2 * Math.hypot(turn.x, turn.y, turn.z) * m.parts[s]!.extent;
        }
      }
      out.push(sum);
    }
    return out;
  }
}
.IModel,
    frames: readonly (readonly IAutoMovieMotionHumanColliders.IPlaced[])[],
  ): Float64Array[] {
    const out: Float64Array[] = [];
    for (let k: number = 0; k < frames.length; k++) {
      const sum: Float64Array = new Float64Array(m.parts.length);
      if (k > 0) {
        const before: Float64Array = out[k - 1]!;
        for (let s: number = 0; s < m.parts.length; s++) {
          const a: IAutoMovieMotionHumanColliders.IPlaced = frames[k - 1]![s]!;
          const b: IAutoMovieMotionHumanColliders.IPlaced = frames[k]![s]!;
          const turn: IAutoMovieQuaternion = Quaternion.multiply(
            b.pose.rotation,
            Quaternion.inverse(a.pose.rotation),
          );
          sum[s] =
            before[s]! +
            Vector3.distance(a.pose.position, b.pose.position) +
            2 * Math.hypot(turn.x, turn.y, turn.z) * m.parts[s]!.extent;
        }
      }
      out.push(sum);
    }
    return out;
  }
}
