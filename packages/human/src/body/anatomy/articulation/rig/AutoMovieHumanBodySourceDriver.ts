import type { IAutoMovieHumanBodySourceAnatomicalDriver } from "./IAutoMovieHumanBodySourceAnatomicalDriver";
import type { IAutoMovieHumanBodySourcePoseDriver } from "./IAutoMovieHumanBodySourcePoseDriver";
import type { IAutoMovieHumanBodySourceShoulderDriver } from "./IAutoMovieHumanBodySourceShoulderDriver";
import type { IAutoMovieHumanBodySourceToeDriver } from "./IAutoMovieHumanBodySourceToeDriver";

/** Supported numerical goal owners; source vertices and matrices are not authoring coordinates. */
export type AutoMovieHumanBodySourceDriver =
  | IAutoMovieHumanBodySourcePoseDriver
  | IAutoMovieHumanBodySourceShoulderDriver
  | IAutoMovieHumanBodySourceToeDriver
  | IAutoMovieHumanBodySourceAnatomicalDriver;
