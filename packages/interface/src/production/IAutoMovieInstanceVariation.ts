import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Seed-derived per-instance visual and semantic variation.
 *
 * @evidence contracts/common.md#principled-implementation Independent seed-and-slot salts sample scale, rotation, palette, visibility and named numeric ranges; ordered finite ranges and representable quaternion arithmetic are caller premises. Equal endpoints remain constant and explicit slot values override their stated channels; the regenerator checks sampled scalar scale, position and procedural traits but not every enhanced or explicit override.
 * @evidence contracts/common.md#clear-and-simple-design Keeps shared variation laws on the compact set while regenerated slots carry their resolved values; optional axis scale, Euler offsets and visibility extend the basic scale, palette and traits.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Palette entries are actual sRGB swatches decoded before linear shading, not labels or linear triples; omission of enhanced channels preserves the legacy slot shape rather than injecting extra fields.
 * @evidence contracts/common.md#meaningful-documentation Defines positive scale ranges, degree Euler order, visibility probability, exact color encoding and named trait bounds with explicit override behavior.
 * @author Samchon
 */
export interface IAutoMovieInstanceVariation {
  /** Inclusive uniform scale range, both strictly above zero. */
  scale: {
    /** Positive lower endpoint. */
    min: number;

    /** Positive upper endpoint, at least min. */
    max: number;
  };

  /** Optional independent scale ranges per local axis. */
  scale3?: {
    /** Positive lower endpoint on each local axis. */
    min: IAutoMovieVector3;

    /** Upper endpoint on each local axis, at least its corresponding minimum. */
    max: IAutoMovieVector3;
  };

  /** Optional seeded XYZ Euler offsets in degrees, applied after facing. */
  rotationDeg?: {
    /** Inclusive finite X-axis rotation range in degrees. */
    x: {
      /** Lower endpoint. */
      min: number;

      /** Upper endpoint, at least min. */
      max: number;
    };

    /** Inclusive finite Y-axis rotation range in degrees. */
    y: {
      /** Lower endpoint. */
      min: number;

      /** Upper endpoint, at least min. */
      max: number;
    };

    /** Inclusive finite Z-axis rotation range in degrees. */
    z: {
      /** Lower endpoint. */
      min: number;

      /** Upper endpoint, at least min. */
      max: number;
    };
  };

  /** Seeded visibility probability in [0, 1]; omission keeps every procedural slot visible. */
  visibleProbability?: number;

  /**
   * Non-empty exact `#RRGGBB` sRGB swatches applied per instance; the viewer decodes them with `srgbHexToLinearColor`, as it does model recipe palettes. `IAutoMovieColor` instead stores linear components and a derived hex label, so use the same conversion when moving a swatch into that contract.
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
