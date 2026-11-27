import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanFrame,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * A performer's own horizontal frame: an origin on the floor and a heading.
 *
 * Local coordinates follow the canonical body: `x` toward the performer's left,
 * `y` up and `z` forward. A heading of 0 degrees faces world +Z and 90 faces
 * world +X, a right-handed turn about +Y, so the left of a performer at heading
 * `h` is world `(cos h, 0, -sin h)` and the forward is `(sin h, 0, cos h)`.
 */
export namespace HumanFrame {
  /*
   * A local point in world metres.
   * Parameter frame: The frame.
   * Parameter local: `x` left, `y` up, `z` forward, metres.
   * Returns: The world point.
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

  /*
   * A world point in the frame's local coordinates.
   * Parameter frame: The frame.
   * Parameter world: The world point.
   * Returns: `x` left, `y` up, `z` forward, metres.
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

  /*
   * Snapshot a fixed floor frame for repeated conversions. Later mutations of
   * the source origin or yaw do not change this prepared transform.
   * Parameter frame: The frame whose current scalar origin and heading are copied.
   * Returns: Bound forward, inverse and origin-free direction conversions, each
   * returning a fresh vector; point may explicitly supply another origin
   * under the same fixed heading.
   */
  export function prepare(frame: IAutoMovieMotionHumanFrame): IPrepared {
    const origin: IAutoMovieVector3 = {
      x: frame.origin.x,
      y: frame.origin.y,
      z: frame.origin.z,
    };
    const radians: number = (frame.yaw * Math.PI) / 180;
    const cosine: number = Math.cos(radians);
    const sine: number = Math.sin(radians);
    return {
      point: (
        local: IAutoMovieVector3,
        at: IAutoMovieVector3 = origin,
      ): IAutoMovieVector3 => world(at, cosine, sine, local),
      local: (point: IAutoMovieVector3): IAutoMovieVector3 =>
        relative(origin, cosine, sine, point),
      direction: (local: IAutoMovieVector3): IAutoMovieVector3 =>
        world(ZERO, cosine, sine, local),
    };
  }

  /*
   * Prepare a fixed local point under a fixed floor heading, translated by each
   * supplied world origin. Arithmetic grouping matches point exactly.
   * Parameter yaw: The unchanged heading, degrees about world +Y.
   * Parameter local: The unchanged local point in metres, copied as scalar
   * products.
   * Returns: A fresh world point for each varying origin in metres.
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

  /*
   * Prepare a local segment under one fixed heading, then transform each actual
   * interpolated point without allocating its local vector.
   * Parameter frame: The copied default world-metre origin and heading in degrees.
   * Parameter from: The copied local left/up/forward starting point, metres.
   * Parameter to: The copied local endpoint, metres.
   * Returns: A fresh world point for a share, optional current world origin and
   * optional added local height in metres. Shares extrapolate outside [0,1];
   * absent height performs no extra addition.
   */
  export function prepareLerp(
    frame: IAutoMovieMotionHumanFrame,
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
  ): (
    share: number,
    origin?: IAutoMovieVector3,
    liftY?: number,
  ) => IAutoMovieVector3 {
    const origin: IAutoMovieVector3 = {
      x: frame.origin.x,
      y: frame.origin.y,
      z: frame.origin.z,
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
    return (
      share: number,
      at: IAutoMovieVector3 = origin,
      liftY?: number,
    ): IAutoMovieVector3 => {
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

  /*
   * Coordinate readers bound to one copied horizontal frame.
   */
  export interface IPrepared {
    /*
     * Local left/up/forward metres to a fresh world point; an explicit
     * world-metre origin replaces only the copied default translation.
     */
    point(
      local: IAutoMovieVector3,
      origin?: IAutoMovieVector3,
    ): IAutoMovieVector3;

    /*
     * World point to fresh local left/up/forward metres in the copied default
     * frame.
     */
    local(world: IAutoMovieVector3): IAutoMovieVector3;

    /*
     * Local vector to its fresh world direction, without applying the origin.
     */
    direction(local: IAutoMovieVector3): IAutoMovieVector3;
  }

  /*
   * The unit vector a heading faces along the floor, world.
   * Parameter yaw: Degrees about +Y.
   * Returns: `(sin yaw, 0, cos yaw)`.
   */
  export function forward(yaw: number): IAutoMovieVector3 {
    return point({ origin: { x: 0, y: 0, z: 0 }, yaw }, { x: 0, y: 0, z: 1 });
  }

  /*
   * The rotation of a heading about +Y.
   * Parameter yaw: Degrees.
   * Returns: The rotation.
   */
  export function turn(yaw: number): IAutoMovieQuaternion {
    return TURN(yaw);
  }

  /*
   * The heading of a world rotation's forward (+Z) projected on the floor.
   * Parameter rotation: A world rotation.
   * Returns: Degrees about +Y.
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

/*
 * Private unchanged +Y axis; its original magnitude is prepared on the first
 * turn.
 */
const TURN: (yaw: number) => IAutoMovieQuaternion = Quaternion.prepareAxisAngle(
  {
    x: 0,
    y: 1,
    z: 0,
  },
);

/*
 * Apply the original forward expression with a supplied origin and yaw
 * coefficients.
 */
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

/*
 * Apply the original inverse expression with a supplied origin and yaw
 * coefficients.
 */
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

/*
 * Zero origin preserves the standalone direction transform's exact arithmetic.
 */
const ZERO: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
