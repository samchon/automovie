import { evaluateHumanBodyShape } from "../basis/evaluateHumanBodyShape";
import { humanBodyBasisWeights } from "../basis/humanBodyBasisWeights";
import { createHumanBodyMeasurementReader } from "../measure/createHumanBodyMeasurementReader";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { humanBodySimpleChannel } from "./humanBodySimpleChannel";
import { humanBodySimpleShapeMath as math } from "./humanBodySimpleShapeMath";
import { humanBodySimpleStature } from "./humanBodySimpleStature";
import { humanBodySimpleVolume } from "./humanBodySimpleVolume";

/**
 * Measure a shaped body the way the simple tier reads it: stature in metres
 * (the height rule plus the head allowance) and the sum of volumes its
 * separate skin surfaces enclose in cubic metres, and any measurement rule
 * by its channel. Every shaped cap is checked; overlapping shaped solids
 * refuse a mass rather than double-counting their shared volume.
 *
 * Each direct reading evaluates a rest shape through the builder's own path;
 * projection reuses one reader for its stature, mass and tape results. These
 * are the values expansion inverts and projection reports. A rule the surface
 * cannot answer (no section loop or a missing landmark) answers null.
 */
export const measureHumanBodySimpleShape = {
  stature(
    basis: IAutoMovieHumanBodyBasis,
    shape: Record<string, number>,
  ): number {
    return humanBodySimpleStature(createHumanBodyMeasurementReader(basis, shape));
  },

  volume(
    basis: IAutoMovieHumanBodyBasis,
    shape: Record<string, number>,
  ): number {
    const shaped = evaluateHumanBodyShape(
      basis,
      humanBodyBasisWeights(basis, { shape }),
    );
    return humanBodySimpleVolume(basis, shaped);
  },

  /** Whole-body mass in kilograms from the skin volume at a density, over the share above the clip ring. */
  mass(
    volume: number,
    density: number,
    ageYears: number,
    bodyMassIndex: number,
  ): number {
    return (
      (volume * density * 1000) /
      (1 - math.headAndNeckFraction(ageYears, bodyMassIndex))
    );
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
