import type { IAutoMovieQuaternion } from "@automovie/interface";

export const yaw = (angle: number): IAutoMovieQuaternion => ({ x: 0, y: Math.sin(angle / 2), z: 0, w: Math.cos(angle / 2) });
