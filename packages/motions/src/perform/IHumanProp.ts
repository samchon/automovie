import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A prop actions can aim at: a subject id and its named points, each a world
 * point with an outward unit normal at a film second, such as a heavy bag's
 * striking surface or a pad's face.
 *
 * A point is a function of time so a prop that moves (a pad on a holder's
 * hand, a swinging bag) is aimed at where it is, the way a target is tracked
 * after the commit.
 */
export interface IHumanProp {
  /** Subject id, unique in the performance. */
  subject: string;

  /** Named points by name. */
  points: Readonly<Record<string, (seconds: number) => { point: IAutoMovieVector3; normal: IAutoMovieVector3 }>>;
}
