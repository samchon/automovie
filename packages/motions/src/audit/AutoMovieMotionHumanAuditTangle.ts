import { Quaternion, Vector3, advanceAutoMovieGrid } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanAuditTangle,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import { AutoMovieMotionHumanAuditMotion as HumanAuditMotion } from "./AutoMovieMotionHumanAuditMotion";
import { AutoMovieMotionHumanAuditSkin } from "./AutoMovieMotionHumanAuditSkin";
import { AutoMovieMotionHumanAuditTangleMargin as Margin } from "./AutoMovieMotionHumanAuditTangleMargin";
import { AutoMovieMotionHumanAuditTangleModel as M } from "./AutoMovieMotionHumanAuditTangleModel";
import type { IAutoMovieMotionHumanAuditExemption as IExemption } from "./IAutoMovieMotionHumanAuditExemption";

/**
 * How deep a displayed body's own parts pass into one another: the tangle a
 * limb crossing through the trunk, a hand buried in the head or two legs
 * run through each other shows on screen.
 *
 * Every collider segment carries probes: the corners of its shapes as drawn,
 * and three points along its bone from its joint to each child joint, so a
 * limb that crosses another like an X, with no corner inside, is still read
 * by its axis. A probe's depth in another segment is how far it lies below
 * that segment's surface, exactly for a convex hull (the least distance to
 * its face planes) and by the engine's shape distance otherwise.
 *
 * Two readings are removed because they are the body's build and not the
 * motion's doing:
 *
 * - pairs that are one part or share a joint: a bone and its parent, or the
 *   nearest ancestor that carries a collider when the bones between carry
 *   none (the upper arm and the chest meet at the shoulder girdle, whose
 *   clavicle bone has no collider of its own); their colliders overlap at
 *   the joint by construction and fold into each other as it bends, within
 *   its range of motion. Also the hand with its own fingers, and the foot
 *   with its toes;
 * - what two segments already share in the body's two reference postures,
 *   the rest T-pose it was modelled in and the quiet stance every performer
 *   starts from (`stand.posture`): the thighs meet at the crotch as the body
 *   was modelled, and the hanging upper arm lies against the ribs, where
 *   flesh gives and a convex collider does not. Two such surfaces slide
 *   along each other as the body moves (a walking arm passes the flank it
 *   hangs against), so a corner's depth counts only beyond the deepest any
 *   corner of its segment lies in the other in either reference posture:
 *   the practice of a self-collision matrix, which sets aside the pairs that
 *   collide in the default pose (Chitta, Sucan and Cousins 2012, MoveIt,
 *   IEEE Robot Autom Mag 19:18). Where that reference depth is itself more
 *   than the skin gives (`BUILT`), the two convex colliders occupy one
 *   volume by their build, as the upper arm's and the trunk's do along the
 *   flank, and their corners are set aside altogether, as that matrix does;
 *   below it the reference depth is kept as the allowance. A point of a
 *   bone's axis keeps its own reference depth in every pair, so a limb that
 *   crosses another is read in full however much their surfaces share. A
 *   tangle of the quiet stance itself is not this reading's to find.
 *
 * A caller may also exempt the hand a law declares in contact with the
 * person's own body from the bone that carries the touched region, for the
 * span of that contact window (`exemptions`): the hand is meant to lie there.
 * An arm's segment a law declares lying on a segment of the same person (a
 * self-hug's forearm on the other forearm or on the chest) is read against
 * that segment only beyond `BUILT` over its window: a resting forearm may
 * press the skin as far as it gives, and no deeper.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines canonical surface/axis probes, structural and reference-depth removals, sampled contacts and their skin allowances.
 * @evidence contracts/development/design.md#principled-representation The displayed body's posed profile parts and two directed probe depths yield segment-pair penetration in metres; ROM-built overlaps and declared contact windows remain distinct allowances.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns sampled self and directed external collision readings, arm clearing's degree score and unordered bone keys; probe geometry and reference depths stay with AutoMovieMotionHumanAuditTangleModel.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Retains the original per-pair/per-axis references, joint exclusions and declared contacts for every body, with no new clearance, fixture or fallback geometry.
 */
export namespace AutoMovieMotionHumanAuditTangle {
  /**
   * The reference overlap beyond which two segments' surfaces are one volume
   * by their build, metres: the 10 mm a pressed skin gives, the audit's own
   * limit for a tangle. Two colliders deeper in each other than that while
   * the body stands at rest cannot be told apart by their corners.
   */
  export const BUILT: number = AutoMovieMotionHumanAuditSkin.BUILT;
  /**
   * Read a person's self-penetration over the whole motion.
   *
   * The result is the one reading every pair at every grid instant gives
   * ({@link pose} at each instant, each pair keeping its deepest, first
   * instant on a tie), from fewer pair readings: a pair read at an instant
   * is read again only at the first instant its margin does not certify
   * (`AutoMovieMotionHumanAuditTangleMargin`, `advanceAutoMovieGrid`), the
   * margin being how far its depth can grow before it would add to the
   * pair's record and the bound how far its two segments can have moved,
   * measured from the motion's own poses on the grid.
   *
   * @param motion The motion.
   * @param subject The person.
   * @param body Their body.
   * @param rate Grid samples per second.
   * @returns The deepest pair and every pair.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States subject, body, sampling rate, the deepest-per-pair sampled motion result and the certified reading that gives it; contact windows explain skipped or depth-allowed pairs.
   * @evidence contracts/development/implementation.md#principled-implementation A deterministic motion grid reads actual poses; active declared self-contacts supply the original exclusions/skin depths, and each unordered pair retains its deepest sampled instant. Conservative advancement leaves a pair unread only at instants where its depth, less any allowance, cannot exceed what it already recorded (or the nanometre a first record needs), so the record is the full scan's.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Build contact windows, place every grid instant's segments and their travel, visit the grid in order reading the pairs that are due, accumulate deepest pair records, then sort by depth.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps inclusive window endpoints, grid order, strict first-time ties, structural baselines and original contact mapping; a pair is left unread only by a certificate measured on the motion's own poses, never by sampling; existing contact-part/skeleton casts reflect the canonical Human-window producer and are not broadened.
   * @evidence contracts/development/implementation.md#efficient-algorithms For G grid samples and S parts, O(G*S) placements and travel, O(G*S*S) broad comparisons, and bidirectional probe/shape queries only for the pairs a margin leaves due: none while a pair's segments hold still or stay clear by more than they move. Local pair storage is bounded by encountered pairs; the placements are G*S.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The model owns shared body probes and baselines; each instant still resolves its actual displayed bones, which the audit's other readings share through the caller's motion.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Grid placements, travel table, due indices, exemption and deepest maps end with the call; returned results are owned by the caller. Existing weak body models retain only their own geometry/reference state.
   */
  export function measure(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    body: IAutoMovieMotionHumanBody,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditTangle.IResult {
    const m: M.IModel = M.model(body);
    const exempt: IExemption[] = exemptions(motion, subject, body);
    const deepest: Map<string, IAutoMovieMotionHumanAuditTangle.IPair> =
      new Map();
    const times: number[] = HumanAuditMotion.grid(0, motion.duration, rate);

    // Every instant's placed segments and each segment's travel to it, so a
    // pair read at an instant is next read at the first instant its margin
    // does not certify (`advanceAutoMovieGrid`); `due` holds that instant
    // per pair, by the pair's index.
    const frames: IAutoMovieMotionHumanColliders.IPlaced[][] = times.map(
      (t: number): IAutoMovieMotionHumanColliders.IPlaced[] =>
        HumanColliders.placed(body, motion.bones(subject, t)),
    );
    const travelled: Float64Array[] = Margin.travel(m, frames);
    const count: number = m.parts.length;
    const due: Int32Array = new Int32Array(count * count);

    // Each pair's record, by its index: the greatest depth it read, or the
    // nanometre a first record must pass.
    const recorded: Float64Array = new Float64Array(count * count).fill(
      Margin.NANOMETRE,
    );
    for (let k: number = 0; k < times.length; k++) {
      const t: number = times[k]!;
      const skip: Set<string> = new Set();
      const pressed: Map<string, number> = new Map();
      for (const e of exempt)
        if (t >= e.from && t <= e.to)
          for (const key of e.pairs)
            if (e.depth === undefined) skip.add(key);
            else pressed.set(key, Math.max(pressed.get(key) ?? 0, e.depth));
      for (const pair of Margin.within(
        m,
        frames[k]!,
        skip,
        pressed,
        unordered,
        {
          due: (index: number): boolean => k >= due[index]!,

          // A pair read here cannot add to its record while both segments
          // travel less than its base plus the depth recorded for it (the
          // nanometre a depth must pass to be recorded at all, before any);
          // a pressed allowance only lowers what is read, so it is left
          // out. A pair whose bounding spheres were apart is not read
          // before the two travel the gap between them.
          heard: (
            index: number,
            base: number,
            apart: boolean,
            depth: number,
          ): void => {
            recorded[index] = Math.max(recorded[index]!, depth);
            const i: number = Math.floor(index / count);
            const j: number = index % count;
            due[index] = advanceAutoMovieGrid(
              k,
              times.length - 1,
              apart ? base : base + recorded[index]!,
              (from: number, to: number): number =>
                travelled[to]![i]! -
                travelled[from]![i]! +
                (travelled[to]![j]! - travelled[from]![j]!),
            );
          },
        },
      )) {
        const key: string = unordered(pair.a, pair.b);
        const known: IAutoMovieMotionHumanAuditTangle.IPair | undefined =
          deepest.get(key);
        if (known === undefined || pair.depth > known.depth)
          deepest.set(key, { ...pair, seconds: t });
      }
    }
    const pairs: IAutoMovieMotionHumanAuditTangle.IPair[] = [
      ...deepest.values(),
    ].sort(
      (
        x: IAutoMovieMotionHumanAuditTangle.IPair,
        y: IAutoMovieMotionHumanAuditTangle.IPair,
      ): number => y.depth - x.depth,
    );
    return {
      worst:
        pairs.length === 0
          ? { value: 0, seconds: 0, where: "none" }
          : {
              value: pairs[0]!.depth,
              seconds: pairs[0]!.seconds,
              where: `${pairs[0]!.a} in ${pairs[0]!.b}`,
            },
      pairs,
    };
  }

  /**
   * Every pair of segments that pass into each other in one pose.
   *
   * @param body The body.
   * @param bones Its displayed bones.
   * @param skip Unordered pair keys (`unordered`) not to read.
   * @param pressed Unordered pair keys read only beyond a depth, metres: a declared rest's give.
   * @returns The pairs, each once, with the deeper direction.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines a single displayed pose, unordered skips/depth allowances and one result per penetrating self pair.
   * @evidence contracts/development/implementation.md#principled-implementation The model's structural/reference rules and both probe directions give the same excess depth, with conservative spheres rejecting distant pairs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Place actual colliders, form sphere centres, scan unordered part pairs, then keep the deeper direction past the existing allowance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps related-pair skips, sphere comparison, direction order, reference depths and the original 1e-9 roundoff threshold; no query or tolerance is changed.
   * @evidence contracts/development/implementation.md#efficient-algorithms S parts require O(S*S) broad comparisons and the original selected probe/shape work; collider placement and centre arrays remain per pose. Each segment a probe is read in is prepared once for the pose (`M.beyond`'s `targets`), and a pair's key is built only where some pair is skipped or pressed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the body's canonical model, its pair baselines and the existing centre/excess owners without reusing pose-dependent answers.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh pair records and releases local placements/centres; the existing model lifetime belongs to its weak body owner.
   */
  export function pose(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    skip: ReadonlySet<string> = new Set(),
    pressed: ReadonlyMap<string, number> = new Map(),
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    return Margin.within(
      M.model(body),
      HumanColliders.placed(body, bones),
      skip,
      pressed,
      unordered,
    );
  }

  /**
   * Every segment of one body that passes into a segment of another body in
   * one pose. Two bodies share no joint and no rest pose, so every pair is
   * read at its full depth.
   *
   * @param body The body whose probes are read.
   * @param bones Its displayed bones.
   * @param other The body they are read against.
   * @param otherBones That body's displayed bones.
   * @returns The pairs, `a` of `body` in `b` of `other`, with `seconds` zero.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States two bodies' displayed bone maps and the requested body-to-other directed pairs at second zero.
   * @evidence contracts/development/implementation.md#principled-implementation Different bodies share no structural joints or default-pose allowance, so original directed probe depths are read in full.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Place both bodies, scan their ordered part pairs, conservatively screen spheres and read every selected directed depth.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps full external depth, part order, strict depth updates and the original 1e-9 threshold; no own-body reference is applied.
   * @evidence contracts/development/implementation.md#efficient-algorithms For S and T parts, O(S*T) broad comparisons precede original selected probe/shape work, with each of the other body's segments prepared once for the pose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses each body's canonical model and the same centre/depth owners; no other-body pose result is retained.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Local placements and results are released or returned with this call; only the existing weak per-body models survive.
   */
  export function across(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    other: IAutoMovieMotionHumanBody,
    otherBones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    return Margin.entering(
      M.model(body),
      HumanColliders.placed(body, bones),
      M.model(other),
      HumanColliders.placed(other, otherBones),
    );
  }

  /**
   * How far one arm's segments (the upper arm, the forearm, the hand and its
   * fingers) pass into the rest of the same body beyond their reference
   * depths, as degrees of turn at the shoulder: each probe's excess depth
   * over its distance from the shoulder joint. The reading the tangle audit
   * makes of the arm, in the unit a range of motion overshoot has, so a law
   * that keeps an arm clear keeps it clear by this audit's measure.
   *
   * @param body The body.
   * @param bones Its posed bones.
   * @param side The arm.
   * @param prepared Optional exact placement of this body and bone map in the same unchanged evaluation, in original profile order; computed here when absent.
   * @param targets The caller's list of the segments already prepared as read-in targets (`prepareAutoMovieMotionHumanAuditDepths`), by index in `prepared`; an entry must belong to the very placed segment at its index, so a caller that replaces a placed segment between reads clears that entry. A list of this read's own when absent.
   * @param exceeded A monotone predicate for an optional lower-bound decision. When absent every part is scored for the maximum.
   * @returns Degrees; 0 when no probe of the arm lies deeper than at rest or in the quiet stance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines actual posed bones, arm segments, degree-valued excess and an optional exact same-epoch collider placement.
   * @evidence contracts/development/implementation.md#principled-implementation The model's original probes, references and both depth directions yield shoulder-arc degrees; an optional placement is the same body's unchanged posed geometry in original profile order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the model, borrow an exact supplied placement or create one, then run the original arm-to-body and reverse probe loops.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves all part/joint exclusions, sphere comparisons, reference queries, forward/reverse order, probe radii and degree arithmetic; supplied geometry must belong to these exact body/bones and unchanged evaluation.
   * @evidence contracts/development/implementation.md#efficient-algorithms For A arm parts and S total parts, keeps O(A*S) broad norms and every selected depth query. Each required part centre and positive-depth probe's world placement is composed once; every lever norm and radius clamp still runs. Which segments are the arm's is the model's table, read by index, and each segment a probe is read in is prepared once for the placement. A room read also shares its collider construction.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Clearance.room lends one exact placement used by obstacles. Its unchanged poses and model geometry also prove local centre/probe placement reuse by index within this arm read. Every sphere/lever distance, radius clamp, depth and score remains an actual reading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Keeps at most S centres and the queried model probes' world points only through this synchronous arm read; no borrowed pose, geometry workspace or scalar score survives return. The existing weak body model still owns reference lifetime.
   */
  export function arm(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: "left" | "right",
    prepared?: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    targets: NonNullable<Parameters<typeof M.beyond>[4]> = [],
    exceeded?: (degrees: number) => boolean,
  ): number {
    const m: M.IModel = M.model(body);
    const placed: readonly IAutoMovieMotionHumanColliders.IPlaced[] =
      prepared ?? HumanColliders.placed(body, bones);
    const shoulder: IAutoMovieVector3 = bones.get(
      `${side}UpperArm`,
    )!.worldPosition;
    const mine: readonly boolean[] = m.arms[side];

    // Geometry stays fixed for this arm read; share only completed first-use
    // world placements, never depth or score results.
    const centres: IAutoMovieVector3[] = [];
    const points: IAutoMovieVector3[][] = [];
    const centre: (part: number) => IAutoMovieVector3 = (
      part: number,
    ): IAutoMovieVector3 => {
      let point: IAutoMovieVector3 | undefined = centres[part];
      if (point === undefined) {
        point = M.centre(placed[part]!, m.parts[part]!);
        centres[part] = point;
      }
      return point;
    };

    // A positive depth still measures and clamps its lever on every query.
    const lever: (part: number, corner: number) => number = (
      part: number,
      corner: number,
    ): number => {
      let list: IAutoMovieVector3[] | undefined = points[part];
      if (list === undefined) {
        list = [];
        points[part] = list;
      }
      let point: IAutoMovieVector3 | undefined = list[corner];
      if (point === undefined) {
        point = Vector3.add(
          placed[part]!.pose.position,
          Quaternion.rotateVector(
            placed[part]!.pose.rotation,
            m.parts[part]!.probes[corner]!,
          ),
        );
        list[corner] = point;
      }
      return Math.max(1e-3, Vector3.distance(point, shoulder));
    };

    let worst: number = 0;
    for (let i: number = 0; i < placed.length; i++) {
      if (!mine[i]) continue;
      const a: IAutoMovieVector3 = centre(i);
      for (let j: number = 0; j < placed.length; j++) {
        if (m.related[i]![j]! || mine[j]) continue;
        const reach: number = m.parts[i]!.radius + m.parts[j]!.radius;
        if (Vector3.distance(a, centre(j)) >= reach) continue;
        const over: Float64Array = M.beyond(m, placed, i, j, targets);
        for (let k: number = 0; k < over.length; k++) {
          if (!(over[k]! > 0)) continue;
          const radius: number = lever(i, k);
          worst = Math.max(worst, ((over[k]! / radius) * 180) / Math.PI);
          if (exceeded?.(worst)) return worst;
        }

        // The other part's probes inside the arm's part: a corner of the
        // belly lying in the forearm is the same tangle read from the other
        // side, and `pose` takes the deeper of the two, so an arm is clear
        // only when neither direction reads a depth.
        const under: Float64Array = M.beyond(m, placed, j, i, targets);
        for (let k: number = 0; k < under.length; k++) {
          if (!(under[k]! > 0)) continue;
          const radius: number = lever(j, k);
          worst = Math.max(worst, ((under[k]! / radius) * 180) / Math.PI);
          if (exceeded?.(worst)) return worst;
        }
      }
    }
    return worst;
  }

  /**
   * The key of an unordered pair of bones.
   *
   * @param a One bone.
   * @param b The other.
   * @returns The same key for either order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States two bone identities and the identical key returned for either ordering.
   * @evidence contracts/development/implementation.md#principled-implementation Lexicographic ordering of the two canonical bone names defines one deterministic unordered pair key.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One original string comparison and delimiter composition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the exact comparison and delimiter used by all skip/rest/reference maps, without remapping names.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant comparisons and key construction in bone-name length, independent of pose or probe count.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All pair readers and exemption production share this key owner instead of choosing another ordering.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a string scalar and retains no names, pose or key history.
   */
  export function unordered(
    a: AutoMovieHumanoidBone,
    b: AutoMovieHumanoidBone,
  ): string {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }
}

/** The declared contacts of a person with their own body, as pair keys and spans. */
const exemptions: (
  motion: IAutoMovieMotionHumanAuditMotion,
  subject: string,
  body: IAutoMovieMotionHumanBody,
) => IExemption[] = (
  motion: IAutoMovieMotionHumanAuditMotion,
  subject: string,
  body: IAutoMovieMotionHumanBody,
): IExemption[] => {
  const out: IExemption[] = [];
  for (const window of HumanAuditMotion.windows(motion, subject)) {
    const support: typeof window.contact.support = window.contact.support;
    if (support.kind !== "person" || support.subject !== subject) continue;

    // An arm's segment declared lying on a segment of the same person: read
    // only beyond the skin's give (`BUILT`).
    if ("bone" in support) {
      out.push({
        from: window.from,
        to: window.to,
        pairs: [
          AutoMovieMotionHumanAuditTangle.unordered(
            window.contact.part as AutoMovieHumanoidBone,
            support.bone,
          ),
        ],
        depth: AutoMovieMotionHumanAuditTangle.BUILT,
      });
      continue;
    }
    const part: string = window.contact.part;
    if (part !== "leftHand" && part !== "rightHand") continue;
    const touched: AutoMovieHumanoidBone =
      body.surfaces.regions[support.region].bone;
    const pairs: string[] = [];
    for (const bone of body.skeleton.bones as IAutoMovieBone[])
      if (M.group(bone.bone) === part)
        pairs.push(
          AutoMovieMotionHumanAuditTangle.unordered(bone.bone, touched),
        );
    out.push({ from: window.from, to: window.to, pairs });
  }
  return out;
};
