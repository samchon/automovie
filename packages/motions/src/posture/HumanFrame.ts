import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A performer's own horizontal frame: an origin on the floor and a heading.
 *
 * Local coordinates follow the canonical body: `x` toward the performer's
 * left, `y` up and `z` forward. A heading of 0 degrees faces world +Z and 90
 * faces world +X, a right-handed turn about +Y, so the left of a performer at
 * heading `h` is world `(cos h, 0, -sin h)` and the forward is
 * `(sin h, 0, cos h)`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines canonical left/up/forward coordinates, world-metre origin and degree heading, including a prepared immutable frame for repeated conversions.
 * @evidence contracts/development/design.md#principled-representation Represents one horizontal rigid transform using the existing vector/quaternion types and explicit degree heading.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Existing point/local/direction-heading helpers serve motion laws; prepare binds the same scalar transform for actual typing and crossed-arm search consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Introduces no second coordinate convention, body dimensions, pose result, contact tolerance or scene-specific branch.
 */
export namespace HumanFrame {
  /**
   * A floor origin and heading defining the performer's horizontal frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines world-metre origin and degrees about world +Y.
   * @evidence contracts/development/design.md#principled-representation An origin and one yaw are exactly the degrees of freedom of a floor frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Both members are read by forward and inverse coordinate conversion.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface vector and a numeric degree value without an alternate transform representation.
   */
  export interface IFrame {
    /** Origin, world metres. */
    origin: IAutoMovieVector3;

    /** Heading about +Y, degrees. */
    yaw: number;
  }

  /**
   * A local point in world metres.
   *
   * @param frame The frame.
   * @param local `x` left, `y` up, `z` forward, metres.
   * @returns The world point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States local/world coordinate signs and metre units.
   * @evidence contracts/development/implementation.md#principled-implementation Rotates the local x/z plane by the frame yaw and adds its origin, preserving the documented right-handed +Y convention.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Computes sine/cosine once and delegates the scalar expression shared with prepare.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original multiply/add order and imposes no angle normalization, threshold or input repair.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fixed scalar work with no scan or algorithm selection.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the scalar transform owner with prepare while reading the current frame for this standalone call.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector and retains no frame or point.
   */
  export function point(
    frame: IFrame,
    local: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const r: number = (frame.yaw * Math.PI) / 180;
    const c: number = Math.cos(r);
    const s: number = Math.sin(r);
    return world(frame.origin, c, s, local);
  }

  /**
   * A world point in the frame's local coordinates.
   *
   * @param frame The frame.
   * @param world The world point.
   * @returns `x` left, `y` up, `z` forward, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States inverse-conversion inputs, signs and metre output.
   * @evidence contracts/development/implementation.md#principled-implementation Subtracts the origin then applies the transpose of the yaw rotation, the exact inverse of the horizontal rigid frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Computes sine/cosine once and delegates the inverse scalar expression shared with prepare.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps original subtraction and multiply/add order without normalizing or repairing inputs.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fixed scalar work without a scan or algorithm choice.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the inverse transform owner with prepare while reading this call's current frame.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector and retains no input.
   */
  export function local(
    frame: IFrame,
    world: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    const r: number = (frame.yaw * Math.PI) / 180;
    const c: number = Math.cos(r);
    const s: number = Math.sin(r);
    return relative(frame.origin, c, s, world);
  }

  /**
   * Snapshot a fixed floor frame for repeated conversions. Later mutations
   * of the source origin or yaw do not change this prepared transform.
   *
   * @param frame The frame whose current scalar origin and heading are copied.
   * @returns Bound forward, inverse and origin-free direction conversions, each returning a fresh vector; point may explicitly supply another origin under the same fixed heading.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States copied scalar provenance, source-mutation independence, coordinate operations and fresh outputs.
   * @evidence contracts/development/implementation.md#principled-implementation Precomputes point/local's same yaw sine/cosine and delegates every conversion to their unchanged scalar expressions; directions use zero origin and an explicit per-point origin changes translation alone while retaining the original arithmetic grouping.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One origin snapshot and sine/cosine pair belong to three bound readers; scalar transform arithmetic has one private owner per direction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Stores no transformed point, sampled time or body-specific approximation; finite-input and frame conventions remain those of the original methods, with unchanged arithmetic order.
   * @evidence contracts/development/implementation.md#efficient-algorithms Pays two trigonometric evaluations once for K conversions instead of twice per call; each conversion retains constant multiply/add work and one fresh vector, with constant retained space and no measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The explicit frame snapshot establishes a fixed heading and default origin; a moving-root caller can supply its actual current origin per point without rebuilding the heading, while changed points/translations are always transformed and a changed heading requires another preparation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns three closures and five scalar origin/heading coefficients until released; none retains the source frame, prior point, output vector or growing history.
   */
  export function prepare(frame: IFrame): IPrepared {
    const origin: IAutoMovieVector3 = {
      x: frame.origin.x, y: frame.origin.y, z: frame.origin.z,
    };
    const radians: number = (frame.yaw * Math.PI) / 180;
    const cosine: number = Math.cos(radians);
    const sine: number = Math.sin(radians);
    return {
      point: (local: IAutoMovieVector3, at: IAutoMovieVector3 = origin): IAutoMovieVector3 =>
        world(at, cosine, sine, local),
      local: (point: IAutoMovieVector3): IAutoMovieVector3 =>
        relative(origin, cosine, sine, point),
      direction: (local: IAutoMovieVector3): IAutoMovieVector3 =>
        world(ZERO, cosine, sine, local),
    };
  }

  /**
   * Coordinate readers bound to one copied horizontal frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines forward/inverse metre points, optional explicit point origin under the fixed heading and origin-free world directions, with fresh results.
   * @evidence contracts/development/design.md#principled-representation Three operations distinguish affine points from origin-free vectors while using the same horizontal rigid transform.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Typing consumes point and crossed-arm placement consumes point/local/direction within repeated fixed-frame geometry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Exposes no source frame, cached result or mutable coefficient; each operation preserves the existing vector representation.
   */
  export interface IPrepared {
    /** Local left/up/forward metres to a fresh world point; an explicit world-metre origin replaces only the copied default translation. */
    point(local: IAutoMovieVector3, origin?: IAutoMovieVector3): IAutoMovieVector3;

    /** World point to fresh local left/up/forward metres. */
    local(world: IAutoMovieVector3): IAutoMovieVector3;

    /** Local vector to its fresh world direction, without applying the origin. */
    direction(local: IAutoMovieVector3): IAutoMovieVector3;
  }

  /**
   * The unit vector a heading faces along the floor, world.
   *
   * @param yaw Degrees about +Y.
   * @returns `(sin yaw, 0, cos yaw)`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States degree input and world floor-forward output.
   * @evidence contracts/development/implementation.md#principled-implementation Applies the same yaw point transform to unit +Z at zero origin.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One point delegation preserves the frame convention.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no threshold or heading normalization.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fixed scalar delegation without a workload-dependent strategy.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses point's single frame-transform owner.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector and retains nothing.
   */
  export function forward(yaw: number): IAutoMovieVector3 {
    return point({ origin: { x: 0, y: 0, z: 0 }, yaw }, { x: 0, y: 0, z: 1 });
  }

  /**
   * The rotation of a heading about +Y.
   *
   * @param yaw Degrees.
   * @returns The rotation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States degree yaw about +Y and quaternion output.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates degree-valued axis-angle conversion to the engine quaternion owner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One canonical +Y axis-angle call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses no alternate axis or fitted coefficient.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant scalar work with no algorithm selection.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the engine's axis-angle conversion without a duplicate implementation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh quaternion and retains nothing.
   */
  export function turn(yaw: number): IAutoMovieQuaternion {
    return Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw);
  }

  /**
   * The heading of a world rotation's forward (+Z) projected on the floor.
   *
   * @param rotation A world rotation.
   * @returns Degrees about +Y.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines world-rotation input, floor projection and degree output.
   * @evidence contracts/development/implementation.md#principled-implementation Rotates canonical +Z, then takes atan2 of its x/z floor projection as the existing yaw convention requires.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One quaternion-vector rotation and one angle conversion.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves atan2 behavior for a vertical forward projection and adds no guessed heading.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fixed scalar work without a workload-dependent strategy.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the engine quaternion rotation owner; the current input is read afresh.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a scalar and retains nothing.
   */
  export function heading(rotation: IAutoMovieQuaternion): number {
    const f: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 0,
      y: 0,
      z: 1,
    });
    return (Math.atan2(f.x, f.z) * 180) / Math.PI;
  }
}

/** Apply the original forward expression with a supplied origin and yaw coefficients. */
function world(
  origin: IAutoMovieVector3,
  cosine: number,
  sine: number,
  local: IAutoMovieVector3,
): IAutoMovieVector3 {
  return {
    x: origin.x + local.x * cosine + local.z * sine,
    y: origin.y + local.y,
    z: origin.z - local.x * sine + local.z * cosine,
  };
}

/** Apply the original inverse expression with a supplied origin and yaw coefficients. */
function relative(
  origin: IAutoMovieVector3,
  cosine: number,
  sine: number,
  world: IAutoMovieVector3,
): IAutoMovieVector3 {
  const dx: number = world.x - origin.x;
  const dz: number = world.z - origin.z;
  return {
    x: dx * cosine - dz * sine,
    y: world.y - origin.y,
    z: dx * sine + dz * cosine,
  };
}

/** Zero origin preserves the standalone direction transform's exact arithmetic. */
const ZERO: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
