import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";

/** Type contracts exchanged by AutoMovieHumanTrunkMassPlacement; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanTrunkMassPlacement {
  /**
   * The original wall point, AP direction and distance to the declared apex.
   *
   * @evidence contracts/common.md#principled-implementation Separates the source wall point and AP extreme from the host chart used only for embedding.
   * @evidence contracts/common.md#clear-and-simple-design Three tuples/scalars supply the existing mass builder directly.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries no fitted or recovered geometric substitute.
   * @evidence contracts/common.md#meaningful-documentation Members state calibration units and chart versus world meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The record declares no algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The placement operation owns sharing.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Its synchronous caller owns the returned tuples.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The original wall point, AP direction and distance to the declared apex.
   * @evidence contracts/development/design.md#principled-representation `centre`: Original trunk chart station and polar phase, mm and radians. `origin`: Original wall point at the target's Y/Z, calibration mm. `normal`: Anatomical anterior or posterior unit direction.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanTrunkMassPlacement.of. Also types AutoMovieHumanTrunkBuild.placement.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `centre`, `origin`, `normal`, `amplitude`; callers supply the complete record.
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
