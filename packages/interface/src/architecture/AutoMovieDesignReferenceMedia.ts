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
 *
 * @evidence contracts/common.md#principled-implementation MIME type strings name the five container families the production inspector parses from bytes, and `validateDesignReference` tests a record's media for membership in the engine's `AUTO_MOVIE_DESIGN_REFERENCE_MEDIA` table.
 * @evidence contracts/common.md#clear-and-simple-design The five names are repeated in that engine table with no type annotation tying it to this union, and the guard casts the table to unknown values, so a change has to edit both lists by hand.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts PDF page boxes and DXF drawing extents are reported as unsupported rather than guessed, and the family comes from parsed signatures and grammar, never from a file extension.
 * @evidence contracts/common.md#meaningful-documentation States that registering a family implies no analysis, which families yield an extent and from what, and where an unregistrable container is refused in source and in JSON.
 */
export type AutoMovieDesignReferenceMedia =
  | "image/png"
  | "image/jpeg"
  | "image/svg+xml"
  | "application/pdf"
  | "image/vnd.dxf";
