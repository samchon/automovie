import { measureHumanFaceTongueSection } from "@automovie/human/face/basis/measureHumanFaceTongueSection";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * Triangle/slab extrema are geometric measurements independent of source
 * vertex density. Expected heights come from affine edge interpolation.
 *
 * Scenarios:
 * 1. A triangle from (-1,-2) to (1,2) in height/forward coordinates
 *    meets a half-metre slab at heights -0.25 and 0.25; its third corner
 *    keeps a bottom edge at -1, making the section 1.25 metres tall.
 * 2. Reversed winding preserves the same measurement; corners exactly on
 *    either slab plane are retained, and an interior triangle keeps its height.
 * 3. Empty, wholly posterior and wholly anterior triangles report an absent
 *    section; an unused anterior source vertex changes no rendered protrusion.
 * 4. Translating the origin and permuting the orthonormal axes retains both
 *    measurements without an implicit world-axis assumption.
 */
export const test_subject_human_tongue_section = (): void => {
  const frame = {
    origin: { x: 0, y: 0, z: 0 },
    up: { x: 0, y: 1, z: 0 },
    forward: { x: 0, y: 0, z: 1 },
    slabMetres: 0.5,
  };
  const triangle = [0, -1, -2, 0, 1, 2, 1, -1, 2];
  for (const indices of [[0, 1, 2], [0, 2, 1]]) {
    const section = measureHumanFaceTongueSection(triangle, indices, frame);
    TestValidator.predicate(
      "edges crossing both planes have the analytic section",
      section.thicknessMetres !== null &&
        nclose(section.thicknessMetres, 1.25) &&
        nclose(section.protrudingMetres, 2),
    );
  }
  for (const distance of [0, 0.5]) {
    const section = measureHumanFaceTongueSection(
      [0, -1, -distance, 0, 1, distance, 1, -1, distance],
      [0, 1, 2],
      frame,
    );
    TestValidator.predicate(
      "interior and boundary corners retain their full height",
      section.thicknessMetres !== null && nclose(section.thicknessMetres, 2),
    );
  }
  const empty = measureHumanFaceTongueSection([], [], frame);
  TestValidator.equals("an empty surface has no section", empty.thicknessMetres, null);
  TestValidator.predicate("an empty surface has no protrusion", nclose(empty.protrudingMetres, 0));
  for (const sign of [-1, 1]) {
    const section = measureHumanFaceTongueSection(
      [0, -1, 2 * sign, 0, 1, 2 * sign, 1, -1, 2 * sign],
      [0, 1, 2],
      frame,
    );
    TestValidator.equals("a disjoint triangle has no section", section.thicknessMetres, null);
    TestValidator.predicate(
      "posterior triangles have no positive protrusion",
      nclose(section.protrudingMetres, sign < 0 ? 0 : 2),
    );
  }
  const unused = measureHumanFaceTongueSection(
    [0, -1, 0, 0, 1, 0, 1, -1, 0, 0, 0, 10],
    [0, 1, 2],
    frame,
  );
  TestValidator.predicate("unreferenced vertices are not tongue triangles", nclose(unused.protrudingMetres, 0));
  const transformed = measureHumanFaceTongueSection(
    [8, 20, 29, 12, 20, 31, 12, 21, 29],
    [0, 1, 2],
    {
      origin: { x: 10, y: 20, z: 30 },
      up: { x: 0, y: 0, z: 1 },
      forward: { x: 1, y: 0, z: 0 },
      slabMetres: 0.5,
    },
  );
  TestValidator.predicate(
    "the section uses the declared opening frame",
    transformed.thicknessMetres !== null &&
      nclose(transformed.thicknessMetres, 1.25) &&
      nclose(transformed.protrudingMetres, 2),
  );
};
