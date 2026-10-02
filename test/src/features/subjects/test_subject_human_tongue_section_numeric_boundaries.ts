import { measureHumanFaceTongueSection } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * Finite edge interpolation preserves a section across numeric scales.
 * These are geometric metric probes, not admitted anatomical dimensions.
 *
 * Scenarios:
 * 1. A plane halfway from 0 to twice the smallest positive double cuts the
 *    rising edge at height 0. Together with the retained height -1 corner,
 *    its section is one metre tall. Halving those forward distances first
 *    underflows the plane to zero and incorrectly removes that height.
 * 2. Opposite finite endpoints at +/-1e308 overflow their direct difference.
 *    The quarter-span slab has the same 1.25 metre affine section as the
 *    ordinary-scale oracle, requiring the overflow-safe edge calculation.
 */
export const test_subject_human_tongue_section_numeric_boundaries = (): void => {
  const frame = {
    origin: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
    forward: { x: 0, y: 0, z: 1 },
  };
  const tiny = measureHumanFaceTongueSection(
    [0, -1, 0, 0, 1, 2 * Number.MIN_VALUE, 1, -1, 2 * Number.MIN_VALUE],
    [0, 1, 2],
    { ...frame, slabMetres: Number.MIN_VALUE },
  );
  TestValidator.predicate(
    "a finite subnormal slab keeps its analytic section",
    tiny.thicknessMetres !== null && nclose(tiny.thicknessMetres, 1),
  );
  const large = measureHumanFaceTongueSection(
    [0, -1, -1e308, 0, 1, 1e308, 1, -1, 1e308],
    [0, 1, 2],
    { ...frame, slabMetres: 2.5e307 },
  );
  TestValidator.predicate(
    "finite opposite endpoints keep the analytic section despite span overflow",
    large.thicknessMetres !== null && nclose(large.thicknessMetres, 1.25) && large.protrudingMetres === 1e308,
  );
};
