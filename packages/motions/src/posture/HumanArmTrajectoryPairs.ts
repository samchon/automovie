import {
  Quaternion,
  Vector3,
  physicalShapeNormal,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmShapeBox } from "./HumanArmShapeBox";
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
 */
export namespace HumanArmTrajectoryPairs {
  /** A segment's deepest probe in one shape: `short` is how far, millimetres, it lies below what it may (negative when clear).
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
   */
  export type ICrossing = HumanArmTrajectoryOverlap.ICrossing;

  /** The reverse collider pair owned by HumanArmTrajectoryOverlap.
   */
  export type IEmbedded = HumanArmTrajectoryOverlap.IEmbedded;

  /** A site where an iterate puts it: its point, normal and rotation, its touched collider's distance, and the segment it rides on.
   */
  export interface ILocated {
    /** The site's world point. */
    point: IAutoMovieVector3;

    /** The touched collider's outward normal at the point; none for a site on nothing. */
    normal?: IAutoMovieVector3;

    /** The hand's world rotation on the site; free when absent. */
    rotation?: IAutoMovieQuaternion;

    /** The touched collider. */
    shape?: IAutoMovieMotionHumanArmGeometry.IShape;

    /** A world point's signed distance to the touched collider, metres; zero without a surface.
     */
    gap: (p: IAutoMovieVector3) => number;

    /** The touched collider's world normal, the site's fallback without one, or zero for a surface-free grip.
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
   * @param cut How far short of its bound a pair may be left unread, millimetres (`CUT` where the reading's users need no more; negative, how little past it, for a reader that refuses only past a slack); every pair in reach is read when absent.
   * @param stopWhen Optional predicate that accepts a single exact depth as a complete refusal witness.
   * @returns The pairs by part and shape, through the first exact refusal if requested.
   */
  export function deepest(
    c: M.IContext,
    a: number,
    k: number,
    placed: IAutoMovieMotionHumanArmGeometry.IPlaced,
    cut: number = Infinity,
    stopWhen?: (short: number) => boolean,
  ): Map<number, IPair> {
    const frame: IAutoMovieMotionHumanArmGeometry.IFrame = c.frames[a]![k]!;
    const out: Map<number, IPair> = new Map();
    const screened: S.IScreen = S.screen(
      frame,
      placed,
      T.REACH,
      c.reachable[a]![k]!,
    );
    const gaps: number[] = [];
    let queries: ReturnType<typeof S.prepareGap>[] | undefined;
    placed.probes.some(
      ([p, r]: readonly [IAutoMovieVector3, number], probe: number): boolean => {
        if (probe < G.SURFACE) return false;

        // A probe whose segment's screen holds no shape has none near it.
        if (screened[frame.owners[probe - G.SURFACE]!].length === 0) return false;
        const part: number = frame.segments[probe - G.SURFACE]!;
        for (const shape of S.nearby(frame, placed, probe, T.REACH, screened, gaps)) {
          const other: number = frame.shapes[shape]!.part;
          if (frame.related[part]?.[other] === true) continue;
          // The hand on what it rests on is the goal's contact.
          if (frame.owners[probe - G.SURFACE] === "hand" && frame.resting.has(other)) continue;

          // A part of -1 is the arm's own segment's; one number keys the pair.
          const key: number = (part + 1) * frame.shapes.length + shape;
          const known: IPair | undefined = out.get(key);
          const allowance: number = c.allowed(a, k, probe, shape);

          // The shape's bounding sphere bounds its distance from below, so a
          // probe it shows no deeper than the pair's deepest so far is not
          // read exactly: it could not replace it (branch and bound).
          const bound: number = 1000 * (allowance - (gaps[shape]! - r));
          if (known !== undefined && bound <= known.short) continue;
          // The hull's box bounds the distance tighter than its sphere: a
          // probe the box shows no deeper than the pair's deepest so far
          // could not replace it either.
          if (
            known !== undefined &&
            1000 * (allowance - (HumanArmShapeBox(frame.shapes[shape]!, p) - r)) <=
              known.short
          )
            continue;
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
          if (known === undefined || short > known.short) {
            out.set(key, {
              probe,
              shape,
              short,
              rested: c.rested(a, k, probe, frame.shapes[shape]!.bone),
            });
            if (stopWhen?.(short)) return true;
          }
        }
        return false;
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
   */
  export function located(
    c: M.IContext,
    placed:
      | readonly (readonly IAutoMovieMotionHumanArmGeometry.IPlaced[])[] | ((arm: number) => IAutoMovieMotionHumanArmGeometry.IPlaced),
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
   */
  export function relative(
    c: M.IContext,
    a: number,
    k: number,
    shape: number,
    p: IAutoMovieVector3,
  ): { point: IAutoMovieVector3; turn: IAutoMovieQuaternion } {
    const now: IAutoMovieMotionHumanArmGeometry.IShape = c.frames[a]![k]!.shapes[shape]!;
    const next: IAutoMovieMotionHumanArmGeometry.IShape | undefined = c.frames[a]![k + 1]!.shapes[shape];

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
