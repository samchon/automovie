import { Vector3, physicalShapeNearest } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalShapeNearest,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliderBound } from "./HumanColliderBound";
import { HumanColliderDistance } from "./HumanColliderDistance";
import { HumanColliderPlacement } from "./HumanColliderPlacement";

/** The record of `IReadingResult`'s site. */
type IReadingResult = {
  segment: (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    taper?: readonly [number, number],
  ) => IAutoMovieMotionHumanColliders.IDistance;
  cast: (
    from: IAutoMovieVector3,
    direction: IAutoMovieVector3,
    reach: number,
  ) => IAutoMovieMotionHumanColliders.IHit | undefined;
};

/**
 * A posed body's colliders as signed distances: how far a point, or a segment
 * (a capsule weapon's axis), lies outside the body's profile shapes (negative
 * inside), and on which segment.
 *
 * Each profile segment's shapes are placed by its bone: the segment's neutral
 * frame is its rest frame, and the canonical rig rests unrotated, so a
 * segment's posed frame is the bone's world transform applied to the segment's
 * neutral offset from the bone's rest joint. Every shape distance is the
 * engine's single owner, `physicalShapeSegmentDistance`, and the body's
 * distance is the least over its shapes, the distance to their union. A shape
 * whose bounding sphere already lies farther than the least distance found is
 * passed over without the exact query, which cannot change the least, so the
 * searches that call this in loops pay for the near shapes only.
 */
export namespace HumanColliders {
  /**
   * Where a segment comes nearest a posed body: the signed distance and the
   * bone of `distanceToSegment`, with the point of that bone's colliders
   * nearest the segment and their outward normal there, read by the engine's
   * one proximity owner (`physicalShapeNearest`). A flight's contact reads
   * where it struck and which way the surface faced.
   *
   * @param body The body.
   * @param bones Its posed bones, world frame.
   * @param a One end, world metres.
   * @param b The other end, world metres.
   * @returns The distance, the bone, the surface point and its outward normal.
   * @throws {Error} When the reduction remains positive Infinity, including an
   *   empty observed profile.
   */
  export function nearest(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): IAutoMovieMotionHumanColliders.INearestResult {
    const placements: readonly IAutoMovieMotionHumanColliders.IPlaced[] =
      placed(body, bones);
    const found: IAutoMovieMotionHumanColliders.IDistance =
      HumanColliderDistance(placements, a, b, undefined, 0);
    let best: IAutoMoviePhysicalShapeNearest.IResult | undefined;
    for (const { bone, pose, shapes } of placements) {
      if (bone !== found.bone) continue;
      for (const shape of shapes) {
        const near: IAutoMoviePhysicalShapeNearest.IResult =
          physicalShapeNearest(pose, shape, a, b);
        if (best === undefined || near.distance < best.distance) best = near;
      }
    }
    return {
      distance: found.distance,
      bone: found.bone,
      point: best!.point,
      normal: best!.normal,
    };
  }

  /**
   * The signed distance from a point to a posed body.
   *
   * @param body The body.
   * @param bones Its posed bones, world frame.
   * @param point The point, world metres.
   * @returns The distance to the nearest collider and its bone.
   * @throws {Error} When the reduction remains positive Infinity, including an
   *   empty observed profile.
   */
  export function distance(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    point: IAutoMovieVector3,
  ): IAutoMovieMotionHumanColliders.IDistance {
    return distanceToSegment(body, bones, point, point);
  }

  /**
   * The signed distance from a segment to a posed body: the least over the
   * segment's points of their signed distance to the body's colliders. A
   * zero-length segment is a point. Given a taper, the segment is widened by a
   * radius running linearly from its end at `a` to its end at `b` (a tapered
   * capsule weapon), and the distance is less that radius at each point.
   *
   * @param body The body.
   * @param bones Its posed bones, world frame.
   * @param a One end, world metres.
   * @param b The other end, world metres.
   * @param taper The radii at `a` and at `b`, metres; absent for the bare
   *   segment.
   * @returns The distance to the nearest collider and its bone.
   * @throws {Error} When the reduction remains positive Infinity, including an
   *   empty observed profile.
   */
  export function distanceToSegment(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    taper?: readonly [number, number],
  ): IAutoMovieMotionHumanColliders.IDistance {
    const widest: number =
      taper === undefined ? 0 : Math.max(taper[0], taper[1]);
    return HumanColliderDistance(placed(body, bones), a, b, taper, widest);
  }

  /**
   * Query varying world segments and rays against one unchanged posed body
   * during a synchronous contact operation. Release the reader with that
   * operation; changed bones/profile geometry require a new reading.
   */
  export function reading(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IReadingResult {
    let query: ReturnType<typeof HumanColliderDistance.prepare> | undefined;
    const segment: ReturnType<typeof reading>["segment"] = (
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
      taper?: readonly [number, number],
    ): IAutoMovieMotionHumanColliders.IDistance =>
      (query ??= HumanColliderDistance.prepare(placed(body, bones)))(
        a,
        b,
        taper,
      );
    return {
      segment,
      cast: (
        from: IAutoMovieVector3,
        direction: IAutoMovieVector3,
        reach: number,
      ): IAutoMovieMotionHumanColliders.IHit | undefined =>
        castOn(segment, from, direction, reach),
    };
  }
  /**
   * The first point of a posed body's colliders along a ray, by sphere tracing:
   * the signed distance at a point is how far the ray may advance without
   * passing a surface, so each step moves by it until the distance falls within
   * `CAST_TOLERANCE`. The normal is the distance's gradient there, by central
   * differences over `CAST_PROBE`. A ray that starts inside the body hits at
   * its start. A hand surface laid on the trunk takes its place and facing from
   * this, on the colliders themselves.
   *
   * @param body The body.
   * @param bones The posed bones to test, world frame; a segment whose bone is
   *   absent is not tested.
   * @param from The ray's start, world metres.
   * @param direction Where it runs; any non-zero vector.
   * @param reach How far it runs, metres.
   * @returns The hit, or `undefined` when the ray passes the body within
   *   `reach` or only grazes it for `CAST_STEPS` steps.
   * @throws {Error} When no tested segment has a shape.
   */
  export function cast(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    from: IAutoMovieVector3,
    direction: IAutoMovieVector3,
    reach: number,
  ): IAutoMovieMotionHumanColliders.IHit | undefined {
    return reading(body, bones).cast(from, direction, reach);
  }

  /**
   * Trace each actual ray against a caller-owned, unchanged segment geometry
   * reader.
   */
  function castOn(
    segment: ReturnType<typeof reading>["segment"],
    from: IAutoMovieVector3,
    direction: IAutoMovieVector3,
    reach: number,
  ): IAutoMovieMotionHumanColliders.IHit | undefined {
    const along: IAutoMovieVector3 = Vector3.normalize(direction);
    const atPoint: (
      point: IAutoMovieVector3,
    ) => IAutoMovieMotionHumanColliders.IDistance = (
      point: IAutoMovieVector3,
    ): IAutoMovieMotionHumanColliders.IDistance => {
      return segment(point, point);
    };
    let travelled: number = 0;
    for (let i: number = 0; i < CAST_STEPS; i++) {
      const point: IAutoMovieVector3 = Vector3.addScaled(
        from,
        along,
        travelled,
      );
      const near: IAutoMovieMotionHumanColliders.IDistance = atPoint(point);
      if (near.distance <= CAST_TOLERANCE) {
        const slope: (axis: IAutoMovieVector3) => number = (
          axis: IAutoMovieVector3,
        ): number =>
          atPoint(Vector3.add(point, axis)).distance -
          atPoint(Vector3.subtract(point, axis)).distance;
        return {
          point,
          normal: Vector3.normalize({
            x: slope(CAST_X),
            y: slope(CAST_Y),
            z: slope(CAST_Z),
          }),
          bone: near.bone,
        };
      }
      travelled += near.distance;
      if (travelled > reach) return undefined;
    }
    return undefined;
  }

  /**
   * The lowest world height any of a posed body's colliders reaches, metres:
   * the least over the placed shapes of their exact world axis bounds
   * (`physicalShapeBounds`). This is what a body lying or falling rests on, and
   * it is synchronous, unlike the engine's physics geometry, which needs the
   * physics runtime initialised.
   *
   * @param body The body.
   * @param bones Its posed bones, world frame.
   * @returns The least world Y of every collider, metres.
   * @throws {Error} When the reduction remains positive Infinity, including an
   *   empty observed profile.
   */
  export function lowest(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): number {
    const low: number = HumanColliderPlacement.lowest(body, bones);
    if (low === Infinity)
      throw new Error("A body without colliders has no lowest point");
    return low;
  }

  /**
   * Prepare exact collider floor minima for fixed bone-name groups.
   *
   * @param body The unchanged canonical body supplying neutral profile
   *   geometry.
   * @param groups Copied ordered name sets; omission requests one whole-profile
   *   minimum.
   * @returns A current-bone reader returning fresh world-metre minima in group
   *   order. An unobserved group remains Infinity; NaN and negative Infinity
   *   follow the original Math.min reduction, without lowest's
   *   positive-Infinity refusal.
   */
  export function prepareMinima(
    body: IAutoMovieMotionHumanBody,
    groups?: readonly ReadonlySet<AutoMovieHumanoidBone>[],
  ): ReturnType<typeof HumanColliderPlacement.prepareMinima> {
    return HumanColliderPlacement.prepareMinima(body, groups);
  }

  /** Existing posed-segment type, owned by HumanColliderPlacement. */
  export interface IPlaced extends HumanColliderPlacement.IPlaced {}

  /**
   * Every profile segment of a posed body with the frame its shapes are placed
   * in. The canonical rig rests unrotated and a segment's neutral frame is its
   * rest frame, so the posed frame is the bone's world rotation applied to the
   * neutral offset from the bone's rest joint. A left segment is its right
   * twin's mirror image in the median plane (`mirrored`), its offset, turn and
   * shapes, point for point, as the surfaces are (8d750b565), so a left-hand
   * problem mirrored to the right reads the very colliders a right-hand one
   * does. This is the single owner of collider placement; distances and bounds
   * read it.
   *
   * @param body The body.
   * @param bones Its posed bones, world frame.
   * @returns The placed segments, in profile order; a segment whose bone the
   *   pose does not carry is skipped.
   */
  export function placed(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IAutoMovieMotionHumanColliders.IPlaced[] {
    return HumanColliderPlacement.of(body, bones);
  }

  /**
   * Prepare actual profile entries for a fixed bone demand and varying poses.
   *
   * @param body The unchanged body owning neutral profile placement metadata.
   * @param requested Canonical names to snapshot; unrequested map entries are
   *   ignored.
   * @returns Fresh posed segments for the demanded names present in each
   *   current map, retaining original profile order and duplicates.
   */
  export function preparePlaced(
    body: IAutoMovieMotionHumanBody,
    requested: ReadonlySet<AutoMovieHumanoidBone>,
  ): ReturnType<typeof HumanColliderPlacement.preparePlaced> {
    return HumanColliderPlacement.preparePlaced(body, requested);
  }

  /**
   * Borrow the canonical profile-bearing bone demand for scoped FK. Only fixed
   * neutral metadata is shared; every posed collider query stays current.
   */
  export function bones(
    body: IAutoMovieMotionHumanBody,
  ): ReadonlySet<AutoMovieHumanoidBone> {
    return HumanColliderPlacement.bones(body);
  }

  /**
   * Prepare the body's neutral mirrored metadata and every hull's faces.
   * Current world placement remains a fresh read of the posed bones.
   *
   * @param body The body.
   */
  export function prepare(body: IAutoMovieMotionHumanBody): void {
    HumanColliderPlacement.prepare(body);
  }

  /**
   * The sphere about a shape's centre that contains it: a sphere's own radius,
   * a capsule's half length plus radius, a box's half diagonal, a hull's vertex
   * radius about its vertex mean. A point outside it is outside the shape, so a
   * query may skip the shape there.
   *
   * @param shape The shape.
   * @returns The sphere, in the shape's frame.
   * @throws {Error} On an unknown shape kind.
   */
  export function bound(
    shape: IAutoMoviePhysicalShape,
  ): IAutoMovieMotionHumanColliders.IBall {
    return HumanColliderBound(shape);
  }
}

/** How near a traced ray must come to a surface to have hit it, metres. */
const CAST_TOLERANCE: number = 1e-5;

/** The half step of the central differences a hit's normal is read by, metres. */
const CAST_PROBE: number = 1e-4;

/**
 * The most steps a ray is traced for; a ray that needs more only grazes the
 * body.
 */
const CAST_STEPS: number = 64;

/** The original positive central-difference axes, never mutated or returned. */
const CAST_X: IAutoMovieVector3 = { x: CAST_PROBE, y: 0, z: 0 };
const CAST_Y: IAutoMovieVector3 = { x: 0, y: CAST_PROBE, z: 0 };
const CAST_Z: IAutoMovieVector3 = { x: 0, y: 0, z: CAST_PROBE };
