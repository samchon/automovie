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
 * @evidence contracts/development/design.md#principled-representation Couples current placed profile geometry with signed point/segment queries, nearest surface witnesses and sphere-traced ray hits in world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps the existing distance, nearest, ray, bounds and placement facades; HumanColliderPlacement owns neutral metadata and current placement while engine query owners retain their numerical geometry.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Preserves the original broad-sphere screen, strict first-winner comparisons, scalar/full two-pass nearest policy and ray constants; only unchanged placement and fixed shape-frame metadata may be shared within one synchronous operation.
 * @evidence contracts/development/common.md#meaningful-documentation Defines query signs, frames, shape ownership, broad-phase policy and separation of neutral versus current placement.
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
   * @throws {Error} When the reduction remains positive Infinity, including an empty observed profile.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Retains the scalar union-distance pass, then measures full nearest witnesses on every shape of its winning bone through the engine's existing owner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One current placement feeds the unchanged distanceOn policy and the original ordered full-witness pass.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps both passes, the scalar distance result, winning-bone restriction and strict first-minimum tie behavior; no full result or minimizer is substituted for another query.
   * @evidence contracts/development/implementation.md#efficient-algorithms Adds O(S) placement once for S profile segments to the delegated scalar query and W full queries on the winning bone's W shapes, avoiding a second placement pass and its frame allocations.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Body/profile/bones remain unchanged during this synchronous query and the engine leaves them untouched, so both passes share their actual placed frames; distance and full-witness computations still run separately.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Placement metadata lives only for this call; the returned distance and witnesses retain no placements, body, bones or query history.
   * @evidence contracts/development/common.md#meaningful-documentation States both passes, their preserved winner/tie policy, current-input premise, delegated costs and ownership.
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
   * @throws {Error} When the reduction remains positive Infinity, including an empty observed profile.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Treats the point as a zero-length segment and delegates to the same signed union-distance owner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call preserves the point/segment correspondence without duplicating geometry.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses actual shape distances and the unchanged broad-phase/winner policy, without a point-specific approximation or tolerance.
   * @evidence contracts/development/implementation.md#efficient-algorithms Pays the documented placement and shape-query costs of distanceToSegment; the wrapper adds constant work and no numeric arrays.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the segment query implementation; each distinct point still runs its actual current geometric queries.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new distance/bone record without retaining the point, body or posed frames.
   * @evidence contracts/development/common.md#meaningful-documentation Defines the zero-length correspondence, signed units, failure and delegated ownership.
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
   * zero-length segment is a point. Given a taper, the segment is widened by
   * a radius running linearly from its end at `a` to its end at `b` (a
   * tapered capsule weapon), and the distance is less that radius at each
   * point.
   *
   * @param body The body.
   * @param bones Its posed bones, world frame.
   * @param a One end, world metres.
   * @param b The other end, world metres.
   * @param taper The radii at `a` and at `b`, metres; absent for the bare segment.
   * @returns The distance to the nearest collider and its bone.
   * @throws {Error} When the reduction remains positive Infinity, including an empty observed profile.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reads the minimum signed segment-to-shape distance, less the declared taper, using the existing conservative sphere screen and engine shape query.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Computes the original widest taper before placement, then delegates ordered shape traversal to distanceOn, which also serves nearest and ray probes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains the original greater-or-equal sphere rejection, strict first-minimum update, taper interpolation and empty-profile refusal; no candidate policy or numerical threshold changes.
   * @evidence contracts/development/implementation.md#efficient-algorithms Adds O(S) placement for S segments to one ordered pass over shapes and the delegated exact costs of shapes not screened out; no whole result is cached.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the unchanged distanceOn implementation; composite same-pose operations may supply their existing placements to that private owner while every new point/segment query recomputes its own distance.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Current placements and temporary shape bounds live for this call; only the scalar distance and bone escape.
   * @evidence contracts/development/common.md#meaningful-documentation States segment/point cases, taper units, traversal and rejection policy, delegated cost and failure.
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
   * Query varying world segments and rays against one unchanged posed body during a
   * synchronous contact operation. Release the reader with that operation;
   * changed bones/profile geometry require a new reading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines fixed body/bones, varying segments/tapers/rays, world units and synchronous lifetime; segment and cast share only the bound geometry.
   * @evidence contracts/development/implementation.md#principled-implementation Places actual profile geometry once, delegates each segment to the same signed union-distance owner and every ray to cast's unchanged sphere-tracing/normal-probe owner over that segment reader.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A lazy bound segment reader owns placement lifetime and HumanColliderDistance.prepare owns sphere/query-frame scratch; castOn owns the original ray loop used by this reader and standalone cast.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every segment, point, taper and ray probe is actually queried with original shape order, strict ties, screens, ray constants and empty-profile refusal; no distance, hit or contact verdict is cached.
   * @evidence contracts/development/implementation.md#efficient-algorithms Pays O(S) placement once across segment queries and ray marches on S segments, preparing at most F world spheres/engine frames on first use; each actual segment and at most 64 ray steps plus six normal probes retain their exact query costs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The explicit caller keeps body/profile and posed bones unchanged until its synchronous contact completes; any geometry change requires another reading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns one lazy closure, one placement and at most F spheres/readers through the contact operation; it retains no queried point, result, previous pose or global history and acquires no external handle.
   */
  export function reading(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): {
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
  } {
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
   * The first point of a posed body's colliders along a ray, by sphere
   * tracing: the signed distance at a point is how far the ray may advance
   * without passing a surface, so each step moves by it until the distance
   * falls within `CAST_TOLERANCE`. The normal is the distance's gradient
   * there, by central differences over `CAST_PROBE`. A ray that starts inside
   * the body hits at its start. A hand surface laid on the trunk takes its
   * place and facing from this, on the colliders themselves.
   *
   * @param body The body.
   * @param bones The posed bones to test, world frame; a segment whose bone is absent is not tested.
   * @param from The ray's start, world metres.
   * @param direction Where it runs; any non-zero vector.
   * @param reach How far it runs, metres.
   * @returns The hit, or `undefined` when the ray passes the body within `reach` or only grazes it for `CAST_STEPS` steps.
   * @throws {Error} When no tested segment has a shape.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the original sphere-tracing distance steps and six central-difference probes to estimate the accepted point's outward normal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Constructs a bound geometry reader and delegates to its cast method; castOn keeps one original ray march, hit test and gradient owner shared with repeated rays on a prepared reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves CAST_STEPS=64, CAST_TOLERANCE=1e-5, CAST_PROBE=1e-4, inside-start behavior and every queried point; no pose-identity cache, query-result reuse or new success condition is added.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most 64 march queries and six hit probes retain all point-to-sphere and physical shape-query costs. Vector3.addScaled preserves scale-before-add arithmetic without a discarded scaled vector per step; fixed probe-axis vectors allocate no per-hit axis records. O(S) placement is paid once; each of F shapes prepares its sphere and engine frame at most once at their original first screen/query phases, with O(S+F) local metadata.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Bones/profile stay unchanged and queries do not mutate them, so probes share current placements, world spheres and engine-owned fixed-shape frames in original order. Opaque readers are acquired only at the first unscreened query; every changed point still runs the same actual distance owner and sphere predicate. The engine owns the same component read/multiply/add order, and private immutable probe axes retain the original positive half-step on each component.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Placements start at the first distance read, spheres at their first screen and opaque readers at their first unscreened shape query; all end on hit, miss or throw. At most F readers retain fixed geometry, never query points/results, and the hit retains no body, frames, spheres or readers.
   * @evidence contracts/development/common.md#meaningful-documentation States ray units, signed-distance stepping, inherited numerical policies, lazy metadata scope and hit/miss ownership.
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

  /** Trace each actual ray against a caller-owned, unchanged segment geometry reader. */
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
   * @throws {Error} When the reduction remains positive Infinity, including an empty observed profile.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reduces each currently placed profile shape's actual minimum world Y using the engine bounds owner's same shape formula, frame composition and hull vertex order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure HumanColliderPlacement stages the original current placement inputs before one ordered scalar shape-minimum sweep; this facade preserves its original positive-Infinity refusal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps every shape, the original Math.min sequence and empty-profile refusal without substituting candidate approximations or a contact tolerance.
   * @evidence contracts/development/implementation.md#efficient-algorithms Stages O(S) actual segment Y/rotation/name/shape inputs, then fixed primitive work or O(V) for each V-vertex hull. The shared scalar owner omits unused X/Z, posed wrappers and max extrema while retaining every Y expression/comparison; no previous posture's minimum is reused.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the same placement/bounds owners as floor readers while freshly computing the supplied current pose's minimum.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one scalar and retains no current pose, shape or bounds array.
   * @evidence contracts/development/common.md#meaningful-documentation Defines exact bounds reduction, world Y units, shape coverage and empty-profile behavior.
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
   * @param body The unchanged canonical body supplying neutral profile geometry.
   * @param groups Copied ordered name sets; omission requests one whole-profile minimum.
   * @returns A current-bone reader returning fresh world-metre minima in group order. An unobserved group remains Infinity; NaN and negative Infinity follow the original Math.min reduction, without lowest's positive-Infinity refusal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed body/group membership, whole-profile default, current bones, world-metre output order, fresh arrays and original Infinity/NaN policies.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates genuine neutral-entry selection and scalar placement to HumanColliderPlacement; each selected shape's original engine minimum-Y formula updates every matched group in profile/shape/group order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One facade exposes the shared fixed-group producer to floor and gymnastics consumers, with placement, staging and numerical bounds kept in their existing owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains selected profile duplicates, missing-bone skips, overlapping groups, shape/vertex order and Math.min nonfinite behavior. No supplied indices, floor answer, contact allowance or substituted collider enters the API.
   * @evidence contracts/development/implementation.md#efficient-algorithms The owning producer indexes K memberships across G groups and selects R of S entries once. Each query stages four O(R) scalar/reference arrays and computes each selected shape bound once before group updates, omitting unused placed/pose/XYZ records without a measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed unchanged neutral geometry and copied group names establish membership equivalence. Every selected current bone transform and shape minimum still evaluates; no pose, query result or time sample is reused.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the producer's selected neutral references and bounded name/group metadata until release. The facade retains nothing; query staging ends on return/throw and only a fresh numeric array escapes, without input maps, sets, dynamic frames or growing history.
   */
  export function prepareMinima(
    body: IAutoMovieMotionHumanBody,
    groups?: readonly ReadonlySet<AutoMovieHumanoidBone>[],
  ): ReturnType<typeof HumanColliderPlacement.prepareMinima> {
    return HumanColliderPlacement.prepareMinima(body, groups);
  }

  /**
   * Existing posed-segment type, owned by HumanColliderPlacement.
   *
   * @evidence contracts/development/design.md#principled-representation Inherits the same canonical bone, current world frame and neutral shape references used by every collider query.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Preserves the existing augmentable HumanColliders.IPlaced interface while the actual placement owner defines its members once.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Imports the actual placement representation without a second shape definition or cached nearest answer.
   * @evidence contracts/development/common.md#meaningful-documentation States the owning placement type and preserved public name.
   */
  export interface IPlaced extends HumanColliderPlacement.IPlaced {}

  /**
   * Every profile segment of a posed body with the frame its shapes are placed
   * in. The canonical rig rests unrotated and a segment's neutral frame is its
   * rest frame, so the posed frame is the bone's world rotation applied to the
   * neutral offset from the bone's rest joint. A left segment is its right
   * twin's mirror image in the median plane (`mirrored`), its offset, turn and
   * shapes, point for point, as the surfaces are (8d750b565), so a left-hand
   * problem mirrored to the right reads the very colliders a right-hand one
   * does. This is the single owner of collider placement; distances and
   * bounds read it.
   *
   * @param body The body.
   * @param bones Its posed bones, world frame.
   * @returns The placed segments, in profile order; a segment whose bone the pose does not carry is skipped.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Delegates the unchanged canonical neutral-offset and median-reflection placement to HumanColliderPlacement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One facade preserves current consumers while the neutral metadata and actual frame producer live together.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves profile order, first right-twin selection, absent-bone skip and all original transform expressions.
   * @evidence contracts/development/implementation.md#efficient-algorithms Pays HumanColliderPlacement.of's O(S) current-frame work plus its documented first-use neutral preparation; the facade adds no array or copy.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Keeps existing per-body neutral metadata with its owner; each call reads current bones, while nearest/cast share their returned frames only for their unchanged synchronous operation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the producer's fresh placed array and owns no second cache or current-frame lifetime beyond its caller.
   * @evidence contracts/development/common.md#meaningful-documentation States placement ownership, geometry conventions, ordering, costs and fresh output lifetime.
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
   * @param requested Canonical names to snapshot; unrequested map entries are ignored.
   * @returns Fresh posed segments for the demanded names present in each current map, retaining original profile order and duplicates.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines fixed unchanged body/name demand, varying current bones, absent-frame skip, ignored extra frames and fresh ordered output.
   * @evidence contracts/development/implementation.md#principled-implementation The actual placement owner selects its genuine neutral profile entries once, then uses the same neutral-offset/world-rotation formula as placed for every current demanded frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One facade returns HumanColliderPlacement's body-bound fixed-entry producer; no second neutral representation or placement loop is added here.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves every selected profile entry, duplicate and original order, current absent-bone skip and all placement expressions; no posed frame, collider result or derived external geometry is accepted or cached.
   * @evidence contracts/development/implementation.md#efficient-algorithms One O(S) neutral-entry selection replaces the full S-entry profile traversal on each of Q reads. Each read visits only D demanded entries and performs their actual current placement, without hull search or a measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The body and requested-name snapshot establish fixed neutral-entry membership; changing either requires new preparation. Every supplied current bone frame is still read and placed normally, with fresh outputs.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the producer's bounded selected neutral entries until its binding/action ends; the facade retains no reader, current bones, placed array or query/time history.
   */
  export function preparePlaced(
    body: IAutoMovieMotionHumanBody,
    requested: ReadonlySet<AutoMovieHumanoidBone>,
  ): ReturnType<typeof HumanColliderPlacement.preparePlaced> {
    return HumanColliderPlacement.preparePlaced(body, requested);
  }

  /**
   * Borrow the canonical profile-bearing bone demand for scoped FK. Only
   * fixed neutral metadata is shared; every posed collider query stays current.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the read-only canonical FK demand and unchanged-body metadata lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation The neutral placement owner lists every canonical bone whose posed frame a profile segment consumes, with ancestors handled by the engine's requested FK.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One facade delegates name ownership to HumanColliderPlacement alongside its neutral segments.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No collider shape, contact, pose or query result is omitted or reused; missing canonical profile names preserve existing placement skips.
   * @evidence contracts/development/implementation.md#efficient-algorithms Delegates first O(B+S) fixed indexing then constant borrowed reads; scoped FK can avoid bones with no profile observation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the established unchanged-body neutral metadata cache, without another body or posed-result cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The existing weak body owner holds at most B names with its neutral segments; this facade retains nothing and callers leave the borrowed set unchanged.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes fixed neutral/hull preparation from current posed-frame construction.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates original neutral reflection and hull-face preparation to their single placement and engine owners.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One facade call preserves body preparation while HumanColliderPlacement owns its neutral traversal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Prepares the same original shapes and faces without a current-pose or nearest-result cache.
   * @evidence contracts/development/implementation.md#efficient-algorithms Pays the owning neutral and hull-face first-use costs at body preparation; current query placement still takes its documented O(S) work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The moved existing neutral WeakMap and existing hull-point preparation share only their established unchanged-body/geometry inputs.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Adds no cache: the owning existing weak body and points lifetimes remain, and no posed bones or ray state is retained here.
   */
  export function prepare(body: IAutoMovieMotionHumanBody): void {
    HumanColliderPlacement.prepare(body);
  }

  /**
   * The sphere about a shape's centre that contains it: a sphere's own
   * radius, a capsule's half length plus radius, a box's half diagonal, a
   * hull's vertex radius about its vertex mean. A point outside it is outside
   * the shape, so a query may skip the shape there.
   *
   * @param shape The shape.
   * @returns The sphere, in the shape's frame.
   * @throws {Error} On an unknown shape kind.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each kind's sphere, its frame and what it allows.
   * @evidence contracts/development/implementation.md#principled-implementation Each sphere contains its shape: a capsule's farthest point is its half length plus its radius from its centre, a box's its half diagonal, a hull's a vertex.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates unchanged shape-local containing formulas to HumanColliderBound, separately from this facade's current posed distance queries.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unknown kind throws.
   * @evidence contracts/development/implementation.md#efficient-algorithms Primitive kinds take constant work; hulls read their existing cached centre/radius, with the hull owner's geometry preparation cost only on a cold points array.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A hull's centre and radius come from `physicalHullFaces`, which keeps them by its points.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new ball record with a fresh primitive origin or borrowed immutable hull centre; this function retains no shape or result, and the hull owner keeps its existing geometry cache.
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

/** The most steps a ray is traced for; a ray that needs more only grazes the body. */
const CAST_STEPS: number = 64;

/** The original positive central-difference axes, never mutated or returned. */
const CAST_X: IAutoMovieVector3 = { x: CAST_PROBE, y: 0, z: 0 };
const CAST_Y: IAutoMovieVector3 = { x: 0, y: CAST_PROBE, z: 0 };
const CAST_Z: IAutoMovieVector3 = { x: 0, y: 0, z: CAST_PROBE };
