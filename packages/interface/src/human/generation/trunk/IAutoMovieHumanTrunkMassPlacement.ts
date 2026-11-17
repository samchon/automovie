import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/**
 * Original trunk wall chart, world point, anatomical AP direction and apex distance. Runtime construction and admission remain with AutoMovieHumanTrunkMassPlacement in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes original trunk wall chart, world point, anatomical AP direction and apex distance; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Original trunk wall chart, world point, anatomical AP direction and apex distance. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanTrunkMassPlacement; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing TrunkMassPlacement contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanTrunkMassPlacement {
  /**
   * The original wall point, AP direction and distance to the declared apex.
   *
   * Its synchronous caller owns the returned tuples.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The original wall point, AP direction and distance to the declared apex.
   * @evidence contracts/development/design.md#principled-representation Separates the source wall point and AP extreme from the host chart used only for embedding.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The source chart, wall point, anatomical direction and apex distance supply the existing mass builder directly.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Carries no fitted or recovered geometric substitute.
   */
  export interface IPlacement {
    /** Original trunk chart station and polar phase, mm and radians. */
    centre: [number, number];
    /** Original wall point at the target's Y/Z, calibration mm. */
    origin: AutoMovieVector3Tuple;
    /** Anatomical anterior or posterior unit direction. */
    normal: AutoMovieVector3Tuple;
    /** Positive AP distance from wall to apex, mm. */
    amplitude: number;
  }
}
