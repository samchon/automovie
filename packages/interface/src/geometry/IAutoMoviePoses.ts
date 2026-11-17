import type { IAutoMoviePhysicalProfile } from "../physics/IAutoMoviePhysicalProfile";

/** Borrowed world transforms for one candidate. */
export type IAutoMoviePoses = Readonly<Record<string, IAutoMoviePhysicalProfile.ITransform>>;
