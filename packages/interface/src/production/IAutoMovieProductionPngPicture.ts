import { AutoMovieProductionPngColor } from "./AutoMovieProductionPngColor";

/**
 * Complete parser-observed PNG picture facts.
 *
 * @evidence requirements/delivery-and-accessibility/picture-color-and-image-sequences.md#delivery-picture-dimensions-window Preserves the decoded raster, precision, channel, color, aspect, and orientation facts final picture verification compares against the planned window.
 * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-picture-products Supplies the observed picture product compared fieldwise with the selected delivery profile.
 */
export interface IAutoMovieProductionPngPicture {
  /**
   * Decoded pixel width.
   * @evidence requirements/delivery-and-accessibility/picture-color-and-image-sequences.md#delivery-picture-dimensions-window Preserves the decoded horizontal stored dimension.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-picture-products Supplies the observed width for profile comparison.
   */
  width: number;
  /**
   * Decoded pixel height.
   * @evidence requirements/delivery-and-accessibility/picture-color-and-image-sequences.md#delivery-picture-dimensions-window Preserves the decoded vertical stored dimension.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-picture-products Supplies the observed height for profile comparison.
   */
  height: number;
  /**
   * Decoded sample precision.
   * @evidence requirements/delivery-and-accessibility/picture-color-and-image-sequences.md#delivery-picture-alpha-channels Preserves the encoded per-channel precision that fixes each channel's valid range.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-picture-products Supplies the observed bit depth for profile comparison.
   */
  bitDepth: number;
  /**
   * Decoded channel population.
   * @evidence requirements/delivery-and-accessibility/picture-color-and-image-sequences.md#delivery-picture-alpha-channels Distinguishes grayscale, palette, RGB, and alpha-bearing channel populations.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-picture-products Supplies the observed color model for profile comparison.
   */
  color: AutoMovieProductionPngColor;
  /**
   * Decoded alpha relation.
   * @evidence requirements/delivery-and-accessibility/picture-color-and-image-sequences.md#delivery-picture-alpha-channels Keeps opacity distinct from straight alpha.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-picture-products Supplies the observed alpha fact for profile comparison.
   */
  alpha: "none" | "straight";
  /**
   * Decoded scan organization.
   * @evidence requirements/delivery-and-accessibility/picture-color-and-image-sequences.md#delivery-image-sequences Preserves whether the picture is interlaced.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-picture-products Supplies the observed interlace fact for profile comparison.
   */
  interlace: "none" | "adam7";
  /**
   * Color meaning explicitly carried by the datastream.
   * @evidence requirements/delivery-and-accessibility/picture-color-and-image-sequences.md#delivery-scene-display-picture Preserves the display-referred color identity the datastream declares instead of inferring one.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-picture-products Supplies the observed color-space fact for profile comparison.
   */
  colorSpace: "srgb" | "icc" | "gamma" | "unidentified";
  /**
   * Implicit or explicit pixel aspect carried by the datastream.
   * @evidence requirements/delivery-and-accessibility/picture-color-and-image-sequences.md#delivery-picture-refusal Makes stretch-producing density metadata observable.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-picture-products Supplies the observed aspect fact for profile comparison.
   */
  pixelAspect:
    | { kind: "square" }
    | { kind: "explicit"; x: number; y: number; unit: 0 | 1 };
  /**
   * Presence of orientation metadata that could transform presentation.
   * @evidence requirements/delivery-and-accessibility/picture-color-and-image-sequences.md#delivery-picture-refusal Keeps encoded orientation from being silently applied.
   * @evidence specifications/editorial-render-and-delivery/delivery-profiles-time-and-picture.md#spec-delivery-picture-products Supplies the observed orientation fact for profile comparison.
   */
  orientation: "upright" | "metadata-present";
}
