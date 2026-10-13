/**
 * Container families a design reference may declare.
 *
 * Declaring a family is not a claim that every analysis over it is implemented:
 * a raster plan and a vector plan are both registrable, while the source-space
 * extent of a PDF page or a DXF drawing is reported as `unsupported` rather
 * than guessed. The list is closed so an unregistrable container fails at the
 * type level in source and at validation in JSON.
 *
 * The production inspector reads an extent from PNG and JPEG headers and from
 * an SVG root `viewBox` or unitless size, and never from PDF or DXF.
 */
export type AutoMovieDesignReferenceMedia =
  | "image/png"
  | "image/jpeg"
  | "image/svg+xml"
  | "application/pdf"
  | "image/vnd.dxf";
