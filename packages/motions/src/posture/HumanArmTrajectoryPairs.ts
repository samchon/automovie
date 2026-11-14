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
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

/**
 * What an arms' trajectory reads at one waypoint
 * (`HumanArmTrajectoryModel`): each segment's deepest collider probe against
 * the body and another body, each arm's against the other arm, where a site
 * lies as the iterate carries it, and the small rotation readings the
 * objective and its model share.
 */
export namespace HumanArmTrajectoryPairs {
  /** A segment's deepest probe in one shape: `short` is how far, millimetres, it lies below what it may (negative when clear). */
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

  /** An arm's deepest probe in a collider shape of the other arm, read the same way. */
  export interface ICrossing {
    /** The arm whose probe it is. */
    a: number;
    /** The arm's deepest probe. */
    probe: number;
    /** The other arm's shape, placed. */
    shape: G.IShape;
    /** The other arm's segment the shape rides on. */
    owner: "upper" | "lower" | "hand";
    /** The shape's bone. */
    bone: string;
    /** How far the probe lies below what it may, millimetres. */
    short: number;
    /** Whether the pair is a declared rest. */
    rested: boolean;
  }

  /** A site where an iterate puts it: its point, normal and rotation, its touched collider's distance, and the segment it rides on. */
  export interface ILocated {
    /** The site's world point. */
    point: IAutoMovieVector3;
    /** The touched collider's outward normal at the point; none for a site on nothing. */
    normal?: IAutoMovieVector3;
    /** The hand's world rotation on the site; free when absent. */
    rotation?: IAutoMovieQuaternion;
    /** The touched collider. */
    shape?: G.IShape;
    /** A point's signed distance to the touched collider, metres. */
    gap: (p: IAutoMovieVector3) => number;
    /** The touched collider's outward normal at a point. */
    normalAt: (p: IAutoMovieVector3) => IAutoMovieVector3;
    /** The other arm's segment the site rides on, and that segment's origin. */
    on?: { arm: number; owner: "upper" | "lower" | "hand"; origin: IAutoMovieVector3 };
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
  export function tangents(n: IAutoMovieVector3): [IAutoMovieVector3, IAutoMovieVector3] {
    const helper: IAutoMovieVector3 = Math.abs(n.x) < 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 1, z: 0 };
    const t1: IAutoMovieVector3 = Vector3.normalize(Vector3.cross(n, helper));
    return [t1, Vector3.cross(n, t1)];
  }

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
   * @returns The pairs by part and shape.
   */
  export function deepest(c: M.IContext, a: number, k: number, placed: G.IPlaced): Map<string, IPair> {
    const frame: G.IFrame = c.frames[a]![k]!;
    const out: Map<string, IPair> = new Map();
    placed.probes.forEach(([p, r]: readonly [IAutoMovieVector3, number], probe: number): void => {
      if (probe < G.SURFACE) return;
      const part: number = frame.segments[probe - G.SURFACE]!;
      for (const shape of G.nearby(frame, placed, probe, T.REACH)) {
        const other: number = frame.shapes[shape]!.part;
        if (part >= 0 && other >= 0 && frame.related[part]![other]!) continue;
        const short: number = 1000 * (c.allowed(a, k, probe, shape) - (G.gap(frame, shape, p, p) - r));
        const key: string = `${part}|${shape}`;
        const known: IPair | undefined = out.get(key);
        if (known === undefined || short > known.short)
          out.set(key, { probe, shape, short, rested: c.rested(a, k, probe, frame.shapes[shape]!.bone) });
      }
    });
    return out;
  }

  /**
   * Each arm's deepest collider probe against each of the other arm's
   * collider shapes at a waypoint, by the probe's segment and the shape.
   *
   * @param c The context.
   * @param k The waypoint.
   * @param first The first arm placed there.
   * @param second The second arm placed there.
   * @returns The pairs by arm, segment and shape.
   */
  export function crossing(c: M.IContext, k: number, first: G.IPlaced, second: G.IPlaced): Map<string, ICrossing> {
    const out: Map<string, ICrossing> = new Map();
    const placed: G.IPlaced[] = [first, second];
    for (let a: number = 0; a < 2; ++a) {
      const theirs: G.IShape[] = G.colliders(c.frames[1 - a]![k]!, placed[1 - a]!);
      const owners: ("upper" | "lower" | "hand")[] = c.frames[1 - a]![k]!.colliders.flatMap((col: G.IFrame["colliders"][number]) =>
        col.shapes.map((): "upper" | "lower" | "hand" => col.owner),
      );

      // Each segment's sphere is screened against each shape before its probes.
      const frame: G.IFrame = c.frames[a]![k]!;
      const own: G.IPlaced = placed[a]!;
      const centres: Record<"upper" | "lower" | "hand", IAutoMovieVector3> = {
        upper: Vector3.add(own.shoulder, Quaternion.rotateVector(own.upper, frame.bounds.upper.centre)),
        lower: Vector3.add(own.elbow, Quaternion.rotateVector(own.lower, frame.bounds.lower.centre)),
        hand: Vector3.add(own.wrist, Quaternion.rotateVector(own.hand, frame.bounds.hand.centre)),
      };
      const near = (owner: "upper" | "lower" | "hand"): boolean[] =>
        theirs.map(
          (shape: G.IShape): boolean =>
            Vector3.length(Vector3.subtract(centres[owner], shape.centre)) - shape.radius - frame.bounds[owner].radius < T.REACH,
        );
      const screened: Record<"upper" | "lower" | "hand", boolean[]> = { upper: near("upper"), lower: near("lower"), hand: near("hand") };
      own.probes.forEach(([p, r]: readonly [IAutoMovieVector3, number], probe: number): void => {
        if (probe < G.SURFACE) return;
        const segment: string = G.segment(frame, probe);
        const mine: boolean[] = screened[frame.owners[probe - G.SURFACE]!];
        theirs.forEach((shape: G.IShape, i: number): void => {
          if (!mine[i]) return;
          if (Vector3.length(Vector3.subtract(p, shape.centre)) - shape.radius - r >= T.REACH) return;
          const short: number = 1000 * (c.between(a, k, probe, i, shape.bone) - (physicalShapeSegmentDistance(shape.pose, shape.shape, p, p) - r));
          const key: string = `${a}|${segment}|${i}`;
          const known: ICrossing | undefined = out.get(key);
          if (known === undefined || short > known.short)
            out.set(key, { a, probe, shape, owner: owners[i]!, bone: shape.bone, short, rested: c.rested(a, k, probe, shape.bone) });
        });
      });
    }
    return out;
  }

  /**
   * A site where an iterate puts it: the base's own for a site that rides
   * nothing; the riding segment's frame carried by its arm's iterate
   * otherwise.
   *
   * @param c The context.
   * @param placed Every arm placed at every waypoint.
   * @param a The arm whose site it is.
   * @param k The waypoint.
   * @param site The site.
   * @returns The site as placed.
   */
  export function located(c: M.IContext, placed: readonly (readonly G.IPlaced[])[], a: number, k: number, site: M.ISite): ILocated {
    const where: number = c.touched[a]![k]!;
    if (site.on === undefined) {
      const frame: G.IFrame = c.frames[a]![k]!;
      const shape: G.IShape | undefined = where < 0 ? undefined : frame.shapes[where];
      return {
        point: site.point,
        ...(c.normals[a]![k] === undefined ? {} : { normal: c.normals[a]![k]! }),
        ...(site.rotation === undefined ? {} : { rotation: site.rotation }),
        ...(shape === undefined ? {} : { shape }),
        gap: (p: IAutoMovieVector3): number => (shape === undefined ? 0 : physicalShapeSegmentDistance(shape.pose, shape.shape, p, p)),
        normalAt: (p: IAutoMovieVector3): IAutoMovieVector3 =>
          shape === undefined ? c.normals[a]![k]! : physicalShapeNormal(shape.pose, shape.shape, p, c.normals[a]![k]!),
      };
    }
    const on: NonNullable<M.ISite["on"]> = site.on;
    const theirs: G.IPlaced = placed[on.arm]![k]!;
    const [origin, turn]: [IAutoMovieVector3, IAutoMovieQuaternion] =
      on.owner === "upper" ? [theirs.shoulder, theirs.upper] : on.owner === "lower" ? [theirs.elbow, theirs.lower] : [theirs.wrist, theirs.hand];
    const shape: G.IShape | undefined = where < 0 ? undefined : G.colliders(c.frames[on.arm]![k]!, theirs)[where];
    const normal: IAutoMovieVector3 = Quaternion.rotateVector(turn, on.normal);
    return {
      point: Vector3.add(origin, Quaternion.rotateVector(turn, on.point)),
      normal,
      ...(on.rotation === undefined ? {} : { rotation: Quaternion.multiply(turn, on.rotation) }),
      ...(shape === undefined ? {} : { shape }),
      gap: (p: IAutoMovieVector3): number => (shape === undefined ? 0 : physicalShapeSegmentDistance(shape.pose, shape.shape, p, p)),
      normalAt: (p: IAutoMovieVector3): IAutoMovieVector3 => (shape === undefined ? normal : physicalShapeNormal(shape.pose, shape.shape, p, normal)),
      on: { arm: on.arm, owner: on.owner, origin },
    };
  }

  /**
   * A hand's contact point in the world.
   *
   * @param placed The arm placed.
   * @param contact The contact in the hand's frame from the wrist.
   * @returns The point.
   */
  export function pad(placed: G.IPlaced, contact: IAutoMovieVector3): IAutoMovieVector3 {
    return Vector3.add(placed.wrist, Quaternion.rotateVector(placed.hand, contact));
  }

  /**
   * The angle between two rotations.
   *
   * @param a One rotation.
   * @param b The other.
   * @returns Degrees, in [0, 180].
   */
  export function angle(a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number {
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
  export function rotationVector(a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): IAutoMovieVector3 {
    let q: IAutoMovieQuaternion = Quaternion.multiply(Quaternion.inverse(a), b);
    if (q.w < 0) q = { x: -q.x, y: -q.y, z: -q.z, w: -q.w };
    const s: number = Math.hypot(q.x, q.y, q.z);
    if (s < 1e-12) return { x: 0, y: 0, z: 0 };
    const theta: number = (2 * Math.atan2(s, q.w) * 180) / Math.PI;
    return { x: (q.x / s) * theta, y: (q.y / s) * theta, z: (q.z / s) * theta };
  }
}
