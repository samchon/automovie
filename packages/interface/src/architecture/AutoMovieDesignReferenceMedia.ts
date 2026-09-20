/**
 * Container families a design reference may declare.
 *
 * Declaring a family is not a claim that every analysis over it is implemented:
 * a raster plan and a vector plan are both registrable, while the source-space
 * extent of a PDF page or a DXF drawing is reported as `unsupported` rather
 * than guessed. The list is closed so an unregistrable container fails at the
 * type level in source and at validation in JSON.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-reference-unsupported-incomplete Exposes `AutoMovieDesignReferenceMedia` as the portable data boundary for the production design reference unsupported incomplete requirement.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-authority-replacement Types `AutoMovieDesignReferenceMedia` for the narrative intent reference authority replacement system contract.
 */
export type AutoMovieDesignReferenceMedia =
  | "image/png"
  | "image/jpeg"
  | "image/svg+xml"
  | "application/pdf"
  | "image/vnd.dxf";
