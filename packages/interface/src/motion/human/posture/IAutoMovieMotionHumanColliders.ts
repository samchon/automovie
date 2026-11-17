import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalShape } from "../../../physics/IAutoMoviePhysicalShape";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";

/**
 * A posed body's colliders as signed distances: how far a point, or a
 * segment (a capsule weapon's axis), lies outside the body's profile shapes
 * (negative inside), and on which segment.
 *
 * Each profile segment's shapes are placed by its bone: the segment's neutral
 * frame is its rest frame, and the canonical rig rests unrotated, so a
 * segment's posed frame is the bone's world transform applied to the
 * segment's neutral offset from the bone's rest joint. Every shape distance
 * is the engine's single owner, `physicalShapeSegmentDistance`, and the
 * body's distance is the least over its shapes, the distance to their union.
 * A shape whose bounding sphere already lies farther than the least distance
 * found is passed over without the exact query, which cannot change the
 * least, so the searches that call this in loops pay for the near shapes only.
 *
 * @evidence contracts/development/common.md#meaningful-documentation pose: The segment's posed frame, world metres: the bone's world transform applied to the segment's neutral offset from the bone's rest joint. distance: Metres, negative inside. point: The point on the collider surface, world metres.
 * @evidence contracts/development/design.md#principled-representation pose: The segment's posed frame, world metres: the bone's world transform applied to the segment's neutral offset from the bone's rest joint. distance: Metres, negative inside. point: The point on the collider surface, world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkLegBinding.ts (walkLegBinding.relative, a); actions/walkLegBinding.ts (walkLegBinding.relative, b); actions/walkLegBinding.ts (walkLegBinding.inside, shape); actions/walkLegBinding.ts (walkLegBinding.planar, shape); actions/walkLegClearance.ts (walkLegClearance.placed, return); actions/walkLegClearance.ts (walkLegClearance.reading.segmentsOf, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone, IAutoMovieRigidTransform, IAutoMoviePhysicalShape, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanColliders {
  /**
   * One profile segment placed by its posed bone: the parent pose its shapes compose with.
   *
   * @evidence contracts/development/common.md#meaningful-documentation pose: The segment's posed frame, world metres: the bone's world transform applied to the segment's neutral offset from the bone's rest joint.
   * @evidence contracts/development/design.md#principled-representation pose: The segment's posed frame, world metres: the bone's world transform applied to the segment's neutral offset from the bone's rest joint.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: actions/walkLegBinding.ts (walkLegBinding.relative, a); actions/walkLegBinding.ts (walkLegBinding.relative, b); actions/walkLegBinding.ts (walkLegBinding.inside, shape); actions/walkLegBinding.ts (walkLegBinding.planar, shape); actions/walkLegClearance.ts (walkLegClearance.placed, return); actions/walkLegClearance.ts (walkLegClearance.reading.segmentsOf, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone, IAutoMovieRigidTransform, IAutoMoviePhysicalShape identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IPlaced {
    /** The rig bone that carries the segment. */
    bone: AutoMovieHumanoidBone;

    /** The segment's posed frame, world metres: the bone's world transform applied to the segment's neutral offset from the bone's rest joint. */
    pose: IAutoMovieRigidTransform;

    /** The segment's shapes, each placed by `pose` composed with its own transform. */
    shapes: readonly IAutoMoviePhysicalShape[];
  }

  /**
   * A signed distance and the segment it is measured to.
   *
   * @evidence contracts/development/common.md#meaningful-documentation distance: Metres, negative inside.
   * @evidence contracts/development/design.md#principled-representation distance: Metres, negative inside.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanColliders.ts (HumanColliders.distance, return); posture/HumanColliders.ts (HumanColliders.distanceToSegment, return); executable/cases/StrikingLimb.ts (StrikingLimb.gap); posture/HumanColliders.ts (HumanColliders.nearest); posture/HumanColliders.ts (HumanColliders.distanceToSegment); posture/HumanColliders.ts (HumanColliders.cast).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IDistance {
    /** Metres, negative inside. */
    distance: number;

    /** The nearest segment's bone. */
    bone: AutoMovieHumanoidBone;
  }

  /**
   * The first point of a posed body's colliders along a ray, by sphere tracing: the signed distance at a point is how far the ray may advance without passing a surface, so each step moves by it until the distance falls within `CAST_TOLERANCE`. The normal is the distance's gradient there, by central differences over `CAST_PROBE`. A ray that starts inside the body hits at its start. A hand surface laid on the trunk takes its place and facing from this, on the colliders themselves. Where a ray meets a posed body.
   *
   * @evidence contracts/development/common.md#meaningful-documentation point: The point on the collider surface, world metres.
   * @evidence contracts/development/design.md#principled-representation point: The point on the collider surface, world metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanColliders.ts (HumanColliders.cast, return); everyday/HumanTrunk.ts (HumanTrunk.surface).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IHit {
    /** The point on the collider surface, world metres. */
    point: IAutoMovieVector3;

    /** The surface's outward unit normal there. */
    normal: IAutoMovieVector3;

    /** The bone of the segment that was hit. */
    bone: AutoMovieHumanoidBone;
  }

  /**
   * A sphere containing a shape, in the shape's own frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation A centre and a radius, the bound a query tests before the shape itself.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IBall {
    /** The sphere's centre, shape-local metres. */
    centre: IAutoMovieVector3;

    /** The sphere's radius, metres. */
    radius: number;
  }

  /**
   * Where a segment comes nearest a posed body: the signed distance and the bone of `distanceToSegment`, with the point of that bone's colliders nearest the segment and their outward normal there, read by the engine's one proximity owner (`physicalShapeNearest`). A flight's contact reads where it struck and which way the surface faced. Result returned by HumanColliders.nearest. The distance, the bone, the surface point and its outward normal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation point: Nearest collider surface point in world metres. normal: Outward surface normal at that point in world coordinates.
   * @evidence contracts/development/design.md#principled-representation point: Nearest collider surface point in world metres. normal: Outward surface normal at that point in world coordinates.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanColliders.ts (HumanColliders.nearest, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanColliders.IDistance, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type INearestResult = IAutoMovieMotionHumanColliders.IDistance & {
    /** Nearest collider surface point in world metres. */
    point: IAutoMovieVector3;
    /** Outward surface normal at that point in world coordinates. */
    normal: IAutoMovieVector3;
  };
}
