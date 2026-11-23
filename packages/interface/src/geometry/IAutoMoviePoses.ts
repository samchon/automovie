import type { IAutoMovieRigidTransform } from "./IAutoMovieRigidTransform";

/** Borrowed world transforms for one candidate. */
export type IAutoMoviePoses = Readonly<
  Record<string, IAutoMovieRigidTransform>
>;
