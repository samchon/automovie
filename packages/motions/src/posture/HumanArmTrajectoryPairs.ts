import {
  Quaternion,
  Vector3,
  physicalShapeNormal,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmShapes as S } from "./HumanArmShapes";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryOverlap } from "./HumanArmTrajectoryOverlap";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

/**
 * What the arm trajectory reads at one waypoint
 * (`HumanArmTrajectoryModel`): each segment's deepest collider probe against
 * the body and another body, the body's corners against the arm's own
 * colliders (the audit reads every pair both ways), each arm's against the
 * other arm, each site's current placement, and the small rotation readings
 * the objective and its model share.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names waypoint collision pairs, moving sites and the shared geometric readings used by the merit and convex model.
 * @evidence contracts/development/design.md#principled-representation Pair indices identify actual frame geometry; shortfalls are millimetres, while site points and shape inputs stay in world metres and angular residuals in degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns fixed-body pairs, site placement and rotation readings; moving-arm and reverse pairs alias HumanArmTrajectoryOverlap rather than repeat its definitions.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Keeps collider identity, reference depths, declared rests, grasp contacts and the original query cut; no scene-specific target or new tolerance is represented.
 */
export namespace HumanArmTrajectoryPairs {
  /** A segment's deepest probe in one shape: `short` is how far, millimetres, it lies below what it may (negative when clear).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines probe/shape indices, signed millimetre shortfall and the declared-rest flag.
   * @evidence contracts/development/design.md#principled-representation One deepest actual collider probe per audit-part/shape pair; current geometry supplies bounded indices and the context supplies physical allowances.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The merit, refusal and convex rows consume these four fields from deepest without another geometry representation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Negative shortfalls remain clear gaps, and exact ties retain the first probe; no padded clearance or combined rest allowance is represented.
   */
  export interface IPair {
    /** The segment's deepest probe. */
    probe: number;

    /** The shape, by index in the frame. */
    shape: number;

    /** How far the probe lies below what it may, millimetres. */
    short: number;

    /** Whether the pair is a declared rest (`HumanArmTrajectoryModel.IRest`). */
    rested: boolean;
  }

  /** The moving-arm pair owned by HumanArmTrajectoryOverlap.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the canonical moving-arm pair owner.
   * @evidence contracts/development/design.md#principled-representation The actual probe, shape, owning segment and millimetre shortfall returned by the moving-arm collision reader.
   * @evidence contracts/development/design.md#minimal-and-owned-surface An alias preserves existing merit/model imports while every field remains owned by HumanArmTrajectoryOverlap.ICrossing.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No field is copied, dropped, cast or adapted in this alias.
   */
  export type ICrossing = HumanArmTrajectoryOverlap.ICrossing;

  /** The reverse collider pair owned by HumanArmTrajectoryOverlap.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the owner of body/external corners embedded in an arm collider.
   * @evidence contracts/development/design.md#principled-representation The reverse reader's original corner, collider, owner and millimetre shortfall record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Pair consumers share HumanArmTrajectoryOverlap.IEmbedded directly instead of declaring another reverse-contact type.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias changes neither external-part identity nor own-body reference exemptions.
   */
  export type IEmbedded = HumanArmTrajectoryOverlap.IEmbedded;

  /** A site where an iterate puts it: its point, normal and rotation, its touched collider's distance, and the segment it rides on.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Documents world point/frame fields, optional collider and riding segment, and point-distance/normal callbacks.
   * @evidence contracts/development/design.md#principled-representation An actual site at one candidate, in world metres and quaternion, with queries on its touched collider; a surface-free held grip returns zero surface readings.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The merit, hard task limits and convex rows consume these fields and queries; located constructs the coherent world or attached variants.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional shape/on fields keep the existing producer's cases; callers use its coherent records rather than fabricate a collider or replace a contact disc with point equality.
   */
  export interface ILocated {
    /** The site's world point. */
    point: IAutoMovieVector3;

    /** The touched collider's outward normal at the point; none for a site on nothing. */
    normal?: IAutoMovieVector3;

    /** The hand's world rotation on the site; free when absent. */
    rotation?: IAutoMovieQuaternion;

    /** The touched collider. */
    shape?: G.IShape;

    /** A world point's signed distance to the touched collider, metres; zero without a surface.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Specifies world-metre input, signed-metre output and the no-surface zero case.
     * @evidence contracts/development/implementation.md#principled-implementation located delegates actual touched geometry to the engine point query; a surface-free closed-chain contact has no surface separation to constrain.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure The producer closes over one actual shape or supplies its original constant-zero closure.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No allowance, skin depth or substitute distance enters this callback.
     * @evidence contracts/development/implementation.md#efficient-algorithms One existing engine point query or constant zero, without a body traversal.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows the candidate's touched collider; distance mathematics remains with physicalShapeSegmentDistance.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The located record owns the closure lifetime and borrowed shape; no queried-point or distance history is retained.
     */
    gap: (p: IAutoMovieVector3) => number;

    /** The touched collider's world normal, the site's fallback without one, or zero for a surface-free grip.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines world-metre input and the surface normal, borrowed fallback or surface-free grip zero returned.
     * @evidence contracts/development/implementation.md#principled-implementation located uses physicalShapeNormal's original radial or smooth-plane reading on actual geometry, with its supplied fallback direction.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure The producer delegates when a shape exists, otherwise returning its original fallback or grip zero.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The engine's normal policy is retained rather than replaced by the bounding-sphere direction.
     * @evidence contracts/development/implementation.md#efficient-algorithms An existing engine normal query or constant fallback work, with no FK or candidate search.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the located candidate's actual shape and fallback; each point still receives its own normal reading.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The record holds closure inputs while live, with no query cache; fallback vectors may be borrowed as before.
     */
    normalAt: (p: IAutoMovieVector3) => IAutoMovieVector3;

    /** The other arm's segment the site rides on, and that segment's origin. */
    on?: {
      /** Index of the arm carrying the site at this waypoint. */
      arm: number;

      /** Its rigid segment carrying the site. */
      owner: "upper" | "lower" | "hand";

      /** That segment's actual world origin, metres. */
      origin: IAutoMovieVector3;
    };
  }

  /** The three world axes. */
  export const AXES: readonly IAutoMovieVector3[] = [
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
  ];

  /**
   * Two unit directions across a normal.
   *
   * @param n The unit normal.
   * @returns Two unit directions perpendicular to it and to each other.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the admitted unit normal and the two unit orthogonal tangents returned.
   * @evidence contracts/development/implementation.md#principled-implementation A coordinate axis chosen away from parallel gives a nonzero cross; normalizing it and crossing again completes an orthogonal basis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Choose a helper axis, normalize one cross, then form the second tangent.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains the original 0.9 helper-axis branch for basis conditioning without changing any physical bound.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two cross products and one normalization use constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The first tangent constructs the second; vector arithmetic remains with its existing owners.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh tangents and retains neither the normal nor state.
   */
  export function tangents(
    n: IAutoMovieVector3,
  ): [IAutoMovieVector3, IAutoMovieVector3] {
    const helper: IAutoMovieVector3 =
      Math.abs(n.x) < 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
    const t1: IAutoMovieVector3 = Vector3.normalize(Vector3.cross(n, helper));
    return [t1, Vector3.cross(n, t1)];
  }

  /**
   * How far short of its bound the trajectory reads a pair exactly,
   * millimetres: TrajOpt's contact check reads only pairs within a check
   * distance of their safety distance (Schulman et al. 2014, d_check), and
   * no reading of a pair further short than its active set (`T.CHECK`) uses
   * it, the merit counting only a pair past its bound (or a declared rest,
   * read whatever its distance) and the convex model only a pair within the
   * active set. A shape's bounding sphere bounds its distance from below,
   * so a probe the sphere shows further short than this is left unread,
   * its pair keeping that bound until a probe read exactly passes it: the
   * pair keeps its first place among the pairs, and its depth is past every
   * user's reach whichever value it keeps.
   */
  export const CUT: number = T.CHECK;

  /**
   * Each segment's deepest collider probe against each shape near it at a
   * waypoint, the tangle audit's pairs: by the audit part the probe belongs
   * to and the shape, a pair the audit does not read (one part, or two that
   * share a joint) left out.
   *
   * @param c The context.
   * @param a The arm.
   * @param k The waypoint.
   * @param placed The arm placed there.
   * @param cut How far short of its bound a pair may be left unread, millimetres (`CUT` where the reading's users need no more); every pair in reach is read when absent.
   * @returns The pairs by part and shape.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines indexed deepest pairs, millimetre cut and own-part/joint exclusions.
   * @evidence contracts/development/implementation.md#principled-implementation Bounding spheres conservatively select actual probes; original reference allowances and shape gaps select each pair's deepest admissible reading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Each probe's complete sphere pass precedes the unchanged exact-query loop; a private buffer transfers completed sphere distances and selected shapes lazily acquire opaque fixed-geometry readers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves reach, CUT, exclusions, first-winner ties, rest/reference callbacks and exact query order; no pair receives a new allowance.
   * @evidence contracts/development/implementation.md#efficient-algorithms P probes traverse their screened shape lists and required exact queries. One O(S) numeric buffer for S shapes removes repeated selected-pair norms and difference vectors; fresh index lists and branch-and-bound remain.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work nearby supplies the same candidate probe's actual sphere gap. A prepared engine reader shares only each selected shape's unchanged frame geometry; every exact distance and original allowance/rest query still runs in order, and callbacks leave geometry/probes unchanged.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Numeric gaps and at most one opaque reader per queried frame shape die with this candidate read. The reader array is created only after an actual exact query is selected; returned map entries contain only scalar indices/shortfalls, never scratch or a retained query reader.
   */
  export function deepest(
    c: M.IContext,
    a: number,
    k: number,
    placed: G.IPlaced,
    cut: number = Infinity,
  ): Map<number, IPair> {
    const frame: G.IFrame = c.frames[a]![k]!;
    const out: Map<number, IPair> = new Map();
    const screened: S.IScreen = S.screen(
      frame,
      placed,
      T.REACH,
      c.reachable[a]![k]!,
    );
    const gaps: number[] = [];
    let queries: ReturnType<typeof S.prepareGap>[] | undefined;
    placed.probes.forEach(
      ([p, r]: readonly [IAutoMovieVector3, number], probe: number): void => {
        if (probe < G.SURFACE) return;
        const part: number = frame.segments[probe - G.SURFACE]!;
        for (const shape of S.nearby(frame, placed, probe, T.REACH, screened, gaps)) {
          const other: number = frame.shapes[shape]!.part;
          if (frame.related[part]?.[other] === true) continue;

          // A part of -1 is the arm's own segment's; one number keys the pair.
          const key: number = (part + 1) * frame.shapes.length + shape;
          const known: IPair | undefined = out.get(key);
          const allowance: number = c.allowed(a, k, probe, shape);

          // The shape's bounding sphere bounds its distance from below, so a
          // probe it shows no deeper than the pair's deepest so far is not
          // read exactly: it could not replace it (branch and bound).
          const bound: number = 1000 * (allowance - (gaps[shape]! - r));
          if (known !== undefined && bound <= known.short) continue;
          if (
            bound < -cut &&
            !c.rested(a, k, probe, frame.shapes[shape]!.bone)
          ) {
            if (known === undefined)
              out.set(key, { probe, shape, short: bound, rested: false });
            continue;
          }
          let query: ReturnType<typeof S.prepareGap> | undefined = queries?.[shape];
          if (query === undefined) {
            query = S.prepareGap(frame, shape);
            if (queries === undefined) queries = [];
            queries[shape] = query;
          }
          const short: number =
            1000 * (allowance - (query(p, p) - r));
          if (known === undefined || short > known.short)
            out.set(key, {
              probe,
              shape,
              short,
              rested: c.rested(a, k, probe, frame.shapes[shape]!.bone),
            });
        }
      },
    );
    return out;
  }

  /** The two moving arms' pairs (HumanArmTrajectoryOverlap.crossing). */
  export const crossing: typeof HumanArmTrajectoryOverlap.crossing =
    HumanArmTrajectoryOverlap.crossing;

  /** The reverse body and external pairs (HumanArmTrajectoryOverlap.embedded). */
  export const embedded: typeof HumanArmTrajectoryOverlap.embedded =
    HumanArmTrajectoryOverlap.embedded;

  /**
   * A site where an iterate puts it: the base's own for a site that rides
   * nothing; the riding segment's frame carried by its arm's iterate
   * otherwise.
   *
   * @param c The context.
   * @param placed Every arm placed at every waypoint, or a reader of the arms at this one waypoint.
   * @param a The arm whose site it is.
   * @param k The waypoint.
   * @param site The site.
   * @returns The site as placed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States world or riding site inputs and the actual located record returned.
   * @evidence contracts/development/implementation.md#principled-implementation An attached site's local point, rotation and normal are transformed by its actual carrying segment; world sites retain their point and context's touched collider.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure World, surface-free grip and surface-contact branches build the existing coherent site/query records.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps arm-reader call order, touched-shape index, fallback and contact ownership; no pose or surface is inferred from unrelated geometry.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed pose composition plus original collider placement when a riding surface is needed; later queries use that actual shape.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses current placed arms, S.colliders and existing world-shape query owners, without caching site or arm-reader results.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh outer record, borrowing original world points/fallbacks while attached compositions are fresh. Closures retain only their located shape/fallback inputs and no query history.
   */
  export function located(
    c: M.IContext,
    placed: readonly (readonly G.IPlaced[])[] | ((arm: number) => G.IPlaced),
    a: number,
    k: number,
    site: M.ISite,
  ): ILocated {
    const where: number = c.touched[a]![k]!;
    if (site.on === undefined) {
      const frame: G.IFrame = c.frames[a]![k]!;
      const shape: G.IShape | undefined =
        where < 0 ? undefined : frame.shapes[where];
      return {
        point: site.point,
        ...(c.normals[a]![k] === undefined
          ? {}
          : { normal: c.normals[a]![k]! }),
        ...(site.rotation === undefined ? {} : { rotation: site.rotation }),
        ...(shape === undefined ? {} : { shape }),
        gap: (p: IAutoMovieVector3): number =>
          shape === undefined
            ? 0
            : physicalShapeSegmentDistance(shape.pose, shape.shape, p, p),
        normalAt: (p: IAutoMovieVector3): IAutoMovieVector3 =>
          shape === undefined
            ? c.normals[a]![k]!
            : physicalShapeNormal(
                shape.pose,
                shape.shape,
                p,
                c.normals[a]![k]!,
              ),
      };
    }
    const on: NonNullable<M.ISite["on"]> = site.on;
    const theirs: G.IPlaced =
      typeof placed === "function" ? placed(on.arm) : placed[on.arm]![k]!;
    const [origin, turn]: [IAutoMovieVector3, IAutoMovieQuaternion] =
      on.owner === "upper"
        ? [theirs.shoulder, theirs.upper]
        : on.owner === "lower"
          ? [theirs.elbow, theirs.lower]
          : [theirs.wrist, theirs.hand];
    const point: IAutoMovieVector3 = Vector3.add(
      origin,
      Quaternion.rotateVector(turn, on.point),
    );
    const rotation: { rotation?: IAutoMovieQuaternion } =
      on.rotation === undefined
        ? {}
        : { rotation: Quaternion.multiply(turn, on.rotation) };
    // A grip on an object both hands hold touches no surface of the other
    // arm: the contact is held to the point on every axis, a closed chain.
    if (on.normal === undefined)
      return {
        point,
        ...rotation,
        gap: (): number => 0,
        normalAt: (): IAutoMovieVector3 => ({ x: 0, y: 0, z: 0 }),
        on: { arm: on.arm, owner: on.owner, origin },
      };
    const shape: G.IShape | undefined =
      where < 0 ? undefined : S.colliders(c.frames[on.arm]![k]!, theirs)[where];
    const normal: IAutoMovieVector3 = Quaternion.rotateVector(turn, on.normal);
    return {
      point,
      normal,
      ...rotation,
      ...(shape === undefined ? {} : { shape }),
      gap: (p: IAutoMovieVector3): number =>
        shape === undefined
          ? 0
          : physicalShapeSegmentDistance(shape.pose, shape.shape, p, p),
      normalAt: (p: IAutoMovieVector3): IAutoMovieVector3 =>
        shape === undefined
          ? normal
          : physicalShapeNormal(shape.pose, shape.shape, p, normal),
      on: { arm: on.arm, owner: on.owner, origin },
    };
  }

  /**
   * A probe's point at the next waypoint in a shape's frame at this one: the
   * point carried back by the shape's own motion between the two, so a
   * sweep reads the probe's motion relative to the shape, as continuous
   * collision detection against a moving obstacle does. A body that carries
   * an arm still is then never swept through its own old place.
   *
   * @param c The context.
   * @param a The arm.
   * @param k The waypoint the sweep starts at.
   * @param shape The shape's index in the frame at `k` and at `k + 1`.
   * @param p The probe's point at `k + 1`, world metres.
   * @returns The point in frame `k`, and the turn that carries a direction there from `k + 1`'s frame (the point's derivative in `p`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines next-to-current rigid-collider mapping, world point and returned direction rotation.
   * @evidence contracts/development/implementation.md#principled-implementation The matching collider's current frame times inverse next frame carries the probe; a missing/different collider keeps the original point and identity turn.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Check collider identity, delegate its transform to S.relative, or return the original fallback.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps bone/part checks and placement-pair arithmetic without changing sweep bounds or making a moving shape static.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant lookup and quaternion/vector work per relative mapping.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work S.relative owns the rigid transform; the wrapper supplies actual frame shapes and retains no computed map.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Computed point/turn are fresh; fallback borrows the point and creates an identity quaternion. No source state is retained.
   */
  export function relative(
    c: M.IContext,
    a: number,
    k: number,
    shape: number,
    p: IAutoMovieVector3,
  ): { point: IAutoMovieVector3; turn: IAutoMovieQuaternion } {
    const now: G.IShape = c.frames[a]![k]!.shapes[shape]!;
    const next: G.IShape | undefined = c.frames[a]![k + 1]!.shapes[shape];

    // A shape read at both waypoints by the same index is the same segment
    // (the body's colliders lead every frame in profile order).
    if (next === undefined || next.bone !== now.bone || next.part !== now.part)
      return { point: p, turn: Quaternion.identity() };
    return S.relative(now, next, p);
  }

  /**
   * A hand's contact point in the world.
   *
   * @param placed The arm placed.
   * @param contact The contact in the hand's frame from the wrist.
   * @returns The point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the hand-local contact input and world-metre point returned.
   * @evidence contracts/development/implementation.md#principled-implementation Rigidly carries the contact by the actual hand rotation and adds the current wrist origin.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rotation followed by one translation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Transforms the full contact without a wrist proxy, offset correction or tolerance.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant quaternion/vector work for one contact.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the already placed hand and existing quaternion/vector owners.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh point, retaining no contact or placement.
   */
  export function pad(
    placed: G.IPlaced,
    contact: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Vector3.add(
      placed.wrist,
      Quaternion.rotateVector(placed.hand, contact),
    );
  }

  /**
   * The angle between two rotations.
   *
   * @param a One rotation.
   * @param b The other.
   * @returns Degrees, in [0, 180].
   *
   * @evidence contracts/development/common.md#meaningful-documentation States shortest-angle degrees for admitted unit quaternions.
   * @evidence contracts/development/implementation.md#principled-implementation The absolute quaternion dot removes double-cover sign; twice its clamped arccosine is the shortest rotation angle.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered dot, absolute value, upper clamp and degree conversion.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains dot grouping and roundoff clamp, with no angular tolerance or alternative residual.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed scalar work and one arccosine, without vector allocation.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the actual rotations without retaining or quantizing them.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one scalar and retains no input or history.
   */
  export function angle(
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
  ): number {
    const dot: number = Math.abs(a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w);
    return (2 * Math.acos(Math.min(1, dot)) * 180) / Math.PI;
  }

  /**
   * The rotation vector of `conj(a) b`: the axis scaled by the angle.
   *
   * @param a The rotation measured from.
   * @param b The rotation measured to.
   * @returns Degrees along the axis.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines conjugate-relative axis-angle degrees in the reference rotation's frame.
   * @evidence contracts/development/implementation.md#principled-implementation Inverse reference times actual rotation, the original nonnegative-w hemisphere and quaternion logarithm give the existing residual with its near-zero branch.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One relative quaternion, sign choice, vector magnitude and axis-angle scaling.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains the exact 1e-12 threshold, q.w test, hypot and atan2 grouping; no surrogate or new tolerance is added.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed quaternion/vector work independent of probe count.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses actual rotations with the existing quaternion owner, without cross-candidate inverse/residual caching.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Every branch returns a fresh vector and retains no rotations or previous residuals.
   */
  export function rotationVector(
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
  ): IAutoMovieVector3 {
    let q: IAutoMovieQuaternion = Quaternion.multiply(Quaternion.inverse(a), b);
    if (q.w < 0) q = { x: -q.x, y: -q.y, z: -q.z, w: -q.w };
    const s: number = Math.hypot(q.x, q.y, q.z);
    if (s < 1e-12) return { x: 0, y: 0, z: 0 };
    const theta: number = (2 * Math.atan2(s, q.w) * 180) / Math.PI;
    return { x: (q.x / s) * theta, y: (q.y / s) * theta, z: (q.z / s) * theta };
  }
}
