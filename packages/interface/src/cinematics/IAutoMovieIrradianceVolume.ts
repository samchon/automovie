import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieIrradianceProbe } from "./IAutoMovieIrradianceProbe";

/**
 * A baked grid of irradiance probes (Greger, Shirley, Hubbard and Greenberg
 * 1998, "The irradiance volume"): probe `(i, j, k)` sits at `min + spacing ×
 * (i, j, k)` and is `probes[i + counts.x × (j + counts.y × k)]`.
 */
export interface IAutoMovieIrradianceVolume {
  /** World position of probe (0, 0, 0), metres. */
  min: IAutoMovieVector3;

  /** Probe pitch in metres, above zero. */
  spacing: number;

  /** Probes along each axis, each at least one. */
  counts: {
    /** Probes along X. */
    x: number;

    /** Probes along Y. */
    y: number;

    /** Probes along Z. */
    z: number;
  };

  /** Every probe, X fastest, then Y, then Z. */
  probes: IAutoMovieIrradianceProbe[];
}
