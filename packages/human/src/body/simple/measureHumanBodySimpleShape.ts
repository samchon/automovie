import { createHumanBodyMeasurementReader } from "../measure/createHumanBodyMeasurementReader";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { humanBodySimpleChannel } from "./humanBodySimpleChannel";

/**
 * Measure a shaped body the way the simple tier reads it: mass from the whole
 * person's closed volume at a density, and any body measurement rule by its
 * channel. Stature and volume belong to the whole person
 * (`IAutoMovieHumanBodySimpleWhole`), not to the body basis.
 *
 * A channel reading evaluates a rest shape through the builder's own path. A
 * rule the surface cannot answer (no section loop, a missing landmark or a
 * named skin point the basis does not declare) answers null.
 */
export const measureHumanBodySimpleShape = {
  /** Whole-body mass in kilograms from the whole person's closed skin volume at a density. */
  mass(volume: number, density: number): number {
    return volume * density * 1000;
  },

  channel(
    basis: IAutoMovieHumanBodyBasis,
    shape: Record<string, number>,
    channel: string,
  ): number | null {
    return humanBodySimpleChannel(
      createHumanBodyMeasurementReader(basis, shape),
      channel,
    );
  },
};
