import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMoviePhysicalProfile,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanColliderCorners } from "../posture/HumanColliderCorners";
import { HumanColliders } from "../posture/HumanColliders";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanAuditSkin } from "./AutoMovieMotionHumanAuditSkin";
import { prepareAutoMovieMotionHumanAuditDepths } from "./prepareAutoMovieMotionHumanAuditDepths";

/**
 * The per-body model the tangle audit (`AutoMovieMotionHumanAuditTangle`)
 * reads a pose against: each collider segment's probes and bounding sphere,
 * which pairs of segments are one part or share a joint, the two reference
 * postures, and how deep a probe lies in another segment beyond what the
 * reference postures already show.
 *
 * The reasons for the probes, the related pairs and the reference depths
 * are stated on the audit; this holds their construction and the depth
 * arithmetic.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is modelled, for whom, and where the reasons are stated.
 * @evidence contracts/development/design.md#principled-representation One model per body, built once, from which every reading of the audit is a lookup and a depth.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The model's records, its construction and the four depth readings the audit calls.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every probe and sphere is read from the body's own colliders and joints.
 */
export namespace AutoMovieMotionHumanAuditTangleModel {
  /** The reference overlap beyond which two segments' surfaces are one volume by their build, metres (`AutoMovieMotionHumanAuditSkin.BUILT`). */
  export const BUILT: number = AutoMovieMotionHumanAuditSkin.BUILT;

  /** One collider segment's probes and bounding sphere in its own frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the carrying bone, ordered shape/axis probes, surface prefix and metre-valued local sphere.
   * @evidence contracts/development/design.md#principled-representation Actual collider corners and along-bone points share one segment-local frame and its conservative bounding sphere.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Model construction produces every field for the canonical audit, arm-frame and trajectory reference readers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No probe is invented from a scene, no physical radius is padded and surface/axis ownership stays explicit.
   */
  export interface IPart {
    /** The bone that carries the segment. */
    bone: AutoMovieHumanoidBone;

    /** The segment's shapes. */
    shapes: readonly IAutoMoviePhysicalProfile.IShape[];

    /** The probes: the shapes' corners, then points along the bone. */
    probes: IAutoMovieVector3[];

    /** How many of the probes, the first ones, are corners of the shapes; the rest lie on the bone's axis. */
    surface: number;

    /** The bounding sphere's centre. */
    centre: IAutoMovieVector3;

    /** The bounding sphere's radius, metres. */
    radius: number;
  }

  /** What is derived once per body.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States ordered parts, own-body exclusions, the two actual reference placements and lazy ordered-pair depth readings.
   * @evidence contracts/development/design.md#principled-representation A body's actual build and fixed reference poses define its probe allowances; external bodies receive no such own-body reference.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The shared model supplies the audit and arm planner without duplicating collider construction or reference policy.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The existing live-body cache holds this build only; current candidate poses and scores are not represented as model state.
   */
  export interface IModel {
    /** The segments, in the order the colliders are placed. */
    parts: IPart[];

    /** Whether two segments are one part or share a joint. */
    related: boolean[][];

    /** Whether each segment is of that side's arm: its upper arm, its forearm, or its hand with the fingers. */
    arms: Record<"left" | "right", boolean[]>;

    /** The segments placed in the rest T-pose. */
    rest: HumanColliders.IPlaced[];

    /** The segments placed in the quiet stance. */
    stance: HumanColliders.IPlaced[];

    /** The reference depths of each ordered pair's probes, by pair index. */
    baseline: Map<number, Float64Array>;
  }

  /**
   * The part of the body a bone belongs to when several bones are one part:
   * a hand with its fingers, a foot with its toes.
   *
   * @param bone The bone.
   * @returns The part's name; the bone's own otherwise.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the result and the two grouped parts.
   * @evidence contracts/development/implementation.md#principled-implementation A finger belongs to its hand and a toe to its foot by the rig's naming.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One side test and two suffix tests.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A bone with no side is its own part.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function group(bone: AutoMovieHumanoidBone): string {
    const side: string = bone.startsWith("left")
      ? "left"
      : bone.startsWith("right")
        ? "right"
        : "";
    if (side === "") return bone;
    if (bone.endsWith("Hand") || DIGIT.test(bone)) return `${side}Hand`;
    if (bone.endsWith("Foot") || bone.endsWith("Toes")) return `${side}Foot`;
    return bone;
  }

  /**
   * The body's model, built on first use.
   *
   * @param body The body.
   * @returns The model, the same one for every later call with this body.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the result and that it is remembered.
   * @evidence contracts/development/implementation.md#principled-implementation Probes are the shapes' corners and three points along the bone to each child joint; two segments are related when they are one part or one's nearest ancestor with a collider is the other; the reference postures are the rest T-pose and the quiet stance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The skeleton's relations, the probes and spheres, the related pairs, then the stance.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A bone without a collider is skipped to its ancestor, never treated as a joint of its own.
   * @evidence contracts/development/implementation.md#efficient-algorithms Built once per body; pairs are quadratic in the segments, a few dozen.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Remembered in a `WeakMap` keyed by the body.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One model per live body, released with it.
   */
  export function model(body: IHumanBody): IModel {
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
        for (const corner of HumanColliderCorners(shape))
          probes.push(
            Vector3.add(
              shape.transform.position,
              Quaternion.rotateVector(shape.transform.rotation, corner),
            ),
          );
      const surface: number = probes.length;
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
      return {
        bone: p.bone,
        shapes: p.shapes,
        probes,
        surface,
        centre,
        radius,
      };
    });

    // The nearest ancestor of a bone that carries a collider: the joint its
    // collider meets, skipping bones (a clavicle) that have none.
    const collided: ReadonlySet<AutoMovieHumanoidBone> = new Set(
      parts.map((p: IPart): AutoMovieHumanoidBone => p.bone),
    );
    const above: (bone: AutoMovieHumanoidBone) => AutoMovieHumanoidBone | null = (
      bone: AutoMovieHumanoidBone,
    ): AutoMovieHumanoidBone | null => {
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
    const arm: (side: "left" | "right") => boolean[] = (side: "left" | "right"): boolean[] =>
      parts.map((p: IPart): boolean =>
        p.bone === `${side}UpperArm` || p.bone === `${side}LowerArm` || group(p.bone) === `${side}Hand`);
    const built: IModel = { parts, related, arms: { left: arm("left"), right: arm("right") }, rest, stance, baseline: new Map() };
    MODELS.set(body, built);
    return built;
  }

  /**
   * A placed segment's bounding-sphere centre.
   *
   * @param p The placed segment.
   * @param part Its part in the model.
   * @returns World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the unit.
   * @evidence contracts/development/implementation.md#principled-implementation The part's centre carried by the segment's pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Carries the supplied canonical centre without replacing it by the bone origin or modifying its radius.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function centre(
    p: HumanColliders.IPlaced,
    part: IPart,
  ): IAutoMovieVector3 {
    return Vector3.add(
      p.pose.position,
      Quaternion.rotateVector(p.pose.rotation, part.centre),
    );
  }

  /**
   * How deep each probe of placed segment `a` lies in placed segment `b`.
   *
   * @param probes The probes, in `a`'s frame.
   * @param a The segment that carries them.
   * @param b The segment they are read in.
   * @returns Metres per probe, zero outside.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the unit and the outside value.
   * @evidence contracts/development/implementation.md#principled-implementation Interior depth of a point in a convex hull is its least distance to the face planes; other shapes are read by the engine's shape distance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reading through `prepareAutoMovieMotionHumanAuditDepths`, which owns the arithmetic; a caller reading many segments against `b` in one pose prepares `b` once there (`beyond`'s `targets`).
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The engine still owns every hull face and shape distance. Shape DTO transforms remain unchanged during this synchronous depth read; no query, bound, face order, deepest comparison or tolerance changes.
   * @evidence contracts/development/implementation.md#efficient-algorithms One preparation of `b` and one reading: sphere screening, selected point transforms and the face loop's early cut, with each selected hull's inverse computed once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared between calls here; the preparation lives for this one reading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The preparation is dropped on return; only the fresh depth array escapes.
   */
  export function depths(
    probes: readonly IAutoMovieVector3[],
    a: HumanColliders.IPlaced,
    b: HumanColliders.IPlaced,
  ): Float64Array {
    return prepareAutoMovieMotionHumanAuditDepths(b)(probes, a);
  }

  /**
   * Each probe of segment `i`'s reference depth in segment `j`: the depth it
   * may keep there before the audit reads it as a tangle, which a planner
   * keeps its probes within.
   *
   * @param m The body's model.
   * @param i The segment whose probes are read.
   * @param j The segment they are read in.
   * @returns Metres per probe; `Infinity` for a corner of a pair whose colliders overlap past the skin by their build.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the unit, who reads it and the value of a pair the audit sets aside.
   * @evidence contracts/development/implementation.md#principled-implementation The reference depth is the deeper of the rest pose's and the quiet stance's; corners share their pair's deepest reference depth, set aside past `BUILT`, and a point of the bone's axis keeps its own.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two depth readings, one maximum per probe, then the corners' shared depth.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only the corners share a depth, so a crossing limb's axis is read in full.
   * @evidence contracts/development/implementation.md#efficient-algorithms Computed once per ordered pair.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Remembered in the model's baseline map, which `beyond` reads too.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The baselines live with the model, bounded by the segment pairs.
   */
  export function reference(m: IModel, i: number, j: number): Float64Array {
    const key: number = i * m.parts.length + j;
    const probes: IAutoMovieVector3[] = m.parts[i]!.probes;
    let baseline: Float64Array | undefined = m.baseline.get(key);
    if (baseline === undefined) {
      baseline = depths(probes, m.rest[i]!, m.rest[j]!);
      const stance: Float64Array = depths(probes, m.stance[i]!, m.stance[j]!);
      for (let k: number = 0; k < baseline.length; k++)
        baseline[k] = Math.max(baseline[k]!, stance[k]!);

      // Two surfaces that already overlap in a reference posture slide along
      // each other as the body moves, so another corner comes to lie where
      // the first one lay; the pair's deepest reference depth is what every
      // corner of the segment may keep. Where that depth is more than the
      // skin gives, the two colliders occupy one volume by their build and
      // their corners say nothing of the motion. A point of the bone's axis
      // keeps its own.
      const surface: number = m.parts[i]!.surface;
      let shared: number = 0;
      for (let k: number = 0; k < surface; k++)
        shared = Math.max(shared, baseline[k]!);
      for (let k: number = 0; k < surface; k++)
        baseline[k] = shared > BUILT ? Infinity : shared;
      m.baseline.set(key, baseline);
    }
    return baseline;
  }

  /**
   * How deep each probe of segment `i` lies in segment `j` beyond its own
   * reference depth there (`reference`).
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param i The segment whose probes are read.
   * @param j The segment they are read in.
   * @param targets The caller's own list for this one reading of `placed`, empty when first given: each segment read in is prepared into it once (`prepareAutoMovieMotionHumanAuditDepths`) and read from it after. The caller drops it with `placed` and gives it with no other placement.
   * @returns Metres per probe; zero or less where it lies no deeper.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the unit, the sign, and whose the list of prepared segments is and how long it holds.
   * @evidence contracts/development/implementation.md#principled-implementation The depth now less the reference depth, probe by probe.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The reference, then one subtraction per probe.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every probe is read against its own reference, none skipped.
   * @evidence contracts/development/implementation.md#efficient-algorithms One depth reading per call; the reference is computed once per ordered pair, and with `targets` what a reading needs of segment `j` alone once per pose rather than once per pair.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads `reference`. A prepared segment is shared only through the list its caller made for the same `placed`, by that segment's index, so it is the preparation of `placed[j]` as placed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh array; the list, one entry per segment read in, is the caller's and ends with its reading.
   */
  export function beyond(
    m: IModel,
    placed: readonly HumanColliders.IPlaced[],
    i: number,
    j: number,
    targets?: (ReturnType<typeof prepareAutoMovieMotionHumanAuditDepths> | undefined)[],
  ): Float64Array {
    const probes: IAutoMovieVector3[] = m.parts[i]!.probes;
    const baseline: Float64Array = reference(m, i, j);
    const now: Float64Array = targets === undefined
      ? depths(probes, placed[i]!, placed[j]!)
      : (targets[j] ??= prepareAutoMovieMotionHumanAuditDepths(placed[j]!))(probes, placed[i]!);
    for (let k: number = 0; k < now.length; k++)
      now[k] = now[k]! - baseline[k]!;
    return now;
  }

  /**
   * The deepest any probe of segment `i` lies in segment `j` beyond its own
   * reference depth there.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param i The segment whose probes are read.
   * @param j The segment they are read in.
   * @param targets The caller's list of prepared segments for this reading of `placed` (`beyond`).
   * @returns Metres; zero when no probe lies deeper.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the unit and the zero.
   * @evidence contracts/development/implementation.md#principled-implementation The greatest of `beyond`'s readings, floored at zero.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every original beyond reading and the zero floor without a new margin or pair exemption.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the probes, with no algorithm to choose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `beyond`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function excess(
    m: IModel,
    placed: readonly HumanColliders.IPlaced[],
    i: number,
    j: number,
    targets?: Parameters<typeof beyond>[4],
  ): number {
    let worst: number = 0;
    for (const d of beyond(m, placed, i, j, targets)) worst = Math.max(worst, d);
    return worst;
  }
}

/** The models of live bodies. */
const MODELS: WeakMap<IHumanBody, AutoMovieMotionHumanAuditTangleModel.IModel> =
  new WeakMap();

/** The fingers' part of a bone name. */
const DIGIT: RegExp = /(Thumb|Index|Middle|Ring|Little)/u;
