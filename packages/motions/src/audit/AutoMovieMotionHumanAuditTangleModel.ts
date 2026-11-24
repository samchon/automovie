import {
  Quaternion,
  Vector3,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { HumanColliderCorners } from "../posture/HumanColliderCorners";
import { HumanColliders } from "../posture/HumanColliders";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanAuditSkin } from "./AutoMovieMotionHumanAuditSkin";
import { prepareAutoMovieMotionHumanAuditDepths } from "./prepareAutoMovieMotionHumanAuditDepths";

/**
 * The per-body model the tangle audit (`AutoMovieMotionHumanAuditTangle`) reads
 * a pose against: each collider segment's probes and bounding sphere, which
 * pairs of segments are one part or share a joint, the two reference postures,
 * and how deep a probe lies in another segment beyond what the reference
 * postures already show.
 *
 * The reasons for the probes, the related pairs and the reference depths are
 * stated on the audit; this holds their construction and the depth arithmetic.
 */
export namespace AutoMovieMotionHumanAuditTangleModel {
  /**
   * The reference overlap beyond which two segments' surfaces are one volume by
   * their build, metres (`AutoMovieMotionHumanAuditSkin.BUILT`).
   */
  export const BUILT: number = AutoMovieMotionHumanAuditSkin.BUILT;

  /** One collider segment's probes and bounding sphere in its own frame. */
  export interface IPart {
    /** The bone that carries the segment. */
    bone: AutoMovieHumanoidBone;

    /** The segment's shapes. */
    shapes: readonly IAutoMoviePhysicalShape[];

    /** The probes: the shapes' corners, then points along the bone. */
    probes: IAutoMovieVector3[];

    /**
     * How many of the probes, the first ones, are corners of the shapes; the
     * rest lie on the bone's axis.
     */
    surface: number;

    /** The bounding sphere's centre. */
    centre: IAutoMovieVector3;

    /** The bounding sphere's radius, metres. */
    radius: number;

    /**
     * How far from the segment's own origin any of its probes, or any point of
     * the bounding spheres of its shapes, lies, metres: a turn of the segment
     * by an angle moves none of them farther than this times the chord of the
     * angle, which bounds how fast a reading against it moves.
     */
    extent: number;

    /**
     * How far any of its probes lies outside its own shapes, metres: zero for
     * corners on a shape's surface and points of the bone inside a shape. A
     * link pair's certificate (`HumanLinkCertificate`) bounds every probe by
     * its shapes' distance less this.
     */
    offset: number;
  }

  /** What is derived once per body. */
  export interface IModel {
    /** The segments, in the order the colliders are placed. */
    parts: IPart[];

    /** Whether two segments are one part or share a joint. */
    related: boolean[][];

    /**
     * Whether each segment is of that side's arm: its upper arm, its forearm,
     * or its hand with the fingers.
     */
    arms: Record<AutoMovieHumanSide, boolean[]>;

    /** The segments placed in the rest T-pose. */
    rest: IAutoMovieMotionHumanColliders.IPlaced[];

    /** The segments placed in the quiet stance. */
    stance: IAutoMovieMotionHumanColliders.IPlaced[];

    /** The reference depths of each ordered pair's probes, by pair index. */
    baseline: Map<number, Float64Array>;
  }

  /**
   * The part of the body a bone belongs to when several bones are one part: a
   * hand with its fingers, a foot with its toes.
   *
   * @param bone The bone.
   * @returns The part's name; the bone's own otherwise.
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
   */
  export function model(body: IAutoMovieMotionHumanBody): IModel {
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
    const rest: IAutoMovieMotionHumanColliders.IPlaced[] =
      HumanColliders.placed(
        body,
        poseBones(body, { skeleton: body.skeleton.id, root: null, joints: [] }),
      );
    const parts: IPart[] = rest.map(
      (p: IAutoMovieMotionHumanColliders.IPlaced): IPart => {
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
        const inverse: IAutoMovieQuaternion = Quaternion.inverse(
          p.pose.rotation,
        );
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

        // The farthest a probe, or a shape's bounding sphere as the depth
        // reader places it, lies from the segment's origin.
        let extent: number = 0;
        for (const probe of probes)
          extent = Math.max(extent, Vector3.length(probe));
        for (const shape of p.shapes) {
          const ball: IAutoMovieMotionHumanColliders.IBall =
            HumanColliders.bound(shape);
          extent = Math.max(
            extent,
            Vector3.length(
              Vector3.add(
                shape.transform.position,
                Quaternion.rotateVector(shape.transform.rotation, ball.centre),
              ),
            ) + ball.radius,
          );
        }
        // The farthest a probe lies outside the segment's own shapes, read in
        // the segment's frame by the shapes' exact distance.
        let offset: number = 0;
        for (const probe of probes) {
          let near: number = Infinity;
          for (const shape of p.shapes)
            near = Math.min(
              near,
              physicalShapeSegmentDistance(ORIGIN, shape, probe, probe),
            );
          if (near < Infinity) offset = Math.max(offset, near);
        }
        return {
          bone: p.bone,
          shapes: p.shapes,
          probes,
          surface,
          centre,
          radius,
          extent,
          offset,
        };
      },
    );

    // The nearest ancestor of a bone that carries a collider: the joint its
    // collider meets, skipping bones (a clavicle) that have none.
    const collided: ReadonlySet<AutoMovieHumanoidBone> = new Set(
      parts.map((p: IPart): AutoMovieHumanoidBone => p.bone),
    );
    const above: (
      bone: AutoMovieHumanoidBone,
    ) => AutoMovieHumanoidBone | null = (
      bone: AutoMovieHumanoidBone,
    ): AutoMovieHumanoidBone | null => {
      let up: AutoMovieHumanoidBone | null = parent.get(bone) ?? null;
      while (up !== null && !collided.has(up)) up = parent.get(up) ?? null;
      return up;
    };
    // A digit hung directly on the hand (the thumb's metacarpal at the
    // carpometacarpal joint, the fingers' proximal phalanges) rides the
    // carpus the wrist joins to the forearm: a flat hand on a flexed wrist
    // brings the thumb's metacarpal base into the forearm's distal end, so
    // such a digit shares the wrist with the forearm as the hand does.
    const wrist: (digit: IPart, forearm: IPart) => boolean = (
      digit: IPart,
      forearm: IPart,
    ): boolean => {
      const hand: IPart | undefined = parts.find(
        (p: IPart): boolean => p.bone === group(digit.bone),
      );
      return (
        hand !== undefined &&
        hand.bone !== digit.bone &&
        above(digit.bone) === hand.bone &&
        above(hand.bone) === forearm.bone
      );
    };
    const related: boolean[][] = parts.map((a: IPart): boolean[] =>
      parts.map(
        (b: IPart): boolean =>
          a.bone === b.bone ||
          above(a.bone) === b.bone ||
          above(b.bone) === a.bone ||
          group(a.bone) === group(b.bone) ||
          wrist(a, b) ||
          wrist(b, a),
      ),
    );
    const stance: IAutoMovieMotionHumanColliders.IPlaced[] =
      HumanColliders.placed(
        body,
        poseBones(
          body,
          resolveHumanPosture(
            body,
            stand.posture(body, { x: 0, y: 0, z: 0 }, 0),
          ),
        ),
      );
    const arm: (side: AutoMovieHumanSide) => boolean[] = (
      side: AutoMovieHumanSide,
    ): boolean[] =>
      parts.map(
        (p: IPart): boolean =>
          p.bone === `${side}UpperArm` ||
          p.bone === `${side}LowerArm` ||
          group(p.bone) === `${side}Hand`,
      );
    const built: IModel = {
      parts,
      related,
      arms: { left: arm("left"), right: arm("right") },
      rest,
      stance,
      baseline: new Map(),
    };
    MODELS.set(body, built);
    return built;
  }

  /**
   * A placed segment's bounding-sphere centre.
   *
   * @param p The placed segment.
   * @param part Its part in the model.
   * @returns World metres.
   */
  export function centre(
    p: IAutoMovieMotionHumanColliders.IPlaced,
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
   */
  export function depths(
    probes: readonly IAutoMovieVector3[],
    a: IAutoMovieMotionHumanColliders.IPlaced,
    b: IAutoMovieMotionHumanColliders.IPlaced,
  ): Float64Array {
    return prepareAutoMovieMotionHumanAuditDepths(b)(probes, a);
  }

  /**
   * Each probe of segment `i`'s reference depth in segment `j`: the depth it
   * may keep there before the audit reads it as a tangle, which a planner keeps
   * its probes within.
   *
   * @param m The body's model.
   * @param i The segment whose probes are read.
   * @param j The segment they are read in.
   * @returns Metres per probe; `Infinity` for a corner of a pair whose
   *   colliders overlap past the skin by their build.
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
   * @param targets The caller's own list for this one reading of `placed`,
   *   empty when first given: each segment read in is prepared into it once
   *   (`prepareAutoMovieMotionHumanAuditDepths`) and read from it after. The
   *   caller drops it with `placed` and gives it with no other placement.
   * @param room An array of the probes' length to receive each probe's room in
   *   `j` (`prepareAutoMovieMotionHumanAuditDepths`), for a caller that
   *   certifies how long the pair stays clear; not filled when absent.
   * @returns Metres per probe; zero or less where it lies no deeper.
   */
  export function beyond(
    m: IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    i: number,
    j: number,
    targets?: (
      | ReturnType<typeof prepareAutoMovieMotionHumanAuditDepths>
      | undefined
    )[],
    room?: Float64Array,
  ): Float64Array {
    const probes: IAutoMovieVector3[] = m.parts[i]!.probes;
    const baseline: Float64Array = reference(m, i, j);
    const now: Float64Array = (
      targets === undefined
        ? prepareAutoMovieMotionHumanAuditDepths(placed[j]!)
        : (targets[j] ??= prepareAutoMovieMotionHumanAuditDepths(placed[j]!))
    )(probes, placed[i]!, room);
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
   * @param targets The caller's list of prepared segments for this reading of
   *   `placed` (`beyond`).
   * @returns Metres; zero when no probe lies deeper.
   */
  export function excess(
    m: IModel,
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    i: number,
    j: number,
    targets?: Parameters<typeof beyond>[4],
  ): number {
    let worst: number = 0;
    for (const d of beyond(m, placed, i, j, targets))
      worst = Math.max(worst, d);
    return worst;
  }
}

/** The models of live bodies. */
const MODELS: WeakMap<
  IAutoMovieMotionHumanBody,
  AutoMovieMotionHumanAuditTangleModel.IModel
> = new WeakMap();

/** The fingers' part of a bone name. */
const DIGIT: RegExp = /(Thumb|Index|Middle|Ring|Little)/u;

/** The identity pose: a segment's own frame. */
const ORIGIN: IAutoMovieRigidTransform = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};
