/**
 * Container families a design reference may declare.
 *
 * Declaring a family does not implement its analyses or establish its
 * source-space extent. Raster and vector families share a closed type
 * vocabulary; explicit Engine validation checks that vocabulary without
 * guessing dimensions.
 *
 * Engine validation checks the declared media string. The production
 * byte-container and sheet-extent inspector is retired, so declaring a family
 * performs no current byte decoding or dimension measurement.
 */
export type AutoMovieDesignReferenceMedia =
  | "image/png"
  | "image/jpeg"
  | "image/svg+xml"
  | "application/pdf"
  | "image/vnd.dxf";
