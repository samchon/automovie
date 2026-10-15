import type { IAutoMovieVector3 } from "@automovie/interface";


/** Unit vector along `a`; throws for a zero-length vector. */
export const unit = (a: IAutoMovieVector3): IAutoMovieVector3 => {
  const length = Math.hypot(a.x, a.y, a.z);
  if (length < 1e-9) throw new Error("frustum: zero-length camera direction");
  return { x: a.x / length, y: a.y / length, z: a.z / length };
};
