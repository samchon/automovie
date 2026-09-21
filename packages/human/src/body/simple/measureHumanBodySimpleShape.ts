import { evaluateHumanBodyShape } from "../basis/evaluateHumanBodyShape";
import { humanBodyBasisWeights } from "../basis/humanBodyBasisWeights";
import { HUMAN_BODY_MEASUREMENTS } from "../constants/HUMAN_BODY_MEASUREMENTS";
import { HUMAN_BODY_SIMPLE_SHAPE } from "../constants/HUMAN_BODY_SIMPLE_SHAPE";
import { evaluateHumanBodyMeasurement } from "../measure/evaluateHumanBodyMeasurement";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { measureHumanBodyVolume } from "./measureHumanBodyVolume";

/**
 * Measure a shaped body the way the simple tier reads it: stature in metres
 * (the height rule plus the head allowance) and the volume the skin
 * encloses in cubic metres, and any measurement rule by its channel.
 *
 * Both readings evaluate the shape once through the builder's own path,
 * without a pose, and are what the expansion inverts and the projection
 * reports; a channel with no rule answers null, as does a rule the surface
 * cannot answer.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Reads the stature and skin volume a requested height and mass are met against.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Realizes the height rule plus head allowance and the capped tetrahedron volume the mass model specifies.
 */
export const measureHumanBodySimpleShape = {
  stature(
    basis: IAutoMovieHumanBodyBasis,
    shape: Record<string, number>,
  ): number {
    const rule =
      HUMAN_BODY_MEASUREMENTS[HUMAN_BODY_SIMPLE_SHAPE.solved.stature];
    const height =
      rule === undefined
        ? null
        : evaluateHumanBodyMeasurement(basis, shape, rule);
    if (height === null)
      throw new Error("A simple body stature needs the basis's height rule.");
    return height + HUMAN_BODY_SIMPLE_SHAPE.stature.headAboveRingMetres;
  },

  volume(
    basis: IAutoMovieHumanBodyBasis,
    shape: Record<string, number>,
  ): number {
    const positions = evaluateHumanBodyShape(
      basis,
      humanBodyBasisWeights(basis, { shape }),
      undefined,
    ).surfaces[0];
    return measureHumanBodyVolume(positions, basis.surfaces[0].indices);
  },

  /** Whole-body mass in kilograms from the skin volume at a density, over the head-and-neck share. */
  mass(volume: number, density: number): number {
    return (
      (volume * density * 1000) /
      (1 - HUMAN_BODY_SIMPLE_SHAPE.mass.headAndNeckFraction)
    );
  },

  channel(
    basis: IAutoMovieHumanBodyBasis,
    shape: Record<string, number>,
    channel: string,
  ): number | null {
    const rule = HUMAN_BODY_MEASUREMENTS[channel];
    return rule === undefined
      ? null
      : evaluateHumanBodyMeasurement(basis, shape, rule);
  },
};
