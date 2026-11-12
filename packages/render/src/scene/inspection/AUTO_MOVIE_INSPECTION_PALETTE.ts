import type { IAutoMovieMeshDefect } from "@automovie/engine";

/**
 * Colours the inspection itself owns, as sRGB hex: the flag every anomaly takes, the kinds it measures on meshes, defects and edges, and the surface colours of its two shades.
 *
 * Supplied marks bring their own colours, so this table lists no curve, joint or contact. A mark kind may take none of the reserved colours: the flag always, `clay` under the clay shade, `front` and `back` under the faces shade.
 *
 * | Use | Colour |
 * | --- | --- |
 * | Flagged mark of any kind | Magenta `ff00ff` |
 * | Open edge | Red `ff3b30` |
 * | Non-manifold edge | Purple `b14aff` |
 * | Inconsistent edge | Yellow `ffcc00` |
 * | Degenerate triangle | White `ffffff` |
 * | Sliver triangle | Orange `ff9500` |
 * | Mesh edge | Dark blue `2b3a67` |
 * | Clay surface | Grey `bdbdbd` |
 * | Front of a surface, under the faces shade | Grey `b0b0b0` |
 * | Back of a surface, under the faces shade | Maroon `8b1a1a` |
 */
export const AUTO_MOVIE_INSPECTION_PALETTE: {
  /** Colour of a flagged mark, whatever its kind. */
  readonly flagged: number;

  /** Colour of a measured mesh defect, by its kind. */
  readonly defect: Readonly<Record<IAutoMovieMeshDefect.Kind, number>>;

  /** Colour of a mesh's triangle edges, dark so they read over the clay grey and apart from every shade's colours. */
  readonly edge: number;

  /** Surface colour of the clay shade, before lighting. */
  readonly clay: number;

  /** Colour of a surface seen from its front under the faces shade. */
  readonly front: number;

  /** Colour of a surface seen from its back under the faces shade. */
  readonly back: number;
} = {
  flagged: 0xff00ff,
  defect: {
    open: 0xff3b30,
    "non-manifold": 0xb14aff,
    inconsistent: 0xffcc00,
    degenerate: 0xffffff,
    sliver: 0xff9500,
  },
  edge: 0x2b3a67,
  clay: 0xbdbdbd,
  front: 0xb0b0b0,
  back: 0x8b1a1a,
};
