import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  physicalHullFaces,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMoviePhysicalProfile,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanColliders } from "../posture/HumanColliders";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
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
 * - what a probe already lies inside in the body's two reference postures,
 *   the rest T-pose it was modelled in and the quiet stance every performer
 *   starts from (`stand.posture`): the thighs meet at the crotch as the body
 *   was modelled, and the hanging upper arm lies against the ribs, where
 *   flesh gives and a convex collider does not. A probe's depth counts only
 *   beyond the deeper of its own two reference depths in that segment, so a
 *   tangle of the quiet stance itself is not this reading's to find.
 *
 * A caller may also exempt the hand a law declares in contact with the
 * person's own body from the bone that carries the touched region, for the
 * span of that contact window (`exemptions`): the hand is meant to lie there.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the probes, the depth, both removals with their reasons and the declared-contact exemption.
 * @evidence contracts/development/implementation.md#principled-implementation Interior depth of a point in a convex polytope is its least distance to the supporting planes; the engine's hull faces and shape distance are the owners of both.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure A per-body model built once, a bounding-sphere pass, then probes against shapes.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No pair is exempt beyond the stated structural ones, the joint a collider meets being read through bones without colliders; the rest baseline is per probe, so a part of the same segment that is free at rest is read at its full depth.
 * @evidence contracts/development/implementation.md#efficient-algorithms Bounding spheres reject distant pairs before any probe is transformed; a probe costs one plane product per face.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The probes, spheres, pair relation and rest depths of a body are remembered in a `WeakMap` keyed by the body.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One model per live body, released with it; rest depths are bounded by segment pairs.
 */
export namespace AutoMovieMotionHumanAuditTangle {
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
      for (const e of exempt)
        if (t >= e.from && t <= e.to) for (const key of e.pairs) skip.add(key);
      for (const pair of pose(body, motion.bones(subject, t), skip)) {
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
   * @returns The pairs, each once, with the deeper direction.
   */
  export function pose(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    skip: ReadonlySet<string> = new Set(),
  ): IPair[] {
    const m: IModel = model(body);
    const placed: HumanColliders.IPlaced[] = HumanColliders.placed(body, bones);
    const out: IPair[] = [];
    const centres: IAutoMovieVector3[] = placed.map(
      (p: HumanColliders.IPlaced, i: number): IAutoMovieVector3 =>
        centre(p, m.parts[i]!),
    );
    for (let i: number = 0; i < placed.length; i++)
      for (let j: number = i + 1; j < placed.length; j++) {
        if (m.related[i]![j]!) continue;
        const reach: number = m.parts[i]!.radius + m.parts[j]!.radius;
        if (Vector3.length(Vector3.subtract(centres[i]!, centres[j]!)) >= reach)
          continue;
        if (skip.has(unordered(placed[i]!.bone, placed[j]!.bone))) continue;
        const forward: number = excess(m, placed, i, j);
        const backward: number = excess(m, placed, j, i);
        const depth: number = Math.max(forward, backward);
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
    const m: IModel = model(body);
    const o: IModel = model(other);
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
          centre(mine[i]!, m.parts[i]!),
          centre(theirs[j]!, o.parts[j]!),
        );
        if (Vector3.length(apart) >= reach) continue;
        let depth: number = 0;
        for (const d of depths(m.parts[i]!.probes, mine[i]!, theirs[j]!))
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
    const m: IModel = model(body);
    const placed: HumanColliders.IPlaced[] = HumanColliders.placed(body, bones);
    const shoulder: IAutoMovieVector3 = bones.get(
      `${side}UpperArm`,
    )!.worldPosition;
    const mine = (bone: AutoMovieHumanoidBone): boolean =>
      bone === `${side}UpperArm` ||
      bone === `${side}LowerArm` ||
      group(bone) === `${side}Hand`;
    let worst: number = 0;
    for (let i: number = 0; i < placed.length; i++) {
      if (!mine(placed[i]!.bone)) continue;
      const a: IAutoMovieVector3 = centre(placed[i]!, m.parts[i]!);
      for (let j: number = 0; j < placed.length; j++) {
        if (m.related[i]![j]! || mine(placed[j]!.bone)) continue;
        const reach: number = m.parts[i]!.radius + m.parts[j]!.radius;
        if (
          Vector3.length(
            Vector3.subtract(a, centre(placed[j]!, m.parts[j]!)),
          ) >= reach
        )
          continue;
        const over: Float64Array = beyond(m, placed, i, j);
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

/** One collider segment's probes and bounding sphere in its own frame. */
interface IPart {
  bone: AutoMovieHumanoidBone;
  shapes: readonly IAutoMoviePhysicalProfile.IShape[];
  probes: IAutoMovieVector3[];
  centre: IAutoMovieVector3;
  radius: number;
}

/** What is derived once per body. */
interface IModel {
  parts: IPart[];
  related: boolean[][];
  rest: HumanColliders.IPlaced[];
  stance: HumanColliders.IPlaced[];
  baseline: Map<number, Float64Array>;
}

/** A declared self-contact: pair keys left unread in a span of film seconds. */
interface IExemption {
  from: number;
  to: number;
  pairs: string[];
}

const MODELS: WeakMap<IHumanBody, IModel> = new WeakMap();

/** The fingers' part of a bone name. */
const DIGIT: RegExp = /(Thumb|Index|Middle|Ring|Little)/u;

/** The part of the body a bone belongs to when several bones are one part: a hand with its fingers, a foot with its toes. */
const group = (bone: AutoMovieHumanoidBone): string => {
  const side: string = bone.startsWith("left")
    ? "left"
    : bone.startsWith("right")
      ? "right"
      : "";
  if (side === "") return bone;
  if (bone.endsWith("Hand") || DIGIT.test(bone)) return `${side}Hand`;
  if (bone.endsWith("Foot") || bone.endsWith("Toes")) return `${side}Foot`;
  return bone;
};

/** The body's model, built on first use. */
const model = (body: IHumanBody): IModel => {
  const known: IModel | undefined = MODELS.get(body);
  if (known !== undefined) return known;
  const parent: Map<AutoMovieHumanoidBone, AutoMovieHumanoidBone | null> =
    new Map();
  const children: Map<AutoMovieHumanoidBone, AutoMovieHumanoidBone[]> =
    new Map();
  for (const bone of body.skeleton.bones as IAutoMovieBone[]) {
    parent.set(bone.bone, bone.parent);
    if (bone.parent !== null)
      children.set(bone.parent, [
        ...(children.get(bone.parent) ?? []),
        bone.bone,
      ]);
  }
  const rest: HumanColliders.IPlaced[] = HumanColliders.placed(
    body,
    poseBones(body, { skeleton: body.skeleton.id, root: null, joints: [] }),
  );
  const parts: IPart[] = rest.map((p: HumanColliders.IPlaced): IPart => {
    const probes: IAutoMovieVector3[] = [];
    for (const shape of p.shapes)
      for (const corner of corners(shape))
        probes.push(
          Vector3.add(
            shape.transform.position,
            Quaternion.rotateVector(shape.transform.rotation, corner),
          ),
        );
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(p.pose.rotation);
    const joint: IAutoMovieVector3 = body.rest.get(p.bone)!;
    for (const child of children.get(p.bone) ?? [])
      for (const share of [0.25, 0.5, 0.75])
        probes.push(
          Quaternion.rotateVector(
            inverse,
            Vector3.subtract(
              Vector3.add(
                joint,
                Vector3.scale(
                  Vector3.subtract(body.rest.get(child)!, joint),
                  share,
                ),
              ),
              p.pose.position,
            ),
          ),
        );
    let centre: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const probe of probes)
      centre = Vector3.add(centre, Vector3.scale(probe, 1 / probes.length));
    let radius: number = 0;
    for (const probe of probes)
      radius = Math.max(
        radius,
        Vector3.length(Vector3.subtract(probe, centre)),
      );
    return { bone: p.bone, shapes: p.shapes, probes, centre, radius };
  });
  // The nearest ancestor of a bone that carries a collider: the joint its
  // collider meets, skipping bones (a clavicle) that have none.
  const collided: ReadonlySet<AutoMovieHumanoidBone> = new Set(
    parts.map((p: IPart): AutoMovieHumanoidBone => p.bone),
  );
  const above = (bone: AutoMovieHumanoidBone): AutoMovieHumanoidBone | null => {
    let up: AutoMovieHumanoidBone | null = parent.get(bone) ?? null;
    while (up !== null && !collided.has(up)) up = parent.get(up) ?? null;
    return up;
  };
  const related: boolean[][] = parts.map((a: IPart): boolean[] =>
    parts.map(
      (b: IPart): boolean =>
        a.bone === b.bone ||
        above(a.bone) === b.bone ||
        above(b.bone) === a.bone ||
        group(a.bone) === group(b.bone),
    ),
  );
  const stance: HumanColliders.IPlaced[] = HumanColliders.placed(
    body,
    poseBones(
      body,
      resolveHumanPosture(body, stand.posture(body, { x: 0, y: 0, z: 0 }, 0)),
    ),
  );
  const built: IModel = { parts, related, rest, stance, baseline: new Map() };
  MODELS.set(body, built);
  return built;
};

/** A shape's corners in its own frame: a hull's points, a box's corners, and the poles and equators of a sphere or a capsule. */
const corners = (
  shape: IAutoMoviePhysicalProfile.IShape,
): readonly IAutoMovieVector3[] => {
  if (shape.kind === "hull") return physicalHullFaces(shape.points).vertices;
  if (shape.kind === "box") {
    const h: IAutoMovieVector3 = shape.halfExtents;
    return [-1, 1].flatMap((x: number): IAutoMovieVector3[] =>
      [-1, 1].flatMap((y: number): IAutoMovieVector3[] =>
        [-1, 1].map(
          (z: number): IAutoMovieVector3 => ({
            x: x * h.x,
            y: y * h.y,
            z: z * h.z,
          }),
        ),
      ),
    );
  }
  const r: number = shape.radius;
  const half: number = shape.kind === "capsule" ? shape.halfLength : 0;
  return [
    { x: 0, y: half + r, z: 0 },
    { x: 0, y: -half - r, z: 0 },
    ...(half === 0 ? [0] : [-half, 0, half]).flatMap(
      (y: number): IAutoMovieVector3[] => [
        { x: r, y, z: 0 },
        { x: -r, y, z: 0 },
        { x: 0, y, z: r },
        { x: 0, y, z: -r },
      ],
    ),
  ];
};

/** A placed segment's bounding-sphere centre, world metres. */
const centre = (p: HumanColliders.IPlaced, part: IPart): IAutoMovieVector3 =>
  Vector3.add(
    p.pose.position,
    Quaternion.rotateVector(p.pose.rotation, part.centre),
  );

/** How deep each probe of placed segment `a` lies in placed segment `b`, metres, zero outside. */
const depths = (
  probes: readonly IAutoMovieVector3[],
  a: HumanColliders.IPlaced,
  b: HumanColliders.IPlaced,
): Float64Array => {
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(b.pose.rotation);
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    inverse,
    a.pose.rotation,
  );
  const position: IAutoMovieVector3 = Quaternion.rotateVector(
    inverse,
    Vector3.subtract(a.pose.position, b.pose.position),
  );
  const out: Float64Array = new Float64Array(probes.length);
  for (let k: number = 0; k < probes.length; k++) {
    // The probe in segment j's frame.
    const local: IAutoMovieVector3 = Vector3.add(
      position,
      Quaternion.rotateVector(rotation, probes[k]!),
    );
    let deepest: number = 0;
    for (const shape of b.shapes) {
      if (shape.kind !== "hull") {
        deepest = Math.max(
          deepest,
          -physicalShapeSegmentDistance(IDENTITY, shape, local, local),
        );
        continue;
      }
      const point: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(shape.transform.rotation),
        Vector3.subtract(local, shape.transform.position),
      );
      let inside: number = Infinity;
      for (const face of physicalHullFaces(shape.points).faces) {
        inside = Math.min(
          inside,
          face.offset - Vector3.dot(face.normal, point),
        );
        if (inside <= deepest) break;
      }
      if (inside !== Infinity) deepest = Math.max(deepest, inside);
    }
    out[k] = deepest;
  }
  return out;
};

/** How deep each probe of segment `i` lies in segment `j` beyond its own reference depth there, metres; zero or less where it does not. */
const beyond = (
  m: IModel,
  placed: readonly HumanColliders.IPlaced[],
  i: number,
  j: number,
): Float64Array => {
  const key: number = i * m.parts.length + j;
  const probes: IAutoMovieVector3[] = m.parts[i]!.probes;
  let baseline: Float64Array | undefined = m.baseline.get(key);
  if (baseline === undefined) {
    baseline = depths(probes, m.rest[i]!, m.rest[j]!);
    const stance: Float64Array = depths(probes, m.stance[i]!, m.stance[j]!);
    for (let k: number = 0; k < baseline.length; k++)
      baseline[k] = Math.max(baseline[k]!, stance[k]!);
    m.baseline.set(key, baseline);
  }
  const now: Float64Array = depths(probes, placed[i]!, placed[j]!);
  for (let k: number = 0; k < now.length; k++) now[k] = now[k]! - baseline[k]!;
  return now;
};

/** The deepest any probe of segment `i` lies in segment `j` beyond its own rest depth there. */
const excess = (
  m: IModel,
  placed: readonly HumanColliders.IPlaced[],
  i: number,
  j: number,
): number => {
  let worst: number = 0;
  for (const d of beyond(m, placed, i, j)) worst = Math.max(worst, d);
  return worst;
};

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
    const part: string = window.contact.part;
    if (part !== "leftHand" && part !== "rightHand") continue;
    const touched: AutoMovieHumanoidBone =
      body.surfaces.regions[support.region].bone;
    const pairs: string[] = [];
    for (const bone of body.skeleton.bones as IAutoMovieBone[])
      if (group(bone.bone) === part)
        pairs.push(
          AutoMovieMotionHumanAuditTangle.unordered(bone.bone, touched),
        );
    out.push({ from: window.from, to: window.to, pairs });
  }
  return out;
};

const IDENTITY: IAutoMoviePhysicalProfile.ITransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};
