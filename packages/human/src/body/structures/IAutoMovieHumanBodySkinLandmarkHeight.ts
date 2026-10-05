/**
 * The vertical height of a named skin point above a ground landmark, as an
 * anthropometer reads a drawn landmark's height from the standing surface.
 *
 * `to` is a fixed anatomical landmark registered on the basis skin
 * (`skinLandmarks`), so the reading follows it on every shape; `from` is the
 * joint landmark the horizontal ground plane passes through.
 *
 * @evidence contracts/common.md#principled-implementation The skin point is the registered landmark the definition names, read on each shaped skin.
 * @evidence contracts/common.md#clear-and-simple-design One ground landmark and one skin landmark.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A basis without the landmark answers null in the reader instead of a substitute point.
 * @evidence contracts/common.md#meaningful-documentation States both landmarks and the vertical reading.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Metres along +Y in the basis frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It reads the builder's skin.
 * @evidenceExclude contracts/modeling.md#rendered-observation The measured channel's consumer owns observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Each rule in HUMAN_BODY_MEASUREMENTS states its survey definition.
 * @evidenceExclude contracts/anatomy.md#permitted-range It reads and bounds no authored value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It is an instrument definition, not an authoring input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkinLandmarkHeight {
  /** A skin landmark's height above the ground plane. */
  kind: "skin-height";

  /** Joint landmark id the horizontal ground plane passes through. */
  from: string;

  /** Skin landmark name whose height is read. */
  to: string;
}
