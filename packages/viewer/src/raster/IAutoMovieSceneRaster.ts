/**
 * One frame drawn in Node by `rasterizeAutoMovieScene`: its opaque sRGB
 * pixels and a count of what was drawn and what could not be represented.
 *
 * The frame is a CPU diagnostic of geometry, pose, staging and framing, not a
 * copy of the GPU Viewer's pixels: surfaces are flat shaded from their base
 * colours under the scene's lights, without textures, shadows, fog or
 * post-processing. `statistics.skipped` and `statistics.untextured` say what a
 * reader should not expect to see.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The comment says which call produces the frame, that it is a geometry and staging diagnostic rather than GPU parity, what the shading leaves out, and where the omissions are counted; each member states its unit and layout.
 * @evidence contracts/development/design.md#principled-representation A frame is exactly what a PNG encoder and a reviewer need: integer raster size, row-major opaque RGBA bytes and counts; byte layout matches the encoder and the sheet writer without conversion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, all read by the encoder, label stamping or the capture manifest; the statistics shape lives in the companion namespace.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member names a particular film, figure or capture command.
 */
export interface IAutoMovieSceneRaster {
  /** Raster width in pixels. */
  width: number;

  /** Raster height in pixels. */
  height: number;

  /** Opaque sRGB RGBA bytes, row-major from the top-left corner. */
  pixels: Uint8ClampedArray;

  /** What the frame drew and what it replaced or left out. */
  statistics: IAutoMovieSceneRaster.IStatistics;
}

/** Companion types of {@link IAutoMovieSceneRaster}. */
export namespace IAutoMovieSceneRaster {
  /**
   * Counts of one frame's drawing work.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each count states what it counts, so a reader can tell an empty frame from an unrepresentable one.
   * @evidence contracts/development/design.md#principled-representation Plain non-negative counts keyed by stable three.js type names serialize directly into a capture manifest.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the counts a reviewer needs to judge coverage: drawn primitives, skipped object types, approximated materials.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No count is specific to one production or object name.
   */
  export interface IStatistics {
    /** Visible meshes submitted, counting each instance of an instanced mesh. */
    meshes: number;

    /** Triangles that reached the raster after culling and clipping. */
    triangles: number;

    /** Line segments drawn from `Line`, `LineSegments` and `LineLoop` objects. */
    lines: number;

    /** Points drawn from `Points` objects. */
    points: number;

    /** Visible objects of a type this rasterizer does not draw, by three.js type name. */
    skipped: Record<string, number>;

    /** Submitted materials whose texture map was replaced by the base colour. */
    untextured: number;

    /** Submitted shader materials drawn with a neutral clay colour. */
    approximated: number;
  }
}
