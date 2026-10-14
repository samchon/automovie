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
 * an SVG root `viewBox`, else its unitless or `px` `width` and `height`, and
 * never from PDF or DXF.
 *
 * @evidence contracts/common.md#principled-implementation Five media strings mirror the engine's exact case-sensitive table. Production signature/token dispatch selects bounded family admission: PNG framing/CRC plus decoding, JPEG marker/scan framing without entropy decoding, classic PDF xref/page-tree framing rather than complete semantics, DTD-free namespace-resolved SVG XML or DXF section records. Admission establishes only those profiles, not universal format or visual validity.
 * @evidence contracts/common.md#clear-and-simple-design Standard media type strings rather than a private format enum, so a declared reference names its container the way the bytes are labelled elsewhere.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts PDF and DXF stay registrable with their extent reported as unsupported instead of guessed from a page box or drawing limits that the inspector does not read.
 * @evidence contracts/common.md#meaningful-documentation States that registration does not imply full analysis, why the list is closed, and from which part of each family the inspector reads an extent.
 * @author Samchon
 */
export type AutoMovieDesignReferenceMedia =
  | "image/png"
  | "image/jpeg"
  | "image/svg+xml"
  | "application/pdf"
  | "image/vnd.dxf";
