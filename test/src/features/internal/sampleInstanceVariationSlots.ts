import {
  type IAutoMovieInstanceSetPlacement,
  instanceSlot,
} from "@automovie/engine";
import type { IAutoMovieInstanceSlot } from "@automovie/interface";

/**
 * Regenerate the existing complete placement population through the actual member owner.
 *
 * Instance variation units observe every addressed slot through this helper, so an omitted or substituted member changes their range, distribution, transform or visibility results.
 *
 * This is an arrangement carrier, not an independent expected population; callers use literal authored ranges, probability endpoints and hand-derived quaternion relations as their expectations.
 *
 * Population size and layout come from the supplied placement, preserving the existing 2,000-member witnesses and smaller fixed-range twins; slot admission and malformed-layout refusal remain with instanceSlot.
 *
 * A portable caller owns the fresh result array and placement. The helper executes no host, mutates no placement and replaces no global or foreign method.
 */
export const sampleInstanceVariationSlots: (
  placement: IAutoMovieInstanceSetPlacement,
) => IAutoMovieInstanceSlot[] = (
  placement: IAutoMovieInstanceSetPlacement,
): IAutoMovieInstanceSlot[] =>
  Array.from(
    { length: placement.count },
    (_: unknown, slot: number): IAutoMovieInstanceSlot =>
      instanceSlot(placement, slot),
  );
