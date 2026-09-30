import {
  type IAutoMovieHumanBodyBasis,
  humanBodySkinMetresPerUv,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * The layout scale is the ratio below which half of the skin's surface area
 * lies, not the median over triangles.
 *
 * Every triangle is a right isoceles one whose legs are `a` in space and
 * `a / ratio` in UV, so its metres per UV unit is exactly `ratio` and its
 * surface area is `a^2 / 2`.
 *
 * Scenarios:
 * 1. Two small triangles (a = 0.05, ratio 1, area 0.00125 each) and one large
 *    one (a = sqrt(2), ratio 4, area 1): the median over triangles is 1, and
 *    half the area lies at ratio 4, which is the answer.
 * 2. Two triangles of equal area at ratios 2 and 3: half the area is reached
 *    at the lower ratio, so the answer is 2 (the boundary is inclusive).
 * 3. A triangle of another material, or without UVs, is ignored; a material
 *    none of whose triangles has a UV area is refused.
 */
export const test_human_body_skin_metres_per_uv = (): void => {
  const fixture = humanBodyBasisFixture().basis;
  const surface = fixture.surfaces[0]!;
  const layout = (
    triangles: { a: number; ratio: number; material?: string }[],
  ): IAutoMovieHumanBodyBasis => {
    const positions: number[] = [];
    const uvs: number[] = [];
    triangles.forEach(({ a, ratio }, t) => {
      const b = a / ratio;
      positions.push(0, 0, t, a, 0, t, 0, a, t);
      uvs.push(0, 0, b, 0, 0, b);
    });
    const regions = triangles.map(({ material }, t) => ({
      id: "r" + t,
      material: material ?? "skin",
      indices: [t * 3, t * 3 + 1, t * 3 + 2],
      uvs: uvs.slice(t * 6, t * 6 + 6),
    }));
    return { ...fixture, surfaces: [{ ...surface, positions, regions }] };
  };

  TestValidator.predicate(
    "half the area lies at the large triangle's ratio",
    nclose(
      humanBodySkinMetresPerUv(
        layout([
          { a: 0.05, ratio: 1 },
          { a: 0.05, ratio: 1 },
          { a: Math.SQRT2, ratio: 4 },
        ]),
        "skin",
      ),
      4,
      1e-9,
    ),
  );
  TestValidator.predicate(
    "equal areas reach half at the lower ratio",
    nclose(
      humanBodySkinMetresPerUv(
        layout([
          { a: 1, ratio: 3 },
          { a: 1, ratio: 2 },
        ]),
        "skin",
      ),
      2,
      1e-9,
    ),
  );
  TestValidator.predicate(
    "another material is ignored",
    nclose(
      humanBodySkinMetresPerUv(
        layout([
          { a: 1, ratio: 2 },
          { a: 3, ratio: 9, material: "lips" },
        ]),
        "skin",
      ),
      2,
      1e-9,
    ),
  );
  const untextured = layout([{ a: 1, ratio: 2 }]);
  untextured.surfaces[0]!.regions[0]!.uvs = null;
  TestValidator.predicate(
    "a region without UVs is refused",
    throwsError(() => humanBodySkinMetresPerUv(untextured, "skin"), "UV layout"),
  );
};
