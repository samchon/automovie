import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditTangle,
  IAutoMovieMotionHumanColliders,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditTangleModel as M } from "./AutoMovieMotionHumanAuditTangleModel";
import { prepareAutoMovieMotionHumanAuditDepths } from "./prepareAutoMovieMotionHumanAuditDepths";

/**
 * What lets the penetration audits (`AutoMovieMotionHumanAuditTangle` of one
 * body, `AutoMovieMotionHumanAuditPartner` of two) leave a pair of segments
 * unread at the grid instants a reading certifies, by conservative
 * advancement (`advanceAutoMovieGrid`): a pair's margin, how far its depth
 * can still grow before a reading of it could change the audit's record, and
 * each segment's travel, how far any point of it can move between two grid
 * instants.
 *
 * A probe's depth in a segment, zero outside, is the distance to the
 * segment's surface from inside, so it grows no faster than the probe and
 * the segment's surface move toward each other. Its room
 * (`prepareAutoMovieMotionHumanAuditDepths`), the most over the segment's
 * shapes of a bounding sphere's radius less the probe's distance from its
 * centre, bounds the depth from above and moves no faster either. So a
 * probe read at depth `d` with room `r` lies, an instant later, no deeper
 * than the lesser of `d` and `r` plus the two segments' travel between the
 * instants; a pair whose every probe stays at or below the depth the audit
 * has already recorded for it adds nothing there, which is the margin. A
 * pair whose bounding spheres do not meet is not read at all, and its
 * spheres stay apart while the two segments travel less than the gap
 * between them (each sphere's centre lies within its segment's extent), so
 * that gap is its margin. The travel of a segment between two neighbouring grid instants is the
 * distance its origin moved plus its extent (`IPart.extent`) times the
 * chord of the angle it turned (a rigid motion moves a point `x` from the
 * origin by the origin's move plus `(R2 - R1) x`, whose length is at most
 * `2 sin(angle / 2) |x|`); summed over the steps between two instants it
 * bounds how far any of its points moved between them, by the triangle
 * inequality. The poses are the motion's own on its grid, read anyway by the
 * audit, so the bound is measured, never estimated.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the margin and the travel bound, why each holds and where the poses come from.
 * @evidence contracts/development/implementation.md#principled-implementation Conservative advancement (Mirtich 1996) on signed distances: a depth below a surface and a distance difference are each 1-Lipschitz in the relative motion of the probe and the surface, and a rigid motion's point displacement is bounded by its translation and the chord of its rotation times the point's distance from the origin.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The pose readings of one body and of two that a certifying audit gates (`within`, `entering`), one reading of a pair in one body with its margin (`own`), one of a directed pair across bodies (`across`), and one travel table; the audits own the walk over the grid.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every depth a margin is read from is the audit's own reading, and every travel is measured from the displayed poses; no tolerance widens either.
 * @evidence contracts/development/implementation.md#efficient-algorithms The margin costs one comparison per probe on the reading the audit makes anyway; the travel one translation and one rotation per segment per grid step.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the model's references and the depth reader the audit already prepared for the pose.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Pure readings returning fresh values.
 */
export namespace AutoMovieMotionHumanAuditTangleMargin {
  /**
   * A nanometre, metres: below it a depth is the rounding of the two frames,
   * and no pair is recorded.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit and what it decides.
   * @evidence contracts/development/design.md#principled-representation One length every pair reading compares a depth with.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the pair readings here and by the two audits' certificates, which must not certify past it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The audits' existing roundoff threshold, named once.
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
   * with its base (the lesser of its two directions' `own` bases) and the
   * depth it read, less any allowance, whether or not it passed into the
   * other. The pair's record is the greatest such depth above the nanometre.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param skip Unordered pair keys not to read.
   * @param pressed Unordered pair keys read only beyond a depth, metres.
   * @param key The unordered pair key (`AutoMovieMotionHumanAuditTangle.unordered`).
   * @param read The certifying caller's gate and listener; every pair within reach is read when absent.
   * @returns The pairs, `a` the segment whose probe lies deeper, with `seconds` zero.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the pose, the skips and allowances, the pair index, the gate and listener and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The model's structural and reference rules and both probe directions give the excess depth, with conservative spheres rejecting distant pairs; the base is `own`'s reading of the same depths.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Form sphere centres, scan the unordered part pairs, gate, read both directions, then keep the deeper past the allowance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps related-pair skips, the sphere comparison, direction order, reference depths and the nanometre threshold; a pair is left unread only where its caller's gate says it is certified.
   * @evidence contracts/development/implementation.md#efficient-algorithms S parts require O(S*S) broad comparisons and two depth readings per pair within reach that is due; each segment read in is prepared once for the pose, and a pair's key is built only where some pair is skipped or pressed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the body's model and its references without reusing pose-dependent answers.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh pair records; the centres and prepared readers end with the call.
   */
  export function within(
    m: M.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    skip: ReadonlySet<string>,
    pressed: ReadonlyMap<string, number>,
    key: (a: AutoMovieHumanoidBone, b: AutoMovieHumanoidBone) => string,
    read?: {
      due: (index: number) => boolean;
      heard: (
        index: number,
        base: number,
        apart: boolean,
        depth: number,
      ) => void;
    },
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
        const forward: { excess: number; base: number } = own(
          m,
          placed,
          i,
          j,
          targets,
        );
        const backward: { excess: number; base: number } = own(
          m,
          placed,
          j,
          i,
          targets,
        );
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
   * Every segment of one placed body that passes into a segment of another,
   * at its full depth: the reading of `AutoMovieMotionHumanAuditTangle.across`
   * on segments already placed.
   *
   * A caller that certifies pairs across the instants of a motion
   * (`AutoMovieMotionHumanAuditPartner`) passes `read`: a pair whose index
   * (`i * other's parts + j`) is not `due` is not read, and every pair read is
   * `heard` as `within` hears it, its base being `across`'s.
   *
   * @param m The model of the body whose probes are read.
   * @param mine Its placed segments.
   * @param o The model of the body they are read against.
   * @param theirs That body's placed segments.
   * @param read The certifying caller's gate and listener; every pair within reach is read when absent.
   * @returns The pairs, `a` of the first body in `b` of the other, with `seconds` zero.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both placements, the pair index, the gate and listener and the directed result.
   * @evidence contracts/development/implementation.md#principled-implementation Two bodies share no joint and no rest pose, so the directed probe depths are read in full; the base is `across`'s reading of the same depths.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scan of the ordered part pairs with the sphere screen, then the gate, one reading and the record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps full external depth, part order, the sphere screen and the nanometre threshold; a pair is left unread only where its caller's gate says it is certified.
   * @evidence contracts/development/implementation.md#efficient-algorithms For S and T parts, O(S*T) broad comparisons and one depth reading per pair within reach that is due, each of the other body's segments prepared once for the pose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the caller's placements and each body's canonical model.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The prepared readers live for this call; only the returned pairs survive.
   */
  export function entering(
    m: M.IModel,
    mine: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    o: M.IModel,
    theirs: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    read?: {
      due: (index: number) => boolean;
      heard: (
        index: number,
        base: number,
        apart: boolean,
        depth: number,
      ) => void;
    },
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
        const reading: { depth: number; base: number } = across(
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
   * their reference depths, and how far that can grow before it exceeds a
   * depth already recorded.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param i The segment whose probes are read.
   * @param j The segment they are read in.
   * @param targets The caller's list of prepared segments for this reading of `placed` (`AutoMovieMotionHumanAuditTangleModel.beyond`).
   * @returns `excess`, the model's `excess` of the pair, metres, zero when no probe lies deeper than its reference; `base`, metres, such that while the two segments travel less than `base + K` the excess stays at or below any `K` of zero or more.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, both results with their units and how the base is read.
   * @evidence contracts/development/implementation.md#principled-implementation A probe's excess an instant later is at most the lesser of its depth and its room plus the travel, less its reference; the base is the least over the probes of the reference less that lesser value.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One depth reading with the room, then one pass over the probes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The excess is the model's `excess`, the greatest positive `beyond`, in the same order of operations; a set-aside corner, whose reference is infinite, never lowers the base.
   * @evidence contracts/development/implementation.md#efficient-algorithms One depth reading of the pair, as `excess` makes, and one pass over its probes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the model's references and the caller's prepared segments.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns two numbers; the room array is local.
   */
  export function own(
    m: M.IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    i: number,
    j: number,
    targets: Parameters<typeof M.beyond>[4],
  ): { excess: number; base: number } {
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
   * How deep segment `i` of one body's probes lie in a segment of another
   * body, which shares no reference with it, and how far that can grow
   * before it exceeds a depth already recorded.
   *
   * @param probes Segment `i`'s probes, in its frame.
   * @param mine Segment `i` as placed.
   * @param read The other segment's prepared depth reader for this pose.
   * @returns `depth`, metres, the deepest probe, zero outside; `base`, metres, such that while the two segments travel less than `base + K` the depth stays at or below any `K` of zero or more.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, both results with their units and how the base is read.
   * @evidence contracts/development/implementation.md#principled-implementation A probe's depth an instant later is at most the lesser of its depth and its room plus the travel; the base is the least over the probes of minus that lesser value.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One depth reading with the room, then one pass over the probes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The depth is the greatest probe depth in the order `AutoMovieMotionHumanAuditTangle.across` takes it.
   * @evidence contracts/development/implementation.md#efficient-algorithms One depth reading and one pass over the probes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the caller's prepared reader.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns two numbers; the room array is local.
   */
  export function across(
    probes: readonly IAutoMovieVector3[],
    mine: IAutoMovieMotionHumanColliders.IPlaced,
    read: ReturnType<typeof prepareAutoMovieMotionHumanAuditDepths>,
  ): { depth: number; base: number } {
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
   * @param frames The body's placed segments at each grid instant, in grid order.
   * @returns Per instant, per segment, metres: the sum over the grid steps before it of the segment's travel over that step; zero at the first instant. Between instants `a < b` a segment's points moved no more than its value at `b` less its value at `a`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the unit, what each entry sums and how a span's bound is read.
   * @evidence contracts/development/implementation.md#principled-implementation A step's travel is the origin's move plus the extent times the rotation's chord, `2 |vec(q2 q1^-1)|`, which is `2 sin(angle / 2)` read off the quaternion's vector part without the cancellation of `1 - w^2`; sums of steps bound a span by the triangle inequality.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One running sum per segment.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every step of every segment is read from its placements; nothing is sampled.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in instants times segments.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reads the placements the caller made.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one array per instant of one number per segment, the caller's.
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
