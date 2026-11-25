import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieScalarPredicate } from "./IAutoMovieScalarPredicate";
import type { IAutoMovieShotSpatialSelector } from "./IAutoMovieShotSpatialSelector";

/**
 * One scalar state or event fact measured from compiled pose or world
 * placement.
 */
export type IAutoMovieShotPredicate =
  | (IAutoMovieScalarPredicate & {
      /** Sample one articulated joint angle in degrees. */
      kind: "joint-angle";

      /** Performed scene-node id. */
      actor: string;

      /** Normalized humanoid bone. */
      bone: AutoMovieHumanoidBone;

      /** Semantic pose axis. */
      axis: "flexion" | "abduction" | "twist";
    })
  | (IAutoMovieScalarPredicate & {
      /** Sample one world-space coordinate in meters. */
      kind: "position";

      /** Compiled spatial subject. */
      subject: IAutoMovieShotSpatialSelector;

      /** World-space coordinate axis. */
      axis: "x" | "y" | "z";
    })
  | (IAutoMovieScalarPredicate & {
      /**
       * Measure Euclidean distance in meters between two compiled spatial
       * operands.
       */
      kind: "distance";

      /** First spatial operand. */
      from: IAutoMovieShotSpatialSelector;

      /** Second spatial operand. */
      to: IAutoMovieShotSpatialSelector;
    });
