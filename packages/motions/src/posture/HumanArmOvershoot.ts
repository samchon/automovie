import {
  closestPointsBetweenSegments,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditSkin } from "../audit/AutoMovieMotionHumanAuditSkin";
import { HumanArmOvershootRoom } from "./HumanArmOvershootRoom";
import { HumanShapeFraming } from "./HumanShapeFraming";

/**
 * How far a forearm lies inside the room it needs, the reading
 * `HumanArmClearance.overshoot` gives: the chest's median plane for the
 * elbow's side, and the forearm's tapering capsule against placed colliders.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read and who reads it.
 * @evidence contracts/development/design.md#principled-representation A capsule of linearly tapering radius against the body's own profile colliders, with the median plane for the elbow's side.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The reading and its prepared form; `HumanArmClearance` owns the colliders it is read against and the arm readings built on it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The radius is the body's measured forearm radius; no margin is added and no law is named.
 */
export namespace HumanArmOvershoot {
  /**
   * How far a forearm lies inside the room it needs, as degrees of upper arm
   * turn, the unit a range of motion overshoot has.
   *
   * @param body The body, for the forearm's radius and the upper arm's length.
   * @param shapes The trunk's placed colliders (`trunk`).
   * @param elbow The elbow, world metres.
   * @param wrist The wrist, world metres.
   * @param side The arm.
   * @param others Placed colliders the wrist has no goal on (another body's); none when absent.
   * @param goal Whether the wrist is where a goal put it, which excuses its own depth in `shapes`; a carried arm between its ends has none.
   * @param rival The world point the other arm's goal will put its wrist at, while that arm is still to be fitted: the plane keeps that arm's room only when it lies on this arm's side; absent, the room is kept unless the other arm's colliders are among `shapes`.
   * @param hint The world point the goal hints the elbow toward, which the elbow may follow across the median plane by up to the forearm's radius beyond it; none when absent.
   * @param rests Placed colliders of another body the goal lays the hand on (the partner's segment a palm rests on); none when absent.
   * @returns Degrees; 0 when the forearm clears every shape and the elbow keeps its side.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, each input's frame and the meaning of 0.
   * @evidence contracts/development/implementation.md#principled-implementation An elbow goes no farther across the chest's median plane than its wrist's goal, or a forearm's radius beyond its hint, and while the other arm is still to come and its goal is not across, two arms sent to places on their own sides do not cross, so the elbow then keeps the forearm's radius on its own side, or the wrist's own distance when the goal lies nearer or across; and the deepest of `SAMPLES` axis points below its needed clearance, the forearm's radius at the elbow falling linearly toward the wrist but never below the radius less `TISSUE`, the skin the contact verdicts let press in, plus the wrist's own signed clearance where a goal put it (0 for a wrist outside the body), divided by the upper arm's length: the angle the upper arm turns to carry the elbow that far. Against `others` the wrist's own depth excuses nothing, since no goal put the wrist there. Against `rests` the goal puts the hand on the surface, so the wrist lies nearer it than the forearm's room needs (a palm on a partner's chest left the wrist 1.2 mm from it, where a 41 mm forearm needs 31 mm, and the fit gave up 61 mm of its reach to clear it): the needed clearance falls by the wrist's shortfall from the room it needs there, in proportion along the forearm as the wrist's own depth does, so the wrist end asks no more than the goal gives.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The room read once, one bounding-sphere test per hull, then the samples of the shapes that pass it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The wrist end asks no more than the goal itself gives, so a palm laid on the trunk or on a partner is not refused; nothing is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms A hull whose bounding sphere the axis stays a radius from costs one point-to-segment distance; a shape that passes costs one point query per sample, where an exact segment query would cost the tens of point queries of its line search to decide what the samples decide anyway, and a sample or a wrist that surely lies too far outside the shape for the query to raise the depth found (or lower the wrist's clearance) is not queried at all, which leaves the reading exactly as it is: the bounding sphere decides first, then a hull's face planes, the face that last decided tried first and the scan stopped at the first face that decides (`beyond`).
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same evaluate owner serves this one-off reading and prepare's varying candidates; only opaque unchanged shape geometry is shared, and every wrist/sample distance, allowance and screen remains actual.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Existing weak frame/room caches remain unchanged. This one-off call creates a query map only at an exact query, retains no point/result and releases it on return or throw.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    shapes: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    elbow: IAutoMovieVector3,
    wrist: IAutoMovieVector3,
    side: "left" | "right",
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
    goal: boolean = true,
    rival?: IAutoMovieVector3,
    hint?: IAutoMovieVector3,
    rests: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
  ): number {
    return evaluate(
      body,
      HumanArmOvershootRoom.of(shapes, others, rests, side),
      elbow,
      wrist,
      goal,
      rival,
      hint,
    );
  }

  /**
   * Read varying elbow/wrist candidates against one unchanged room during a
   * synchronous fit. The lists, their placed geometry, body measurements and
   * goal metadata must remain unchanged until the caller releases the reader.
   * Preparation is lazy, preserving the first actual obstruction's admission.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines fixed dependencies, lazy first use, varying world-metre points and operation ownership.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same evaluate body as of; shape-frame geometry is independent of elbow/wrist candidates, so its opaque engine readers can serve every actual query in that fit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One closure owns fixed room metadata and lazy distance readers; evaluate alone owns all screening, samples, allowances and depth calculations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every selected point distance and candidate is evaluated in original order, with unchanged samples, ties and tolerances; no query result or resolved flag is stored.
   * @evidence contracts/development/implementation.md#efficient-algorithms Room lookup happens once and at most S exact readers are prepared across the fit's K candidates and S fixed shapes; candidate shape screening and point-distance costs remain unchanged, without a measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Caller-owned fixed placed frames, shapes and scalar goal metadata establish equivalence only within this synchronous fit; the engine readers share geometry and never points, taper values or distances.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The fit owns the closure, borrowed lists and at most S lazy opaque geometry readers until return or throw; none enter global room/frame caches, a result, a body memory or a returned plan.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    shapes: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    side: "left" | "right",
    others: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
    goal: boolean = true,
    rival?: IAutoMovieVector3,
    hint?: IAutoMovieVector3,
    rests: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
  ): (elbow: IAutoMovieVector3, wrist: IAutoMovieVector3) => number {
    let room: IRoom | undefined;
    const shared: IQueries = {};
    return (elbow: IAutoMovieVector3, wrist: IAutoMovieVector3): number =>
      evaluate(
        body,
        (room ??= HumanArmOvershootRoom.of(shapes, others, rests, side)),
        elbow,
        wrist,
        goal,
        rival,
        hint,
        shared,
      );
  }
}

/** A framed shape of a reading's room (HumanArmOvershootRoom.IShape). */
type IShape = HumanArmOvershootRoom.IShape;

/** A reading's room (HumanArmOvershootRoom.IRoom). */
type IRoom = HumanArmOvershootRoom.IRoom;

/** An opaque fixed-geometry reader with no retained point or distance. */
type IDistanceReader = ReturnType<typeof physicalShapeSegmentDistance.prepare>;

/** Operation-local holder, populated only when a candidate needs exact geometry. */
interface IQueries {
  /** Readers for unchanged shapes, without queried points or results. */
  readers?: Map<IShape, IDistanceReader>;
}

/**
 * Evaluate one candidate, sharing only operation-owned unchanged geometry.
 * A hinged fit calls it at every candidate, so it builds nothing per call:
 * the near shapes go into one module list it alone writes, reset at each
 * call, the samples into one module point, and the readers' queries read
 * them before the next is written; no reading calls back into it.
 */
function evaluate(
  body: IAutoMovieMotionHumanBody,
  room: IRoom,
  elbow: IAutoMovieVector3,
  wrist: IAutoMovieVector3,
  goal: boolean,
  rival: IAutoMovieVector3 | undefined,
  hint: IAutoMovieVector3 | undefined,
  shared?: IQueries,
): number {
  const radius: number = body.measure.forearmRadius;

  // The elbow's side: it goes no farther across the chest's median plane
  // than its goal asks, by the wrist or by the elbow's own hint, so a hand
  // sent across the body takes its elbow as far as the goal asks and no
  // farther, and a hand on its own side keeps its elbow there unless the
  // hint asks it across (a hand put ahead of its own shoulder, with a
  // partner too close to clear, had its elbow fitted 61 mm across). An
  // elbow is at its hint while its flesh covers the hint's place, so its
  // axis may lie a forearm's radius beyond it: an arm wrestle hints its
  // elbow onto the midline, where the place the elbow's circle offers
  // nearest the hint lies a few millimetres across.
  // While the other arm is still to come, the plane also stands in for that
  // arm's room, by the forearm's radius; only then, since an arm fitted,
  // hanging or resting has its own colliders among the shapes, and only
  // while the goal it will be fitted to (`rival`) lies on this arm's side:
  // an arm wrestle's elbow on the midline ahead of the sternum, its other
  // hand on its own side, was lifted 50 mm off its place by the margin.
  let depth: number = 0;
  if (room.chest !== undefined) {
    const centre: IAutoMovieVector3 = room.chest.pose.position;
    const out: IAutoMovieVector3 = room.out;
    const kept: boolean =
      !room.present &&
      (rival === undefined || own(rival, centre, out) > -radius);
    depth = Math.max(
      0,
      Math.min(
        kept ? radius : 0,
        own(wrist, centre, out),
        hint === undefined ? Infinity : own(hint, centre, out) - radius,
      ) - own(elbow, centre, out),
    );
  }

  // A shape whose bounding sphere the forearm's axis stays a radius from
  // cannot be within a radius of any axis point, so it is not sampled.
  const near: IShape[] = NEAR;
  let count: number = 0;
  for (const shape of room.shapes) {
    const bound: HumanShapeFraming.IFramed = shape.framed;

    // The cheap point-to-segment distance decides where it clears the bound by more than `MARGIN` either way; the exact query decides the rest, so the choice is the exact query's.
    if (bound.faces !== undefined) {
      const gap: number = along(elbow, wrist, bound.centre) - bound.radius - radius;
      if (gap > MARGIN) continue;
      if (
        !(gap < -MARGIN) &&
        closestPointsBetweenSegments(elbow, wrist, bound.centre, bound.centre)
          .distance -
          bound.radius >=
          radius
      )
        continue;
    }
    near[count++] = shape;
  }
  if (count === 0) return degrees(depth, body.measure.upperArm);
  const queries: IQueries = shared ?? {};

  // The wrist's own signed clearance when the goal puts it inside a shape,
  // which no elbow place changes; 0 for a wrist outside the body. A shape
  // the wrist surely lies outside of has a positive distance, which the
  // least with 0 ignores, so it is not queried. Only fixed posed geometry
  // is shared through this candidate; every selected wrist/sample still
  // runs its actual signed-distance query.
  let grazing: number = 0;
  for (let n: number = 0; n < count; n++) {
    const shape: IShape = near[n]!;
    if (
      goal &&
      !shape.free &&
      !HumanShapeFraming.beyond(wrist, shape.framed, MARGIN)
    )
      grazing = Math.min(grazing, distance(shape, wrist, queries));
  }

  // The wrist's shortfall from the room it needs from a shape the goal
  // lays the hand on: the goal puts the hand on its surface.
  let resting: number = 0;
  for (let n: number = 0; n < count; n++) {
    const shape: IShape = near[n]!;
    if (
      goal &&
      shape.rest &&
      !HumanShapeFraming.beyond(wrist, shape.framed, radius - TISSUE + MARGIN)
    )
      resting = Math.min(
        resting,
        distance(shape, wrist, queries) - (radius - TISSUE),
      );
  }

  const at: IAutoMovieVector3 = AT;
  for (let i: number = 0; i < SAMPLES; i++) {
    const s: number = i / SAMPLES;
    at.x = elbow.x + (wrist.x - elbow.x) * s;
    at.y = elbow.y + (wrist.y - elbow.y) * s;
    at.z = elbow.z + (wrist.z - elbow.z) * s;

    // The skin may press `TISSUE` into a surface anywhere along the
    // forearm, as the contact verdicts allow, and no deeper.
    const needed: number = Math.max(radius * (1 - s), radius - TISSUE);
    for (let n: number = 0; n < count; n++) {
      const shape: IShape = near[n]!;
      // A shape that cannot ask more than the depth already found leaves
      // the greatest as it is: the needed clearance less the least the
      // distance can be, `grazing` only lowering it.
      if (
        HumanShapeFraming.beyond(at, shape.framed, needed - depth + MARGIN)
      )
        continue;
      depth = Math.max(
        depth,
        needed +
          (shape.rest ? resting * s : shape.free ? 0 : grazing * s) -
          distance(shape, at, queries),
      );
    }
  }
  return degrees(depth, body.measure.upperArm);
}

/** A point's signed offset from the chest's median plane toward the arm's side, metres. */
function own(
  p: IAutoMovieVector3,
  centre: IAutoMovieVector3,
  out: IAutoMovieVector3,
): number {
  return (
    (p.x - centre.x) * out.x +
    (p.y - centre.y) * out.y +
    (p.z - centre.z) * out.z
  );
}

/** A depth as degrees of turn at the shoulder, over the upper arm's length. */
function degrees(metres: number, upperArm: number): number {
  return ((metres / upperArm) * 180) / Math.PI;
}

/** A shape's signed distance to a point, its fixed-geometry reader made once per operation. */
function distance(
  shape: IShape,
  point: IAutoMovieVector3,
  shared: IQueries,
): number {
  const queries: Map<IShape, IDistanceReader> = (shared.readers ??= new Map());
  let query: IDistanceReader | undefined = queries.get(shape);
  if (query === undefined) {
    query = physicalShapeSegmentDistance.prepare(shape.pose, shape.shape);
    queries.set(shape, query);
  }
  return query(point, point);
}

/** The near shapes of the candidate `evaluate` reads, written only by it, from index 0 at each call. */
const NEAR: IShape[] = [];

/** The axis sample `evaluate` reads, written only by it before each sample's queries. */
const AT: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/** A point's distance from a segment, metres, by the clamped projection. */
function along(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  p: IAutoMovieVector3,
): number {
  const ex: number = b.x - a.x;
  const ey: number = b.y - a.y;
  const ez: number = b.z - a.z;
  const length: number = ex * ex + ey * ey + ez * ez;
  const t: number =
    length > 0
      ? Math.min(
          1,
          Math.max(
            0,
            ((p.x - a.x) * ex + (p.y - a.y) * ey + (p.z - a.z) * ez) / length,
          ),
        )
      : 0;
  return Math.hypot(
    p.x - (a.x + ex * t),
    p.y - (a.y + ey * t),
    p.z - (a.z + ez * t),
  );
}


/** How far, metres, a bound must clear what it is compared with before a query is spared: far above the rounding of a body-scale distance, far below anything a forearm's room reads. */
const MARGIN: number = 1e-9;

/** How far a forearm's skin may press into a surface, metres: the skin the tangle audit allows (`AutoMovieMotionHumanAuditSkin.BUILT`), its one owner. */
const TISSUE: number = AutoMovieMotionHumanAuditSkin.BUILT;

/** The intervals a forearm's axis is sampled in, from the elbow to short of the wrist. */
const SAMPLES: number = 8;
