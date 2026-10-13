import { IAutoMovieVector3, IAutoMovieYawPitch } from "@automovie/interface";
const VECTOR_AXES: readonly ["x", "y", "z"] = ["x", "y", "z"];

/**
 * The yaw and pitch, in degrees, that aim from `from` at `to` for an actor
 * facing `facingDeg` about +Y: the angles a head, an eye or a camera turns
 * through to look at a target.
 *
 * The world direction is rotated by `-facingDeg` into the actor's frame. Yaw is
 * `atan2(localX, localZ)` in `[-180, 180]`, where 0 is straight ahead and +90
 * is the actor's left, the direction-target convention. Pitch is
 * `atan2(dy, horizontal)` in `[-90, 90]`, positive up. A target on `from` has
 * no direction and answers `{ yawDeg: 0, pitchDeg: 0 }`. The caller maps the
 * pair onto a rig, such as a head's twist and flexion or a camera's pan and
 * tilt.
 * Heading is periodic modulo 360 degrees. Finite coordinates are uniformly
 * rescaled when differences overflow or heading rotation risks overflow or
 * subnormal precision loss; angles depend on direction rather than distance.
 *
 * A non-finite coordinate or facing throws an error naming the field, such as
 * `aimYawPitch to.z must be finite, but was Infinity`.
 *
 * @param from Eye or lens position in world metres.
 * @param to Target position in world metres.
 * @param facingDeg Actor heading about +Y in degrees; 0 faces +Z and 90 faces
 *   +X.
 *
 * @evidence contracts/common.md#principled-implementation Inverse-heading rotation followed by atan2 yields quadrant-aware yaw and elevation; modulo 360 preserves heading periodicity and positive uniform rescaling preserves directions when finite differences overflow or rotated components risk overflow/subnormal precision loss. Exact zero offset has the stated zero-angle convention.
 * @evidence contracts/common.md#clear-and-simple-design One geometric query beside `aimRotation`, called by the actor synthesizer's `lookAt` before `gazeChainJoints` splits the angles; how a rig carries them stays with that caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no rig or actor; non-finite input throws instead of being replaced, and the zero-offset answer is the stated convention for a direction that does not exist rather than a compensation.
 * @evidence contracts/common.md#meaningful-documentation States the heading convention, the yaw and pitch formulas with their ranges and signs, the zero-offset answer, the thrown message shape, and each parameter's unit and frame.
 * @evidence contracts/performance.md#efficient-algorithms Constant time: seven input finiteness checks, three difference checks, bounded coordinate rescaling, one sine and cosine, one hypot and two atan2 calls; field-label strings and the returned angle record have fixed size.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of two points and a heading that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the returned pair.
 * @author Samchon
 */
export const aimYawPitch: (from: IAutoMovieVector3, to: IAutoMovieVector3, facingDeg: number) => IAutoMovieYawPitch = (
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  facingDeg: number,
): IAutoMovieYawPitch => {
  validateVector("from", from);
  validateVector("to", to);
  validateFinite("facingDeg", facingDeg);
  let dx: number = to.x - from.x;
  let dy: number = to.y - from.y;
  let dz: number = to.z - from.z;
  if (dx === 0 && dy === 0 && dz === 0) return { yawDeg: 0, pitchDeg: 0 };
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || !Number.isFinite(dz)) {
    const scale: number = Math.max(Math.abs(from.x), Math.abs(from.y), Math.abs(from.z), Math.abs(to.x), Math.abs(to.y), Math.abs(to.z));
    dx = to.x / scale - from.x / scale;
    dy = to.y / scale - from.y / scale;
    dz = to.z / scale - from.z / scale;
  }
  const magnitude: number = Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz));
  if (magnitude > Number.MAX_VALUE / 4 || magnitude < 2 ** -511) {
    dx /= magnitude;
    dy /= magnitude;
    dz /= magnitude;
  }

  const facing: number = ((facingDeg % 360) * Math.PI) / 180;
  const cos: number = Math.cos(facing);
  const sin: number = Math.sin(facing);
  // rotate the world direction by -facing into the actor's local frame
  const localX: number = dx * cos - dz * sin;
  const localZ: number = dx * sin + dz * cos;
  const horizontal: number = Math.hypot(localX, localZ);
  return {
    yawDeg: (Math.atan2(localX, localZ) * 180) / Math.PI,
    pitchDeg: (Math.atan2(dy, horizontal) * 180) / Math.PI,
  };
};

const validateVector: (label: "from" | "to", value: IAutoMovieVector3) => void = (
  label: "from" | "to",
  value: IAutoMovieVector3,
): void => {
  for (const axis of VECTOR_AXES)
    validateFinite(`${label}.${axis}`, value[axis]);
};

const validateFinite: (label: string, value: number) => void = (label: string, value: number): void => {
  if (!Number.isFinite(value))
    throw new Error(`aimYawPitch ${label} must be finite, but was ${value}`);
};
