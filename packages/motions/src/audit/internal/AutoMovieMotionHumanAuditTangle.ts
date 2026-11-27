import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineSchedule } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanAuditTangle,
  IAutoMovieMotionHumanAuditTangleModel,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../../posture/internal/HumanColliders";
import { AutoMovieMotionHumanAuditMotion as HumanAuditMotion } from "./AutoMovieMotionHumanAuditMotion";
import { AutoMovieMotionHumanAuditSkin } from "./AutoMovieMotionHumanAuditSkin";
import { AutoMovieMotionHumanAuditTangleMargin as Margin } from "./AutoMovieMotionHumanAuditTangleMargin";
import { AutoMovieMotionHumanAuditTangleModel as M } from "./AutoMovieMotionHumanAuditTangleModel";
import type { IAutoMovieMotionHumanAuditExemption as IExemption } from "./IAutoMovieMotionHumanAuditExemption";

/*
 * How deep a displayed body's own parts pass into one another: the tangle a
 * limb crossing through the trunk, a hand buried in the head or two legs run
 * through each other shows on screen.
 *
 * Every collider segment carries probes: the corners of its shapes as drawn,
 * and three points along its bone from its joint to each child joint, so a limb
 * that crosses another like an X, with no corner inside, is still read by its
 * axis. A probe's depth in another segment is how far it lies below that
 * segment's surface, exactly for a convex hull (the least distance to its face
 * planes) and by the engine's shape distance otherwise.
 *
 * Two readings are removed because they are the body's build and not the
 * motion's doing:
 *
 * - Pairs that are one part or share a joint: a bone and its parent, or the
 *   nearest ancestor that carries a collider when the bones between carry none
 *   (the upper arm and the chest meet at the shoulder girdle, whose clavicle
 *   bone has no collider of its own); their colliders overlap at the joint by
 *   construction and fold into each other as it bends, within its range of
 *   motion. Also the hand with its own fingers, the foot with its toes, and the
 *   forearm with the digits hung directly on the hand, which ride the carpus
 *   the wrist joins to it (the thumb's metacarpal base meets the forearm's
 *   distal end on a flexed wrist);
 * - What two segments already share in the body's two reference postures, the
 *   rest T-pose it was modelled in and the quiet stance every performer starts
 *   from (`stand.posture`): the thighs meet at the crotch as the body was
 *   modelled, and the hanging upper arm lies against the ribs, where flesh
 *   gives and a convex collider does not. Two such surfaces slide along each
 *   other as the body moves (a walking arm passes the flank it hangs against),
 *   so a corner's depth counts only beyond the deepest any corner of its
 *   segment lies in the other in either reference posture: the practice of a
 *   self-collision matrix, which sets aside the pairs that collide in the
 *   default pose (Chitta, Sucan and Cousins 2012, MoveIt, IEEE Robot Autom Mag
 *   19:18). Where that reference depth is itself more than the skin gives
 *   (`BUILT`), the two convex colliders occupy one volume by their build, as
 *   the upper arm's and the trunk's do along the flank, and their corners are
 *   set aside altogether, as that matrix does; below it the reference depth is
 *   kept as the allowance. A point of a bone's axis keeps its own reference
 *   depth in every pair, so a limb that crosses another is read in full however
 *   much their surfaces share. A tangle of the quiet stance itself is not this
 *   reading's to find.
 *
 * A caller may also exempt the hand a law declares in contact with the person's
 * own body from the bone that carries the touched region, for the span of that
 * contact window (`exemptions`): the hand is meant to lie there. An arm's
 * segment a law declares lying on a segment of the same person (a self-hug's
 * forearm on the other forearm or on the chest) is read against that segment
 * only beyond `BUILT` over its window: a resting forearm may press the skin as
 * far as it gives, and no deeper.
 */
export namespace AutoMovieMotionHumanAuditTangle {
  /*
   * The reference overlap beyond which two segments' surfaces are one volume by
   * their build, metres: the 10 mm a pressed skin gives, the audit's own limit
   * for a tangle. Two colliders deeper in each other than that while the body
   * stands at rest cannot be told apart by their corners.
   */
  export const BUILT: number = AutoMovieMotionHumanAuditSkin.BUILT;
  /*
   * Read a person's self-penetration over the whole motion.
   *
   * The result is the one reading every pair at every grid instant gives
   * (pose at each instant, each pair keeping its deepest, first instant
   * on a tie), from fewer pair readings: a pair read at an instant is read
   * again only at the first instant its margin does not certify
   * (`AutoMovieMotionHumanAuditTangleMargin`, `advanceGrid`), the
   * margin being how far its depth can grow before it would add to the pair's
   * record and the bound how far its two segments can have moved, measured from
   * the motion's own poses on the grid.
   * Parameter motion: The motion.
   * Parameter subject: The person.
   * Parameter body: Their body.
   * Parameter rate: Grid samples per second.
   * Returns: The deepest pair and every pair.
   */
  export function measure(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    body: IAutoMovieMotionHumanBody,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditTangle.IResult {
    const m: IAutoMovieMotionHumanAuditTangleModel.IModel = body.tangle;
    const exempt: IExemption[] = exemptions(motion, subject, body);
    const deepest: Map<string, IAutoMovieMotionHumanAuditTangle.IPair> =
      new Map();
    const times: number[] = HumanAuditMotion.grid(0, motion.duration, rate);

    // Every instant's placed segments and each segment's travel to it, so a
    // pair read at an instant is next read at the first instant its margin
    // does not certify (`advanceGrid`); `due` holds that instant
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
            due[index] = AutoMovieEngineSchedule.advanceGrid(
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

  /*
   * Every pair of segments that pass into each other in one pose.
   * Parameter body: The body.
   * Parameter bones: Its displayed bones.
   * Parameter skip: Unordered pair keys (`unordered`) not to read.
   * Parameter pressed: Unordered pair keys read only beyond a depth, metres: a
   * declared rest's give.
   * Returns: The pairs, each once, with the deeper direction.
   */
  export function pose(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    skip: ReadonlySet<string> = new Set(),
    pressed: ReadonlyMap<string, number> = new Map(),
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    return Margin.within(
      body.tangle,
      HumanColliders.placed(body, bones),
      skip,
      pressed,
      unordered,
    );
  }

  /*
   * Every segment of one body that passes into a segment of another body in one
   * pose. Two bodies share no joint and no rest pose, so every pair is read at
   * its full depth.
   * Parameter body: The body whose probes are read.
   * Parameter bones: Its displayed bones.
   * Parameter other: The body they are read against.
   * Parameter otherBones: That body's displayed bones.
   * Returns: The pairs, `a` of `body` in `b` of `other`, with `seconds` zero.
   */
  export function across(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    other: IAutoMovieMotionHumanBody,
    otherBones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IAutoMovieMotionHumanAuditTangle.IPair[] {
    return Margin.entering(
      body.tangle,
      HumanColliders.placed(body, bones),
      other.tangle,
      HumanColliders.placed(other, otherBones),
    );
  }

  /*
   * How far one arm's segments (the upper arm, the forearm, the hand and its
   * fingers) pass into the rest of the same body beyond their reference depths,
   * as degrees of turn at the shoulder: each probe's excess depth over its
   * distance from the shoulder joint. The reading the tangle audit makes of the
   * arm, in the unit a range of motion overshoot has, so a law that keeps an
   * arm clear keeps it clear by this audit's measure.
   * Parameter body: The body.
   * Parameter bones: Its posed bones.
   * Parameter side: The arm.
   * Parameter prepared: Optional exact placement of this body and bone map in the
   * same unchanged evaluation, in original profile order; computed here when
   * absent.
   * Parameter targets: The caller's list of the segments already prepared as
   * read-in targets (`prepareMotionHumanAuditDepths`), by index in
   * `prepared`; an entry must belong to the very placed segment at its index,
   * so a caller that replaces a placed segment between reads clears that
   * entry. A list of this read's own when absent.
   * Parameter exceeded: A monotone predicate for an optional lower-bound decision.
   * When absent every part is scored for the maximum.
   * Returns: Degrees; 0 when no probe of the arm lies deeper than at rest or in
   * the quiet stance.
   */
  export function arm(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: AutoMovieHumanSide,
    prepared?: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    targets: NonNullable<Parameters<typeof M.beyond>[4]> = [],
    exceeded?: (degrees: number) => boolean,
  ): number {
    const m: IAutoMovieMotionHumanAuditTangleModel.IModel = body.tangle;
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
        point = AutoMovieEngineVector3.add(
          placed[part]!.pose.position,
          AutoMovieEngineQuaternion.rotateVector(
            placed[part]!.pose.rotation,
            m.parts[part]!.probes[corner]!,
          ),
        );
        list[corner] = point;
      }
      return Math.max(1e-3, AutoMovieEngineVector3.distance(point, shoulder));
    };

    let worst: number = 0;
    for (let i: number = 0; i < placed.length; i++) {
      if (!mine[i]) continue;
      const a: IAutoMovieVector3 = centre(i);
      for (let j: number = 0; j < placed.length; j++) {
        if (m.related[i]![j]! || mine[j]) continue;
        const reach: number = m.parts[i]!.radius + m.parts[j]!.radius;
        if (AutoMovieEngineVector3.distance(a, centre(j)) >= reach) continue;
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

  /*
   * The key of an unordered pair of bones.
   * Parameter a: One bone.
   * Parameter b: The other.
   * Returns: The same key for either order.
   */
  export function unordered(
    a: AutoMovieHumanoidBone,
    b: AutoMovieHumanoidBone,
  ): string {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }
}

/*
 * The declared contacts of a person with their own body, as pair keys and
 * spans.
 */
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
