import { IAutoMovieVector3, IAutoMovieYawPitch } from "@automovie/interface";

/*
 * The yaw and pitch, in degrees, that aim from `from` at `to` for an actor
 * facing `facingDeg` about +Y: the angles a head, an eye or a camera turns
 * through to look at a target.
 *
 * The world direction is rotated by `-facingDeg` into the actor's frame. Yaw is
 * `atan2(localX, localZ)` in `[-180, 180]`, where 0 is straight ahead and +90
 * is the actor's left, the direction-target convention. Pitch is `atan2(dy,
 * horizontal)` in `[-90, 90]`, positive up. A target on `from` has no direction
 * and answers `{ yawDeg: 0, pitchDeg: 0 }`. The caller maps the pair onto a
 * rig, such as a head's twist and flexion or a camera's pan and tilt. Heading
 * is periodic modulo 360 degrees. Finite coordinates are uniformly rescaled
 * when differences overflow or heading rotation risks overflow or subnormal
 * precision loss; angles depend on direction rather than distance.
 *
 * A non-finite coordinate or facing throws an error naming the field, such as
 * `aimYawPitch to.z must be finite, but was Infinity`.
 * Parameter from: Eye or lens position in world metres.
 * Parameter to: Target position in world metres.
 * Parameter facingDeg: Actor heading about +Y in degrees; 0 faces +Z and 90 faces
 * +X.
 */
export function aimYawPitch(
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
  facingDeg: number,
): IAutoMovieYawPitch {
  let dx: number = to.x - from.x;
  let dy: number = to.y - from.y;
  let dz: number = to.z - from.z;
  if (dx === 0 && dy === 0 && dz === 0) return { yawDeg: 0, pitchDeg: 0 };
  // A component difference can overflow only past half the largest double;
  // the endpoints are then read on their common scale.
  const extent: number = Math.max(
    Math.abs(from.x),
    Math.abs(from.y),
    Math.abs(from.z),
    Math.abs(to.x),
    Math.abs(to.y),
    Math.abs(to.z),
  );
  if (extent > Number.MAX_VALUE / 2) {
    const scale: number = Math.max(
      Math.abs(from.x),
      Math.abs(from.y),
      Math.abs(from.z),
      Math.abs(to.x),
      Math.abs(to.y),
      Math.abs(to.z),
    );
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
}
