import {
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
  /**
   * The reference overlap beyond which two segments' surfaces are one volume
   * by their build, metres: the 10 mm a pressed skin gives, the audit's own
   * limit for a tangle. Two colliders deeper in each other than that while
   * the body stands at rest cannot be told apart by their corners.
   */
  export const BUILT: number = 0.01;

  /** One collider segment's probes and bounding sphere in its own frame. */
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

  /** What is derived once per body. */
  export interface IModel {
    /** The segments, in the order the colliders are placed. */
    parts: IPart[];

    /** Whether two segments are one part or share a joint. */
    related: boolean[][];

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
        for (const corner of corners(shape))
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
    const above = (
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
    const built: IModel = { parts, related, rest, stance, baseline: new Map() };
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
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One relative transform, then one loop over probes and shapes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The engine owns the hull faces and the shape distance.
   * @evidence contracts/development/implementation.md#efficient-algorithms A face loop stops once a probe is no deeper than the deepest found.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Poses are read independently.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh array and retains nothing.
   */
  export function depths(
    probes: readonly IAutoMovieVector3[],
    a: HumanColliders.IPlaced,
    b: HumanColliders.IPlaced,
  ): Float64Array {
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
  }

  /**
   * How deep each probe of segment `i` lies in segment `j` beyond its own
   * reference depth there.
   *
   * @param m The body's model.
   * @param placed The body's placed segments.
   * @param i The segment whose probes are read.
   * @param j The segment they are read in.
   * @returns Metres per probe; zero or less where it lies no deeper.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the unit and the sign.
   * @evidence contracts/development/implementation.md#principled-implementation The reference depth is the deeper of the rest pose's and the quiet stance's; corners share their pair's deepest reference depth, set aside past `BUILT`, and a point of the bone's axis keeps its own.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The remembered baseline, then one subtraction per probe.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only the corners share a depth, so a crossing limb's axis is read in full.
   * @evidence contracts/development/implementation.md#efficient-algorithms The baseline is computed once per ordered pair.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Remembered in the model's baseline map.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The baselines live with the model, bounded by the segment pairs.
   */
  export function beyond(
    m: IModel,
    placed: readonly HumanColliders.IPlaced[],
    i: number,
    j: number,
  ): Float64Array {
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
    const now: Float64Array = depths(probes, placed[i]!, placed[j]!);
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
   * @returns Metres; zero when no probe lies deeper.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the unit and the zero.
   * @evidence contracts/development/implementation.md#principled-implementation The greatest of `beyond`'s readings, floored at zero.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the probes, with no algorithm to choose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `beyond`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function excess(
    m: IModel,
    placed: readonly HumanColliders.IPlaced[],
    i: number,
    j: number,
  ): number {
    let worst: number = 0;
    for (const d of beyond(m, placed, i, j)) worst = Math.max(worst, d);
    return worst;
  }
}

/** The models of live bodies. */
const MODELS: WeakMap<IHumanBody, AutoMovieMotionHumanAuditTangleModel.IModel> =
  new WeakMap();

/** The fingers' part of a bone name. */
const DIGIT: RegExp = /(Thumb|Index|Middle|Ring|Little)/u;

/** The identity frame a shape's distance is read in. */
const IDENTITY: IAutoMoviePhysicalProfile.ITransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
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
