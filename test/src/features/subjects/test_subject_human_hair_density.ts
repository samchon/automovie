import { Vector3 } from "@automovie/engine";
import { humanFaceHairDensity } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../internal/predicates";

/**
 * A ribbon covers the scalp its own root is responsible for.
 * On a square lattice of spacing a the fourth neighbour stands at a, so the
 * unbiased three-neighbour density is 3 / (pi a^2) and the side of one root's
 * area is a sqrt(pi / 3) = 1.0233 a: neighbouring ribbons meet with a two per
 * cent overlap instead of leaving a gap, which is the coverage this rule is
 * for. Scenarios:
 * 1. Every interior root of a 7 by 7 lattice measures that same analytic width.
 * 2. Doubling the lattice doubles the widths, and one population holding a
 *    dense and a sparse block measures each block by its own density.
 * 3. A population with no neighbourhood takes the measured area over its own
 *    count; an empty one has no widths; a nonpositive area and coincident
 *    roots refuse instead of returning an unrepresentable ribbon.
 */
export const test_subject_human_hair_density = (): void => {
  const lattice = (spacing: number, side: number) =>
    Array.from({ length: side * side }, (_, at) =>
      Vector3.create((at % side) * spacing, Math.floor(at / side) * spacing, 0),
    );
  const side = 7,
    spacing = 0.01;
  const roots = lattice(spacing, side);
  const widths = humanFaceHairDensity({ roots, area: 1 });
  const interior = roots
    .map((_, at) => at)
    .filter(
      (at) =>
        at % side > 0 &&
        at % side < side - 1 &&
        Math.floor(at / side) > 0 &&
        Math.floor(at / side) < side - 1,
    );
  TestValidator.predicate(
    "an interior root covers its own lattice cell",
    interior.every((at) =>
      nclose(widths[at], spacing * Math.sqrt(Math.PI / 3), 1e-12),
    ),
  );
  TestValidator.predicate(
    "a doubled lattice doubles every width",
    humanFaceHairDensity({ roots: lattice(2 * spacing, side), area: 1 }).every(
      (width, at) => nclose(width, 2 * widths[at], 1e-12),
    ),
  );
  const sparse = lattice(2 * spacing, 4).map((point) =>
    Vector3.create(point.x + 8 * spacing, point.y, 0),
  );
  const mixed = [...roots, ...sparse];
  const measured = humanFaceHairDensity({ roots: mixed, area: 1 });
  const at = (point: (typeof mixed)[number]) =>
    mixed.findIndex((other) => other === point);
  TestValidator.predicate(
    "each half is measured by its own density",
    nclose(
      measured[at(roots[3 * side + 3])],
      spacing * Math.sqrt(Math.PI / 3),
      1e-12,
    ) &&
      nclose(
        measured[at(sparse[4 + 1])],
        2 * spacing * Math.sqrt(Math.PI / 3),
        1e-12,
      ),
  );
  TestValidator.predicate(
    "a population without neighbours reads the measured area",
    humanFaceHairDensity({ roots: roots.slice(0, 4), area: 0.36 }).every(
      (width) => nclose(width, 0.3, 1e-12),
    ),
  );
  TestValidator.equals(
    "no roots, no ribbons",
    humanFaceHairDensity({ roots: [], area: 1 }),
    [],
  );
  for (const area of [0, -1, Number.NaN])
    TestValidator.predicate(
      "a population needs a positive growth area",
      throwsError(() => humanFaceHairDensity({ roots, area }), "growth area"),
    );
  TestValidator.predicate(
    "coincident roots cannot measure a density",
    throwsError(
      () =>
        humanFaceHairDensity({
          roots: Array.from({ length: 8 }, () => Vector3.create()),
          area: 1,
        }),
      "distinct enough",
    ),
  );
};
