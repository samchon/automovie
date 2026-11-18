import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanFrame,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/** Private unchanged +Y axis; its original magnitude is prepared on the first turn. */
const TURN: (yaw: number) => IAutoMovieQuaternion = Quaternion.prepareAxisAngle({
  x: 0, y: 1, z: 0,
});

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
 * @evidence contracts/development/design.md#minimal-and-owned-surface Existing point/local/direction-heading helpers serve motion laws. prepare binds repeated fixed-frame conversions, preparePoint binds recovery knee offsets, and prepareLerp serves the jump's four actual local point/bend paths without an intermediate vector.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Introduces no second coordinate convention, body dimensions, pose result, contact tolerance or scene-specific branch.
 */
export namespace HumanFrame {
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
    frame: IAutoMovieMotionHumanFrame,
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
    frame: IAutoMovieMotionHumanFrame,
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
  export function prepare(frame: IAutoMovieMotionHumanFrame): IPrepared {
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
   * Prepare a fixed local point under a fixed floor heading, translated by
   * each supplied world origin. Arithmetic grouping matches point exactly.
   *
   * @param yaw The unchanged heading, degrees about world +Y.
   * @param local The unchanged local point in metres, copied as scalar products.
   * @returns A fresh world point for each varying origin in metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States fixed yaw/local inputs, varying world origin, metre/degree units and fresh output ownership.
   * @evidence contracts/development/implementation.md#principled-implementation Precomputes the original sine/cosine products for the fixed local point while preserving origin.x+local.x*c+local.z*s and origin.z-local.x*s+local.z*c grouping at each read.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed scalar products precede one translation reader, leaving ordinary one-shot point calls unchanged.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses exact original rotation arithmetic with no quantization, normalization, coordinate substitution or changed frame convention.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation and evaluation; heading trigonometry and four local products run once for a fixed knot/side rather than at every nearby leg-fit probe.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The returned reader captures copied scalar prerequisites, so later mutation of the input local object does not invalidate its fixed-source meaning; a changed heading/local source needs a new reader.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One caller-owned reader retains five scalar terms until its owning operation releases it, with no result/time history or handle.
   */
  export function preparePoint(
    yaw: number,
    local: IAutoMovieVector3,
  ): (origin: IAutoMovieVector3) => IAutoMovieVector3 {
    const r: number = (yaw * Math.PI) / 180;
    const c: number = Math.cos(r);
    const s: number = Math.sin(r);
    const xc: number = local.x * c;
    const zs: number = local.z * s;
    const xs: number = local.x * s;
    const zc: number = local.z * c;
    const y: number = local.y;
    return (origin: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: origin.x + xc + zs,
      y: origin.y + y,
      z: origin.z - xs + zc,
    });
  }

  /**
   * Prepare a local segment under one fixed heading, then transform each
   * actual interpolated point without allocating its local vector.
   *
   * @param frame The copied default world-metre origin and heading in degrees.
   * @param from The copied local left/up/forward starting point, metres.
   * @param to The copied local endpoint, metres.
   * @returns A fresh world point for a share, optional current world origin and optional added local height in metres. Shares extrapolate outside [0,1]; absent height performs no extra addition.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines fixed local endpoints/heading, copied default translation, actual share/origin/height inputs, metre/degree units, extrapolation and fresh output.
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates each original a+(b-a)*share local component, then explicit localY+height when supplied, then point's origin.x+x*cos+z*sin, origin.y+y and origin.z-x*sin+z*cos grouping in that order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Copied endpoint/delta and heading coefficients precede one scalar point reader; existing point/prepare readers keep their original vector input and arithmetic.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not transform endpoints before interpolation, regroup world sums, clamp the share, add zero for an absent height or replace any sampled goal with an earlier output.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant preparation/storage and one fresh world-vector allocation per query; the actual jump consumer omits one discarded local vector and three repeated endpoint subtractions while retaining every interpolation/transform operation. Runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Explicit copied frame/endpoints prove fixed coefficients; changing share/origin/lift is evaluated anew. Source mutation cannot alter the snapshot, and changed heading/endpoints require a different reader.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One caller-owned closure holds only copied origin/endpoint coefficients until released, without a source frame/vector, body, query history, returned vector or external handle.
   */
  export function prepareLerp(
    frame: IAutoMovieMotionHumanFrame,
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
  ): (share: number, origin?: IAutoMovieVector3, liftY?: number) => IAutoMovieVector3 {
    const origin: IAutoMovieVector3 = {
      x: frame.origin.x, y: frame.origin.y, z: frame.origin.z,
    };
    const radians: number = (frame.yaw * Math.PI) / 180;
    const cosine: number = Math.cos(radians);
    const sine: number = Math.sin(radians);
    const ax: number = from.x;
    const ay: number = from.y;
    const az: number = from.z;
    const dx: number = to.x - ax;
    const dy: number = to.y - ay;
    const dz: number = to.z - az;
    return (share: number, at: IAutoMovieVector3 = origin, liftY?: number): IAutoMovieVector3 => {
      const x: number = ax + dx * share;
      const y: number = ay + dy * share;
      const z: number = az + dz * share;
      const raised: number = liftY === undefined ? y : y + liftY;
      return {
        x: at.x + x * cosine + z * sine,
        y: at.y + raised,
        z: at.z - x * sine + z * cosine,
      };
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
    /**
     * Local left/up/forward metres to a fresh world point; an explicit world-metre origin replaces only the copied default translation.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines local/world metre input/output and explicit translation override under the prepared heading.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only; prepare owns the unchanged forward scalar implementation.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Declares one forward conversion; prepare owns its closure and scalar helper.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No body here can change arithmetic or introduce an input exception.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The concrete conversion cost is documented by prepare.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The signature shares no result; prepare owns its copied coefficients.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This signature owns no state; the concrete reader lifetime is prepare's.
     */
    point(local: IAutoMovieVector3, origin?: IAutoMovieVector3): IAutoMovieVector3;

    /**
     * World point to fresh local left/up/forward metres in the copied default frame.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Defines inverse metre conversion relative to the preparation's copied origin and heading.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only; prepare owns the original inverse scalar expression.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Declares one inverse operation with no implementation layer.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No body here can substitute a transform or repair an input.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The implementation's fixed scalar cost belongs to prepare.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The signature coordinates no computation; prepare owns coefficient reuse.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration owns no result or retained frame.
     */
    local(world: IAutoMovieVector3): IAutoMovieVector3;

    /**
     * Local vector to its fresh world direction, without applying the origin.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Distinguishes a vector conversion from a point's translated coordinates.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only; prepare implements the zero-origin yaw conversion.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Declares one direction operation; its shared scalar owner is prepare's.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts A declaration contains no alternate vector convention or numerical exception.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Prepare documents the implementation's fixed operations.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature performs no work; prepare owns the fixed-heading reuse.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature holds no vector or resource; prepare documents its bound reader.
     */
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
   * @evidence contracts/development/common.md#meaningful-documentation States degree yaw about +Y and fresh quaternion output, with the module's private fixed-axis preparation.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to the engine's same axis-angle owner, sharing only the unchanged +Y direction and original magnitude while every yaw keeps its original half-angle/sine-division/component/cosine arithmetic.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One private canonical-axis reader serves actual frame turns without duplicating quaternion or heading mathematics.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Construction reads no numerical axis component; first use keeps the original magnitude work. Every yaw retains signed-zero/nonfinite propagation, fresh output and original arithmetic with no angle clamp, alternate axis or fitted coefficient.
   * @evidence contracts/development/implementation.md#efficient-algorithms One direction/magnitude preparation replaces a literal axis allocation and repeated magnitude scan/square root per turn; each yaw retains its actual trigonometry/division/products and output allocation. Runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only private immutable axis prerequisites cross calls through Quaternion.prepareAxisAngle; no yaw, rotation result, performer or pose is cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One module-owned reader retains one private axis/magnitude state until module release. Each quaternion is fresh, with no queried angle/output, performer, handle or task retained.
   */
  export function turn(yaw: number): IAutoMovieQuaternion {
    return TURN(yaw);
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
