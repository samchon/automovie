import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Seed-derived per-instance visual and semantic variation. */
export interface IAutoMovieInstanceVariation {
  /** Inclusive uniform scale range, both strictly above zero. */
  scale: { min: number; max: number };

  /** Optional independent scale ranges per local axis. */
  scale3?: { min: IAutoMovieVector3; max: IAutoMovieVector3 };

  /** Optional seeded XYZ Euler offsets in degrees, applied after facing. */
  rotationDeg?: {
    x: { min: number; max: number };
    y: { min: number; max: number };
    z: { min: number; max: number };
  };

  /** Seeded probability that a procedural slot is visible. */
  visibleProbability?: number;

  /**
   * Non-empty exact `#RRGGBB` palette choices applied per instance.
   *
   * An entry is the color itself rather than a label for one, so the viewer
   * decodes it from sRGB to linear with `srgbHexToLinearColor` before it
   * reaches the instance. A model recipe palette is decoded by that same
   * function on its way into `baseColor`, so the identical swatch authored
   * either way now renders the identical color.
   *
   * `IAutoMovieColor` holds the opposite convention: its components are
   * authored linear and its `hex` is a derived label the renderer never
   * decodes. Reach for `srgbHexToLinearColor` when carrying a swatch across
   * that boundary. Pasting the digits straight into a triple renders about
   * 2.3x too bright at midtones, and instanced slots covering the same surface
   * as such a material is how one production ended up drawing one roof in two
   * colors.
   */
  palette: string[];

  /** Named bounded numeric traits regenerated from seed and slot. */
  traits: Array<{
    /** Stable trait name unique in this set. */
    name: string;

    /** Inclusive minimum. */
    min: number;

    /** Inclusive maximum. */
    max: number;
  }>;
}
