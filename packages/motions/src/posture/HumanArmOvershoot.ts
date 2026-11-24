import {
  closestPointsBetweenSegments,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanAuditSkin } from "../audit/AutoMovieMotionHumanAuditSkin";
import type { HumanArmBendRoom } from "./HumanArmBendRoom";
import { HumanArmOvershootRoom } from "./HumanArmOvershootRoom";
import { HumanShapeFraming } from "./HumanShapeFraming";

/**
 * How far a forearm lies inside the room it needs, the reading
 * `HumanArmClearance.overshoot` gives: the chest's median plane for the elbow's
 * side, and the forearm's tapering capsule against placed colliders.
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
   * @param others Placed colliders the wrist has no goal on (another body's);
   *   none when absent.
   * @param goal Whether the wrist is where a goal put it, which excuses its own
   *   depth in `shapes`; a carried arm between its ends has none.
   * @param rival The world point the other arm's goal will put its wrist at,
   *   while that arm is still to be fitted: the plane keeps that arm's room
   *   only when it lies on this arm's side; absent, the room is kept unless the
   *   other arm's colliders are among `shapes`.
   * @param hint The world point the goal hints the elbow toward, which the
   *   elbow may follow across the median plane by up to the forearm's radius
   *   beyond it; none when absent.
   * @param rests Placed colliders of another body the goal lays the hand on
   *   (the partner's segment a palm rests on); none when absent.
   * @returns Degrees; 0 when the forearm clears every shape and the elbow keeps
   *   its side.
   */
  export function of(
    body: IAutoMovieMotionHumanBody,
    shapes: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    elbow: IAutoMovieVector3,
    wrist: IAutoMovieVector3,
    side: AutoMovieHumanSide,
    others: readonly IAutoMovieMotionHumanColliders.IFramed[] = [],
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
   * The room is built here, once, and every candidate reads it.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    shapes: readonly IAutoMovieMotionHumanColliders.IPlaced[],
    side: AutoMovieHumanSide,
    others: readonly IAutoMovieMotionHumanColliders.IFramed[] = [],
    goal: boolean = true,
    rival?: IAutoMovieVector3,
    hint?: IAutoMovieVector3,
    rests: readonly IAutoMovieMotionHumanColliders.IPlaced[] = [],
    trial?: HumanArmBendRoom,
  ): (elbow: IAutoMovieVector3, wrist: IAutoMovieVector3) => number {
    const room: IRoom = HumanArmOvershootRoom.of(shapes, others, rests, side);
    const shared: IQueries = trial === undefined ? {} : { trial };
    return (elbow: IAutoMovieVector3, wrist: IAutoMovieVector3): number =>
      evaluate(body, room, elbow, wrist, goal, rival, hint, shared);
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
  /** Optional proof for the original ordinary elbow search. */
  trial?: HumanArmBendRoom;

  /** Readers for unchanged shapes, without queried points or results. */
  readers?: Map<IShape, IDistanceReader>;
}

/**
 * Evaluate one candidate, sharing only operation-owned unchanged geometry. A
 * hinged fit calls it at every candidate: the near shapes and the axis samples
 * are the call's own, and the shapes' distance readers are prepared once per
 * operation (`IQueries`).
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
  shared?.trial?.read(room, radius);

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
  const near: IShape[] = [];
  let count: number = 0;
  for (const shape of room.shapes) {
    const bound: HumanShapeFraming.IFramed = shape.framed;

    // The cheap point-to-segment distance decides where it clears the bound by more than `MARGIN` either way; the exact query decides the rest, so the choice is the exact query's.
    if (bound.faces !== undefined) {
      const gap: number =
        along(elbow, wrist, bound.centre) - bound.radius - radius;
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

  for (let i: number = 0; i < SAMPLES; i++) {
    const s: number = i / SAMPLES;
    const at: IAutoMovieVector3 = {
      x: elbow.x + (wrist.x - elbow.x) * s,
      y: elbow.y + (wrist.y - elbow.y) * s,
      z: elbow.z + (wrist.z - elbow.z) * s,
    };

    // The skin may press `TISSUE` into a surface anywhere along the
    // forearm, as the contact verdicts allow, and no deeper.
    const needed: number = Math.max(radius * (1 - s), radius - TISSUE);
    for (let n: number = 0; n < count; n++) {
      const shape: IShape = near[n]!;
      // A shape that cannot ask more than the depth already found leaves
      // the greatest as it is: the needed clearance less the least the
      // distance can be, `grazing` only lowering it.
      if (HumanShapeFraming.beyond(at, shape.framed, needed - depth + MARGIN))
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

/**
 * A point's signed offset from the chest's median plane toward the arm's side,
 * metres.
 */
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

/**
 * A shape's signed distance to a point, its fixed-geometry reader made once per
 * operation.
 */
function distance(
  shape: IShape,
  point: IAutoMovieVector3,
  shared: IQueries,
): number {
  const queries: Map<IShape, IDistanceReader> = (shared.readers ??= new Map());
  let query: IDistanceReader | undefined = queries.get(shape);
  if (query === undefined) {
    if (shared.trial === undefined)
      query = physicalShapeSegmentDistance.prepare(shape.pose, shape.shape);
    else {
      const pointQuery: (point: IAutoMovieVector3) => number =
        shared.trial.trial.prepare(shape.pose, shape.shape);
      query = (point: IAutoMovieVector3): number => pointQuery(point);
    }
    queries.set(shape, query);
  }
  return query(point, point);
}

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

/**
 * How far, metres, a bound must clear what it is compared with before a query
 * is spared: far above the rounding of a body-scale distance, far below
 * anything a forearm's room reads.
 */
const MARGIN: number = 1e-9;

/**
 * How far a forearm's skin may press into a surface, metres: the skin the
 * tangle audit allows (`AutoMovieMotionHumanAuditSkin.BUILT`), its one owner.
 */
const TISSUE: number = AutoMovieMotionHumanAuditSkin.BUILT;

/**
 * The intervals a forearm's axis is sampled in, from the elbow to short of the
 * wrist.
 */
const SAMPLES: number = 8;
