import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One answered station of a girth or breadth rule, as the measurement
 * instrument cut it.
 *
 * `readHumanBodyShapedMeasurement` hands an owned copy of each answered
 * station to its optional observer, so a consumer can read the same cut
 * without repeating the witness calculation. Mutating the copy changes
 * neither the measured skin nor a later station.
 *
 * @evidence contracts/common.md#principled-implementation Exposes the instrument's own plane and seed instead of a second witness formula.
 * @evidence contracts/common.md#clear-and-simple-design Three named vectors replace an anonymous observer argument.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reports only answered stations; an unanswered station produces no record.
 * @evidence contracts/common.md#meaningful-documentation States the producer, the ownership of the copy and each vector's frame.
 * @evidence contracts/modeling.md#spatial-conventions Points are metres in the frame of the evaluated surfaces; the normal is a unit direction.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no channel.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The builder owns the measured skin.
 * @evidenceExclude contracts/modeling.md#rendered-observation Consumers own observation of the cut.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The measurement rule owns its anatomical site.
 * @evidenceExclude contracts/anatomy.md#permitted-range Bounds no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Derived instrument output, not an authored input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyMeasurementSection {
  /**
   * Station on the rule's landmark segment, in metres; for a skin-level rule,
   * where the plane through the shaped witness vertex meets that segment.
   */
  point: IAutoMovieVector3;

  /** Unit plane normal: `+Y` for a horizontal rule, else the segment direction. */
  normal: IAutoMovieVector3;

  /** Position whose nearest closed loop by centroid is the measured component. */
  seed: IAutoMovieVector3;
}
