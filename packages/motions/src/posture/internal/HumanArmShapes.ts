import {
  Quaternion,
  Vector3,
  AutoMovieEnginePhysics,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanColliders,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanShapeFraming } from "./HumanShapeFraming";

/** The record of `IRelativeResult`'s site. */
type IRelativeResult = { point: IAutoMovieVector3; turn: IAutoMovieQuaternion };

/** The alternatives of `ReachableOwner`'s site. */
type ReachableOwner = "upper" | "lower" | "hand";

/** The alternatives of `ReachableOriginEntry`'s site. */
type ReachableOriginEntry = "upper" | "lower" | "hand";

/** The alternatives of `ReachableBeforeEntry`'s site. */
type ReachableBeforeEntry = "upper" | "lower" | "hand";

/** The alternatives of `ScreenOfOwner2`'s site. */
type ScreenOfOwner2 = "upper" | "lower" | "hand";

/** The alternatives of `ScreenOfOwner`'s site. */
type ScreenOfOwner = "upper" | "lower" | "hand";

/** The alternatives of `ScreenEntry`'s site. */
type ScreenEntry = "upper" | "lower" | "hand";

/** The alternatives of `NearbyOwner`'s site. */
type NearbyOwner = "upper" | "lower" | "hand";

/** The alternatives of `SegmentOwner`'s site. */
type SegmentOwner = "upper" | "lower" | "hand";

/** The alternatives of `SegmentResult`'s site. */
type SegmentResult = "upperArm" | "lowerArm" | "hand";

/**
 * The shapes an arm placed by the trajectory's coordinates (`HumanArmGeometry`)
 * meets: the segment each of its probes lies on, the shapes a probe or a
 * segment may come within a reach of (screened by bounding spheres first, as
 * the tangle audit's own pose does), the arm's own colliders placed as shapes
 * another arm is read against, and one shape's outward normal and signed
 * distance.
 */
export namespace HumanArmShapes {
  /**
   * The arm's segment a probe lies on.
   *
   * @param at The frame.
   * @param probe The probe.
   * @returns The segment: an axis sphere's by its place along the arm, a
   *   collider probe's by its owner.
   */
  export function segment(
    at: IAutoMovieMotionHumanArmGeometry.IFrame,
    probe: number,
  ): SegmentResult {
    if (probe >= G.SURFACE) {
      const owner: SegmentOwner = at.owners[probe - G.SURFACE]!;
      return owner === "upper"
        ? "upperArm"
        : owner === "lower"
          ? "lowerArm"
          : "hand";
    }
    return probe < 2 ? "upperArm" : probe < 6 ? "lowerArm" : "hand";
  }

  /**
   * The shapes a placed arm's probe may come within a reach of; a collider
   * probe's segment sphere is screened first, as the tangle audit's own pose
   * does.
   *
   * @param at The frame.
   * @param placed The arm placed.
   * @param probe The probe.
   * @param reach The reach, metres.
   * @param screened The placement's screen (`screen`), when it is read for many
   *   probes; taken here when absent.
   * @param gaps Optional caller-owned scratch indexed by shape, receiving the
   *   current sphere gap, metres, at every traversed index. Read only indices
   *   returned by this call; another probe overwrites its own traversed slots.
   * @returns The shapes' indices.
   */
  export function nearby(
    at: IAutoMovieMotionHumanArmGeometry.IFrame,
    placed: IAutoMovieMotionHumanArmGeometry.IPlaced,
    probe: number,
    reach: number,
    screened?: IScreen,
    gaps?: number[],
  ): number[] {
    const [p, r]: readonly [IAutoMovieVector3, number] = placed.probes[probe]!;
    if (probe < G.SURFACE) return near(at, p, r + reach, gaps);
    const owner: NearbyOwner = at.owners[probe - G.SURFACE]!;
    const among: readonly number[] = (screened ?? screen(at, placed, reach))[
      owner
    ];
    const out: number[] = [];
    for (const i of among) {
      const shape: IAutoMovieMotionHumanArmGeometry.IShape = at.shapes[i]!;
      const gap: number = Vector3.distance(p, shape.centre) - shape.radius;
      if (gaps !== undefined) gaps[i] = gap;
      if (gap < r + reach) out.push(i);
    }
    return out;
  }

  /**
   * The shapes each of a placed arm's segments may come within a reach of, by
   * their bounding spheres.
   */
  export type IScreen = Record<ScreenEntry, number[]>;

  /**
   * The shapes each of a placed arm's segments may come within a reach of: the
   * screen `nearby` reads a surface probe's shapes from, taken once for every
   * probe of the same placement.
   *
   * @param at The frame.
   * @param placed The arm placed.
   * @param reach The reach, metres.
   * @param among The frame's shapes any placement of the arm can come within
   *   the reach of (`reachable` at this reach), ascending; every shape when
   *   absent.
   * @returns The shapes' indices by segment.
   */
  export function screen(
    at: IAutoMovieMotionHumanArmGeometry.IFrame,
    placed: IAutoMovieMotionHumanArmGeometry.IPlaced,
    reach: number,
    among?: readonly number[],
  ): IScreen {
    const of: (
      owner: ScreenOfOwner,
      o: IAutoMovieVector3,
      w: IAutoMovieQuaternion,
    ) => number[] = (
      owner: ScreenOfOwner2,
      o: IAutoMovieVector3,
      w: IAutoMovieQuaternion,
    ): number[] =>
      near(
        at,
        Vector3.add(o, Quaternion.rotateVector(w, at.bounds[owner].centre)),
        at.bounds[owner].radius + reach,
        undefined,
        among,
      );
    return {
      upper: of("upper", placed.shoulder, placed.upper),
      lower: of("lower", placed.elbow, placed.lower),
      hand: of("hand", placed.wrist, placed.hand),
    };
  }

  /**
   * The arm's own colliders placed where coordinates put it, as shapes another
   * arm is read against.
   *
   * @param at The frame.
   * @param placed The arm placed.
   * @returns The shapes, in the order of the frame's colliders.
   */
  export function colliders(
    at: IAutoMovieMotionHumanArmGeometry.IFrame,
    placed: IAutoMovieMotionHumanArmGeometry.IPlaced,
  ): IAutoMovieMotionHumanArmGeometry.IShape[] {
    const out: IAutoMovieMotionHumanArmGeometry.IShape[] = [];
    for (const c of at.colliders) {
      const o: IAutoMovieVector3 =
        c.owner === "upper"
          ? placed.shoulder
          : c.owner === "lower"
            ? placed.elbow
            : placed.wrist;
      const w: IAutoMovieQuaternion =
        c.owner === "upper"
          ? placed.upper
          : c.owner === "lower"
            ? placed.lower
            : placed.hand;
      const pose: IAutoMovieMotionHumanColliders.IPlaced["pose"] = {
        ...c.pose,
        position: Vector3.add(o, Quaternion.rotateVector(w, c.pose.position)),
        rotation: Quaternion.multiply(w, c.pose.rotation),
      };
      for (const shape of c.shapes)
        out.push(bounded(c.bone, c.part, pose, shape));
    }
    return out;
  }

  /**
   * A placed shape with its bounding sphere (`HumanShapeFraming.sphere`).
   *
   * @param bone The bone its segment rides on.
   * @param part The audit's part, -1 for another body's.
   * @param pose The segment's world pose.
   * @param shape The shape.
   * @param hullBox The static hull's extrema, when prepared by its frame.
   * @returns The shape.
   */
  export function bounded(
    bone: IAutoMovieMotionHumanArmGeometry.Segment,
    part: number,
    pose: IAutoMovieMotionHumanColliders.IPlaced["pose"],
    shape: IAutoMovieMotionHumanColliders.IPlaced["shapes"][number],
    hullBox?: IAutoMovieMotionHumanArmGeometry.IShape["hullBox"],
  ): IAutoMovieMotionHumanArmGeometry.IShape {
    // Its bounding sphere is the clearance reading's own (`HumanShapeFraming.sphere`).
    return {
      bone,
      part,
      pose,
      shape,
      ...(hullBox === undefined ? {} : { hullBox }),
      ...HumanShapeFraming.sphere(pose, shape),
    };
  }

  /**
   * The shapes whose bounding sphere lies within a reach of a point.
   *
   * @param at The frame.
   * @param p The point.
   * @param reach The reach, metres.
   * @param gaps Optional caller-owned scratch receiving each traversed shape's
   *   sphere gap, metres, by index; no scratch is retained here.
   * @param among The only shapes read, ascending indices (`reachable`, for a
   *   point of the arm it was taken for and a reach no greater than its own);
   *   every shape when absent.
   * @returns The shapes' indices, ascending.
   */
  export function near(
    at: IAutoMovieMotionHumanArmGeometry.IFrame,
    p: IAutoMovieVector3,
    reach: number,
    gaps?: number[],
    among?: readonly number[],
  ): number[] {
    const out: number[] = [];
    const read: (
      shape: IAutoMovieMotionHumanArmGeometry.IShape,
      i: number,
    ) => void = (
      shape: IAutoMovieMotionHumanArmGeometry.IShape,
      i: number,
    ): void => {
      const gap: number = Vector3.distance(p, shape.centre) - shape.radius;
      if (gaps !== undefined) gaps[i] = gap;
      if (gap < reach) out.push(i);
    };
    if (among === undefined) at.shapes.forEach(read);
    else for (const i of among) read(at.shapes[i]!, i);
    return out;
  }

  /**
   * The frame's shapes some placement of the arm can bring a probe or a
   * segment's bounding sphere within a reach of, whatever its coordinates: the
   * shapes the sphere screens (`near`, `screen`) can ever return, so a screen
   * reads only these.
   *
   * The shoulder's point is the frame's own and every link is rigid, so a probe
   * riding a segment lies no farther from the shoulder than the links before
   * its segment's joint plus its own distance from that joint (the triangle
   * inequality along the chain), and a segment's bounding sphere no farther
   * than the links plus its centre's offset and its radius. With `far` the
   * greatest of those, each plus its probe's radius, a shape whose sphere
   * stands `far + reach` or more from the shoulder has a sphere gap of at least
   * `radius + reach` to every probe, which `near` leaves out.
   *
   * @param at The frame.
   * @param placed The arm placed at any coordinates in this frame, with its
   *   collider probes; only its rigid distances are read.
   * @param reach The greatest reach the screens are asked, metres, beyond a
   *   probe's radius.
   * @returns The shapes' indices, ascending.
   */
  export function reachable(
    at: IAutoMovieMotionHumanArmGeometry.IFrame,
    placed: IAutoMovieMotionHumanArmGeometry.IPlaced,
    reach: number,
  ): number[] {
    const upper: number = Vector3.distance(placed.elbow, placed.shoulder);
    const before: Record<ReachableBeforeEntry, number> = {
      upper: 0,
      lower: upper,
      hand: upper + Vector3.distance(placed.wrist, placed.elbow),
    };
    const origin: Record<ReachableOriginEntry, IAutoMovieVector3> = {
      upper: placed.shoulder,
      lower: placed.elbow,
      hand: placed.wrist,
    };
    let far: number = 0;
    placed.probes.forEach(
      ([p, r]: readonly [IAutoMovieVector3, number], probe: number): void => {
        const owner: ReachableOwner =
          probe >= G.SURFACE
            ? at.owners[probe - G.SURFACE]!
            : probe < 2
              ? "upper"
              : probe < 6
                ? "lower"
                : "hand";
        far = Math.max(
          far,
          before[owner] + Vector3.distance(p, origin[owner]) + r,
        );
      },
    );
    const owners: readonly ReachableOwner[] = ["upper", "lower", "hand"];
    for (const owner of owners)
      far = Math.max(
        far,
        before[owner] +
          Vector3.length(at.bounds[owner].centre) +
          at.bounds[owner].radius,
      );
    const out: number[] = [];
    at.shapes.forEach(
      (shape: IAutoMovieMotionHumanArmGeometry.IShape, i: number): void => {
        if (
          Vector3.distance(shape.centre, placed.shoulder) - shape.radius <
          far + reach + ROUNDING
        )
          out.push(i);
      },
    );
    return out;
  }

  /**
   * One shape's outward normal at a point near it: the gradient of its distance
   * there (`physicalShapeNormal`).
   *
   * @param at The frame.
   * @param shape The shape's index.
   * @param p The point.
   * @returns The unit normal.
   */
  export function normal(
    at: IAutoMovieMotionHumanArmGeometry.IFrame,
    shape: number,
    p: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const s: IAutoMovieMotionHumanArmGeometry.IShape = at.shapes[shape]!;
    return AutoMovieEnginePhysics.physicalShapeNormal(
      s.pose,
      s.shape,
      p,
      Vector3.normalize(Vector3.subtract(p, s.centre)),
    );
  }

  /**
   * A segment's signed distance to one shape.
   *
   * @param at The frame.
   * @param shape The shape's index.
   * @param a The segment's one end.
   * @param b Its other end; `a` for a point.
   * @returns Metres, negative inside.
   */
  export function gap(
    at: IAutoMovieMotionHumanArmGeometry.IFrame,
    shape: number,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): number {
    const s: IAutoMovieMotionHumanArmGeometry.IShape = at.shapes[shape]!;
    return AutoMovieEnginePhysics.physicalShapeSegmentDistance(s.pose, s.shape, a, b);
  }

  /**
   * Read changing segment gaps against one fixed frame shape during one
   * synchronous candidate evaluation; the first actual query prepares its
   * geometry, and all later queries still read their actual signed distance.
   *
   * @param at This candidate's unchanged frame.
   * @param shape Its fixed shape index, with unchanged pose and shape geometry.
   * @returns A world-metre distance reader, released with the candidate.
   */
  export function prepareGap(
    at: IAutoMovieMotionHumanArmGeometry.IFrame,
    shape: number,
  ): ReturnType<typeof AutoMovieEnginePhysics.preparePhysicalShapeSegmentDistance> {
    const s: IAutoMovieMotionHumanArmGeometry.IShape = at.shapes[shape]!;
    return AutoMovieEnginePhysics.preparePhysicalShapeSegmentDistance(s.pose, s.shape);
  }

  /**
   * A point carried from one placement of a shape into another's world frame,
   * holding its coordinates relative to that shape. Both placements must
   * describe the same rigid collider.
   *
   * @param now The reference placement.
   * @param next The placement the point is read against.
   * @param point The point at `next`, world metres.
   * @returns The point at `now`, world metres, and the rotation carrying a
   *   direction with it.
   */
  export function relative(
    now: IAutoMovieMotionHumanArmGeometry.IShape,
    next: IAutoMovieMotionHumanArmGeometry.IShape,
    point: IAutoMovieVector3,
  ): IRelativeResult {
    const turn: IAutoMovieQuaternion = Quaternion.multiply(
      now.pose.rotation,
      Quaternion.inverse(next.pose.rotation),
    );
    return {
      point: Vector3.add(
        now.pose.position,
        Quaternion.rotateVector(
          turn,
          Vector3.subtract(point, next.pose.position),
        ),
      ),
      turn,
    };
  }
}

/**
 * What `reachable` keeps a shape by beyond its bound, metres: a nanometre, far
 * above the rounding of distances of a metre in doubles (about 1e-16 m) and far
 * below any reach asked, so rounding never drops a shape a screen would
 * return.
 */
const ROUNDING: number = 1e-9;
