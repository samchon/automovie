import { evaluateHumanBodyShape } from "../basis/evaluateHumanBodyShape";
import { humanBodyBasisWeights } from "../basis/humanBodyBasisWeights";
import { HUMAN_BODY_MEASUREMENTS } from "../constants/HUMAN_BODY_MEASUREMENTS";
import { HUMAN_BODY_SIMPLE_SHAPE } from "../constants/HUMAN_BODY_SIMPLE_SHAPE";
import { evaluateHumanBodyMeasurement } from "../measure/evaluateHumanBodyMeasurement";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import { humanBodyCappedSurface } from "./humanBodyCappedSurface";
import { humanBodySimpleShapeMath as math } from "./humanBodySimpleShapeMath";
import { humanBodySurfaceBoundary } from "./humanBodySurfaceBoundary";

// An admitted basis is immutable; its topological loops are the same at every
// inversion sample even while the evaluated positions move.
const boundaryLoops = new WeakMap<IAutoMovieHumanBodyBasis, number[][][]>();

/**
 * Measure a shaped body the way the simple tier reads it: stature in metres
 * (the height rule plus the head allowance) and the sum of volumes its
 * separate skin surfaces enclose in cubic metres, and any measurement rule
 * by its channel. Every shaped cap is checked; overlapping shaped solids
 * refuse a mass rather than double-counting their shared volume.
 *
 * Both readings evaluate the shape once through the builder's own path,
 * without a pose, and are what the expansion inverts and the projection
 * reports; a rule the surface cannot answer (no section loop, a landmark
 * the basis lacks) answers null.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Reads the stature and skin volume a requested height and mass are met against.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Realizes the height rule plus head allowance and the capped tetrahedron volume the mass model specifies.
 */
export const measureHumanBodySimpleShape = {
  stature(
    basis: IAutoMovieHumanBodyBasis,
    shape: Record<string, number>,
  ): number {
    // the stature channel's rule is a height, which always answers: the
    // two tables are checked against each other by the simple-tier test
    const height = evaluateHumanBodyMeasurement(
      basis,
      shape,
      HUMAN_BODY_MEASUREMENTS[HUMAN_BODY_SIMPLE_SHAPE.solved.stature],
    )!;
    return height + HUMAN_BODY_SIMPLE_SHAPE.stature.headAboveRingMetres;
  },

  volume(
    basis: IAutoMovieHumanBodyBasis,
    shape: Record<string, number>,
  ): number {
    const surfaces = evaluateHumanBodyShape(
      basis,
      humanBodyBasisWeights(basis, { shape }),
    ).surfaces;
    let loops = boundaryLoops.get(basis);
    if (loops === undefined) {
      loops = basis.surfaces.map((surface) =>
        humanBodySurfaceBoundary(surface.indices, true),
      );
      boundaryLoops.set(basis, loops);
    }
    const solids = surfaces.map((positions, index) => {
      const solid = humanBodyCappedSurface(
        positions,
        basis.surfaces[index].indices,
        loops[index],
      );
      solid.assertGeometry();
      return solid;
    });
    for (let first = 0; first < solids.length; first++)
      for (let second = first + 1; second < solids.length; second++)
        if (solids[first].overlaps(solids[second]))
          throw new Error("Shaped body surface interiors must not overlap.");
    return solids.reduce((sum, solid) => sum + solid.volume, 0);
  },

  /** Whole-body mass in kilograms from the skin volume at a density, over the head-and-neck share. */
  mass(volume: number, density: number, ageYears: number): number {
    return (volume * density * 1000) / (1 - math.headAndNeckFraction(ageYears));
  },

  channel(
    basis: IAutoMovieHumanBodyBasis,
    shape: Record<string, number>,
    channel: string,
  ): number | null {
    // every tape channel the table names has a rule (checked by the test);
    // the rule itself may find no section on a surface and answer null
    return evaluateHumanBodyMeasurement(
      basis,
      shape,
      HUMAN_BODY_MEASUREMENTS[channel],
    );
  },
};
