/**
 * Role of a renderer-owned PNG, which decides its picture profile.
 *
 * `preview` and `guide-frame` pictures take the authored raster, while
 * `waveform` (960 × 240) and `spectrogram` (512 × 192) pictures have the fixed
 * rasters their audio-evidence writers draw; `resolveProductionPngProfile`
 * maps a role to its profile.
 *
 * @evidence contracts/development/design.md#principled-representation A closed string union names each kind of picture the renderer writes, so the profile resolver can switch exhaustively and a delivery check names the role in its refusal.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four literals cover the PNG writers that exist; the raster and format rules stay in `resolveProductionPngProfile` rather than in the role type.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The fixed rasters belong to the two audio-evidence roles as contract constants of their writers, and the union adds no role for a single consumer.
 * @evidence contracts/development/common.md#meaningful-documentation The doc states which roles take the authored raster, the fixed raster of the others, and where a role becomes a profile.
 */
export type AutoMovieProductionPngRole =
  | "preview"
  | "guide-frame"
  | "waveform"
  | "spectrogram";
