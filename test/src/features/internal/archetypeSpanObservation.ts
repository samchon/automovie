import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Direct geometric observations of actual rendered cylinder data.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines source-independent cylinder endpoint observations in model metres.
 * @evidence contracts/development/design.md#principled-representation The observations read actual part geometry and TRS, without a span declaration or state operation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Both held-line and line-dependency units need the same physical endpoints; assertion expectations remain with those units.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No producer formula, expected endpoint, saved output or mocked method enters this observer.
 */
export namespace archetypeSpanObservation {
  /**
   * Measure the two actual cylinder axis endpoints.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States model metres, primitive/unit-frame premise and actual endpoint ordering along local +Y.
   * @evidence contracts/development/implementation.md#principled-implementation Rotate the actual half-height vector and add/subtract it from the actual primitive centre.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit a cylinder, obtain one rotated half-axis and return both endpoints.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads no declared span endpoints or implementation-computed state to manufacture expected geometry.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant-size scalar/vector observation with two new points.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One half-axis serves both physical endpoints.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains no model or external resource; the caller owns two new points.
   */
  export function ends(
    part: IAutoMovieModelPart,
  ): readonly [IAutoMovieVector3, IAutoMovieVector3] {
    if (
      part.geometry.type !== "primitive" ||
      part.geometry.shape.type !== "cylinder" ||
      part.transform === null ||
      part.transform === undefined
    )
      throw new Error(
        "The observed line must be an actual transformed cylinder",
      );
    const half: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      part.transform.rotation,
      { x: 0, y: part.geometry.shape.height / 2, z: 0 },
    );
    return [
      AutoMovieEngineVector3.subtract(part.transform.translation, half),
      AutoMovieEngineVector3.add(part.transform.translation, half),
    ];
  }
}
