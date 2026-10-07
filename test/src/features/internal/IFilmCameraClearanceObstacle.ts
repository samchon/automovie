import type { IFilmCameraClearanceBox } from "./IFilmCameraClearanceBox";

/** Original addressed obstacle at a sampled time. */
export interface IFilmCameraClearanceObstacle {
  /** Staged node identity. */
  node: string;

  /** Same-clock world box. */
  bounds: IFilmCameraClearanceBox;
}
