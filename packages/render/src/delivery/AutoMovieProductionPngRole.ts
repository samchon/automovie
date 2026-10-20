/**
 * Role of a renderer-owned PNG, which decides its picture profile.
 *
 * `preview` and `guide-frame` pictures take the authored raster, while
 * `waveform` (960 × 240) and `spectrogram` (512 × 192) pictures have the fixed
 * rasters their audio-evidence writers draw; `resolveProductionPngProfile`
 * maps a role to its profile.
 *
 * @evidence contracts/common.md#principled-implementation A closed string union names each kind of picture the renderer writes, so the profile resolver can switch exhaustively and a delivery check names the role in its refusal.
 * @evidence contracts/common.md#clear-and-simple-design Four literals cover the PNG writers that exist; the raster and format rules stay in `resolveProductionPngProfile` rather than in the role type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fixed rasters belong to the two audio-evidence roles as contract constants of their writers, and the union adds no role for a single consumer.
 * @evidence contracts/common.md#meaningful-documentation The doc states which roles take the authored raster, the fixed raster of the others, and where a role becomes a profile.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A string-literal union carries no executable logic, so it has no algorithm to choose.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The union names roles only and coordinates no work between consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A role literal holds no state, handle or task.
 */
export type AutoMovieProductionPngRole =
  | "preview"
  | "guide-frame"
  | "waveform"
  | "spectrogram";
