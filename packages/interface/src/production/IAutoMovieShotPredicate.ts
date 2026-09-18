import { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import { IAutoMovieScalarPredicate } from "./IAutoMovieScalarPredicate";
import { IAutoMovieShotSpatialSelector } from "./IAutoMovieShotSpatialSelector";

/**
 * One builder-evaluable state or event fact.
 *
 * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `IAutoMovieShotPredicate` as the portable data boundary for the production design story boundary requirement.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `IAutoMovieShotPredicate` for the narrative intent story design ownership system contract.
 */
export type IAutoMovieShotPredicate =
  | (IAutoMovieScalarPredicate & {
      /** Sample one articulated joint angle. */
      kind: "joint-angle";
      /** Performed scene-node id. */
      actor: string;
      /** Normalized humanoid bone. */
      bone: AutoMovieHumanoidBone;
      /** Semantic pose axis. */
      axis: "flexion" | "abduction" | "twist";
    })
  | (IAutoMovieScalarPredicate & {
      /** Sample one world-space coordinate. */
      kind: "position";
      /** Compiled spatial subject. */
      subject: IAutoMovieShotSpatialSelector;
      /** World-space coordinate axis. */
      axis: "x" | "y" | "z";
    })
  | (IAutoMovieScalarPredicate & {
      /** Measure Euclidean distance between two compiled spatial operands. */
      kind: "distance";
      /** First spatial operand. */
      from: IAutoMovieShotSpatialSelector;
      /** Second spatial operand. */
      to: IAutoMovieShotSpatialSelector;
    });
