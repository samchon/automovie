/**
 * Retained triangle interval and chart bounds for one atlas patch.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Generating patch identity. First triangle ordinal in the generated mesh.
 * @evidence contracts/development/design.md#principled-representation First triangle ordinal in the generated mesh.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieRecoveryAnalyticReport, IAutoMovieRecoveryAtlasCompilation, IAutoMovieRecoveryAtlasGeneration share IAutoMovieRecoveryAtlasPrimitiveRange's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export interface IAutoMovieRecoveryAtlasPrimitiveRange {
 
 /** Generating patch identity. */
  patch: string;

 
 /** First triangle ordinal in the generated mesh. */
  firstTriangle: number;

 
 /** Number of consecutive retained triangles. */
  triangleCount: number;

 
 /** Lower local U bound. */
  u0: number;

 
 /** Upper local U bound. */
  u1: number;

 
 /** Lower local V bound. */
  v0: number;

 
 /** Upper local V bound. */
  v1: number;

 
 /** Retained field approximation bound in millimetres. */
  approximationBoundMm: number;
}
