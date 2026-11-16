import {
  IAutoMovieEuler,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { QUATERNION_NLERP_DOT_THRESHOLD } from "./constants/QUATERNION_NLERP_DOT_THRESHOLD";
import { quaternionNormalizationDivisor as normalizationDivisor } from "./quaternionNormalizationDivisor";
import { readNormalizedQuaternion } from "./readNormalizedQuaternion";
import { readQuaternionAngle } from "./readQuaternionAngle";

/**
 * Pure quaternion math over {@link IAutoMovieQuaternion}, components `(x, y, z, w)` in glTF order.
 *
 * Quaternions are the engine's internal rotation representation: the model writes joint angles in degrees, `jointToQuaternion` turns them into quaternions, and the renderer consumes those. Unless a function says otherwise, a rotation argument must be a unit quaternion. Every function leaves its inputs unchanged and returns a new value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the component order, where quaternions come from and go, the unit-length premise for rotation arguments, and that every function returns a new value.
 * @evidence contracts/development/design.md#principled-representation GlTF-ordered real components describe rotations, composed and read in the stated world/local conventions. Degrees enter Euler and axis-angle construction. Prepared axis readers own fixed axis scalars, and prepared interpolation owns one unchanged endpoint pair's exact arc invariants, never changing-angle/progress results.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Rotation construction, products, normalization, inversion, vector rotation, interpolation and angular distance serve existing engine consumers. prepareAxisAngle serves changing-angle OnBasis factors, prepareSlerp serves fixed-interval flight playback, and the internal scalar normalization owner also serves actual projector scores. No metadata getter or target cache is exposed.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Prepared construction keeps the direct formula's rescaling, division and multiplication order rather than substituting a predivided unit axis. Prepared interpolation keeps shorter-arc, threshold, weights and normalization under one arithmetic owner. Zero-axis identity and nonfinite propagation keep their existing meanings; every public quaternion output remains fresh.
 */
export namespace Quaternion {
  /**
   * A new quaternion of the identity rotation, `(0, 0, 0, 1)`.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The multiplicative identity of the Hamilton product, zero vector part and unit scalar part, which rotates no vector.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A function rather than a shared constant, because callers build on the result and must never alias one global record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Returns the same exact value for every call with no cached or caller-specific record.
   * @evidence contracts/development/common.md#meaningful-documentation States the component values and that each call returns a new record, which a caller that mutates the result needs.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Four literal components construct the neutral Hamilton rotation in constant time.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A fresh record is the contract, so sharing one would be wrong rather than cheaper.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each neutral rotation owns its four components, so caller mutation cannot alter another identity result.
   */
  export const identity: () => IAutoMovieQuaternion =
    (): IAutoMovieQuaternion => ({
      x: 0,
      y: 0,
      z: 0,
      w: 1,
    });

  /** Radians per degree, `π / 180`. */
  export const DEG2RAD: number = Math.PI / 180;

  /** The canonical axes `fromEuler` turns about, keyed by order letter. */
  const EULER_AXES: Readonly<Record<string, IAutoMovieVector3>> = {
    X: { x: 1, y: 0, z: 0 },
    Y: { x: 0, y: 1, z: 0 },
    Z: { x: 0, y: 0, z: 1 },
  };

  /**
   * The Hamilton product `a * b`, the rotation that applies `b` first and
   * then `a`.
   *
   * @param a Outer (later) rotation.
   * @param b Inner (earlier) rotation.
   * @returns A new quaternion; its length is the product of the two lengths,
   *   so unit inputs give a unit result up to rounding.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The Hamilton product formula, `w = aw·bw − a·b` and `v = aw·bv + bw·av + av × bv`, written out per component; composing rotations by it applies the right operand first.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One product for every rotation composition, joints, drivers, cameras and placements, without a normalizing variant, because unit inputs already give a unit result.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The result is not renormalized, so rounding drift stays visible to the callers that normalize at their own boundary rather than being hidden on every product.
   * @evidence contracts/development/common.md#meaningful-documentation States the application order of the operands and how the result's length follows from the inputs'.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Sixteen multiplications and twelve additions in constant time, with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of two quaternions that coordinates no work across calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The Hamilton product owns four computed components and keeps no references to either operand quaternion.
   */
  export const multiply: (
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
  ) => IAutoMovieQuaternion = (
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion => ({
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  });

  /**
   * A unit-length copy of `q`, or the identity when `q` has length zero.
   *
   * Extreme finite components are rescaled by their largest magnitude before squaring, preserving direction even when the original norm is unrepresentable. Ordinary near-unit inputs keep the direct summed-square arithmetic. A non-finite component makes the result non-finite.
   *
   * @param q Quaternion of any finite length.
   * @returns A new unit quaternion representing the same rotation.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Positive uniform rescaling leaves quaternion direction unchanged, so dividing extreme finite components by their largest magnitude before the Euclidean norm prevents underflow and overflow; zero is the only finite input without a recoverable direction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure readNormalizedQuaternion owns normalization arithmetic for this record constructor and projector scalar scores. quaternionNormalizationDivisor shares binary64 magnitude bounds with axis-angle construction, while ordinary near-unit quaternions retain their existing multiplication order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The identity for a zero quaternion is the stated degenerate value, not a fallback for bad arithmetic; a non-finite input still yields a non-finite result instead of being replaced.
   * @evidence contracts/development/common.md#meaningful-documentation States zero identity, finite extreme-component rescaling, preserved ordinary arithmetic and nonfinite propagation.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Four magnitude comparisons and one fixed-size norm take constant time, with four extra divisions only for extreme inputs.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The largest magnitude supplies one common rescaling for all four components; normalization retains no rotation history between calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources An extreme input adds one temporary scaled quaternion; the returned unit record belongs to the caller and no input is retained.
   */
  export const normalize: (q: IAutoMovieQuaternion) => IAutoMovieQuaternion = (
    q: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion => readNormalizedQuaternion(q, normalizedRecord, undefined);

  /** Fresh public normalization output from the completed scalar computation. */
  function normalizedRecord(x: number, y: number, z: number, w: number): IAutoMovieQuaternion {
    return { x, y, z, w };
  }

  /**
   * The inverse rotation of `q`, its conjugate normalized.
   *
   * For a unit quaternion this is the exact inverse, so multiply(q,inverse(q)) is identity; for a near-unit one normalization keeps a valid rotation. Camera projection, frustum tests, IK and seat solving use it to bring world vectors into a local frame.
   *
   * @param q Rotation to invert.
   * @returns A new unit quaternion.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The conjugate `(−x, −y, −z, w)` is the inverse of a unit quaternion, and dividing by the length makes it the inverse of the rotation a near-unit quaternion represents.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Sends the conjugate's four original scalar expressions to the shared normalization owner instead of constructing a temporary quaternion or dividing by squared length. Its static record visitor returns the same unit result, including the zero quaternion's identity.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Normalizes every input the same way, so no caller depends on whether its quaternion was exactly unit.
   * @evidence contracts/development/common.md#meaningful-documentation States the exact-inverse property for unit input, the normalization for near-unit input, and the callers that use it.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A sign flip and one normalization in constant time, with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of one quaternion that coordinates no work across calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only the fresh normalized output record is allocated; conjugate and extreme scaled components remain scalars, and no input is retained.
   */
  export const inverse: (q: IAutoMovieQuaternion) => IAutoMovieQuaternion = (
    q: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion => readNormalizedQuaternion.fromScalars(
    -q.x, -q.y, -q.z, q.w, normalizedRecord, undefined,
  );

  /**
   * The rotation of `angleDeg` degrees about `axis`, positive by the
   * right-hand rule.
   *
   * @param axis Rotation axis of any nonzero length; a zero axis returns identity.
   * @param angleDeg Angle in degrees.
   * @returns A new unit quaternion.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The axis-angle formula uses a unit axis and half-angle sine/cosine; extreme finite axes are positively rescaled before the norm, preserving direction without overflowing or losing a nonzero subnormal axis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Takes degrees because every authored angle in the interface is in degrees, so callers never convert, and accepts an unnormalized axis because cross products and authored directions arrive unnormalized.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The zero-axis identity is the one input with no defined axis, not a fallback for a failed computation; any other axis takes the same formula.
   * @evidence contracts/development/common.md#meaningful-documentation States the angle unit, the rotation sense, that the axis needs no normalization, and the zero-axis result.
   * @evidence contracts/development/implementation.md#efficient-algorithms A fixed-size magnitude check precedes one square root, sine and cosine; only extreme finite axes require three rescaling divisions.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Direct and prepared construction share one private axis-angle owner; this direct entry supplies no state and allocates no preparation metadata.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources An extreme axis creates one temporary scaled direction, while the output owns four rotation components and keeps no axis reference.
   */
  export const fromAxisAngle: (
    axis: IAutoMovieVector3,
    angleDeg: number,
  ) => IAutoMovieQuaternion = (
    axis: IAutoMovieVector3,
    angleDeg: number,
  ): IAutoMovieQuaternion => {
    return axisAngle(axis, angleDeg);
  };

  /**
   * Build fresh axis-angle rotations on one unchanged borrowed axis. Construction reads no component. First actual use prepares the original scaled direction and length; later angles keep exactly (angleDeg*DEG2RAD)/2, sin(half)/len, component multiplication and cosine. Keep the axis unchanged from first use until releasing the closure.
   *
   * @param axis Fixed direction, with the direct entry's zero/nonfinite semantics.
   * @returns A lazy reader producing a fresh quaternion for every angle.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines borrowed unchanged-axis lifetime, lazy first-use component reads, degree arithmetic, fresh output, zero identity and nonfinite propagation.
   * @evidence contracts/development/implementation.md#principled-implementation Only the positive-rescaled direction and its original left-associated Euclidean length are invariant. Every angle still divides its half-angle sine by that length before multiplying each direction component, so no rounding association changes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lazy state and closure initialize at the first actual read. Warm reads go straight to the shared angle-on-prepared-axis formula, avoiding the direct path's preparation-state dispatch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No axis admission, normalization or angle work moves into construction. The existing 2**-511/2**510 rescaling boundaries, zero-axis fresh identity, signed zeros and nonfinite arithmetic are preserved without a new guard or unit-axis substitution.
   * @evidence contracts/development/implementation.md#efficient-algorithms One fixed-size rescaling and square root per unchanged-axis reader, then one sine, cosine, division and three component products per nonzero-axis angle. Zero axes return a fresh identity without angle trigonometry, as before. Runtime speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The actual OnBasis factor consumer borrows one reader per query axis. Both public entries share axisAngle, while only this entry retains its fixed scalar preparation; no complete rotation or target-dependent answer is retained.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The closure owns one small state and its lazy direction/length reading, borrowing the axis and retaining an extra scaled vector only for extreme inputs. Every returned quaternion is fresh; release the closure with its fixed-axis operation. No global cache or external handle exists.
   */
  export function prepareAxisAngle(
    axis: IAutoMovieVector3,
  ): (angleDeg: number) => IAutoMovieQuaternion {
    const state: IAxisAngleState = {};
    return (angleDeg: number): IAutoMovieQuaternion => {
      const known: IAxisAngleState["reading"] = state.reading;
      return known === undefined
        ? axisAngle(axis, angleDeg, state)
        : angleOnAxis(known.value, known.length, angleDeg);
    };
  }

  /** One reader's lazy fixed-axis preparation, never a completed rotation. */
  interface IAxisAngleState {
    /** Original scaled direction and its length, populated on first use only. */
    reading?: { value: IAutoMovieVector3; length: number };
  }

  /** Preserve the direct formula, optionally borrowing unchanged axis scalars. */
  function axisAngle(
    axis: IAutoMovieVector3,
    angleDeg: number,
    state?: IAxisAngleState,
  ): IAutoMovieQuaternion {
    const known: IAxisAngleState["reading"] = state?.reading;
    const divisor: number = known === undefined
      ? normalizationDivisor(axis.x, axis.y, axis.z) : 1;
    const value: IAutoMovieVector3 =
      known?.value ?? (divisor === 1
        ? axis
        : {
            x: axis.x / divisor,
            y: axis.y / divisor,
            z: axis.z / divisor,
          });
    const len: number = known?.length ?? Math.sqrt(
      value.x * value.x + value.y * value.y + value.z * value.z,
    );
    if (state !== undefined && known === undefined)
      state.reading = { value, length: len };
    return angleOnAxis(value, len, angleDeg);
  }

  /** Original half-angle formula after fixed direction/length preparation. */
  function angleOnAxis(
    value: IAutoMovieVector3,
    len: number,
    angleDeg: number,
  ): IAutoMovieQuaternion {
    if (len === 0) return identity();
    const half: number = (angleDeg * DEG2RAD) / 2;
    const s: number = Math.sin(half) / len;
    return {
      x: value.x * s,
      y: value.y * s,
      z: value.z * s,
      w: Math.cos(half),
    };
  }

  /**
   * The rotation of intrinsic Euler angles in degrees, applying the axes in `euler.order`, the convention `three.js` uses, so order `"XYZ"` equals `qx · qy · qz`.
   *
   * @param euler Angles in degrees and their application order.
   * @returns A new unit quaternion.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Intrinsic Euler composition is the product of single-axis rotations in the stated letter order, each from `fromAxisAngle`, so `"XYZ"` is `qx · qy · qz` and every one of the six orders of `IAutoMovieEuler` follows the same rule.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop over the order letters with a fixed axis table, used by the instance-set placement paths for their per-slot rotation offsets, instead of six hand-written products.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Angles are neither wrapped nor normalized and no order is special-cased; the product starts from the identity so every order takes the same arithmetic.
   * @evidence contracts/development/common.md#meaningful-documentation States the angle unit, that the rotation is intrinsic, the order convention and its equivalence to the `three.js` product, with an example.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Three axis-angle conversions and three products in constant time, with no intermediate array.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of one Euler record that coordinates no work across calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Allocates the factors and the returned record and retains nothing.
   */
  export const fromEuler: (euler: IAutoMovieEuler) => IAutoMovieQuaternion = (
    euler: IAutoMovieEuler,
  ): IAutoMovieQuaternion => {
    let result: IAutoMovieQuaternion = identity();
    for (const letter of euler.order) {
      const angle: number =
        letter === "X" ? euler.x : letter === "Y" ? euler.y : euler.z;
      result = multiply(result, fromAxisAngle(EULER_AXES[letter]!, angle));
    }
    return result;
  };

  /**
   * The vector `v` rotated by the unit quaternion `q`, `q · v · q⁻¹`.
   *
   * A non-unit q also scales and distorts the result, so normalize first when its length is not known to be one.
   *
   * @param q Unit rotation.
   * @param v Vector to rotate.
   * @returns A new rotated vector.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The expansion `v' = v + w·t + q⃗ × t` with `t = 2·(q⃗ × v)`, algebraically equal to `q · v · q*` for a unit quaternion, where the conjugate is the inverse.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Rotates directly from the quaternion instead of building a rotation matrix, since callers rotate one vector at a time.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The quaternion is not normalized here, so a caller passing a non-unit rotation gets the stated distortion instead of a hidden correction.
   * @evidence contracts/development/common.md#meaningful-documentation States the operation, the unit-length premise and what happens without it.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two cross products and eighteen multiplications in constant time, fewer operations than forming the full product `q · v · q*` or a 3×3 matrix for one vector.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of one rotation and one vector that coordinates no work across calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Allocates only the returned vector and retains nothing.
   */
  export const rotateVector: (
    q: IAutoMovieQuaternion,
    v: IAutoMovieVector3,
  ) => IAutoMovieVector3 = (
    q: IAutoMovieQuaternion,
    v: IAutoMovieVector3,
  ): IAutoMovieVector3 => {
    const tx: number = 2 * (q.y * v.z - q.z * v.y);
    const ty: number = 2 * (q.z * v.x - q.x * v.z);
    const tz: number = 2 * (q.x * v.y - q.y * v.x);
    return {
      x: v.x + q.w * tx + (q.y * tz - q.z * ty),
      y: v.y + q.w * ty + (q.z * tx - q.x * tz),
      z: v.z + q.w * tz + (q.x * ty - q.y * tx),
    };
  };

  /**
   * The exact Y component of rotateVector(q,v), without its vector record or
   * unused X/Z output expressions. The same unit-quaternion premise applies;
   * no normalization is added and nonunit distortion/nonfinite arithmetic stay.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines equivalence to the existing Y component, output frame inherited from v/q, unit-input premise, scalar ownership and unchanged nonunit/nonfinite behavior.
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates the same tx, ty and tz in their original order, then exactly v.y + q.w*ty + (q.z*tx-q.x*tz). Omitting independent X/Z outputs leaves this binary64 expression and its signed-zero/nonfinite behavior unchanged.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One genuinely demanded component serves the actual hull min-Y scan, beside the same math owner's complete vector operation; no matrix, callback wrapper or result cache is introduced.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The quaternion is not normalized or assumed cardinal, and neither cross products nor output arithmetic are reassociated. No tolerance, component repair or scene/shape condition selects the result.
   * @evidence contracts/development/implementation.md#efficient-algorithms Keeps the shared two-cross-product intermediates and only one output component, omitting six products, six output additions/subtractions and one vector allocation versus full rotateVector. Work/storage are constant and runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The actual physical-shape floor query requests only world Y; each current rotation/vertex is evaluated normally, with no cached point or rotation result.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one number, allocates no vector/collection and retains neither quaternion nor vertex, with no state, handle or task.
   */
  export function rotateVectorY(q: IAutoMovieQuaternion, v: IAutoMovieVector3): number {
    const tx: number = 2 * (q.y * v.z - q.z * v.y);
    const ty: number = 2 * (q.z * v.x - q.x * v.z);
    const tz: number = 2 * (q.x * v.y - q.y * v.x);
    return v.y + q.w * ty + (q.z * tx - q.x * tz);
  }

  /**
   * Spherical linear interpolation from `a` (at `t = 0`) to `b` (at `t = 1`) along the shorter arc.
   *
   * When the quaternions' dot product `cos θ` exceeds `0.9995`, so the two rotations differ by less than about 3.6 degrees, it returns normalized linear interpolation to avoid dividing by a vanishing `sin θ`. A `t` outside `[0, 1]` extrapolates along the same arc.
   *
   * @param a Unit rotation at `t = 0`.
   * @param b Unit rotation at `t = 1`.
   * @param t Interpolation parameter.
   * @returns A new unit quaternion; both branches normalize because arccosine near the switch threshold leaves spherical weights inexact.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Shoemake's slerp, `sin((1 − t)θ)/sin θ · a + sin(tθ)/sin θ · b` with `θ` the angle between the operands, after negating `b` when `a · b < 0` so the path takes the shorter of the two arcs that represent the same rotation pair.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One private interpolation owner serves this direct entry and prepareSlerp, including the shorter-arc and near-parallel branches. The direct entry supplies no retained preparation and allocates no arc metadata.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The `0.9995` threshold, shared through QUATERNION_NLERP_DOT_THRESHOLD with component-extrema admission, is the documented numerical switch for a vanishing `sin θ`, the same for every caller, not tuned to any clip or fixture.
   * @evidence contracts/development/common.md#meaningful-documentation States the endpoints, the shorter-arc choice, the near-parallel threshold with its angle and why it exists, extrapolation outside `[0, 1]`, and when the result is unit length.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One dot product, one arccosine and three sines in constant time, with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of two rotations and a parameter that coordinates no work across calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each branch passes completed weighted scalars to the shared normalizer and creates only its fresh output quaternion; no temporary weighted/scaled record or endpoint is retained.
   */
  export const slerp: (
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
    t: number,
  ) => IAutoMovieQuaternion = (
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
    t: number,
  ): IAutoMovieQuaternion => interpolateSlerp(a, b, t);

  /**
   * Prepare repeated progress reads between two unchanged borrowed unit rotations. Construction reads no endpoint. First use prepares the original dot, shorter-arc endpoint components and spherical theta/sine. Every progress retains its original weights and normalization; progress outside [0,1] extrapolates. Release the reader with its fixed pair.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines unchanged unit endpoints, lazy endpoint/arc reads, extrapolation inherited from slerp, original weights/normalization, fresh output and operation lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation Shoemake's endpoint dot, shorter-arc sign, angle and angle sine depend only on the unchanged pair. Sharing those exact completed values leaves each t-dependent weight, weighted component and normalization expression unchanged in the common owner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One small lazy state delegates every query to slerp's private arithmetic owner rather than maintaining a second interpolation algorithm.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The existing QUATERNION_NLERP_DOT_THRESHOLD, comparison order, sign flips, half-circle choice and all output normalization remain. No t clipping, endpoint shortcut, fitted arc, target-result cache or external replacement is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms The dot and shorter-arc endpoint read occur once per pair; the spherical branch also shares one acos and one fixed sine. Each t still needs two weight sines and normalization, or the original linear arithmetic and normalization. Completed component scalars enter the common normalizer without a temporary weighted quaternion. Work/storage are constant and runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The actual flight-table playback shares one reader per unchanged interval endpoint pair. The closure shares only that pair's exact arc invariants; t-dependent weights, quaternions and normalization results remain fresh on every query.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns one closure, its two borrowed endpoints, one lazy arc record and at most seven scalar invariants until the interval table is released. Each read returns a fresh quaternion; no progress history, output, global cache, handle or task is retained.
   */
  export function prepareSlerp(
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
  ): (t: number) => IAutoMovieQuaternion {
    const state: ISlerpState = {};
    return (t: number): IAutoMovieQuaternion => interpolateSlerp(a, b, t, state);
  }

  /** Fixed arc scalars, including the already sign-adjusted second endpoint. */
  interface ISlerpArc {
    /** Original sign-adjusted endpoint dot, before the interpolation branch. */
    cosine: number;

    /** Second endpoint X after the original shorter-arc sign. */
    bx: number;

    /** Second endpoint Y after the same sign choice. */
    by: number;

    /** Second endpoint Z after the same sign choice. */
    bz: number;

    /** Second endpoint W after the same sign choice. */
    bw: number;

    /** Original spherical angle and its sine; absent on the linear branch. */
    theta?: number;

    /** Sine of that angle, used as the unchanged weight denominator. */
    sine?: number;
  }

  /** One unchanged endpoint pair's lazy metadata, never an interpolated result. */
  interface ISlerpState {
    /** Prepared at the first actual interpolation read. */
    arc?: ISlerpArc;
  }

  /** Direct and fixed-pair interpolation under the original arithmetic policy. */
  function interpolateSlerp(
    a: IAutoMovieQuaternion, b: IAutoMovieQuaternion, t: number,
    state?: ISlerpState,
  ): IAutoMovieQuaternion {
    const known: ISlerpArc | undefined = state?.arc;
    let cos: number = known?.cosine ?? a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
    let bx: number = known?.bx ?? b.x;
    let by: number = known?.by ?? b.y;
    let bz: number = known?.bz ?? b.z;
    let bw: number = known?.bw ?? b.w;
    if (known === undefined && cos < 0) {
      // Take the shorter arc.
      cos = -cos;
      bx = -bx;
      by = -by;
      bz = -bz;
      bw = -bw;
    }
    if (known === undefined && state !== undefined)
      state.arc = { cosine: cos, bx, by, bz, bw };
    if (cos > QUATERNION_NLERP_DOT_THRESHOLD) {
      // Nearly parallel: normalized linear interpolation.
      return readNormalizedQuaternion.fromScalars(
        a.x + (bx - a.x) * t,
        a.y + (by - a.y) * t,
        a.z + (bz - a.z) * t,
        a.w + (bw - a.w) * t,
        normalizedRecord, undefined,
      );
    }
    const theta: number = known?.theta ?? Math.acos(cos);
    const sin: number = known?.sine ?? Math.sin(theta);
    if (known === undefined && state !== undefined) {
      state.arc!.theta = theta;
      state.arc!.sine = sin;
    }
    const wa: number = Math.sin((1 - t) * theta) / sin;
    const wb: number = Math.sin(t * theta) / sin;
    // acos loses relative accuracy as cos approaches the switch threshold, so
    // the weights alone leave a norm error near 1e-13; normalize like nlerp.
    return readNormalizedQuaternion.fromScalars(
      a.x * wa + bx * wb,
      a.y * wa + by * wb,
      a.z * wa + bz * wb,
      a.w * wa + bw * wb,
      normalizedRecord, undefined,
    );
  }

  /**
   * The angle of the rotation that takes `a` to `b`, in radians within `[0, π]`: the geodesic distance between the two rotations. `q` and `-q` are the same rotation, so negating either argument changes nothing.
   *
   * The angle is `2 atan2(|v|, |w|)` of `inverse(a) * b`. The shorter `2 acos |a · b|` reads an angle from a cosine's deficit from 1, which binary64 resolves only to about 1.1e-16: angles below about 3e-8 radian collapse to 0 or a few steps that size. The relative vector part keeps full relative precision, which candidate ranking needs for mirrored inputs.
   *
   * @param a Unit rotation.
   * @param b Unit rotation.
   * @returns The angle in radians.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The relative rotation of two unit quaternions is `inverse(a) * b`, whose vector part has length `sin(θ/2)` and whose scalar part is `cos(θ/2)`; reading the half angle from both through atan2 is accurate at every angle, where arccosine of the dot product loses all digits of an angle below the square root of the unit roundoff.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure readQuaternionAngle owns the relative angle used by the chain fit's reference, effector and continuity terms. The inverse's same conjugate enters the shared scalar normalization owner, then one reusable visitor keeps multiply's original expressions without allocating normalized-inverse or relative-quaternion records.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No clamp of a dot product and no threshold: the absolute scalar part is the stated identification of `q` with `-q`, and the result is exact to rounding for every pair.
   * @evidence contracts/development/common.md#meaningful-documentation States the unit, the range, the sign insensitivity, the formula and why the shorter arccosine form is not used, and the unit-length premise of both arguments.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One Hamilton product, one hypotenuse and one arctangent in constant time, with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of two rotations that coordinates no work across calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Conjugate, normalized inverse and relative components remain scalars, including extreme rescaling. The returned angle is a number; no quaternion, callback closure, input or result is allocated or retained.
   */
  export const angle: (
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
  ) => number = (a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number => {
    return readQuaternionAngle(a, b);
  };

  /**
   * Read angle(normalize(a), b), in radians, without a normalized output record.
   * Both the initial normalize and inverse's conjugate normalization execute
   * exactly as in that expression; zero/nonfinite behavior remains arithmetic.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States literal normalize-then-angle semantics, operand order, radians, both normalization boundaries and omitted intermediate ownership.
   * @evidence contracts/development/implementation.md#principled-implementation A synchronous visitor transfers the first normalization's exact completed components to the same conjugate normalization and relative Hamilton/atan2 owner as angle; preserving both roundings preserves angle(normalize(a), b).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure This scalar-demand entry serves actual distal/final chain errors through readQuaternionAngle, with no second normalization policy or angle formula.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Neither normalization is omitted, combined or replaced by a unit premise; original signed zeros, extreme scaling, zero identity, nonfinite propagation and Hamilton association remain.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar work matches normalize then angle while omitting the first normalized quaternion record; the angle owner already omits its inverse/relative records. Runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared static visitors and normalization/relative-angle owners replace a discarded intermediate representation; all current operand values and required arithmetic still run, with no angle or target cache.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one number and retains neither operand; only the original first normalization's extreme scaled temporary may allocate, with no closure or normalized-output record per call.
   */
  export function angleAfterNormalize(
    a: IAutoMovieQuaternion,
    b: IAutoMovieQuaternion,
  ): number {
    return readQuaternionAngle.afterNormalization(a, b);
  }
}
