import { Vector3, physicalShapeNearest } from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * When and where a moving weapon first touches a surface of another body.
 *
 * The weapon is a point on its striking surface (the fist's knuckles, the
 * shin's front, the knee, the sole) moving along the strike's path; the other
 * body is its own collision shapes (spheres, capsules and boxes of its
 * physical profile, posed with its bones), so a strike meets whatever the
 * other body has on its line at that instant: the region it aimed at, a
 * blocking forearm, a covering glove, a checking shin, or an arm crossing the
 * line in a simultaneous exchange. Contact is the first instant the weapon
 * point's distance to any shape falls to zero, the continuous-collision test
 * of a moving point against moving convex shapes (Ericson, Real-Time
 * Collision Detection, 2005, ch. 5); it is found by scanning a fixed time
 * step and bisecting the first crossing a fixed number of times, so the result
 * is deterministic and resolved to the step over 2^24.
 *
 * The striking laws' own weapons are now limb capsules resolved jointly by
 * the performance against `HumanColliders`; these point queries and the
 * scan serve a stroke that scans for itself, the floor rest's shape list and
 * the capture verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the point-against-shape model, its source, the scan's determinism and who still uses it.
 * @evidence contracts/development/design.md#principled-representation Colliders as a discriminated union of capsules and oriented boxes in world metres, so a shape cannot mix both forms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The collider type and the closest, distance, nearest and first queries its current users call.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface vector and quaternion; the signed distances overlap HumanColliders, which owns the segment distances the joint resolution uses.
 */
export namespace StrikingContact {
  /**
   * One convex collision shape of the other body, in world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each variant and member states its meaning and unit.
   * @evidence contracts/development/design.md#principled-representation The profile's own shape with the posed frame of the segment that carries it, so every kind the profile can hold is posed one way and no second shape vocabulary exists.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The shape, its segment's pose and the bone name a verdict reports.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's shape and transform.
   */
  export interface ICollider {
    /** What it is, such as the bone it rides. */
    name: string;

    /** The posed frame of the segment that carries the shape, world metres. */
    pose: IAutoMoviePhysicalProfile.ITransform;

    /** The profile shape, placed by `pose` composed with its own transform. */
    shape: IAutoMoviePhysicalProfile.IShape;
  }

  /**
   * The closest point of a segment to a point.
   *
   * @param p The point.
   * @param a The segment's start.
   * @param b The segment's end.
   * @returns The closest point of the segment.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result; a degenerate segment returns its start.
   * @evidence contracts/development/implementation.md#principled-implementation The projection parameter clamped to [0, 1] (Ericson 2005, §5.1.2); a segment shorter than 1e-9 m is its start.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One projection and one clamp.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function closest(
    p: IAutoMovieVector3,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const ab: IAutoMovieVector3 = Vector3.subtract(b, a);
    const len2: number = Vector3.dot(ab, ab);
    if (len2 < 1e-18) return a;
    const t: number = Math.min(
      1,
      Math.max(0, Vector3.dot(Vector3.subtract(p, a), ab) / len2),
    );
    return Vector3.add(a, Vector3.scale(ab, t));
  }

  /**
   * The signed distance from a point to a shape's surface: positive outside,
   * zero on it, negative inside by the depth to the nearest face.
   *
   * @param p The point, world metres.
   * @param shape The shape.
   * @returns Metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the sign convention.
   * @evidence contracts/development/implementation.md#principled-implementation The engine's single shape query, `physicalShapeNearest`, on a segment of no length; this function states no shape mathematics of its own.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call to the owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms The owner's cost for the shape's kind.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function distance(p: IAutoMovieVector3, shape: ICollider): number {
    return physicalShapeNearest(shape.pose, shape.shape, p, p).distance;
  }

  /**
   * The nearest shape to a point and its signed distance.
   *
   * @param p The point.
   * @param shapes The shapes.
   * @returns The nearest shape's name and distance, or undefined without shapes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result and the meaning of undefined.
   * @evidence contracts/development/implementation.md#principled-implementation The minimum signed distance over the shapes, the distance to their union; ties keep the first.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in shapes, each in constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function nearest(
    p: IAutoMovieVector3,
    shapes: readonly ICollider[],
  ): { name: string; distance: number } | undefined {
    let best: { name: string; distance: number } | undefined;
    for (const s of shapes) {
      const d: number = distance(p, s);
      if (best === undefined || d < best.distance)
        best = { name: s.name, distance: d };
    }
    return best;
  }

  /**
   * The first instant in a span at which a gap function reaches zero:
   * scanned at `step`, the first bracketed crossing bisected 24 times.
   *
   * @param gap Signed gap at a second; non-positive in contact.
   * @param from Span start, seconds.
   * @param to Span end, seconds.
   * @param step Scan step, seconds; positive.
   * @returns The first contact second, or undefined when the gap stays positive.
   * @throws {Error} When the step is not positive.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the scan, the bisection count, the result and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation A fixed-step scan for the first non-positive gap and 24 bisections of the bracketing step; a crossing shorter than one step is the scan's stated blind spot.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scan loop and one bisection loop.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A non-positive step throws.
   * @evidence contracts/development/implementation.md#efficient-algorithms The span over the step plus 24 gap evaluations.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs; callers memoise.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function first(
    gap: (seconds: number) => number,
    from: number,
    to: number,
    step: number,
  ): number | undefined {
    if (!(step > 0)) throw new Error("A contact scan step is positive");
    if (gap(from) <= 0) return from;
    let previous: number = from;
    for (let k: number = 1; ; k++) {
      const t: number = Math.min(to, from + k * step);
      if (gap(t) <= 0) {
        let lo: number = previous;
        let hi: number = t;
        for (let i: number = 0; i < 24; i++) {
          const mid: number = (lo + hi) / 2;
          if (gap(mid) <= 0) hi = mid;
          else lo = mid;
        }
        return hi;
      }
      if (t >= to) return undefined;
      previous = t;
    }
  }
}
