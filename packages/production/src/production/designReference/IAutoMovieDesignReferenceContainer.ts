/**
 * Parser-confirmed family and any extent carried by the admitted container.
 *
 * SVG may omit extent when its root does not declare supported user units. PDF and DXF admission supplies family only, never an inferred page or drawing box. Image dimensions are positive after their family parser admits them.
 *
 * Admission follows each family's documented profile; JPEG entropy, complete PDF semantics and visual quality are not certified by this metadata.
 *
 * @evidence contracts/common.md#principled-implementation The discriminated union reports the supported admission profile's family and extent facts, distinguishing SVG without an extent from raster dimensions and extent-free PDF/DXF.
 * @evidence contracts/common.md#clear-and-simple-design Container inspection owns family and extent admission; design-reference inventory consumes this compact result without retaining parser internals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A recognizable signature alone cannot construct this admitted result, and absent extent is not replaced with an arbitrary default.
 * @evidence contracts/common.md#meaningful-documentation States parser-confirmed facts, positive raster dimensions and unsupported SVG/PDF/DXF extent states.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result type executes no parser; family owners account for full-container admission cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type defines no cache or equivalence proof for container bytes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Results contain scalar metadata only; the inspecting caller owns bytes and this declaration acquires no resource.
 * @author Samchon
 */
export type IAutoMovieDesignReferenceContainer =
  | { media: "image/png" | "image/jpeg"; width: number; height: number }
  | { media: "image/svg+xml"; width: number; height: number }
  | { media: "image/svg+xml" }
  | { media: "application/pdf" | "image/vnd.dxf" };
