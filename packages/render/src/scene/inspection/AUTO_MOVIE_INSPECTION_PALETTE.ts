import type {
  IAutoMovieConstructionCurve,
  IAutoMovieMeshDefect,
} from "@automovie/engine";

/**
 * Colours of inspection marks, as sRGB hex.
 *
 * Each construction curve kind, the flag on a curve, each mesh defect kind and the back of a surface has a hue of its own, so a mark is identified by its colour alone in a reduced still. `clay` and `front` are neutral greys that none of the marks can be mistaken for.
 *
 * | Mark | Colour |
 * | --- | --- |
 * | Section curve | Blue `59a0f4` |
 * | Guide curve | Green `59cb89` |
 * | Axis curve | Cyan `00e5ff` |
 * | Flagged curve of any kind | Magenta `ff00ff` |
 * | Open edge | Red `ff3b30` |
 * | Non-manifold edge | Purple `b14aff` |
 * | Inconsistent edge | Yellow `ffcc00` |
 * | Degenerate triangle | White `ffffff` |
 * | Sliver triangle | Orange `ff9500` |
 * | Back face, under the faces shade | Maroon `8b1a1a` |
 */
export const AUTO_MOVIE_INSPECTION_PALETTE: {
  /** Colour of an unflagged construction curve, by its kind. */
  readonly curve: Readonly<Record<IAutoMovieConstructionCurve.Kind, number>>;

  /** Colour of a construction curve its sampler flagged, whatever its kind. */
  readonly flagged: number;

  /** Colour of a mesh defect's edges, by its kind. */
  readonly defect: Readonly<Record<IAutoMovieMeshDefect.Kind, number>>;

  /** Surface colour of the clay shade, before lighting. */
  readonly clay: number;

  /** Colour of a surface seen from its front under the faces shade. */
  readonly front: number;

  /** Colour of a surface seen from its back under the faces shade. */
  readonly back: number;
} = {
  curve: { section: 0x59a0f4, guide: 0x59cb89, axis: 0x00e5ff },
  flagged: 0xff00ff,
  defect: {
    open: 0xff3b30,
    "non-manifold": 0xb14aff,
    inconsistent: 0xffcc00,
    degenerate: 0xffffff,
    sliver: 0xff9500,
  },
  clay: 0xbdbdbd,
  front: 0xb0b0b0,
  back: 0x8b1a1a,
};
