import { clipHumanFaceBasisSurface } from "@automovie/human/face/basis/clipHumanFaceBasisSurface";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { nclose } from "../internal/predicates";

/**
 * A neutral planar cut must share its edge intersections across UV regions.
 * Scenarios:
 * 1. Cutting the unit square at Y=1/2 leaves area 1/2 with five shared vertices.
 * 2. Signed shape and expression endpoints follow independently known affine fields.
 * 3. UV seams remain corner data; absent UVs remain absent and inputs stay owned.
 */
export const test_subject_human_basis_clip = (): void => {
  for (const textured of [false, true]) {
    const source = humanFaceBasisFixture().basis.surfaces[0];
    if (textured) source.regions[1].uvs = [10, 20, 11, 21, 10, 21];
    const saved = structuredClone(source);
    const { surface, retainedTriangles } = clipHumanFaceBasisSurface(
      source,
      0.5,
    );
    TestValidator.equals(
      "shared clipped vertices",
      surface.positions.length,
      15,
    );
    TestValidator.equals("three clipped triangles", surface.indices.length, 9);
    let area = 0;
    for (let at = 0; at < surface.indices.length; at += 3) {
      const [a, b, c] = surface.indices
        .slice(at, at + 3)
        .map((v) => surface.positions.slice(3 * v, 3 * v + 3));
      const signed =
        ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;
      TestValidator.predicate("winding survives", signed > 0);
      area += signed;
    }
    TestValidator.predicate("half square area", nclose(area, 0.5));
    for (const [name, rows] of Object.entries(surface.targets)) {
      const values = new Map<number, number[]>();
      for (let i = 0; i < rows.length; i += 4)
        values.set(rows[i], rows.slice(i + 1, i + 4));
      for (let v = 0; v < surface.positions.length / 3; v++) {
        const [x, y] = surface.positions.slice(3 * v, 3 * v + 2);
        const actual = values.get(v) ?? [0, 0, 0];
        const expected =
          name === "raised"
            ? [0, 0, Math.min(x, y)]
            : [(name === "wide" ? 0.5 : -0.25) * x, 0, 0];
        TestValidator.predicate(
          "affine endpoint",
          actual.every((p, k) => nclose(p, expected[k])),
        );
      }
    }
    for (const [r, region] of surface.regions.entries()) {
      TestValidator.equals(
        "clipped triangle is not an unchanged attachment",
        retainedTriangles.get(region.id)!.size,
        0,
      );
      if (region.uvs === null) {
        TestValidator.equals("untextured region", r, 1);
        continue;
      }
      for (const [corner, v] of region.indices.entries())
        TestValidator.predicate(
          "corner UV interpolation",
          [0, 1].every((k) =>
            nclose(
              region.uvs![corner * 2 + k],
              surface.positions[v * 3 + k] + r * (k === 0 ? 10 : 20),
            ),
          ),
        );
    }
    surface.positions.fill(8);
    surface.targets.wide.fill(8);
    surface.regions[0].indices.fill(0);
    TestValidator.equals("caller ownership", source, saved);
  }
};
