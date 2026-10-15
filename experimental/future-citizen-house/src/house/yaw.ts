import type { IAutoMovieQuaternion } from "@automovie/interface";

/** Rotation of `angle` radians about the vertical axis. */
export const yaw = (angle: number): IAutoMovieQuaternion => ({ x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) });
