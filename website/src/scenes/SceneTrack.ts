/**
 * The baked placements of one take, and how a pose at any second is read
 * from them. See `ISceneManifest` for the layout.
 *
 * Each value is a signed 16-bit integer: a position in millimetres, which
 * covers ±32.7 m from the origin, and a quaternion component times 32767.
 * That halves a take against 32-bit floats, at an error of half a
 * millimetre and a few thousandths of a degree, which no drawing shows.
 *
 * Reading between two frames interpolates each position linearly and each
 * rotation along the shorter arc, so a take baked at a low rate still plays
 * smoothly.
 */
export namespace SceneTrack {
  /** Values an entry takes in a frame: position, then rotation. */
  export const STRIDE: number = 7;

  /** Stored units in a metre. */
  export const POSITION_SCALE: number = 1000;

  /** Stored units in a quaternion component of 1. */
  export const ROTATION_SCALE: number = 32767;

  /** One entry's placement, the shape `buildHumanPolygon`'s `setPose` takes. */
  export interface IPlacement {
    /** Bone id, or `frame` for a prop. */
    bone: string;

    /** World position, metres. */
    position: [number, number, number];

    /** Rotation, unit quaternion `[x, y, z, w]`. */
    rotation: [number, number, number, number];
  }

  /** A track ready to be read. */
  export interface ITrack {
    /** Frames a second. */
    fps: number;

    /** Frames in the track. */
    frames: number;

    /** Each entry group's order: a figure's bones, or a prop's one frame. */
    orders: string[][];

    /** The values. */
    values: Int16Array;
  }

  /**
   * Write placements into a track's values.
   *
   * @param frames For each frame, for each group, its placements in that group's order.
   * @param orders Each group's order.
   * @returns The values.
   * @throws {Error} When a frame gives a group other entries than its order names, or a position lies beyond ±32.7 m.
   */
  export function encode(
    frames: readonly (readonly (readonly IPlacement[])[])[],
    orders: readonly (readonly string[])[],
  ): Int16Array {
    const width: number = orders.reduce(
      (sum: number, order: readonly string[]): number => sum + order.length,
      0,
    );
    const values: Int16Array = new Int16Array(frames.length * width * STRIDE);
    const position: (metres: number) => number = (metres: number): number => {
      const stored: number = Math.round(metres * POSITION_SCALE);
      if (stored < -32767 || stored > 32767)
        throw new Error(
          `A position of ${metres} m lies beyond the ±32.7 m a track holds`,
        );
      return stored;
    };
    let k: number = 0;
    frames.forEach(
      (groups: readonly (readonly IPlacement[])[], frame: number): void =>
        groups.forEach(
          (placements: readonly IPlacement[], group: number): void => {
            const order: readonly string[] = orders[group]!;
            if (
              placements.length !== order.length ||
              placements.some(
                (p: IPlacement, i: number): boolean => p.bone !== order[i],
              )
            )
              throw new Error(
                `Frame ${frame} gives group ${group} other entries than its order`,
              );
            for (const p of placements) {
              values[k] = position(p.position[0]);
              values[k + 1] = position(p.position[1]);
              values[k + 2] = position(p.position[2]);

              // q and -q are one rotation; storing the one with w ≥ 0 keeps
              // neighbouring frames on one side, so interpolation turns the
              // short way.
              const sign: number = p.rotation[3] < 0 ? -1 : 1;
              for (let c: number = 0; c < 4; c++)
                values[k + 3 + c] = Math.round(
                  sign * p.rotation[c]! * ROTATION_SCALE,
                );
              k += STRIDE;
            }
          },
        ),
    );
    return values;
  }

  /**
   * The placements of every group at a second.
   *
   * @param track The track.
   * @param seconds The film second; held at the ends outside the film.
   * @returns For each group, its placements in its order.
   */
  export function sample(track: ITrack, seconds: number): IPlacement[][] {
    const at: number = Math.min(
      track.frames - 1,
      Math.max(0, seconds * track.fps),
    );
    const lower: number = Math.floor(at);
    const upper: number = Math.min(track.frames - 1, lower + 1);
    const t: number = at - lower;
    const width: number = track.orders.reduce(
      (sum: number, order: string[]): number => sum + order.length,
      0,
    );
    const v: Int16Array = track.values;
    let a: number = lower * width * STRIDE;
    let b: number = upper * width * STRIDE;
    const lerp: (i: number) => number = (i: number): number =>
      (v[a + i]! + (v[b + i]! - v[a + i]!) * t) / POSITION_SCALE;
    return track.orders.map((order: string[]): IPlacement[] =>
      order.map((bone: string): IPlacement => {
        const placement: IPlacement = {
          bone,
          position: [lerp(0), lerp(1), lerp(2)],
          rotation: slerp(v, a + 3, b + 3, t),
        };
        a += STRIDE;
        b += STRIDE;
        return placement;
      }),
    );
  }

  /** The rotation a share `t` of the way along the shorter arc between two stored quaternions. */
  function slerp(
    v: Int16Array,
    a: number,
    b: number,
    t: number,
  ): [number, number, number, number] {
    const s: number = ROTATION_SCALE;
    const ax: number = v[a]! / s;
    const ay: number = v[a + 1]! / s;
    const az: number = v[a + 2]! / s;
    const aw: number = v[a + 3]! / s;
    let bx: number = v[b]! / s;
    let by: number = v[b + 1]! / s;
    let bz: number = v[b + 2]! / s;
    let bw: number = v[b + 3]! / s;

    let cos: number = ax * bx + ay * by + az * bz + aw * bw;
    if (cos < 0) {
      cos = -cos;
      bx = -bx;
      by = -by;
      bz = -bz;
      bw = -bw;
    }

    // Nearly equal rotations blend linearly, where the arc's sine vanishes.
    let p: number = 1 - t;
    let q: number = t;
    if (t !== 0 && cos < 0.9995) {
      const angle: number = Math.acos(cos);
      const sin: number = Math.sin(angle);
      p = Math.sin((1 - t) * angle) / sin;
      q = Math.sin(t * angle) / sin;
    }
    const x: number = p * ax + q * bx;
    const y: number = p * ay + q * by;
    const z: number = p * az + q * bz;
    const w: number = p * aw + q * bw;
    const length: number = Math.hypot(x, y, z, w) || 1;
    return [x / length, y / length, z / length, w / length];
  }
}
