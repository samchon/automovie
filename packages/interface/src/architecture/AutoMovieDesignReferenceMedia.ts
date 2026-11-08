/**
 * Container families a design reference may declare.
 *
 * Declaring a family does not implement its analyses or establish its source-space extent. Raster and vector families share a closed type vocabulary; explicit Engine validation checks that vocabulary without guessing dimensions.
 *
 * Engine validation checks the declared media string. The production byte-container and sheet-extent inspector is retired, so declaring a family performs no current byte decoding or dimension measurement.
 *
 * @evidence contracts/development/design.md#principled-representation Five media strings mirror the engine's exact case-sensitive table. isAutoMovieDesignReferenceMedia checks string membership only; byte/container correctness, decoded extent and correspondence with the declared family remain host premises after production inspector retirement.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Standard media type strings rather than a private format enum, so a declared reference names its container the way the bytes are labelled elsewhere.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A supported string supplies no guessed sheet size, page box, raster recognition or full container-standard admission; explicit hosts own those observations.
 * @evidence contracts/development/common.md#meaningful-documentation States the closed declared families and distinguishes Engine string admission from absent automatic byte/extent inspection.
 */
export type AutoMovieDesignReferenceMedia =
  | "image/png"
  | "image/jpeg"
  | "image/svg+xml"
  | "application/pdf"
  | "image/vnd.dxf";
