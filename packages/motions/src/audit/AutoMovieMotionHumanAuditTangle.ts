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
import { AutoMovieMotionHumanAuditTangleModel } from "./AutoMovieMotionHumanAuditTangleModel";
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
 * @evidence contracts/development/common.md#meaningful-documentation States the probes, the depth, both removals with their reasons and the declared-contact exemption.
 * @evidence contracts/development/implementation.md#principled-implementation Interior depth of a point in a convex polytope is its least distance to the supporting planes; the engine's hull faces and shape distance are the owners of both.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A per-body model built once, a bounding-sphere pass, then probes against shapes.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pair is exempt beyond the stated structural ones, the joint a collider meets being read through bones without colliders; the reference depth is per pair for corners and per point for a bone's axis, so a crossing limb is read at its full depth.
 * @evidence contracts/development/implementation.md#efficient-algorithms Bounding spheres reject distant pairs before any probe is transformed; a probe costs one plane product per face.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The probes, spheres, pair relation and rest depths of a body are remembered per body by `AutoMovieMotionHumanAuditTangleModel`, which builds them and reads the depths.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One model per live body, released with it; rest depths are bounded by segment pairs.
 */
export namespace AutoMovieMotionHumanAuditTangle {
  /**
   * The reference overlap beyond which two segments' surfaces are one volume
   * by their build, metres: the 10 mm a pressed skin gives, the audit's own
   * limit for a tangle. Two colliders deeper in each other than that while
   * the body stands at rest cannot be told apart by their corners.
   */
  export const BUILT: number = AutoMovieMotionHumanAuditTangleModel.BUILT;

  /** One pair of segments that pass into each other. */
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

  /** The reading of {@link measure}. */
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
   */
  export function pose(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    skip: ReadonlySet<string> = new Set(),
    pressed: ReadonlyMap<string, number> = new Map(),
  ): IPair[] {
    const m: AutoMovieMotionHumanAuditTangleModel.IModel =
      AutoMovieMotionHumanAuditTangleModel.model(body);
    const placed: HumanColliders.IPlaced[] = HumanColliders.placed(body, bones);
    const out: IPair[] = [];
    const centres: IAutoMovieVector3[] = placed.map(
      (p: HumanColliders.IPlaced, i: number): IAutoMovieVector3 =>
        AutoMovieMotionHumanAuditTangleModel.centre(p, m.parts[i]!),
    );
    for (let i: number = 0; i < placed.length; i++)
      for (let j: number = i + 1; j < placed.length; j++) {
        if (m.related[i]![j]!) continue;
        const reach: number = m.parts[i]!.radius + m.parts[j]!.radius;
        if (Vector3.length(Vector3.subtract(centres[i]!, centres[j]!)) >= reach)
          continue;
        if (skip.has(unordered(placed[i]!.bone, placed[j]!.bone))) continue;
        const forward: number = AutoMovieMotionHumanAuditTangleModel.excess(
          m,
          placed,
          i,
          j,
        );
        const backward: number = AutoMovieMotionHumanAuditTangleModel.excess(
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
   */
  export function across(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    other: IHumanBody,
    otherBones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IPair[] {
    const m: AutoMovieMotionHumanAuditTangleModel.IModel =
      AutoMovieMotionHumanAuditTangleModel.model(body);
    const o: AutoMovieMotionHumanAuditTangleModel.IModel =
      AutoMovieMotionHumanAuditTangleModel.model(other);
    const mine: HumanColliders.IPlaced[] = HumanColliders.placed(body, bones);
    const theirs: HumanColliders.IPlaced[] = HumanColliders.placed(
      other,
      otherBones,
    );
    const out: IPair[] = [];
    for (let i: number = 0; i < mine.length; i++)
      for (let j: number = 0; j < theirs.length; j++) {
        const reach: number = m.parts[i]!.radius + o.parts[j]!.radius;
        const apart: IAutoMovieVector3 = Vector3.subtract(
          AutoMovieMotionHumanAuditTangleModel.centre(mine[i]!, m.parts[i]!),
          AutoMovieMotionHumanAuditTangleModel.centre(theirs[j]!, o.parts[j]!),
        );
        if (Vector3.length(apart) >= reach) continue;
        let depth: number = 0;
        for (const d of AutoMovieMotionHumanAuditTangleModel.depths(
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
   * @returns Degrees; 0 when no probe of the arm lies deeper than at rest or in the quiet stance.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the segments, the depth's baseline and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation The same probes, pair relation and baselines as `pose`, so a cleared arm and an audited one agree; a depth at a probe is the shoulder's turn that carries the probe that far, its arc over its radius.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the arm's parts and the body's other parts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The pairs of one part or one joint are skipped as `pose` skips them; nothing else is exempt.
   * @evidence contracts/development/implementation.md#efficient-algorithms Bounding spheres reject distant pairs before any probe is read.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the per-body model and its remembered baselines.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The model is the audit's own, held per live body.
   */
  export function arm(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: "left" | "right",
  ): number {
    const m: AutoMovieMotionHumanAuditTangleModel.IModel =
      AutoMovieMotionHumanAuditTangleModel.model(body);
    const placed: HumanColliders.IPlaced[] = HumanColliders.placed(body, bones);
    const shoulder: IAutoMovieVector3 = bones.get(
      `${side}UpperArm`,
    )!.worldPosition;
    const mine = (bone: AutoMovieHumanoidBone): boolean =>
      bone === `${side}UpperArm` ||
      bone === `${side}LowerArm` ||
      AutoMovieMotionHumanAuditTangleModel.group(bone) === `${side}Hand`;
    let worst: number = 0;
    for (let i: number = 0; i < placed.length; i++) {
      if (!mine(placed[i]!.bone)) continue;
      const a: IAutoMovieVector3 = AutoMovieMotionHumanAuditTangleModel.centre(
        placed[i]!,
        m.parts[i]!,
      );
      for (let j: number = 0; j < placed.length; j++) {
        if (m.related[i]![j]! || mine(placed[j]!.bone)) continue;
        const reach: number = m.parts[i]!.radius + m.parts[j]!.radius;
        if (
          Vector3.length(
            Vector3.subtract(
              a,
              AutoMovieMotionHumanAuditTangleModel.centre(
                placed[j]!,
                m.parts[j]!,
              ),
            ),
          ) >= reach
        )
          continue;
        const over: Float64Array = AutoMovieMotionHumanAuditTangleModel.beyond(
          m,
          placed,
          i,
          j,
        );
        for (let k: number = 0; k < over.length; k++) {
          if (!(over[k]! > 0)) continue;
          const probe: IAutoMovieVector3 = Vector3.add(
            placed[i]!.pose.position,
            Quaternion.rotateVector(
              placed[i]!.pose.rotation,
              m.parts[i]!.probes[k]!,
            ),
          );
          const radius: number = Math.max(
            1e-3,
            Vector3.length(Vector3.subtract(probe, shoulder)),
          );
          worst = Math.max(worst, ((over[k]! / radius) * 180) / Math.PI);
        }

        // The other part's probes inside the arm's part: a corner of the
        // belly lying in the forearm is the same tangle read from the other
        // side, and `pose` takes the deeper of the two, so an arm is clear
        // only when neither direction reads a depth.
        const under: Float64Array = AutoMovieMotionHumanAuditTangleModel.beyond(
          m,
          placed,
          j,
          i,
        );
        for (let k: number = 0; k < under.length; k++) {
          if (!(under[k]! > 0)) continue;
          const probe: IAutoMovieVector3 = Vector3.add(
            placed[j]!.pose.position,
            Quaternion.rotateVector(
              placed[j]!.pose.rotation,
              m.parts[j]!.probes[k]!,
            ),
          );
          const radius: number = Math.max(
            1e-3,
            Vector3.length(Vector3.subtract(probe, shoulder)),
          );
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
   */
  export function unordered(
    a: AutoMovieHumanoidBone,
    b: AutoMovieHumanoidBone,
  ): string {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }
}

/** A declared self-contact: pair keys left unread, or read beyond a depth, in a span of film seconds. */
interface IExemption {
  from: number;
  to: number;
  pairs: string[];
  /** How deep the pairs may press, metres; left unread when absent. */
  depth?: number;
}

/** The declared contacts of a person with their own body, as pair keys and spans. */
const exemptions = (
  motion: IAutoMovieMotionHumanAuditMotion,
  subject: string,
  body: IHumanBody,
): IExemption[] => {
  const out: IExemption[] = [];
  for (const window of IAutoMovieMotionHumanAuditMotion.windows(
    motion,
    subject,
  )) {
    const support = window.contact.support;
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
      if (AutoMovieMotionHumanAuditTangleModel.group(bone.bone) === part)
        pairs.push(
          AutoMovieMotionHumanAuditTangle.unordered(bone.bone, touched),
        );
    out.push({ from: window.from, to: window.to, pairs });
  }
  return out;
};
