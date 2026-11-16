import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanColliders } from "../posture/HumanColliders";
import { AutoMovieMotionHumanAuditSkin } from "./AutoMovieMotionHumanAuditSkin";
import { AutoMovieMotionHumanAuditTangleModel as M } from "./AutoMovieMotionHumanAuditTangleModel";
import type { IAutoMovieMotionHumanAuditExemption as IExemption } from "./IAutoMovieMotionHumanAuditExemption";
import type { IAutoMovieMotionHumanAuditMeasure } from "./IAutoMovieMotionHumanAuditMeasure";
import { IAutoMovieMotionHumanAuditMotion } from "./IAutoMovieMotionHumanAuditMotion";

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

  /** One pair of segments that pass into each other.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the probe-owning bone, containing bone, positive excess metres and film second.
   * @evidence contracts/development/design.md#principled-representation One directed deepest penetration at an instant; self-pair results choose the deeper direction while across results keep the requested direction.
   * @evidence contracts/development/design.md#minimal-and-owned-surface measure, pose and across share this result; callers read actual bone identities and scalar depth/time without another shape representation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No display proxy, combined slack or untyped part identifier replaces the actual posed bones.
   */
  export interface IPair {
    /** The segment whose probe lies deepest. */
    a: AutoMovieHumanoidBone;

    /** The segment it lies in. */
    b: AutoMovieHumanoidBone;

    /** How deep beyond the rest pose, metres, positive. */
    depth: number;

    /** The film second of that depth; zero for a single pose. */
    seconds: number;
  }

  /** The reading of {@link measure}.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the worst sampled finding and deepest-per-unordered-pair results in descending depth.
   * @evidence contracts/development/design.md#principled-representation The worst audit measure accompanies actual pair records so its depth, time and location can be traced to the same sampled geometry.
   * @evidence contracts/development/design.md#minimal-and-owned-surface measure constructs these two fields for audit consumers using the existing measure and pair owners.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An empty reading keeps the original zero/none measure and empty pair list instead of a fabricated collision.
   */
  export interface IResult {
    /** The deepest pair. */
    worst: IAutoMovieMotionHumanAuditMeasure;

    /** Every unordered pair that passed into each other at some instant, its deepest instant, deepest first. */
    pairs: IPair[];
  }

  /**
   * Read a person's self-penetration over the whole motion.
   *
   * @param motion The motion.
   * @param subject The person.
   * @param body Their body.
   * @param rate Grid samples per second.
   * @returns The deepest pair and every pair.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States subject, body, sampling rate and the deepest-per-pair sampled motion result; contact windows explain skipped or depth-allowed pairs.
   * @evidence contracts/development/implementation.md#principled-implementation A deterministic motion grid reads actual poses; active declared self-contacts supply the original exclusions/skin depths, and each unordered pair retains its deepest sampled instant.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Build contact windows, visit the original grid, accumulate deepest pair records, then sort by depth.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps inclusive window endpoints, grid order, strict first-time ties, structural baselines and original contact mapping; existing contact-part/skeleton casts reflect the canonical Human-window producer and are not broadened.
   * @evidence contracts/development/implementation.md#efficient-algorithms For G grid samples and S parts, keeps the original O(G*S*S) broad pair work plus selected bidirectional probe/shape queries; local pair storage is bounded by encountered pairs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The model owns shared body probes and baselines; each instant still resolves its actual displayed bones and performs its original pose reading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Grid, exemption and deepest maps end with the call; returned results are owned by the caller. Existing weak body models retain only their own geometry/reference state.
   */
  export function measure(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    body: IHumanBody,
    rate: number = 24,
  ): IResult {
    const exempt: IExemption[] = exemptions(motion, subject, body);
    const deepest: Map<string, IPair> = new Map();
    for (const t of IAutoMovieMotionHumanAuditMotion.grid(
      0,
      motion.duration,
      rate,
    )) {
      const skip: Set<string> = new Set();
      const pressed: Map<string, number> = new Map();
      for (const e of exempt)
        if (t >= e.from && t <= e.to)
          for (const key of e.pairs)
            if (e.depth === undefined) skip.add(key);
            else pressed.set(key, Math.max(pressed.get(key) ?? 0, e.depth));
      for (const pair of pose(body, motion.bones(subject, t), skip, pressed)) {
        const key: string = unordered(pair.a, pair.b);
        const known: IPair | undefined = deepest.get(key);
        if (known === undefined || pair.depth > known.depth)
          deepest.set(key, { ...pair, seconds: t });
      }
    }
    const pairs: IPair[] = [...deepest.values()].sort(
      (x: IPair, y: IPair): number => y.depth - x.depth,
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
   * @evidence contracts/development/implementation.md#efficient-algorithms S parts require O(S*S) broad comparisons and the original selected probe/shape work; collider placement and centre arrays remain per pose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the body's canonical model, its pair baselines and the existing centre/excess owners without reusing pose-dependent answers.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh pair records and releases local placements/centres; the existing model lifetime belongs to its weak body owner.
   */
  export function pose(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    skip: ReadonlySet<string> = new Set(),
    pressed: ReadonlyMap<string, number> = new Map(),
  ): IPair[] {
    const m: M.IModel =
      M.model(body);
    const placed: HumanColliders.IPlaced[] = HumanColliders.placed(body, bones);
    const out: IPair[] = [];
    const centres: IAutoMovieVector3[] = placed.map(
      (p: HumanColliders.IPlaced, i: number): IAutoMovieVector3 =>
        M.centre(p, m.parts[i]!),
    );
    for (let i: number = 0; i < placed.length; i++)
      for (let j: number = i + 1; j < placed.length; j++) {
        if (m.related[i]![j]!) continue;
        const reach: number = m.parts[i]!.radius + m.parts[j]!.radius;
        if (Vector3.distance(centres[i]!, centres[j]!) >= reach)
          continue;
        if (skip.has(unordered(placed[i]!.bone, placed[j]!.bone))) continue;
        const forward: number = M.excess(
          m,
          placed,
          i,
          j,
        );
        const backward: number = M.excess(
          m,
          placed,
          j,
          i,
        );
        const depth: number =
          Math.max(forward, backward) -
          (pressed.get(unordered(placed[i]!.bone, placed[j]!.bone)) ?? 0);

        // A nanometre: below it a depth is the rounding of the two frames.
        if (depth > 1e-9)
          out.push({
            a: placed[forward >= backward ? i : j]!.bone,
            b: placed[forward >= backward ? j : i]!.bone,
            depth,
            seconds: 0,
          });
      }
    return out;
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
   * @evidence contracts/development/implementation.md#efficient-algorithms For S and T parts, O(S*T) broad comparisons precede original selected probe/shape work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses each body's canonical model and the same centre/depth owners; no other-body pose result is retained.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Local placements and results are released or returned with this call; only the existing weak per-body models survive.
   */
  export function across(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    other: IHumanBody,
    otherBones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IPair[] {
    const m: M.IModel =
      M.model(body);
    const o: M.IModel =
      M.model(other);
    const mine: HumanColliders.IPlaced[] = HumanColliders.placed(body, bones);
    const theirs: HumanColliders.IPlaced[] = HumanColliders.placed(
      other,
      otherBones,
    );
    const out: IPair[] = [];
    for (let i: number = 0; i < mine.length; i++)
      for (let j: number = 0; j < theirs.length; j++) {
        const reach: number = m.parts[i]!.radius + o.parts[j]!.radius;
        const apart: number = Vector3.distance(
          M.centre(mine[i]!, m.parts[i]!),
          M.centre(theirs[j]!, o.parts[j]!),
        );
        if (apart >= reach) continue;
        let depth: number = 0;
        for (const d of M.depths(
          m.parts[i]!.probes,
          mine[i]!,
          theirs[j]!,
        ))
          depth = Math.max(depth, d);
        if (depth > 1e-9)
          out.push({ a: mine[i]!.bone, b: theirs[j]!.bone, depth, seconds: 0 });
      }
    return out;
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
   * @returns Degrees; 0 when no probe of the arm lies deeper than at rest or in the quiet stance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines actual posed bones, arm segments, degree-valued excess and an optional exact same-epoch collider placement.
   * @evidence contracts/development/implementation.md#principled-implementation The model's original probes, references and both depth directions yield shoulder-arc degrees; an optional placement is the same body's unchanged posed geometry in original profile order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the model, borrow an exact supplied placement or create one, then run the original arm-to-body and reverse probe loops.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves all part/joint exclusions, sphere comparisons, reference queries, forward/reverse order, probe radii and degree arithmetic; supplied geometry must belong to these exact body/bones and unchanged evaluation.
   * @evidence contracts/development/implementation.md#efficient-algorithms For A arm parts and S total parts, keeps O(A*S) broad norms and every selected depth query. Each required part centre and positive-depth probe's world placement is composed once; every lever norm and radius clamp still runs. A room read also shares its collider construction.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Clearance.room lends one exact placement used by obstacles. Its unchanged poses and model geometry also prove local centre/probe placement reuse by index within this arm read. Every sphere/lever distance, radius clamp, depth and score remains an actual reading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Keeps at most S centres and the queried model probes' world points only through this synchronous arm read; no borrowed pose, geometry workspace or scalar score survives return. The existing weak body model still owns reference lifetime.
   */
  export function arm(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: "left" | "right",
    prepared?: readonly HumanColliders.IPlaced[],
  ): number {
    const m: M.IModel =
      M.model(body);
    const placed: readonly HumanColliders.IPlaced[] = prepared ?? HumanColliders.placed(body, bones);
    const shoulder: IAutoMovieVector3 = bones.get(
      `${side}UpperArm`,
    )!.worldPosition;
    const mine: (bone: AutoMovieHumanoidBone) => boolean = (bone: AutoMovieHumanoidBone): boolean =>
      bone === `${side}UpperArm` ||
      bone === `${side}LowerArm` ||
      M.group(bone) === `${side}Hand`;

    // Geometry stays fixed for this arm read; share only completed first-use
    // world placements, never depth or score results.
    const centres: IAutoMovieVector3[] = [];
    const points: IAutoMovieVector3[][] = [];
    const centre: (part: number) => IAutoMovieVector3 = (part: number): IAutoMovieVector3 => {
      let point: IAutoMovieVector3 | undefined = centres[part];
      if (point === undefined) {
        point = M.centre(placed[part]!, m.parts[part]!);
        centres[part] = point;
      }
      return point;
    };

    // A positive depth still measures and clamps its lever on every query.
    const lever: (part: number, corner: number) => number = (part: number, corner: number): number => {
      let list: IAutoMovieVector3[] | undefined = points[part];
      if (list === undefined) {
        list = [];
        points[part] = list;
      }
      let point: IAutoMovieVector3 | undefined = list[corner];
      if (point === undefined) {
        point = Vector3.add(placed[part]!.pose.position, Quaternion.rotateVector(placed[part]!.pose.rotation, m.parts[part]!.probes[corner]!));
        list[corner] = point;
      }
      return Math.max(1e-3, Vector3.distance(point, shoulder));
    };

    let worst: number = 0;
    for (let i: number = 0; i < placed.length; i++) {
      if (!mine(placed[i]!.bone)) continue;
      const a: IAutoMovieVector3 = centre(i);
      for (let j: number = 0; j < placed.length; j++) {
        if (m.related[i]![j]! || mine(placed[j]!.bone)) continue;
        const reach: number = m.parts[i]!.radius + m.parts[j]!.radius;
        if (Vector3.distance(a, centre(j)) >= reach) continue;
        const over: Float64Array = M.beyond(
          m,
          placed,
          i,
          j,
        );
        for (let k: number = 0; k < over.length; k++) {
          if (!(over[k]! > 0)) continue;
          const radius: number = lever(i, k);
          worst = Math.max(worst, ((over[k]! / radius) * 180) / Math.PI);
        }

        // The other part's probes inside the arm's part: a corner of the
        // belly lying in the forearm is the same tangle read from the other
        // side, and `pose` takes the deeper of the two, so an arm is clear
        // only when neither direction reads a depth.
        const under: Float64Array = M.beyond(
          m,
          placed,
          j,
          i,
        );
        for (let k: number = 0; k < under.length; k++) {
          if (!(under[k]! > 0)) continue;
          const radius: number = lever(j, k);
          worst = Math.max(worst, ((under[k]! / radius) * 180) / Math.PI);
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
  body: IHumanBody,
) => IExemption[] = (
  motion: IAutoMovieMotionHumanAuditMotion,
  subject: string,
  body: IHumanBody,
): IExemption[] => {
  const out: IExemption[] = [];
  for (const window of IAutoMovieMotionHumanAuditMotion.windows(
    motion,
    subject,
  )) {
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
