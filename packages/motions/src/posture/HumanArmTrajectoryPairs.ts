import {
  Quaternion,
  Vector3,
  physicalShapeGjk,
  physicalShapeNormal,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmShapeBox } from "./HumanArmShapeBox";
import { HumanArmShapes as S } from "./HumanArmShapes";
import { HumanArmTrajectoryHalfStep } from "./HumanArmTrajectoryHalfStep";
import { HumanArmTrajectoryLinks } from "./HumanArmTrajectoryLinks";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryOverlap } from "./HumanArmTrajectoryOverlap";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanAuditModel } from "./HumanAuditModel";

/** The record of `IRelativeResult`'s site. */
type IRelativeResult = { point: IAutoMovieVector3; turn: IAutoMovieQuaternion };

/** The record of `ILocatedRotation`'s site. */
type ILocatedRotation = { rotation?: IAutoMovieQuaternion };

/** The alternatives of `LocatedPlaced`'s site. */
type LocatedPlaced =
  | readonly (readonly IAutoMovieMotionHumanArmGeometry.IPlaced[])[]
  | ((arm: number) => IAutoMovieMotionHumanArmGeometry.IPlaced);

/** The record of `ILocatedOn`'s site. */
type ILocatedOn = {
  /** Index of the arm carrying the site at this waypoint. */
  arm: number;

  /** Its rigid segment carrying the site. */
  owner: LocatedOnOwner;

  /** That segment's actual world origin, metres. */
  origin: IAutoMovieVector3;
};

/** The alternatives of `LocatedOnOwner`'s site. */
type LocatedOnOwner = "upper" | "lower" | "hand";

/**
 * What the arm trajectory reads at one waypoint (`HumanArmTrajectoryModel`):
 * each segment's deepest collider probe against the body and another body, the
 * body's corners against the arm's own colliders (the audit reads every pair
 * both ways), each arm's against the other arm, each site's current placement,
 * and the small rotation readings the objective and its model share. The course
 * between read waypoints is the sweeps' (`HumanArmTrajectorySweep`).
 */
export namespace HumanArmTrajectoryPairs {
  /**
   * A segment's deepest probe in one shape: `short` is how far, millimetres, it
   * lies below what it may (negative when clear).
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

  /** The moving-arm pair owned by HumanArmTrajectoryOverlap. */
  export type ICrossing = HumanArmTrajectoryOverlap.ICrossing;

  /** The reverse collider pair owned by HumanArmTrajectoryOverlap. */
  export type IEmbedded = HumanArmTrajectoryOverlap.IEmbedded;

  /**
   * A site where an iterate puts it: its point, normal and rotation, its
   * touched collider's distance, and the segment it rides on.
   */
  export interface ILocated {
    /** The site's world point. */
    point: IAutoMovieVector3;

    /**
     * The touched collider's outward normal at the point; none for a site on
     * nothing.
     */
    normal?: IAutoMovieVector3;

    /** The hand's world rotation on the site; free when absent. */
    rotation?: IAutoMovieQuaternion;

    /** The touched collider. */
    shape?: IAutoMovieMotionHumanArmGeometry.IShape;

    /**
     * A world point's signed distance to the touched collider, metres; zero
     * without a surface.
     */
    gap: (p: IAutoMovieVector3) => number;

    /**
     * The touched collider's world normal, the site's fallback without one, or
     * zero for a surface-free grip.
     */
    normalAt: (p: IAutoMovieVector3) => IAutoMovieVector3;

    /** The other arm's segment the site rides on, and that segment's origin. */
    on?: ILocatedOn;
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
   * distance of their safety distance (Schulman et al. 2014, d_check), and no
   * reading of a pair further short than its active set (`T.CHECK`) uses it,
   * the merit counting only a pair past its bound (or a declared rest, read
   * whatever its distance) and the convex model only a pair within the active
   * set. The link pair's certificate, a shape's bounding sphere and its hull's
   * box bound its distance from below, so a probe they show further short than
   * this is left unread, its pair keeping that bound until a probe read exactly
   * passes it: the pair keeps its first place among the pairs, and its depth is
   * past every user's reach whichever value it keeps.
   */
  export const CUT: number = T.CHECK;

  /**
   * Each segment's deepest collider probe against each shape near it at a
   * waypoint, the tangle audit's pairs: by the audit part the probe belongs to
   * and the shape, a pair the audit does not read (one part, or two that share
   * a joint) left out.
   *
   * Each part is read against a shape first as one link pair
   * (`HumanArmTrajectoryLinks`, `HumanAuditModel.certify`): one GJK between its
   * solids and the shape. A pair it certifies clear by more than the cut is
   * left unread with that bound, its probes never read. The pairs left are read
   * probe by probe, each probe's distance bounded first by the shape's bounding
   * sphere and the hull's box, and read exactly only where those bounds could
   * not settle it (branch and bound). This is the discrete reading at the
   * waypoint, trajopt's per-timestep contact; the course between waypoints is
   * read by the sweeps (`HumanArmTrajectorySweep.links`), each frame step its
   * own reading, so every reading has its own row.
   *
   * @param c The context.
   * @param a The arm.
   * @param k The waypoint.
   * @param placed The arm placed there.
   * @param cut How far short of its bound a pair may be left unread,
   *   millimetres (`CUT` where the reading's users need no more; negative, how
   *   little past it, for a reader that refuses only past a slack); every pair
   *   in reach is read when absent.
   * @returns The pairs by part and shape.
   */
  export function deepest(
    c: M.IContext,
    a: number,
    k: number,
    placed: IAutoMovieMotionHumanArmGeometry.IPlaced,
    cut: number = Infinity,
  ): Map<number, IPair> {
    const frame: IAutoMovieMotionHumanArmGeometry.IFrame = c.frames[a]![k]!;
    const out: Map<number, IPair> = new Map();
    const floor: number = cut / 1000;
    const certifies: boolean = Number.isFinite(floor);
    const queries: ReturnType<typeof S.prepareGap>[] = [];
    for (const link of HumanArmTrajectoryLinks.of(c, a, k, placed)) {
      for (const shape of c.reachable[a]![k]!) {
        const s: IAutoMovieMotionHumanArmGeometry.IShape = frame.shapes[shape]!;
        if (frame.related[link.part]?.[s.part] === true) continue;

        // The part's screen: its probes' sphere against the shape's.
        if (
          Vector3.distance(link.centre, s.centre) - link.radius - s.radius >=
          T.REACH
        )
          continue;

        // A part of -1 is the arm's own segment's; one number keys the pair.
        const key: number = (link.part + 1) * frame.shapes.length + shape;
        const rested: boolean = c.rested(a, k, link.probes[0]!, s.bone);

        // The link pair's certificate: every allowance is no more than zero,
        // so a bound past the cut leaves every probe of the pair beyond it.
        if (certifies && !rested && link.solids.length !== 0) {
          const least: number = HumanAuditModel.certify(
            link.solids,
            link.offset,
            physicalShapeGjk.solid(s.pose, s.shape),
            floor,
          );
          if (least > floor) {
            out.set(key, {
              probe: link.probes[0]!,
              shape,
              short: -1000 * least,
              rested: false,
            });
            continue;
          }
        }
        for (const probe of link.probes) {
          const [p, r]: readonly [IAutoMovieVector3, number] =
            placed.probes[probe]!;
          const known: IPair | undefined = out.get(key);
          const allowance: number = c.allowed(a, k, probe, shape);

          // Two closed-form lower bounds on the probe's distance to the
          // shape, the tighter kept: the shape's bounding sphere and the
          // hull's box. A probe they show no deeper than the pair's deepest
          // so far is not read exactly: it could not replace it (branch and
          // bound).
          const bound: number =
            1000 *
            (allowance -
              (Math.max(
                Vector3.distance(p, s.centre) - s.radius,
                HumanArmShapeBox(s, p),
              ) -
                r));
          if (known !== undefined && bound <= known.short) continue;
          if (bound < -cut && !rested) {
            if (known === undefined)
              out.set(key, { probe, shape, short: bound, rested: false });
            continue;
          }
          const query: ReturnType<typeof S.prepareGap> = (queries[shape] ??=
            S.prepareGap(frame, shape));
          const short: number = 1000 * (allowance - (query(p, p) - r));
          if (known === undefined || short > known.short)
            out.set(key, { probe, shape, short, rested });
        }
      }
    }
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
   * @param placed Every arm placed at every waypoint, or a reader of the arms
   *   at this one waypoint.
   * @param a The arm whose site it is.
   * @param k The waypoint.
   * @param site The site.
   * @returns The site as placed.
   */
  export function located(
    c: M.IContext,
    placed: LocatedPlaced,
    a: number,
    k: number,
    site: M.ISite,
  ): ILocated {
    const where: number = c.touched[a]![k]!;
    if (site.on === undefined) {
      const frame: IAutoMovieMotionHumanArmGeometry.IFrame = c.frames[a]![k]!;
      const shape: IAutoMovieMotionHumanArmGeometry.IShape | undefined =
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
    const theirs: IAutoMovieMotionHumanArmGeometry.IPlaced =
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
    const rotation: ILocatedRotation =
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
    const shape: IAutoMovieMotionHumanArmGeometry.IShape | undefined =
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
   * point carried back by the shape's own motion between the two, so a sweep
   * reads the probe's motion relative to the shape, as continuous collision
   * detection against a moving obstacle does. A body that carries an arm still
   * is then never swept through its own old place.
   *
   * @param c The context.
   * @param a The arm.
   * @param k The waypoint the sweep starts at.
   * @param shape The shape's index in the frame at `k` and at `k + 1`.
   * @param p The probe's point at `k + 1`, world metres.
   * @returns The point in frame `k`, and the turn that carries a direction
   *   there from `k + 1`'s frame (the point's derivative in `p`).
   */
  export function relative(
    c: M.IContext,
    a: number,
    k: number,
    shape: number,
    p: IAutoMovieVector3,
  ): IRelativeResult {
    // A shape read at both waypoints by the same index is the same segment
    // (the body's colliders lead every frame in profile order).
    return HumanArmTrajectoryHalfStep.relative(c, a, k, shape, p);
  }

  /**
   * A hand's contact point in the world.
   *
   * @param placed The arm placed.
   * @param contact The contact in the hand's frame from the wrist.
   * @returns The point.
   */
  export function pad(
    placed: ReturnType<typeof G.chain>,
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
