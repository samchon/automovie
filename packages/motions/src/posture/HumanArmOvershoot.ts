import {
  Quaternion,
  Vector3,
  closestPointsBetweenSegments,
  physicalHullFaces,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanColliders } from "./HumanColliders";

/**
 * How far a forearm lies inside the room it needs, the reading
 * `HumanArmClearance.overshoot` gives: the chest's median plane for the
 * elbow's side, and the forearm's tapering capsule against placed colliders.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read and who reads it.
 * @evidence contracts/development/design.md#principled-representation A capsule of linearly tapering radius against the body's own profile colliders, with the median plane for the elbow's side.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The reading and its screen switch; `HumanArmClearance` owns the colliders it is read against and the arm readings built on it.
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bounding-sphere test per hull, then the samples of the shapes that pass it.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The wrist end asks no more than the goal itself gives, so a palm laid on the trunk or on a partner is not refused; nothing is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms A hull whose bounding sphere the axis stays a radius from costs one point-to-segment distance; a shape that passes costs one point query per sample, where an exact segment query would cost the tens of point queries of its line search to decide what the samples decide anyway, and a sample or a wrist whose distance from the shape's bounding sphere already shows the query cannot raise the depth found (or lower the wrist's clearance) is not queried at all, which leaves the reading exactly as it is (`broad`).
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every distance is the engine's `physicalShapeSegmentDistance`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    body: IHumanBody,
    shapes: readonly HumanColliders.IPlaced[],
    elbow: IAutoMovieVector3,
    wrist: IAutoMovieVector3,
    side: "left" | "right",
    others: readonly HumanColliders.IPlaced[] = [],
    goal: boolean = true,
    rival?: IAutoMovieVector3,
    hint?: IAutoMovieVector3,
    rests: readonly HumanColliders.IPlaced[] = [],
  ): number {
    const radius: number = body.measure.forearmRadius;
    const degrees = (metres: number): number =>
      ((metres / body.measure.upperArm) * 180) / Math.PI;
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
    const chest: HumanColliders.IPlaced | undefined =
      shapes.find((s: HumanColliders.IPlaced) => s.bone === "upperChest") ??
      shapes.find((s: HumanColliders.IPlaced) => s.bone === "chest");
    const other: "left" | "right" = side === "left" ? "right" : "left";
    const present: boolean = shapes.some(
      (s: HumanColliders.IPlaced): boolean =>
        s.bone === `${other}UpperArm` || s.bone === `${other}LowerArm`,
    );
    let depth: number = 0;
    if (chest !== undefined) {
      const out: IAutoMovieVector3 = Quaternion.rotateVector(
        chest.pose.rotation,
        { x: side === "left" ? 1 : -1, y: 0, z: 0 },
      );
      const own = (p: IAutoMovieVector3): number =>
        Vector3.dot(Vector3.subtract(p, chest.pose.position), out);
      const room: boolean =
        !present && (rival === undefined || own(rival) > -radius);
      depth = Math.max(
        0,
        Math.min(
          room ? radius : 0,
          own(wrist),
          hint === undefined ? Infinity : own(hint) - radius,
        ) - own(elbow),
      );
    }
    // A shape whose bounding sphere the forearm's axis stays a radius from
    // cannot be within a radius of any axis point, so it is not sampled.
    const near: IShape[] = [];
    for (const [segment, free, rest] of [
      ...shapes.map((s: HumanColliders.IPlaced) => [s, false, false] as const),
      ...others.map((s: HumanColliders.IPlaced) => [s, true, false] as const),
      ...rests.map((s: HumanColliders.IPlaced) => [s, true, true] as const),
    ])
      for (const shape of segment.shapes) {
        const bound: { centre: IAutoMovieVector3; radius: number } = bounding(
          segment.pose,
          shape,
        );
        // The cheap point-to-segment distance decides where it clears the bound by more than `MARGIN` either way; the exact query decides the rest, so the choice is the exact query's.
        if (shape.kind === "hull") {
          const gap: number = BROAD.on
            ? along(elbow, wrist, bound.centre) - bound.radius - radius
            : 0;
          if (gap > MARGIN) continue;
          if (
            !(gap < -MARGIN) &&
            closestPointsBetweenSegments(
              elbow,
              wrist,
              bound.centre,
              bound.centre,
            ).distance -
              bound.radius >=
              radius
          )
            continue;
        }
        near.push({
          pose: segment.pose,
          shape,
          free,
          rest,
          ...bound,
          ...(shape.kind === "hull"
            ? {
                faces: physicalHullFaces(shape.points).faces,
                origin: Vector3.add(
                  segment.pose.position,
                  Quaternion.rotateVector(
                    segment.pose.rotation,
                    shape.transform.position,
                  ),
                ),
                inverse: Quaternion.inverse(
                  Quaternion.multiply(
                    segment.pose.rotation,
                    shape.transform.rotation,
                  ),
                ),
              }
            : {}),
        });
      }
    if (near.length === 0) return degrees(depth);

    // How far a point surely lies outside a shape, never more than its signed distance: for a hull the greatest of its face planes' distances, which is the distance itself inside and no more than it outside; for any other shape its distance from the bounding sphere.
    const outside = (p: IAutoMovieVector3, shape: IShape): number => {
      if (shape.faces === undefined)
        return Vector3.length(Vector3.subtract(p, shape.centre)) - shape.radius;
      const local: IAutoMovieVector3 = Quaternion.rotateVector(
        shape.inverse!,
        Vector3.subtract(p, shape.origin!),
      );
      let most: number = -Infinity;
      for (const face of shape.faces)
        most = Math.max(
          most,
          face.normal.x * local.x +
            face.normal.y * local.y +
            face.normal.z * local.z -
            face.offset,
        );
      return most;
    };

    // The wrist's own signed clearance when the goal puts it inside a shape,
    // which no elbow place changes; 0 for a wrist outside the body. A shape
    // whose bounding sphere the wrist is outside of has a positive distance,
    // which the least with 0 ignores, so it is not queried.
    let grazing: number = 0;
    for (const shape of near)
      if (goal && !shape.free && !(BROAD.on && outside(wrist, shape) > MARGIN))
        grazing = Math.min(
          grazing,
          physicalShapeSegmentDistance(shape.pose, shape.shape, wrist, wrist),
        );
    // The wrist's shortfall from the room it needs from a shape the goal
    // lays the hand on: the goal puts the hand on its surface.
    let resting: number = 0;
    for (const shape of near)
      if (
        goal &&
        shape.rest &&
        !(BROAD.on && outside(wrist, shape) > radius - TISSUE + MARGIN)
      )
        resting = Math.min(
          resting,
          physicalShapeSegmentDistance(shape.pose, shape.shape, wrist, wrist) -
            (radius - TISSUE),
        );
    for (let i: number = 0; i < SAMPLES; i++) {
      const s: number = i / SAMPLES;
      const at: IAutoMovieVector3 = Vector3.lerp(elbow, wrist, s);
      // The skin may press `TISSUE` into a surface anywhere along the
      // forearm, as the contact verdicts allow, and no deeper.
      const needed: number = Math.max(radius * (1 - s), radius - TISSUE);
      for (const shape of near) {
        // A shape that cannot ask more than the depth already found leaves
        // the greatest as it is: the needed clearance less the least the
        // distance can be, `grazing` only lowering it.
        if (BROAD.on && needed - outside(at, shape) < depth - MARGIN) continue;
        depth = Math.max(
          depth,
          needed +
            (shape.rest ? resting * s : shape.free ? 0 : grazing * s) -
            physicalShapeSegmentDistance(shape.pose, shape.shape, at, at),
        );
      }
    }
    return degrees(depth);
  }

  /**
   * Turn the bounding-sphere screen of `of` off or on again. Off,
   * every near shape is queried at every sample and at the wrist, which is
   * what a check of the screen against the full reading compares with; it
   * is on unless turned off. The screen only spares queries whose result
   * cannot change the reading, so both give the same degrees.
   *
   * @param on Whether queries are screened.
   */
  export function broad(on: boolean): void {
    BROAD.on = on;
  }
}

/** One shape with the posed frame of its segment. */
interface IShape {
  /** The segment's posed frame. */
  pose: HumanColliders.IPlaced["pose"];

  /** The shape. */
  shape: HumanColliders.IPlaced["shapes"][number];

  /** Whether the wrist has no goal on the shape, so its own depth excuses nothing. */
  free: boolean;

  /** Whether the goal lays the hand on the shape, so the wrist's shortfall from its room excuses that much. */
  rest: boolean;

  /** The centre of a sphere the shape lies inside, world metres. */
  centre: IAutoMovieVector3;

  /** That sphere's radius, metres. */
  radius: number;

  /** A hull's face planes in its own frame; absent for any other shape. */
  faces?: physicalHullFaces.IHull["faces"];

  /** The world point a hull's own frame is centred on. */
  origin?: IAutoMovieVector3;

  /** The rotation from the world into a hull's own frame. */
  inverse?: IAutoMovieQuaternion;
}

/**
 * A sphere a placed shape lies inside: a hull's own about the mean of its
 * vertices, a sphere itself, a capsule's about its middle reaching its
 * caps, a box's about its centre reaching its corners. A point's signed
 * distance to the shape is never less than its distance from this sphere,
 * inside the shape too, where the ray from the centre through the point
 * meets the surface within the sphere.
 */
function bounding(
  pose: HumanColliders.IPlaced["pose"],
  shape: HumanColliders.IPlaced["shapes"][number],
): { centre: IAutoMovieVector3; radius: number } {
  const local: { centre: IAutoMovieVector3; radius: number } =
    shape.kind === "hull"
      ? physicalHullFaces(shape.points)
      : {
          centre: { x: 0, y: 0, z: 0 },
          radius:
            shape.kind === "sphere"
              ? shape.radius
              : shape.kind === "capsule"
                ? shape.halfLength + shape.radius
                : Vector3.length(shape.halfExtents),
        };
  return {
    centre: Vector3.add(
      pose.position,
      Quaternion.rotateVector(
        pose.rotation,
        Vector3.add(
          shape.transform.position,
          Quaternion.rotateVector(shape.transform.rotation, local.centre),
        ),
      ),
    ),
    radius: local.radius,
  };
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

/** Whether the bounding spheres spare the exact distance queries they cannot change (`HumanArmClearance.broad`). */
const BROAD: { on: boolean } = { on: true };

/** How far, metres, a bound must clear what it is compared with before a query is spared: far above the rounding of a body-scale distance, far below anything a forearm's room reads. */
const MARGIN: number = 1e-9;

/** How far a forearm's skin may press into a surface, metres: the soft tissue the contact verdicts allow (decision 11). */
const TISSUE: number = 0.01;

/** The intervals a forearm's axis is sampled in, from the elbow to short of the wrist. */
const SAMPLES: number = 8;
