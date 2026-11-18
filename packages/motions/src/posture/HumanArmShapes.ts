import {
  Quaternion,
  Vector3,
  physicalShapeNormal,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanColliders,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanShapeFraming } from "./HumanShapeFraming";

/**
 * The shapes an arm placed by the trajectory's coordinates
 * (`HumanArmGeometry`) meets: the segment each of its probes lies on, the
 * shapes a probe or a segment may come within a reach of (screened by
 * bounding spheres first, as the tangle audit's own pose does), the arm's
 * own colliders placed as shapes another arm is read against, and one
 * shape's outward normal and signed distance.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what an arm placed by the coordinates meets and which owner places the arm.
 * @evidence contracts/development/design.md#principled-representation Shapes are indices into the frame's placed shapes, each with its bounding sphere, so a query returns indices the trajectory's pairs key on.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The probe's segment, the screens, the arm's colliders as shapes, and one shape's normal and distance, read by the trajectory's context, model, pairs, refinement, waypoints and Jacobians.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No shape is named: every query reads the frame it is given.
 */
export namespace HumanArmShapes {
  /**
   * The arm's segment a probe lies on.
   *
   * @param at The frame.
   * @param probe The probe.
   * @returns The segment: an axis sphere's by its place along the arm, a collider probe's by its owner.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, its unit and the result.
   * @evidence contracts/development/implementation.md#principled-implementation An axis sphere's segment is its place along the arm's axis probes, a collider probe's the segment its collider rides.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per probe kind.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The collider probe's owner is read from the frame, not guessed from its index.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A lookup with nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function segment(
    at: IAutoMovieMotionHumanArmGeometry.IFrame,
    probe: number,
  ): "upperArm" | "lowerArm" | "hand" {
    if (probe >= G.SURFACE) {
      const owner: "upper" | "lower" | "hand" = at.owners[probe - G.SURFACE]!;
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
   * @param screened The placement's screen (`screen`), when it is read for many probes; taken here when absent.
   * @param gaps Optional caller-owned scratch indexed by shape, receiving the current sphere gap, metres, at every traversed index. Read only indices returned by this call; another probe overwrites its own traversed slots.
   * @returns The shapes' indices.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, its unit and the result.
   * @evidence contracts/development/implementation.md#principled-implementation A bounding sphere's distance never exceeds the shape's, so a shape whose sphere lies beyond the reach cannot come within it and is left out.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure An axis probe reads the frame's shapes directly; a collider probe filters its segment's screen.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only shapes that surely lie out of reach are left out; the exact distance stays the caller's.
   * @evidence contracts/development/implementation.md#efficient-algorithms One point-to-sphere distance per shape, over the segment's screen when one is given.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A screen taken once serves every probe, and the exact scalar Vector3.distance avoids a displacement object. Optional shape-indexed gaps let deepest use the same completed sphere distance while frame geometry and this candidate's probe remain unchanged.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh index list and retains no scratch. The caller owns the optional gap buffer, reads only this call's returned indices, and releases it with its candidate evaluation; untouched slots are unspecified.
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
    const owner: "upper" | "lower" | "hand" = at.owners[probe - G.SURFACE]!;
    return (screened ?? screen(at, placed, reach))[owner].filter(
      (i: number): boolean => {
        const shape: IAutoMovieMotionHumanArmGeometry.IShape = at.shapes[i]!;
        const gap: number = Vector3.distance(p, shape.centre) - shape.radius;
        if (gaps !== undefined) gaps[i] = gap;
        return gap < r + reach;
      },
    );
  }

  /**
   * The shapes each of a placed arm's segments may come within a reach of,
   * by their bounding spheres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each list holds.
   * @evidence contracts/development/design.md#principled-representation The shape indices per segment, the screen `nearby` filters.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three lists, read by `nearby`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Indices into the frame's shapes, not copies.
   */
  export type IScreen = Record<"upper" | "lower" | "hand", number[]>;

  /**
   * The shapes each of a placed arm's segments may come within a reach of:
   * the screen `nearby` reads a surface probe's shapes from, taken once for
   * every probe of the same placement.
   *
   * @param at The frame.
   * @param placed The arm placed.
   * @param reach The reach, metres.
   * @param among The frame's shapes any placement of the arm can come within the reach of (`reachable` at this reach), ascending; every shape when absent.
   * @returns The shapes' indices by segment.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, its unit and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Each segment's bounding sphere, placed by its own joint, against every shape's sphere.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reading per segment.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The segment's sphere is the frame's own bound of its colliders.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three sphere screens per placement instead of one per probe.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Read by `nearby` for every surface probe of the placement.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function screen(
    at: IAutoMovieMotionHumanArmGeometry.IFrame,
    placed: IAutoMovieMotionHumanArmGeometry.IPlaced,
    reach: number,
    among?: readonly number[],
  ): IScreen {
    const of: (
      owner: "upper" | "lower" | "hand",
      o: IAutoMovieVector3,
      w: IAutoMovieQuaternion,
    ) => number[] = (
      owner: "upper" | "lower" | "hand",
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
   * The arm's own colliders placed where coordinates put it, as shapes
   * another arm is read against.
   *
   * @param at The frame.
   * @param placed The arm placed.
   * @returns The shapes, in the order of the frame's colliders.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, its unit and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Each collider rides its segment's joint: its pose composed with the joint's place and turn.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pose per collider and one bounded shape per shape.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The colliders are the frame's own, in its order.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the arm's colliders.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each shape's sphere is `bounded`'s.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function colliders(at: IAutoMovieMotionHumanArmGeometry.IFrame, placed: IAutoMovieMotionHumanArmGeometry.IPlaced): IAutoMovieMotionHumanArmGeometry.IShape[] {
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
   * @returns The shape.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, its unit and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The sphere is the one the clearance reading tests a point against first, so every screen bounds the same distance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No radius is padded.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per shape, a hull's own sphere aside.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The sphere is `HumanShapeFraming.sphere`'s, the one owner of a placed shape's bound.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function bounded(
    bone: AutoMovieHumanoidBone,
    part: number,
    pose: IAutoMovieMotionHumanColliders.IPlaced["pose"],
    shape: IAutoMovieMotionHumanColliders.IPlaced["shapes"][number],
  ): IAutoMovieMotionHumanArmGeometry.IShape {
    // Its bounding sphere is the clearance reading's own (`HumanShapeFraming.sphere`).
    return {
      bone,
      part,
      pose,
      shape,
      ...HumanShapeFraming.sphere(pose, shape),
    };
  }

  /**
   * The shapes whose bounding sphere lies within a reach of a point.
   *
   * @param at The frame.
   * @param p The point.
   * @param reach The reach, metres.
   * @param gaps Optional caller-owned scratch receiving each traversed shape's sphere gap, metres, by index; no scratch is retained here.
   * @param among The only shapes read, ascending indices (`reachable`, for a point of the arm it was taken for and a reach no greater than its own); every shape when absent.
   * @returns The shapes' indices, ascending.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, its unit and the result.
   * @evidence contracts/development/implementation.md#principled-implementation A shape whose bounding sphere lies beyond the reach cannot come within it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the frame's shapes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The reach is the caller's; nothing is added to it.
   * @evidence contracts/development/implementation.md#efficient-algorithms One distance per shape.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The exact scalar Vector3.distance preserves the robust norm and shape order without a displacement object. Optional gap output supplies actual completed sphere distances without another norm query.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh list; an optional gap buffer remains caller-owned and is never retained, nor are source placements or computed point pairs.
   */
  export function near(
    at: IAutoMovieMotionHumanArmGeometry.IFrame,
    p: IAutoMovieVector3,
    reach: number,
    gaps?: number[],
    among?: readonly number[],
  ): number[] {
    const out: number[] = [];
    const read: (shape: IAutoMovieMotionHumanArmGeometry.IShape, i: number) => void = (
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
   * segment's bounding sphere within a reach of, whatever its coordinates:
   * the shapes the sphere screens (`near`, `screen`) can ever return, so a
   * screen reads only these.
   *
   * The shoulder's point is the frame's own and every link is rigid, so a
   * probe riding a segment lies no farther from the shoulder than the links
   * before its segment's joint plus its own distance from that joint (the
   * triangle inequality along the chain), and a segment's bounding sphere
   * no farther than the links plus its centre's offset and its radius. With
   * `far` the greatest of those, each plus its probe's radius, a shape whose
   * sphere stands `far + reach` or more from the shoulder has a sphere gap
   * of at least `radius + reach` to every probe, which `near` leaves out.
   *
   * @param at The frame.
   * @param placed The arm placed at any coordinates in this frame, with its collider probes; only its rigid distances are read.
   * @param reach The greatest reach the screens are asked, metres, beyond a probe's radius.
   * @returns The shapes' indices, ascending.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the list is for, the bound's derivation, which placement is read and the ordering.
   * @evidence contracts/development/implementation.md#principled-implementation A triangle-inequality bound on a serial chain of rigid links from a fixed shoulder; the premise holds because forward kinematics composes fixed rest offsets and rotations only (`resolveHumanArmChain`) and probes are fixed in their segments (`placeHumanArmGeometry`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The chain's two link lengths, one maximum over probes and segment spheres, one pass over the shapes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only shapes no placement can reach are left out, with `ROUNDING` kept on the keeping side for the distances' rounding; no reach, radius or allowance changes.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(P + S) once per frame for P probes and S shapes, so every later screen of that frame reads the kept shapes instead of S.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The list depends on the frame and the arm's rigid geometry alone, so one list serves every placement, probe and iterate at that frame.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh list and retains nothing.
   */
  export function reachable(
    at: IAutoMovieMotionHumanArmGeometry.IFrame,
    placed: IAutoMovieMotionHumanArmGeometry.IPlaced,
    reach: number,
  ): number[] {
    const upper: number = Vector3.distance(placed.elbow, placed.shoulder);
    const before: Record<"upper" | "lower" | "hand", number> = {
      upper: 0,
      lower: upper,
      hand: upper + Vector3.distance(placed.wrist, placed.elbow),
    };
    const origin: Record<"upper" | "lower" | "hand", IAutoMovieVector3> = {
      upper: placed.shoulder,
      lower: placed.elbow,
      hand: placed.wrist,
    };
    let far: number = 0;
    placed.probes.forEach(
      ([p, r]: readonly [IAutoMovieVector3, number], probe: number): void => {
        const owner: "upper" | "lower" | "hand" =
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
    for (const owner of ["upper", "lower", "hand"] as const)
      far = Math.max(
        far,
        before[owner] +
          Vector3.length(at.bounds[owner].centre) +
          at.bounds[owner].radius,
      );
    const out: number[] = [];
    at.shapes.forEach((shape: IAutoMovieMotionHumanArmGeometry.IShape, i: number): void => {
      if (
        Vector3.distance(shape.centre, placed.shoulder) - shape.radius <
        far + reach + ROUNDING
      )
        out.push(i);
    });
    return out;
  }

  /**
   * One shape's outward normal at a point near it: the gradient of its
   * distance there (`physicalShapeNormal`).
   *
   * @param at The frame.
   * @param shape The shape's index.
   * @param p The point.
   * @returns The unit normal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, its unit and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's normal of the shape at the point, its distance's gradient.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The direction from the shape's centre is only the engine's fallback where the gradient vanishes.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The engine's query.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `physicalShapeNormal`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function normal(
    at: IAutoMovieMotionHumanArmGeometry.IFrame,
    shape: number,
    p: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const s: IAutoMovieMotionHumanArmGeometry.IShape = at.shapes[shape]!;
    return physicalShapeNormal(
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, its unit and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's signed segment-to-shape distance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A point is the segment from it to itself, read by the same query.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The engine's query.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `physicalShapeSegmentDistance`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function gap(
    at: IAutoMovieMotionHumanArmGeometry.IFrame,
    shape: number,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): number {
    const s: IAutoMovieMotionHumanArmGeometry.IShape = at.shapes[shape]!;
    return physicalShapeSegmentDistance(s.pose, s.shape, a, b);
  }

  /**
   * Read changing segment gaps against one fixed frame shape during one
   * synchronous candidate evaluation; the first actual query prepares its
   * geometry, and all later queries still read their actual signed distance.
   *
   * @param at This candidate's unchanged frame.
   * @param shape Its fixed shape index, with unchanged pose and shape geometry.
   * @returns A world-metre distance reader, released with the candidate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines fixed frame/index provenance, lazy geometry preparation, actual varying world segments and candidate-local release.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's opaque prepared distance reader shares only exact fixed shape transforms and retains the same signed proximity mathematics as gap.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Select the original frame shape and delegate preparation to the existing scalar distance owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the actual shape, all segment queries, bounds, branch/error order and metre sign; it supplies no alternate frame numbers, clearance allowance or result callback.
   * @evidence contracts/development/implementation.md#efficient-algorithms One fixed-geometry preparation per selected shape serves repeated probes while changed-point transforms and original closest/hull/search work remain; one-off gap callers create no reader.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The actual deepest-pair candidate owns this reader while its frame geometry stays unchanged; another candidate or frame owns a new reader.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller releases this opaque reader with the synchronous candidate. Only borrowed fixed pose/shape and private geometry are retained; no probe, distance result or global history is kept.
   */
  export function prepareGap(
    at: IAutoMovieMotionHumanArmGeometry.IFrame,
    shape: number,
  ): ReturnType<typeof physicalShapeSegmentDistance.prepare> {
    const s: IAutoMovieMotionHumanArmGeometry.IShape = at.shapes[shape]!;
    return physicalShapeSegmentDistance.prepare(s.pose, s.shape);
  }

  /**
   * A point carried from one placement of a shape into another's world
   * frame, holding its coordinates relative to that shape. Both placements
   * must describe the same rigid collider.
   *
   * @param now The reference placement.
   * @param next The placement the point is read against.
   * @param point The point at `next`, world metres.
   * @returns The point at `now`, world metres, and the rotation carrying a direction with it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Specifies the same-rigid-collider premise, world frame and returned point/turn.
   * @evidence contracts/development/implementation.md#principled-implementation The relative world rotation now*inverse(next) carries the offset from next's origin to now's origin.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One relative quaternion and one rotated offset.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Borrows the actual placements of the same shape without re-estimating a centre or padding a distance.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fixed-size quaternion and vector arithmetic.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call reads its actual placement pair without retaining computed target coordinates.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh point/turn records and retains no source placements.
   */
  export function relative(
    now: IAutoMovieMotionHumanArmGeometry.IShape,
    next: IAutoMovieMotionHumanArmGeometry.IShape,
    point: IAutoMovieVector3,
  ): { point: IAutoMovieVector3; turn: IAutoMovieQuaternion } {
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

/** What `reachable` keeps a shape by beyond its bound, metres: a nanometre, far above the rounding of distances of a metre in doubles (about 1e-16 m) and far below any reach asked, so rounding never drops a shape a screen would return. */
const ROUNDING: number = 1e-9;
