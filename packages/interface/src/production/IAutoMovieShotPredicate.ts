import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import { IAutoMovieScalarPredicate } from "./IAutoMovieScalarPredicate";
import { IAutoMovieShotSpatialSelector } from "./IAutoMovieShotSpatialSelector";

/**
 * One scalar state or event fact measured from compiled pose or world placement.
 *
 * @evidence contracts/common.md#principled-implementation Joint-angle reads degrees on a declared rig bone and semantic axis, position reads one world-meter coordinate, and distance takes the Euclidean norm between spatial operands; all compose with the shared absolute-tolerance comparison.
 * @evidence contracts/common.md#clear-and-simple-design Three discriminated measurement arms reuse one scalar comparison contract, keeping operand-specific fields required only where their measurement consumes them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing nodes, rigs, bones, motions or formations produce a failing null measurement; a missing pose joint means zero rest only after the rig's bone existence is verified.
 * @evidence contracts/common.md#meaningful-documentation Defines each measurement family, typed operands, joint axis and degree or world-meter units inherited by the scalar expectation.
 * @author Samchon
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
      /** Measure Euclidean distance in meters between two compiled spatial operands. */
      kind: "distance";

      /** First spatial operand. */
      from: IAutoMovieShotSpatialSelector;

      /** Second spatial operand. */
      to: IAutoMovieShotSpatialSelector;
    });
