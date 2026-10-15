import type { IAutoMovieVector3 } from "@automovie/interface";


export const dot = (a: IAutoMovieVector3, b: IAutoMovieVector3): number => a.x * b.x + a.y * b.y + a.z * b.z;
